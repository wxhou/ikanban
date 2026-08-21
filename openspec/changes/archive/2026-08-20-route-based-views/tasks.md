# Route-Based Views — Tasks

## 1. Context 层

- [x] 1.1 新建 `src/lib/context/` 目录，实现 AppProvider（auth 状态 + tasks/versions/activeVersionId/members/notifications/unreadCount + login/logout 操作），接收 server 注入的初始数据（initialTasks/initialUsers/initialVersions/initialMembers）作初始值，验证：`bun run lint` 通过，类型检查通过
- [x] 1.2 实现 UIContext（modalTask/modalReadOnly、showMyTasks、showUserManagement、showNotifications + 对应 setter/openTask 操作 + 只读 isModalOpen），验证：`bun run lint` 通过，类型检查通过
- [x] 1.3 将 App.tsx 中的副作用迁入 AppProvider：登录后逾期检查 + 通知创建、通知 30s 拉取、版本/成员拉取，验证：登录后控制台无报错，通知数据正常加载
- [x] 1.4 将 KanbanBoard 的 30s 任务轮询迁入 AppProvider（保留 document.hidden 暂停；modal 打开时暂停通过消费 UIContext 的 isModalOpen 实现），验证：看板页停留 30s 后任务自动刷新，切后台标签页暂停轮询，打开 modal 时暂停轮询

## 2. 认证守卫与登录路由

- [x] 2.1 新建 `/home/layout.tsx`：server 端读 `sid` cookie 校验会话，无有效会话 `redirect("/login")`，验证：未登录访问 `/home/kanban` 被重定向到 `/login` 且响应不含业务数据
- [x] 2.2 新建 `/login/page.tsx` 渲染 LoginPage（users 数据由该页面 server 端获取注入），登录成功后跳转默认视图 `/home/kanban`，验证：登录流程走通，登录后进入看板
- [x] 2.3 登出流程接入 AppProvider（调用 `/api/auth/logout` 后清空状态并跳转 `/login`），验证：点击登出回到登录页，再访问受保护页仍被守卫拦截

## 3. 路由页面与共享 UI 挂载

- [x] 3.1 新建 `/home/kanban/page.tsx` 渲染 KanbanBoard（数据来自 context 初始值，保留筛选参数 URL 同步逻辑），验证：看板功能与现状一致（拖拽/筛选/搜索/批量操作）
- [x] 3.2 新建 `/home/dashboard/page.tsx` 渲染 Dashboard，验证：总览视图正常展示统计卡片与图表
- [x] 3.3 新建 `/home/report/page.tsx` 渲染 Report，验证：汇报视图正常展示表格与 CSV 导出
- [x] 3.4 新建 `/home/versions/page.tsx` 渲染 VersionPage，验证：版本管理视图正常展示与编辑
- [x] 3.5 `/` 与 `/home` 重定向到 `/home/kanban`，验证：访问 `/` 与 `/home` 均落到看板视图
- [x] 3.6 在 layout 常驻渲染 TaskModal（由 UIContext 驱动），迁移 handleSaveTask/handleDeleteTask 逻辑（含分配通知创建），验证：看板与"我的待办"中打开/编辑/删除任务行为与现状一致
- [x] 3.7 在 layout 常驻渲染 MyTasks/UserManagement/NotificationPanel（由 UIContext 驱动），迁移通知点击打开任务（handleClickNotif）逻辑，验证：三个 overlay 打开/关闭行为与现状一致，通知点击打开对应任务
- [x] 3.8 迁移全局键盘快捷键（`n` 新建任务、`/` 聚焦搜索）到 layout 层（依赖 UIContext 的 openTask），验证：看板视图按 `n` 打开新建 modal，按 `/` 聚焦搜索框

## 4. TopNav 改造

- [x] 4.1 TopNav 移除 `view`/`onViewChange` props，改用 `usePathname()` 推导当前视图 + `<Link>` 导航，切换视图时清空筛选参数（仅保留视图路径），验证：点击导航按钮 URL 变化且视图切换，当前视图按钮高亮，切换后 URL 无残留筛选参数
- [x] 4.2 验证筛选参数与视图共存：`/home/kanban?f=jiafang&q=巡检` 加载后应用筛选与搜索

## 5. 删除旧容器

- [x] 5.1 删除 `src/app/home/App.tsx`，`home/page.tsx` 改为重定向到 `/home/kanban`，验证：`bun run lint` + `bun run build` 通过，无残留引用

## 6. 集成验证

- [x] 6.1 Playwright 验证视图路由：直接访问四个视图 URL、`/` 与 `/home` 重定向、刷新保持视图、浏览器后退/前进、分享链接直达视图，验证：全部通过
- [x] 6.2 Playwright 验证认证：未登录访问受保护页被拦截且响应不含业务数据、登录成功进入默认视图、登出回到登录页、会话过期重新登录，验证：全部通过
- [x] 6.3 回归验证核心交互：拖拽移动、任务编辑/删除、通知点击打开任务、我的待办、用户管理（admin）、键盘快捷键，验证：与迁移前行为一致