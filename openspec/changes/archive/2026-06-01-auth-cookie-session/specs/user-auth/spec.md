## ADDED Requirements

### Requirement: Login creates server-side session and sets httpOnly cookie
系统 MUST 在 `POST /api/auth/verify` bcrypt 校验通过后生成 32 字节的随机 session token，INSERT 一行 `sessions` 表记录（含 sha256(token)、user_id、expires_at = now + 8h），并在响应中通过 `Set-Cookie` 写入 `sid=<raw_token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800; Secure(仅生产)`。响应体 MUST 返回 `{ success: true, name, role }`。

#### Scenario: 凭据正确返回 200 + Set-Cookie
- **WHEN** 客户端 POST `/api/auth/verify` 携带正确的 `{ name, password }` 且用户存在
- **THEN** 响应状态为 200，响应头包含 `Set-Cookie: sid=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`，且响应体为 `{ success: true, name: "X", role: "Y" }`

#### Scenario: 凭据错误返回 401 且不写 cookie
- **WHEN** 客户端 POST `/api/auth/verify` 携带错误的 password
- **THEN** 响应状态为 401，响应体为 `{ error: "Invalid credentials" }`，且响应头 MUST NOT 包含 `Set-Cookie`

#### Scenario: 缺失字段返回 400
- **WHEN** 客户端 POST `/api/auth/verify` 缺少 `name` 或 `password`
- **THEN** 响应状态为 400，响应体为 `{ error: "Name and password are required" }`

#### Scenario: 不存在的用户返回 401
- **WHEN** 客户端 POST `/api/auth/verify` 携带 users 表中不存在的 name
- **THEN** 响应状态为 401，响应体为 `{ error: "Invalid credentials" }`（不区分"用户不存在"和"密码错误"以防用户名枚举）

### Requirement: Server reads session from httpOnly cookie on every protected request
所有受保护端点 MUST 通过 `src/lib/auth.ts` 的 `requireUser`/`getValidatedUser` 从请求的 `Cookie` 头中读取名为 `sid` 的值，计算其 sha256 哈希后查 `sessions` 表：当 `token_hash` 存在且 `expires_at > now` 时返回对应用户；否则返回 401。受保护端点 MUST NOT 再从 `x-user` header 读身份。

#### Scenario: 合法未过期的 cookie 通过
- **WHEN** 客户端携带有效 `Cookie: sid=<valid_token>` 请求任意受保护端点
- **THEN** 服务端查表得到 `user_id`，关联 `users` 表返回 `{ name, role }`，端点正常处理

#### Scenario: 缺失 cookie 返回 401
- **WHEN** 客户端未携带 `Cookie: sid=...` 请求受保护端点
- **THEN** 端点 MUST 返回 401，响应体含错误信息

#### Scenario: cookie 中的 token 在 sessions 表不存在返回 401
- **WHEN** 客户端携带 `Cookie: sid=<token>` 但 `sessions` 表无对应行（已登出/被踢/从未创建过）
- **THEN** 端点 MUST 返回 401

#### Scenario: 过期 session 返回 401
- **WHEN** 客户端携带的 cookie 对应 session 行的 `expires_at <= now`
- **THEN** 端点 MUST 返回 401

#### Scenario: x-user header 不再被信任
- **WHEN** 客户端携带 `x-user` header 但不带有效 `Cookie: sid`
- **THEN** 端点 MUST 返回 401（即使 header 解码后对应一个真实存在的用户）

### Requirement: Session expires_at is sliding (renewed on activity)
当服务端校验 session 时，若 `expires_at - now < 2h`，MUST 将该行的 `expires_at` 更新为 `now + 8h`（滑动续期）。每次校验 MUST 更新 `last_used = now`。

#### Scenario: 活跃用户被自动续期
- **WHEN** 用户的 session 距过期不足 2 小时，且该用户发出新请求
- **THEN** 该 session 行的 `expires_at` 被更新为 now + 8h，响应正常返回

#### Scenario: 闲置超 8 小时的 session 失效
- **WHEN** 用户的 session 已超过 8 小时无活动
- **THEN** 下次请求的 cookie 校验返回 401（即使 token 哈希仍存在）

### Requirement: Logout deletes server-side session and clears cookie
系统 MUST 提供 `POST /api/auth/logout`：从 cookie 读 `sid`、计算 sha256、`DELETE FROM sessions WHERE token_hash = ?`，并在响应中通过 `Set-Cookie: sid=; Path=/; Max-Age=0` 清除浏览器端 cookie。即使无 cookie 或 session 不存在，也 MUST 返回 200（不泄露状态）。

#### Scenario: 登录态下登出成功
- **WHEN** 已登录用户 POST `/api/auth/logout`
- **THEN** 响应 200，响应头 `Set-Cookie` 清除 `sid`，且 `sessions` 表中该 token_hash 对应的行被删除

#### Scenario: 登出后该 cookie 不能再通过校验
- **WHEN** 用户在登出后使用原 `sid` cookie 请求任意受保护端点
- **THEN** MUST 返回 401

#### Scenario: 未登录调用 logout 不报错
- **WHEN** 客户端 POST `/api/auth/logout` 时不携带 `Cookie: sid` 或 sid 已无效
- **THEN** MUST 返回 200，且 MUST NOT 在 `Set-Cookie` 中写有效值

