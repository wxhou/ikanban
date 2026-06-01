## Context

**当前状态**：
- `src/lib/auth.ts` 解析请求里的 `x-user` header，base64 解码后直接当作用户名
- `getUserHeader()` 在 25+ 处构建这个 header（`src/api.ts` + 多数组件）
- 登录态由 `localStorage.currentUser`（主 app）和 `localStorage.ikanban_user`（Portal）两套 key 维护，互不相通
- 4 位数字密码无 rate limit
- Portal 的"只读"是 UI 约定，服务端 `requireUser` 没区分 portal user

**约束**：
- 内部工具，8 个固定种子用户，部署在受控网络
- 必须保留 4 位数字密码的 UX 形态
- Next.js 16.2.6 + App Router + libsql/SQLite
- 仓库没有自动测试

**利益相关方**：
- 主 app 用户（管理员/开发者）：登录、登出、保持会话
- Portal 用户：共享同一登录态，无需再次输入密码
- 部署者：`/api/auth/*` 端点的契约稳定

## Goals / Non-Goals

**Goals**：
- session token 服务端签发、不可由客户端伪造
- httpOnly cookie 自动随请求携带，删除所有 `x-user` header 与 `localStorage.*` 用法
- 主 app 与 Portal 共享同一登录态
- 4 位密码 + rate limit（IP+username 联合，5 次/分钟）
- 登出真正生效（服务端 session 表 + cookie 同时清除）
- 同账号多端登录：新登录踢掉旧 session

**Non-Goals**：
- 不改 4 位密码的 UX 形态（`password-status` / `set-password` 端点不变）
- 不引入 JWT、不引入第三方认证库
- 不改 bcrypt 配置（rounds=10 不变）
- 不做密码找回、邮箱验证、SSO
- 不加 session 列表 UI（"在哪些设备登录了"）—— 留作未来能力
- 不做数据库迁移工具的版本管理（一次性 ALTER 即可）
- Portal "只读" 的服务端 enforce 不在本次范围（明确延后）

## Decisions

### D1. Session 模型：服务端表 + sha256 哈希存储 token

**方案**：新建 `sessions` 表，只存 token 的 sha256 哈希，DB 泄露不会泄露在线会话。

```sql
CREATE TABLE sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,        -- sha256(token), 64 hex chars
  created     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  expires_at  TEXT NOT NULL,                -- datetime('now', '+8 hours', 'localtime')
  last_used   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id, expires_at);
```

**备选**：存明文 token。拒绝：DB 泄露会泄露所有在线 session。

**理由**：服务端必须能"用 token 找到 session"，但不应"持 token 等于持会话"。sha256 是单向，DB 持有的是"指纹"。

### D2. Token 长度：32 字节，base64url 编码

**方案**：`crypto.randomBytes(32).toString("base64url")` → ~43 字符的 cookie 值。

**备选**：16 字节 / 64 字节。16 字节（128 位熵）也够安全，但 32 字节是 OWASP 推荐的 session ID 长度；64 字节浪费 cookie 空间。

### D3. Cookie 属性：`HttpOnly; SameSite=Lax; Path=/; Max-Age=28800; Secure (生产)`

**方案**：
- `HttpOnly`：JS 读不到，XSS 不能偷
- `SameSite=Lax`：跨站 GET 带 cookie，跨站 POST 不带，挡住大部分 CSRF
- `Path=/`：全站 API 都用
- `Max-Age=28800`：8 小时
- `Secure`：仅在 `process.env.NODE_ENV === "production"` 时设置（开发环境 http://localhost 不需要，否则浏览器拒绝）

**备选**：`SameSite=Strict` 更严格，但外部链接点进来时不能保持登录；额外 CSRF token 增加复杂度。Lax 配合本项目"内部工具 + 同源"足够。

### D4. Session 生命周期：滑动 8 小时

**方案**：每次请求校验时如果 `expires_at - now < 2h`，刷新 `expires_at = now + 8h`。

**理由**：8 小时覆盖一个工作日；滑动续期让活跃用户不会因输入 4 位密码而中断；闲置 8 小时自动失效减少被偷 cookie 的暴露窗口。

**备选**：固定 8h（每天必须重新登录）—— 体验差；固定 30d —— 偷 cookie 暴露窗口大。

### D5. 多端登录：同账号新登录踢掉旧 session

**方案**：`createSession` 内 `DELETE FROM sessions WHERE user_id = ?` 后再 INSERT。

**理由**：8 人小团队，账号 = 身份，2 处同时登录通常意味着前一个忘了登出；明确"一个身份一处登录"更可预测。

**备选**：允许多端共存。需要 UI 提示用户"你的账号在另一处登录了"——超出本范围。

### D6. 角色变更：立即生效

**方案**：`getValidatedUser` 每次从 `users` 表读 `role`，不缓存到 session 行。

