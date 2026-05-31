# 任务清单

## Phase 1: 数据层

- [x] 1.1 types.ts — 新增 Subtask, Comment 接口，Task 加 subtasks/comments 字段
- [x] 1.2 db.ts — 新增 subtasks, comments 建表 + 索引
- [x] 1.3 db.ts — 新增子任务 CRUD 函数 (getByTaskId, create, update, delete)
- [x] 1.4 db.ts — 新增备注 CRUD 函数 (getByTaskId, create, delete)
- [x] 1.5 db.ts — getAllTasks 联表查 subtasks + comments
- [x] 1.6 db.ts — 更新 seed 数据加入子任务和备注示例

## Phase 2: API 层

- [x] 2.1 src/app/api/tasks/[id]/subtasks/route.ts — POST 创建子任务
- [x] 2.2 src/app/api/tasks/[id]/subtasks/[sid]/route.ts — PATCH + DELETE 子任务
- [x] 2.3 src/app/api/tasks/[id]/comments/route.ts — POST 添加备注
- [x] 2.4 src/app/api/tasks/[id]/comments/[cid]/route.ts — DELETE 删除备注
- [x] 2.5 src/api.ts — 新增客户端子任务/备注 API 函数

## Phase 3: 逾期预警

- [x] 3.1 utils.ts — 新增 isOverdue, overdueDays 工具函数
- [x] 3.2 TaskCard — 逾期红色边框 + 背景 + 逾期天数 badge
- [x] 3.3 FilterBar — 新增优先级筛选组
- [x] 3.4 KanbanBoard — 传递 priority filter 逻辑
- [x] 3.5 Dashboard — 新增 "已逾期" StatCard (红色)
- [x] 3.6 Dashboard — 新增 "逾期任务预警" 面板

## Phase 4: 子任务系统

- [x] 4.1 TaskCard — 子任务进度条 (done/total)
- [x] 4.2 TaskModal — 新增 "子任务" tab
- [x] 4.3 TaskModal — 子任务勾选、编辑、删除、新增交互
- [x] 4.4 TaskModal — 子任务变更调用 API 持久化

## Phase 5: 备注系统

- [x] 5.1 TaskCard — 备注数显示
- [x] 5.2 TaskModal — 新增 "备注" tab
- [x] 5.3 TaskModal — 备注列表 + 添加备注交互
- [x] 5.4 TaskModal — 备注变更调用 API 持久化

## 验证

- [x] 6.1 lint + typecheck 通过
- [x] 6.2 功能验证：逾期任务标红、子任务增删改勾选、备注增删
