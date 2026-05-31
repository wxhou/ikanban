## Why

运维团队处理任务时经常存在多个任务互相阻塞的情况（如"SSL证书到期"阻塞了"部署新版本"），但当前系统无法表达这种关系。同时团队缺乏一个集中的通知面板，成员被分配任务或任务有变动时只能依赖浏览器弹窗，离开页面就错过。这两个能力是运维场景的基础需求。

## What Changes

- **任务关联**: 支持在任务间建立"阻塞/被阻塞/关联"关系，TaskCard 上展示关联徽章，TaskModal 新增加关联管理 Tab
- **通知中心**: TopNav 新增铃铛图标 + 通知下拉面板，任务分配/评论/到期时自动创建通知，支持标记已读
- **数据层**: 新增 `task_links` 表、`notifications` 表及相关 CRUD 端点

## Capabilities

### New Capabilities

- `task-linking`：任务间建立阻塞/关联关系，支持 CRUD 和在 TaskCard/TaskModal 中展示
- `notification-center`：顶部通知铃铛 + 下拉面板，自动生成分配/评论/到期通知，支持已读标记

### Modified Capabilities

- `task-management`：Task 类型扩展 `linkedTasks` 字段；任务变更时触发通知创建

## Impact

- `src/lib/types.ts`：Task 接口新增 `linkedTasks` 字段，新增 `TaskLink` 类型
- `src/lib/db.ts`：新增 `task_links`、`notifications` 表及 CRUD
- `src/app/api/tasks/[id]/links/`：新增关联任务端点
- `src/app/api/notifications/`：新增通知端点
- `src/components/TaskCard/`：关联徽章展示
- `src/components/TaskModal/`：新增关联任务管理 Tab
- `src/components/TopNav/`：铃铛图标 + 未读徽章
- `src/components/NotificationPanel/`：新增组件
