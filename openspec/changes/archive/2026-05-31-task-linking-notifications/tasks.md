## 1. 数据层

- [x] 1.1 types.ts 新增 TaskLink 类型，Task 接口新增 linkedTasks 字段
- [x] 1.2 types.ts 新增 Notification 类型和 NotificationType 枚举
- [x] 1.3 db.ts 新增 task_links 表（含外键约束和唯一索引）及 CRUD 函数
- [x] 1.4 db.ts 新增 notifications 表（含用户索引）及 CRUD 函数

## 2. API 端点

- [x] 2.1 新增 `api/tasks/[id]/links/route.ts`：GET 查询关联、POST 创建关联、DELETE 删除关联
- [x] 2.2 新增 `api/notifications/route.ts`：GET 查询用户通知（分页）、POST 创建通知、PATCH 标记已读

## 3. 任务关联 UI

- [x] 3.1 TaskCard 标签行展示关联徽章（阻塞/被阻塞/关联，可点击跳转）
- [x] 3.2 TaskModal 新增"关联任务"Tab（列表展示、添加关联搜索选择器、删除按钮）
- [x] 3.3 添加关联交互：搜索任务标题 → 选择目标任务 → 选择关系类型

## 4. 通知中心 UI

- [x] 4.1 新增 NotificationPanel 组件（下拉面板、通知列表、已读/未读样式、全部已读按钮）
- [x] 4.2 TopNav 新增铃铛图标 + 未读徽章，点击展开 NotificationPanel
- [x] 4.3 App.tsx 集成通知轮询（30s 间隔更新未读数）

## 5. 通知触发集成

- [x] 5.1 TaskModal 保存时检测分配人变更 → 创建 assigned 通知
- [x] 5.2 评论创建时 → 为任务其他参与人创建 commented 通知
- [x] 5.3 App.tsx 页面加载时检测到期/逾期 → 创建 due_soon/overdue 通知
- [x] 5.4 点击通知时 → 标记已读 + 打开对应任务详情

## 6. 验证

- [x] 6.1 TypeScript 类型检查通过
- [x] 6.2 任务关联创建/删除/展示流程完整
- [x] 6.3 通知生成/展示/已读流程完整