### Requirement: GET /api/auth/me returns current user or 401
系统 MUST 提供 `GET /api/auth/me`：当 cookie 有效时返回 `{ name, role }`；否则返回 401。客户端 MUST 在启动时调用此端点判断登录态，替代 `localStorage` 读取。

#### Scenario: 已登录返回用户信息
- **WHEN** 客户端携带有效 `Cookie: sid` GET `/api/auth/me`
- **THEN** 响应 200，响应体为 `{ name, role }`

#### Scenario: 未登录返回 401
- **WHEN** 客户端未携带有效 `Cookie: sid` GET `/api/auth/me`
- **THEN** 响应 401

### Requirement: Login endpoint is rate-limited per IP+username
`POST /api/auth/verify` MUST 应用 rate limit：key 为 `${clientIP}:${name}`，窗口 60 秒，限 5 次。超过 MUST 返回 429。

#### Scenario: 第 6 次同 IP+username 在 60 秒内返回 429
- **WHEN** 同一 IP 对同一 username 在 60 秒内发起第 6 次 verify 请求（无论成功失败均计数）
- **THEN** 响应 429，响应体为 `{ error: "Too many login attempts" }`

#### Scenario: 不同 username 各自独立计数
- **WHEN** 同一 IP 在 60 秒内对 userA 已用满 5 次，但对 userB 发起第 1 次 verify
- **THEN** userB 的请求 MUST 正常处理（不被 userA 的计数影响）

#### Scenario: 不同 IP 各自独立计数
- **WHEN** IP-A 对 userX 已用满 5 次，但 IP-B 对 userX 发起 verify
- **THEN** IP-B 的请求 MUST 正常处理

### Requirement: New login for the same user invalidates all prior sessions
当 `POST /api/auth/verify` 校验通过时，MUST `DELETE FROM sessions WHERE user_id = ?`（针对该用户），然后再 INSERT 新 session。新 session 创建后该用户的所有旧 cookie MUST 立即失效（即使未到期）。

#### Scenario: 同账号第二次登录踢掉第一次
- **WHEN** 用户 A 在客户端 1 登录获得 sid1，5 分钟后在客户端 2 用同账号再次登录获得 sid2
- **THEN** sid1 的 cookie 下次请求 MUST 返回 401，sid2 的 cookie 正常通过

#### Scenario: 跨用户互不影响
- **WHEN** 用户 A 登录后，用户 B 登录
- **THEN** 用户 A 的 sid 仍有效

### Requirement: Role is read live from users table on every request
`getValidatedUser` MUST 在每次调用时从 `users` 表读 `role`，不在 session 行缓存。`POST /api/auth/verify` 成功后 `Set-Cookie` 不携带 role 信息。

#### Scenario: 管理员降级某用户后立即生效
- **WHEN** 管理员把某用户 role 从 developer 改为 guest（在另一会话中），且该用户已登录
- **THEN** 该用户下一次请求 MUST 看到 role=guest（即使 session 未过期）

#### Scenario: 管理员禁用某用户后立即生效
- **WHEN** 管理员删除某用户（在另一会话中），且该用户已登录
- **THEN** 该用户下一次请求 MUST 返回 401（users 外键 CASCADE 已删除 session 行）

### Requirement: No client-side identity storage in app code
本 change 应用完成后，仓库内 MUST NOT 存在 `localStorage.getItem("currentUser")`、`localStorage.setItem("currentUser", ...)`、`localStorage.getItem("ikanban_user")` 等对登录态 key 的读写。`src/api.ts` MUST NOT 导出 `getUserHeader`。所有原 25+ 处 `getUserHeader()` 调用 MUST 移除；浏览器自动通过 cookie 携带身份，fetch 调用 MUST NOT 手动设置身份相关 header。

#### Scenario: 仓库内不再有 x-user 写入
- **WHEN** 在 `src/` 下 grep `x-user` 或 `btoa(unescape(encodeURIComponent`
- **THEN** MUST NOT 出现匹配（除 design.md/spec.md/comments 中描述历史的引用）

#### Scenario: 仓库内不再有登录态 localStorage 读写
- **WHEN** 在 `src/` 下 grep `localStorage.getItem\("(currentUser|ikanban_user)"\)|localStorage.setItem\("(currentUser|ikanban_user)"`
- **THEN** MUST NOT 出现匹配

#### Scenario: 主 app 启动通过 /api/auth/me 决定登录态
- **WHEN** 用户首次访问主 app（无 cookie）
- **THEN** App 启动调用 `/api/auth/me` 返回 401，渲染 LoginPage
- **WHEN** 用户首次访问主 app（携带有效 cookie）
- **THEN** App 启动调用 `/api/auth/me` 返回 200，渲染主界面（不再依赖 localStorage 同步读取）

#### Scenario: Portal 与主 app 共享登录态
- **WHEN** 用户在主 app 登录后访问 `/portal`
- **THEN** MUST NOT 弹回登录页（cookie 自动共享）
- **WHEN** 用户在 Portal 登出后访问 `/`
- **THEN** MUST 显示 LoginPage
