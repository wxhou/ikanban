# Route-Based Views

## Why

当前所有视图（看板/总览/汇报/版本）挤在单个客户端组件 `src/app/home/App.tsx` 中，靠内存 `view` state 切换：刷新丢失视图位置、浏览器后退直接退出应用、无法分享/收藏特定视图链接。同时认证只在客户端检查（`/api/auth/me` 后条件渲染登录页），server 端 `home/page.tsx` 无守卫直接注入全部任务数据——未登录用户可获取完整数据，UI 遮挡只是表象。

## What Changes

- **视图路由化**：`/home/kanban`、`/home/dashboard`、`/home/report`、`/home/versions` 四个真实路由页面，TopNav 从 state 回调改为 `<Link>` 导航。
- **URL 语义**：刷新、浏览器后退/前进、分享/收藏链接均保持当前视图；看板筛选参数（`?f=` `?p=` `?q=` `?v=` 等）继续与视图共存于 URL。
- **共享状态层**：新增 TaskProvider context 承载 tasks/versions/members/notifications，30s 轮询、逾期检查、通知拉取集中一处，所有视图即时反映数据变更。
- **BREAKING**：认证守卫移到 server 端 layout（读 `sid` cookie，无有效会话则渲染登录页），未登录用户不再能获取任务数据。
- **移除巨型状态容器**：`App.tsx` 拆分删除，各视图页面变薄，仅保留自身 UI 状态。

## Capabilities

### New Capabilities
- `navigation`: 视图路由化与 URL 语义——视图切换通过真实路由，刷新/后退/分享保持视图位置。
- `user-auth`: server 端认证守卫——未登录用户无法获取任务数据，登录/登出由服务端会话驱动。

### Modified Capabilities
- `kanban-board`: "顶部导航"需求从内存 state 切换改为路由导航（URL 反映当前视图，导航按钮为链接）。

## Impact

- `src/app/home/App.tsx`：拆分并删除（383 行状态容器）。
- `src/app/home/page.tsx`：不再直接注入全部数据，改为薄页面或并入 layout。
- 新增 `src/app/home/layout.tsx`：server 端认证守卫 + TopNav + TaskProvider。
- 新增 4 个路由页面：`kanban/page.tsx`、`dashboard/page.tsx`、`report/page.tsx`、`versions/page.tsx`。
- `src/components/TopNav/TopNav.tsx`：`view`/`onViewChange` props 改为 `usePathname` + `<Link>`。
- `src/lib/`：新增 context 模块（TaskProvider 等）。
- 各视图组件（KanbanBoard/Dashboard/Report/VersionPage/MyTasks/UserManagement/TaskModal）保持纯 props 组件，接口基本不变。
- 无新增依赖。