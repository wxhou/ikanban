## Phase 1: 数据层

- [x] 1.1 types.ts — 新增 Version 类型, Task 加 versionId
- [x] 1.2 db.ts — 建 versions 表 + tasks 加 version_id 列 + seed
- [x] 1.3 version-db.ts — 版本 CRUD

## Phase 2: API 层

- [x] 2.1 /api/versions/route.ts — GET all + POST create
- [x] 2.2 /api/versions/[id]/route.ts — PATCH + DELETE

## Phase 3: UI 层

- [x] 3.1 api.ts — 版本客户端函数
- [x] 3.2 App.tsx — activeVersionId state
- [x] 3.3 TopNav — 新增"版本管理" Tab
- [x] 3.4 VersionPage — 版本管理页面 (新建/结算/重命名/激活/删除)
- [x] 3.5 FilterBar — 版本下拉筛选器
- [x] 3.6 TaskModal — 版本关联字段
- [x] 3.7 KanbanBoard — 已结算版本只读模式

## Phase 4: 验证

- [x] 4.1 tsc 通过
