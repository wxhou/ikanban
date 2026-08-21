# Route-Based Views — Design

## Context

现状（详见 proposal.md Why）：所有视图挤在 `src/app/home/App.tsx`（383 行客户端状态容器），`view` 为内存 state；KanbanBoard 已用 `history.replaceState` 将筛选参数同步到 URL（`?f=` `?p=` `?q=` `?v=` `?a=` `?d=` `?ds=` `?de=`），但视图本身无 URL 语义；30s 轮询在 KanbanBoard 内部；Dashboard/Report/MyTasks 是纯 props 组件；server 端 `home/page.tsx` 无认证守卫，直接注入全部任务数据。

约束：无新增依赖；视图组件（KanbanBoard/Dashboard/Report/VersionPage/MyTasks/UserManagement/TaskModal）保持纯 props 接口，尽量不动内部逻辑；项目为内部工具，性能非瓶颈，但"老板视角"需要 URL 语义。

## Goals / Non-Goals

**Goals:**
- 四个视图成为真实路由，URL 反映视图，刷新/后退/分享保持位置
- 共享状态抽为 context，轮询/通知/逾期检查集中一处，所有视图即时反映数据变更
- 认证守卫移到 server 端，未登录用户拿不到业务数据
- 删除 App.tsx 巨型状态容器

**Non-Goals:**
- 不改视图组件内部业务逻辑（筛选、拖拽、图表计算等原样保留）
- 不做每页独立数据获取（A2 方案已否决，见决策 1）
- 不引入新依赖（无 react-router、无状态管理库）
- 不重构数据层（db.ts / API 路由不动）

## Decisions

### 决策 1：共享状态用 React Context（A1），否决每页独立 fetch（A2）
任务数据、版本、成员、通知由 layout 级 Provider 持有，四个路由页面消费同一份状态。

- **理由**：现状即全局状态 + 即时反映（改任务后所有视图立即更新）；轮询、逾期检查、通知拉取只写一份；视图组件已是纯 props 组件，接入 context 改动最小。
- **否决 A2（每页独立 fetch）**：切换视图有网络延迟；轮询/通知逻辑需复制或重构；数据一致性靠重新拉取，与现状行为倒退。

### 决策 2：认证守卫放 `/home/layout.tsx`（server 组件）
layout 读 `sid` cookie（`findSessionByToken`），无有效会话则 `redirect("/login")`；`/login` 为独立路由渲染 LoginPage。

- **理由**：server 端守卫从源头阻断数据泄露（现状是客户端条件渲染，数据已注入）；layout 是 Next.js 路由化守卫的天然位置；登录页独立路由符合 URL 语义。
- **替代方案**：layout 内条件渲染 LoginPage——改动更小但 URL 无登录语义，且守卫逻辑与渲染耦合，否决。

### 决策 3：Context 拆为两层，避免单一大 context 重渲染风暴
- **AppProvider**（layout 级）：auth（currentUser/role/login/logout）+ 业务数据（tasks/versions/activeVersionId/members/notifications/unreadCount）+ 副作用（30s 轮询、逾期检查、通知拉取、版本/成员拉取）。
- **UIContext**（layout 级）：modalTask/modalReadOnly、showMyTasks、showUserManagement、showNotifications 等 overlay 状态。

- **理由**：tasks 高频变更（拖拽/轮询），若与 UI overlay 状态同 context，每次轮询都重渲染 modal 相关组件；拆分后 UI 状态独立，消费方用 `useMemo`/`memo` 隔离。
- **注意**：AppProvider 内部仍会因 tasks 变更重渲染，但消费组件（Dashboard/Report 等）用 `memo` 包裹，props 不变则不重渲染。

### 决策 4：TaskModal 与 overlay 组件挂在 layout，由 UIContext 驱动
TaskModal、MyTasks、UserManagement、NotificationPanel 从"App 层条件渲染"改为"layout 层常驻渲染"，状态由 UIContext 提供。KanbanBoard 与 MyTasks 通过 context 的 `openTask(task, readOnly)` 打开 modal；通知点击打开任务（`handleClickNotif` 逻辑）迁入 layout 层组件。

- **理由**：modal 与 overlay 是跨视图共享 UI（看板、我的待办、通知点击都要打开），路由化后不能只属于看板页；App.tsx 删除后这些渲染逻辑必须有人接管。

