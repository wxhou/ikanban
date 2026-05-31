## Context

iKanban 是一个轻量级项目管理看板，服务于内部团队和甲方。当前架构：
- 前端：Next.js 16 (App Router) + React
- 后端：Next.js API Routes
- 数据库：SQLite (本地) / Turso (生产)
- 状态管理：useState + props drilling

**当前问题**：
1. 数据获取是一次性的（页面加载时 fetchTasks），之后不会自动更新
2. 筛选功能只有"来源"和"优先级"，缺少按负责人和日期筛选

**约束条件**：
- 技术栈轻量，不引入额外依赖（如 Socket.io、SWR）
- 甲方门户和内部看板共用同一套 API
- SQLite/Turso 作为数据库，无原生 Change Stream 支持

## Goals / Non-Goals

**Goals:**
- 看板页面每 30 秒自动刷新任务数据
- 甲方门户每 15 秒自动刷新（甲方对实时性要求更高）
- 页面不可见时暂停轮询，节省资源
- 新增负责人筛选下拉框
- 新增日期范围筛选（今天、本周、本月、自定义）
- 筛选状态持久化到 URL 参数

**Non-Goals:**
- 不实现 WebSocket/SSE 实时推送（过度工程化）
- 不实现增量更新（全量轮询足够，SQLite 场景下数据量有限）
- 不实现复杂的工作流自动化
- 不实现多项目管理

## Decisions

### Decision 1: 轮询 vs WebSocket/SSE

**选择**: 简单轮询（setInterval + fetch）

**理由**:
- 实现简单，无额外依赖
- SQLite/Turso 无原生 Change Stream，WebSocket 仍需轮询 DB
- 30 秒间隔对看板场景足够，服务器负载可控
- 前端代码改动最小

**替代方案**:
- WebSocket: 需要维护连接状态、重连逻辑，复杂度高
- SWR/React Query: 引入额外依赖，与当前轻量架构不符
- Server-Sent Events: 需要保持长连接，SQLite 场景收益不大

### Decision 2: 轮询间隔策略

**选择**: 
- 内部看板：30 秒
- 甲方门户：15 秒
- 页面不可见时：暂停

**理由**:
- 甲方对实时性更敏感（信任问题）
- 页面不可见时轮询浪费资源
- 间隔过短增加服务器负载，过长影响体验

### Decision 3: 筛选状态持久化

**选择**: URL Search Params

**理由**:
- 浏览器原生支持，无额外依赖
- 支持分享筛选后的视图
- 刷新页面后保留状态
- 与 Next.js App Router 兼容

**替代方案**:
- localStorage: 无法分享，多 tab 不同步
- React Context: 刷新丢失
- URL Hash: 不支持服务端渲染

### Decision 4: 筛选器组件设计

**选择**: 扩展现有 FilterBar 组件

**理由**:
- 保持 UI 一致性
- 减少组件数量
- 复用现有筛选逻辑

**实现**:
- 负责人筛选：下拉多选，从 `/api/users/members` 获取列表
- 日期筛选：预设选项（今天/本周/本月）+ 自定义日期范围

## Risks / Trade-offs

### Risk 1: 轮询导致服务器负载
**影响**: 每 15-30 秒全量查询 DB
**缓解**: 
- 页面不可见时暂停
- 合理设置间隔
- 未来可添加 ETag/If-Modified-Since 支持

### Risk 2: 数据冲突
**影响**: 用户编辑时数据被轮询更新覆盖
**缓解**: 
- 轮询只更新未在编辑中的任务
- TaskModal 打开时暂停轮询
- 使用乐观更新策略

### Risk 3: URL 参数过长
**影响**: 筛选条件多时 URL 可读性差
**缓解**: 
- 使用简短参数名（f=负责人, d=日期）
- 合理的默认值不写入 URL

### Risk 4: 日期筛选时区问题
**影响**: 不同时区的用户看到不同的"今天"
**缓解**: 
- 使用客户端本地时区
- API 接收 ISO 8601 格式日期
