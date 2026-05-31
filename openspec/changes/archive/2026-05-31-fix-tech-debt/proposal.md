## Why

项目从 MVP 阶段快速迭代至今，积累了若干技术债：密码明文存储存在安全隐患、团队成员硬编码导致数据不一致、API 全量查询在数据增长后会成为性能瓶颈。这些技术债不解决会随项目演进持续恶化，越晚修成本越高。

## What Changes

1. **密码安全升级**：将用户密码存储从明文改为 bcrypt 哈希。现有明文密码在用户下次登录时自动迁移为哈希值。`verify-password` 和 `set-password` API 对应调整。
2. **团队成员动态化**：移除 `types.ts` 中硬编码的 `TEAM_MEMBERS` 数组，改为从 `users` 表动态读取。看板筛选器、任务卡片、仪表盘等所有引用 TEAM_MEMBERS 的地方统一改为从 API 获取。
3. **API 分页支持**：`GET /api/tasks` 和 `GET /api/portal/tasks` 增加分页参数（`page`、`pageSize`），默认返回全部数据（向后兼容），支持客户端按需加载。
4. **任务批量操作**：新增 `POST /api/tasks/batch` 端点，支持批量修改任务的状态、优先级、负责人。看板页面增加多选模式。

## Capabilities

### New Capabilities
- `auth-security`: 密码哈希存储与自动迁移
- `batch-operations`: 任务批量选择与批量修改

### Modified Capabilities
- `data-persistence`: API 分页支持，移除硬编码团队成员
- `task-management`: 筛选器改为动态读取团队成员列表

## Impact

- **依赖新增**：`bcryptjs`（纯 JS 实现，无 native 依赖，兼容 Next.js）
- **数据库**：无 schema 变更，仅密码字段内容从明文变为哈希值
- **API 变更**：`GET /api/tasks` 新增可选 query 参数；新增 `POST /api/tasks/batch`
- **前端**：多个组件（FilterBar、KanbanBoard、Dashboard、MyTasks、TaskModal 等）中 `TEAM_MEMBERS` 引用改为 API 调用
- **兼容性**：分页参数默认不传时行为不变；密码迁移为渐进式，无破坏性