### 决策 5：轮询/通知/逾期检查从 App.tsx 与 KanbanBoard 迁入 AppProvider
- 30s 轮询（现 KanbanBoard 内）：迁入 AppProvider，所有视图实时；保留 `document.hidden` 暂停与 modal 打开时暂停的行为。AppProvider 消费 UIContext 的 `isModalOpen` 状态实现"modal 打开时暂停"（两个 context 的交互通过 UIContext 暴露的只读状态完成，AppProvider 不直接改 UI 状态）。
- 逾期检查 + 通知创建（现 App.tsx）：迁入 AppProvider，登录后执行一次。
- 通知 30s 拉取（现 App.tsx）：迁入 AppProvider，与任务轮询合并为同一 interval 或并行。

- **理由**：这些副作用本质是"全局数据维护"，不属于任何单一视图；集中后视图组件变薄。

### 决策 6：URL 结构与导航
- 路由：`/home/kanban`、`/home/dashboard`、`/home/report`、`/home/versions`；`/` 与 `/home` 重定向到 `/home/kanban`。
- TopNav：`view`/`onViewChange` props 改为 `usePathname()` 推导当前视图 + `<Link>` 导航；**切换视图时清空筛选参数**（`?f=` `?q=` 等对 dashboard/report/versions 无意义，避免 URL 噪音），仅保留视图路径。
- 看板筛选参数逻辑（KanbanBoard 内 `replaceState`）原样保留，与视图路由共存。

### 决策 7：数据注入方式——server 注入作 context 初始值（已定案）
layout 在守卫通过后获取初始数据（tasks/users/versions/members），作为 props 传给 client 的 AppProvider 作初始值；AppProvider 挂载后不再全量拉取，仅靠轮询增量刷新。

- **理由**：保持首屏行为不变（立即有数据，无 loading 闪烁）；守卫在 layout 已拦截未登录用户，注入只发生在已登录时，无泄露风险；实现简单（layout 渲染 client 组件并传 serializable props）。
- **否决客户端全量拉取**：首屏从"立即有数据"变为"先 loading 再数据"，是用户可感知的行为倒退。

## Risks / Trade-offs

- **[Context 重渲染]** tasks 每次变更（拖拽、轮询）触发 AppProvider 重渲染 → 消费组件用 `memo` 包裹；高频组件（KanbanColumn/TaskCard）已 memo 化，保持即可。
- **[路由切换丢状态]** 看板筛选/搜索等 UI 状态在路由切换时卸载 → 筛选参数已在 URL（现状即如此），切换视图再回来时从 URL 恢复；`activeVersionId` 已在 URL（`?v=`），其余 UI 状态（如拖拽中）可接受丢失。
- **[迁移回归]** App.tsx 删除涉及大量 props 重接线 → 分步迁移（先建 context 与 layout，再逐视图切换，最后删 App.tsx），每步跑 lint + typecheck + Playwright 验证。
- **[认证行为变化]** 未登录用户从"看到空看板"变为"被重定向到 /login" → 属预期行为变化（spec 已定义），需在 Playwright 中验证登录/登出/会话过期路径。
- **[轮询归属变化]** 轮询从看板页迁到全局后，Dashboard/Report 也会每 30s 刷新 → 属预期（老板视角实时性），数据量小无性能风险。

## Migration Plan

1. 新建 `src/lib/context/`：AppProvider（auth + 数据 + 副作用）、UIContext。
2. 新建 `/home/layout.tsx`：server 端守卫 + 初始数据获取 + TopNav + AppProvider + UIContext + TaskModal/MyTasks/UserManagement/NotificationPanel 常驻。
3. 新建 `/login/page.tsx`：LoginPage 独立路由。
4. 新建四个视图页面：`kanban/page.tsx`、`dashboard/page.tsx`、`report/page.tsx`、`versions/page.tsx`，各自渲染对应组件并消费 context。
5. TopNav 改造：props 改 `usePathname` + `<Link>`，切换视图清空筛选参数。
6. 删除 `App.tsx`，`home/page.tsx` 改为重定向。
7. 验证：lint + typecheck + Playwright（登录/登出/视图切换/刷新保持/后退/分享链接/未登录访问受保护页）。

回滚：保留 App.tsx 至迁移完成并验证通过后再删除；git revert 可整体回退。