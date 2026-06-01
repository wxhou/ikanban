## Why

当前认证机制基于"客户端自报家门"：用户登录后名字存进 `localStorage`，后续请求通过 `x-user: btoa(name)` header 标识身份，服务端只校验"这个名字在 users 表里存在"。这意味着任何能改浏览器 localStorage 的人都能以任意用户（包括 admin）身份调用 API；登录的 4 位密码也缺少 rate limit，可被暴力枚举。改造为 httpOnly cookie + 服务端 session 后，session token 由服务端签发且不可由客户端伪造，登出真正生效，主 app 与 Portal 共享同一登录态。

## What Changes

- **新增** `sessions` 表存储登录会话（token 仅存 sha256 哈希），token 由 `crypto.randomBytes(32)` 生成后写入 httpOnly cookie `sid`
- **重写** `src/lib/auth.ts`：`getRequestUser/requireUser/getValidatedUser` 改为从 `cookies()` 读 `sid`、查 `sessions` 表、再关联 `users` 拿 role
- **重写** `POST /api/auth/verify`：bcrypt 校验通过后创建 session、返回 `Set-Cookie: sid=...; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800; Secure`
- **新增** `POST /api/auth/logout`：删 session 行 + 清除 cookie
- **新增** `GET /api/auth/me`：返回当前会话用户（供 App 启动时知道身份，不再依赖 localStorage）
- **新增** `GET /api/auth/cookie-config`：返回 cookie 名字和是否启用 Secure，供前端调试和测试
- **新增** `src/lib/rate-limit.ts`：IP + username 联合限流（5 次/分钟），加在 `/api/auth/verify` 上
- **删除** `src/api.ts` 的 `getUserHeader()` 以及全部 25+ 处调用
- **删除** `App.tsx` 的 `localStorage.getItem/setItem("currentUser", ...)`、`handleLogin` 中的写入逻辑
- **删除** `portal/page.tsx` 的 `localStorage.getItem("ikanban_user", ...)`、独立的 auth 跳转逻辑
- **删除** `LoginPage.tsx` 中 `localStorage` 相关的隐含依赖（如有）
- **删除** `App.tsx` 启动时基于 localStorage 的 `currentUser` 初始化；改为 mount 时 fetch `/api/auth/me` 决定渲染 LoginPage 还是主界面
- **保留** 4 位数字密码的 UX 形态不变；`/api/auth/password-status` 和 `/api/auth/set-password` 接口不变
- **保留** bcrypt 密码哈希（不变）

**BREAKING**: 调用方不能再通过 `x-user` header 认证；session 失效的请求会得到 401。curl 集成需要带 cookie jar（`-b/-c`）。

## Capabilities

### New Capabilities

- `user-auth`: 覆盖用户登录、session 管理、登出、当前用户查询、登录端点的 rate limit

### Modified Capabilities

（无现有 spec 覆盖认证行为，data-persistence/kanban-board/task-management/dashboard 的 REQUIREMENTS 不变化，仅底层身份来源从 header 改为 cookie，因此不在此处列入"修改"）

## Impact

**新增/修改文件**：
- `src/lib/db.ts` — 新增 `createSession/findSessionByToken/destroySession/cleanupExpiredSessions` 4 个函数 + `sessions` schema（约 60 行新增）
- `src/lib/auth.ts` — 重写（约 30 行）
- `src/lib/rate-limit.ts` — 新增（~40 行）
- `src/app/api/auth/verify/route.ts` — 重写（~40 行）
- `src/app/api/auth/logout/route.ts` — 新增（~20 行）
- `src/app/api/auth/me/route.ts` — 新增（~15 行）
- `src/app/api/auth/cookie-config/route.ts` — 新增（~10 行）
- `src/api.ts` — 删 `getUserHeader`（-10 行）
- `src/app/App.tsx` — 删 localStorage 读写、加 `/api/auth/me` 启动查询（约 30 行改动）
- `src/app/portal/page.tsx` — 删 localStorage + auth 跳转逻辑（约 20 行改动）
- `src/components/LoginPage.tsx` — 检查并删除 localStorage 依赖（少量改动）
- `src/components/TaskCard/TaskCard.tsx`、`TaskModal/TaskModal.tsx` — 删 `getUserHeader` 导入与调用

**API 行为变化**：
- 所有受保护端点现在 401 时不返回 `{ error: "Unauthorized" }` 时机扩展到 session 不存在/过期/被销毁
- Portal 与主 app 共享同一 cookie（自动）

**风险**：
- 25+ 处 `getUserHeader` 调用若有遗漏会表现为"偶发 401"
- App 启动时序变化：原 useState initializer 读 localStorage 同步可用 → 改为 mount 后异步 fetch，需在 fetch 完前显示 loading 或 LoginPage 占位
- `tests/` 目录为空，无自动回归网（手动验证清单需在 tasks.md 中显式列出）
