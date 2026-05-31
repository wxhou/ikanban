## ADDED Requirements

### Requirement: SQLite 数据库初始化
系统 SHALL 在 API Route 首次被调用时自动创建 SQLite 数据库文件和 tasks 表（如不存在），并插入种子数据。

#### Scenario: 首次启动
- **WHEN** API Route 首次被调用且数据库文件不存在
- **THEN** 自动创建 `data/kanban.db`，建立 tasks 表结构，插入 10 条种子任务数据

#### Scenario: 非首次启动
- **WHEN** API Route 被调用且数据库文件已存在
- **THEN** 直接连接现有数据库，不重复初始化，保留用户数据

### Requirement: Next.js API Route 端点
系统 SHALL 通过 App Router API Routes 暴露以下 REST 端点供客户端组件调用：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取所有任务列表 |
| POST | /api/tasks | 创建新任务 |
| PATCH | /api/tasks/[id] | 更新指定 id 的任务 |

#### Scenario: GET /api/tasks
- **WHEN** 客户端请求 GET /api/tasks
- **THEN** 返回 JSON 数组，每条任务的 assignees 为数组格式

#### Scenario: POST /api/tasks
- **WHEN** 客户端 POST /api/tasks 并携带任务数据
- **THEN** 任务写入 SQLite，返回带自增 id 的完整任务对象，状态码 201

#### Scenario: PATCH /api/tasks/[id]
- **WHEN** 客户端 PATCH /api/tasks/[id] 并携带部分字段
- **THEN** 仅更新传入的字段，updated 时间戳自动更新为当前日期，返回更新后的任务

### Requirement: 数据库 CRUD 函数
lib/db.ts SHALL 封装以下数据库操作函数供 API Route 调用：

| 操作 | 函数 | 说明 |
|------|------|------|
| 查询全部 | `getAllTasks()` | 返回所有任务，assignees 解析为数组 |
| 创建 | `createTask(task)` | 插入新任务，返回带 id 的任务 |
| 更新 | `updateTask(id, task)` | 更新指定 id 的任务字段 |

#### Scenario: assignees JSON 序列化
- **WHEN** 任务写入数据库
- **THEN** assignees 数组序列化为 JSON 字符串存储；读取时反序列化为数组

### Requirement: 种子数据
系统 SHALL 在数据库初始化时插入 10 条种子任务数据，覆盖所有状态、优先级、来源组合。

#### Scenario: 种子数据覆盖完整
- **WHEN** 数据库初始化完成
- **THEN** 种子数据包含 todo/inprogress/review/blocked/done 五种状态、high/medium/low 三种优先级、jiafang/internal 两种来源的任务
