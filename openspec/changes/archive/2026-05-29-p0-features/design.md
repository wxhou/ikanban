# 技术设计

## 数据模型变更

### 新增表：subtasks

```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text       TEXT NOT NULL DEFAULT '',
  done       INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
```

### 新增表：comments

```sql
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user       TEXT NOT NULL,
  text       TEXT NOT NULL,
  created    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX idx_comments_task_id ON comments(task_id);
```

### 类型变更 (types.ts)

```ts
export interface Subtask {
  id: number;
  taskId: number;
  text: string;
  done: boolean;
  sortOrder: number;
}

export interface Comment {
  id: number;
  taskId: number;
  user: string;
  text: string;
  created: string;
}

// Task 新增字段
export interface Task {
  // ...existing fields...
  subtasks: Subtask[];
  comments: Comment[];
}
```

## API 变更

### GET /api/tasks

返回时 LEFT JOIN subtasks 和 comments，task 对象内嵌 `subtasks[]` 和 `comments[]`。

### POST /api/tasks

创建 task 后可选批量插入 subtasks。

### PATCH /api/tasks/[id]

现有逻辑不变。

### 新增子路由

```
POST   /api/tasks/[id]/subtasks     → 创建子任务
PATCH  /api/tasks/[id]/subtasks/[sid] → 更新子任务 (text/done)
DELETE /api/tasks/[id]/subtasks/[sid] → 删除子任务

POST   /api/tasks/[id]/comments     → 添加备注
DELETE /api/tasks/[id]/comments/[cid] → 删除备注
```

## 前端变更

### 工具函数 (utils.ts)

```ts
export function isOverdue(task: Task): boolean {
  if (!task.due || task.status === 'done') return false;
  return new Date(task.due) < new Date(new Date().toISOString().split('T')[0]);
}

export function overdueDays(due: string): number {
  if (!due) return 0;
  const diff = Date.now() - new Date(due).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}
```

### TaskCard 变更

- 逾期：`border-color: var(--danger)` + 浅红背景
- 逾期标签：`"已逾期 X 天"` 红色 badge
- 子任务进度：进度条 `done/total`
- 备注数：带图标的数字

### FilterBar 变更

新增优先级筛选组（紧急/高/低），紧跟在来源筛选后面，用分隔线隔开。

### TaskModal 变更

三个 tab：基本信息 | 子任务 (N) | 备注 (N)

- **子任务 tab**：checkbox + text input + 删除按钮 + 底部添加按钮
- **备注 tab**：头像+用户名+时间+内容列表 + 底部输入框+发送按钮

### Dashboard 变更

- 新增第 5 个 StatCard："已逾期"，红色主题
- 新增 "逾期任务预警" 面板：列表显示逾期任务，按逾期天数倒序

## 文件变更清单

```
修改:
  src/lib/types.ts           — 新增 Subtask, Comment 类型，Task 加字段
  src/lib/db.ts              — 新增建表、seed、子任务/备注 CRUD
  src/api.ts                 — 新增子任务/备注客户端 API
  src/utils.ts               — 新增 isOverdue, overdueDays
  src/components/TaskCard/TaskCard.tsx      — 逾期样式 + 子任务进度 + 备注数
  src/components/TaskCard/TaskCard.module.css — 对应样式
  src/components/FilterBar/FilterBar.tsx    — 优先级筛选
  src/components/FilterBar/FilterBar.module.css — 对应样式
  src/components/TaskModal/TaskModal.tsx    — 三个 tab
  src/components/TaskModal/TaskModal.module.css — 子任务/备注样式
  src/components/Dashboard.tsx              — 逾期 stat + 预警面板
  src/components/Dashboard.module.css       — 对应样式

新增:
  src/app/api/tasks/[id]/subtasks/route.ts
  src/app/api/tasks/[id]/subtasks/[sid]/route.ts
  src/app/api/tasks/[id]/comments/route.ts
  src/app/api/tasks/[id]/comments/[cid]/route.ts
```