**理由**：admin 把某用户降级后，下一次请求就生效；不会出现"已经被降级但还能干 admin 事"的窗口。

**代价**：每个请求多一次 user 表查询（一次 indexed SELECT by id，影响微小）。

### D7. Rate limit：IP + username 联合，5 次/分钟

**方案**：`src/lib/rate-limit.ts` 维护内存中的滑动窗口 Map（`Map<key, number[]>`），key = `ip:username`。

**理由**：
- 4 位密码只有 10000 种组合，无 rate limit 一晚上就能跑完
- 内存 Map 简单够用，进程重启清零可接受（攻击者也丢进度）
- 单进程 Next.js 部署不需要 Redis

**窗口**：60 秒，限 5 次。命中后返回 429。

**备选**：基于 `users` 表的失败计数（持久化，攻击者不能通过重启绕过）—— 留作未来加固。

### D8. App 启动身份：fetch `/api/auth/me` 替代 localStorage 读取

**方案**：
- `App.tsx` 移除 `useState(() => localStorage.getItem("currentUser"))` 初始化
- 改为 `useState<string | null>(null)` + `useEffect` 里 `fetch("/api/auth/me")` 决定登录态
- fetch 完成前显示 loading 或 LoginPage 占位（已存在 `LoginPage` 可作为兜底）

**理由**：服务端 cookie 才是真实来源，客户端不存任何身份信息。

### D9. 迁移策略：丢弃旧 localStorage

**方案**：不做迁移。代码删掉 localStorage 读写后，老的 `currentUser`/`ikanban_user` 键在浏览器里残留但不再被读取，30 天后浏览器自动清理。下次访问因无 session cookie 直接跳 LoginPage。

**理由**：8 个用户、4 位密码，强制重登一次成本极低；迁移脚本/提示 UI 收益小。

### D10. `/api/auth/cookie-config` 端点（开发期辅助）

**方案**：`GET /api/auth/cookie-config` 返回 `{ name: "sid", secure: boolean, sameSite: "Lax" }`。

**理由**：方便未来测试或前端代码动态获取 cookie 名（避免硬编码两遍）；不暴露 secret。

## Risks / Trade-offs

- **[R1] 25+ 处 `getUserHeader` 调用遗漏 → 单个动作偶发 401** → 缓解：tasks.md 列出 grep 验证步骤；按目录扫一遍 `src/components` 和 `src/app`
- **[R2] App 启动 fetch `/api/auth/me` 引入 loading 闪烁** → 缓解：loading 态复用 LoginPage 的视觉骨架（`mounted` 标志已有先例）
- **[R3] 内存 rate limit 在多实例部署下各自独立** → 缓解：当前单进程部署可接受；写注释"切多实例时必须换 Redis"
- **[R4] sha256 token hash 在 GPU 攻击下 8h 暴力窗口的暴露风险** → 缓解：32 字节（256 位）熵远超 GPU 可枚举空间（2^256），实际不可暴力；sha256 的目的是 DB 泄露防护而非抗在线暴力
- **[R5] 老 localStorage 残留可能让用户在 30 天内仍尝试读老 key** → 缓解：完全删除所有读取代码；grep 验证
- **[R6] 改动跨多个目录，没有测试网** → 缓解：tasks.md 末尾列手动验证清单（登录/登出/跨页面 cookie 共享/Portal 跳转/401 行为/4 位密码首次设置/rate limit 触发/同账号踢旧）
- **[R7] Portal 的 `/api/portal/*` 端点不强制角色** → 缓解：明确写进 Non-Goals，不在本次范围

## Migration Plan

**部署顺序**（单进程，零停机可接受）：
1. 部署新代码（同时支持新表 + 新 cookie；旧 `x-user` 路径暂不删）
2. 旧 session 不存在 → 用户首次访问被弹到 LoginPage → 输入 4 位密码 → 获得新 cookie
3. 监控 24h，确认无 401 异常
4. 删除 `x-user` 兼容代码（如有需要，本次为 breaking change 则一次性切换）

**回滚策略**：
- DB 变更（新增 sessions 表）是可逆的（DROP TABLE sessions 不影响其他表）
- 代码回滚到上一 commit 即可
- 用户已建立的 session 在回滚后会全部失效（因旧代码读 x-user 不读 sid）→ 强制重登，可接受

## Open Questions

- **OQ1**：`/api/auth/cookie-config` 是否要现在做？答：要，作为"前端能拿到 cookie 名"的可观测性入口
- **OQ2**：是否要在用户表加 `failed_login_count` 做持久化 rate limit？答：不在本范围
- **OQ3**：session 列表 UI（"我的设备"）？答：不在本范围
- **OQ4**：Portal 的"只读"服务端 enforce？答：不在本范围（明确延后到独立 change）
