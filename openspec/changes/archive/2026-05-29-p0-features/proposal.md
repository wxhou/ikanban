# P0 功能补齐：逾期预警 + 子任务 + 备注

## 背景

对比 index.html 原型，当前 Next.js 项目缺失三个老板看板核心功能：
- **逾期预警**：老板需要一眼看到哪些任务已逾期、逾期几天
- **子任务**：复杂任务需要拆解，跟踪完成进度
- **备注/评论**：团队成员需要在任务上留痕沟通

## 范围

### 1. 逾期预警 + 逾期统计

- 新增 `isOverdue(task)` / `overdueDays(due)` 工具函数
- TaskCard 逾期样式：红色边框 + "已逾期 X 天" 警告标签
- Dashboard 新增 "已逾期" StatCard
- Dashboard 新增 "逾期任务预警" 面板（按逾期天数排序）
- FilterBar 新增优先级筛选组（紧急/高/低）— 与逾期预警配合使用

### 2. 子任务系统

- 数据库新增 `subtasks` 表（id, task_id, text, done, sort_order）
- API: GET/POST 子任务随 Task 一起返回；PATCH/DELETE 单条子任务
- Task 类型新增 `subtasks: Subtask[]`
- TaskModal 新增 "子任务" tab：勾选、编辑文本、删除、新增
- TaskCard 显示子任务进度条 (`done/total`)

### 3. 备注/评论系统

- 数据库新增 `comments` 表（id, task_id, user, text, created）
- API: GET/POST 备注随 Task 一起返回；DELETE 单条备注
- Task 类型新增 `comments: Comment[]`
- TaskModal 新增 "备注" tab：列表展示 + 添加输入框
- TaskCard 显示备注数量

## 不做什么

- 不改现有的拖拽逻辑
- 不改现有 API 路由结构（只扩展）
- 不加 WebSocket 实时推送
- 不做用户认证（当前固定用户列表）

## 技术约束

- SQLite 数据库，better-sqlite3
- Next.js 16 App Router
- 子任务和备注通过 task API 联表查询返回，不单独开页面
