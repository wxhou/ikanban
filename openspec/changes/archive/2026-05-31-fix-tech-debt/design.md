## Context

项目从 MVP 快速迭代至今，密码使用明文存储（`verifyUserPassword` 直接比较字符串），`TEAM_MEMBERS` 在 `types.ts` 中硬编码为 7 人数组，`getAllTasks()` 全量查询无分页。当前任务数据量较小，但随着使用增长这些问题会持续恶化。

当前代码：
- 密码：`user.password === password`（db.ts:360）
- 团队成员：`export const TEAM_MEMBERS = ["惠寅初", ...]`（types.ts:57），被 Dashboard.tsx、TaskModal.tsx 引用
- 分页：`getAllTasks()` 和 portal API 无分页参数

## Goals / Non-Goals

**Goals:**
- 密码存储使用 bcrypt 哈希，支持渐进式迁移（老用户下次登录时自动升级）
- 团队成员列表改为从 users 表动态读取，前端通过 API 获取
- `GET /api/tasks` 支持可选分页参数，向后兼容
- 新增批量操作 API，看板支持多选修改

**Non-Goals:**
- 不实现 session/JWT 体系（当前 localStorage 方式保持不变）
- 不实现前端路由分页（数据量未到需要无限滚动的程度）
- 不做数据库 schema 迁移脚本（渐进式迁移替代）
- 不实现撤销批量操作（批量操作不可逆）

## Decisions

### 1. 密码哈希：bcryptjs

**选择**：`bcryptjs`（纯 JS 实现）

**理由**：无 native 依赖，Next.js serverless 环境兼容性好。`bcrypt` 包需要 node-gyp 编译，在 Vercel 等平台部署有坑。

**替代方案**：`argon2`（更安全）但 native 依赖问题更严重。`crypto.scrypt`（Node 内置）但 API 不够友好，且没有自动盐值管理。

**迁移策略**：渐进式。verify 时先尝试 bcrypt.compare，失败后比较明文，明文匹配则升级密码哈希值并存储。

### 2. 团队成员：前端缓存 + API

**选择**：新增 `GET /api/users/members` 返回 name 列表。前端 App.tsx 启动时 fetch 一次，存入 context/state，子组件通过 prop 或 context 读取。

**理由**：团队成员变更频率低，不需要实时同步。前端缓存足够。

**替代方案**：直接在已有 `GET /api/users` 响应中提取（但该接口可能包含管理员信息，不够干净）。SWR/React Query 引入新依赖，过重。

### 3. 分页：query 参数，向后兼容

**选择**：`GET /api/tasks?page=1&pageSize=50`，不传时返回全部数据。响应格式：
- 不传分页参数：`Task[]`（现有行为不变）
- 传分页参数：`{ data: Task[], total: number, page: number, pageSize: number }`

**理由**：向后兼容是首要考虑。当前客户端已有多个地方不处理分页格式，强制分页会 break 现有代码。门户页面数据量小，暂不需要分页。

**替代方案**：cursor-based 分页（更优但对现有客户端改动太大）。

### 4. 批量操作：POST /api/tasks/batch

**选择**：`POST /api/tasks/batch`，body: `{ ids: number[], updates: { status?, priority?, assignees? } }`

**理由**：复用现有 PATCH /api/tasks/[id] 的更新逻辑，批量执行。返回 `{ updated: number }`。

**替代方案**：PATCH /api/tasks（带 ids query）但这与 GET /api/tasks 冲突。

## Risks / Trade-offs

- **[密码迁移窗口]** → 渐进迁移期间数据库中同时存在哈希和明文密码。缓解：verify 逻辑兼容两种格式，迁移完成前无法强制所有用户升级。
- **[bcryptjs 性能]** → 纯 JS 比 native bcrypt 慢约 3-5 倍。缓解：4 位数字密码的哈希计算量极小，差异不可感知。
- **[分页格式双轨]** → 响应格式取决于是否传分页参数，客户端需要注意。缓解：不传分页参数时行为完全不变，现有代码零改动。
- **[批量操作权限]** → 需确保只有已登录用户可调用，且只能操作自己有权访问的任务。
