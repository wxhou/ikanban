## MODIFIED Requirements

### Requirement: Next.js API Route 端点
系统 SHALL 通过 App Router API Routes 暴露以下 REST 端点供客户端组件调用：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取所有任务列表（支持分页） |
| POST | /api/tasks | 创建新任务 |
| PATCH | /api/tasks/[id] | 更新指定 id 的任务 |
| POST | /api/tasks/batch | 批量更新任务 |

#### Scenario: GET /api/tasks（无分页参数）
- **WHEN** 客户端请求 GET /api/tasks 且未传 page/pageSize 参数
- **THEN** 返回 `Task[]` 数组，行为与当前完全一致

#### Scenario: GET /api/tasks（带分页参数）
- **WHEN** 客户端请求 GET /api/tasks?page=1&pageSize=50
- **THEN** 返回 `{ data: Task[], total: number, page: number, pageSize: number }`

#### Scenario: GET /api/portal/tasks（带分页参数）
- **WHEN** 客户端请求 GET /api/portal/tasks?page=1&pageSize=20
- **THEN** 仅返回 source === "jiafang" 的任务，支持分页
