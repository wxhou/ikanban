# 技术设计 v2

## 数据模型

```sql
CREATE TABLE IF NOT EXISTS versions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  status  TEXT NOT NULL DEFAULT 'active', -- active | closed
  created TEXT NOT NULL DEFAULT (date('now'))
);

-- tasks 表加 (可空，不关联版本的任务照常存在)
ALTER TABLE tasks ADD COLUMN version_id INTEGER REFERENCES versions(id);
```

## UI 布局

```
TopNav:  看板 | 总览 | 汇报 | 版本管理    ← 新增 Tab

FilterBar: 
  全部 | 甲方 | 内部 | 我的  ·  全部 | 高 | 中 | 低  ·  [版本 ▾]
                                                          ↑ 新增版本筛选
```

## 交互逻辑

```
TaskModal 新建/编辑:
  版本字段: 下拉选择 [当前激活版本 ▾]
    - 未分配
    - V3.1 (活跃)
    - V3.0 (已结算)
    - ...

  新建时默认选中: 
    看板"版本"筛选器当前选中的版本 (选"全部"时 → 未分配)

FilterBar 版本筛选:
  [全部 ▾]  默认不筛选
  [V3.1 ▾]
  [未分配 ▾]
  切换后看板 + 统计均按版本过滤

版本管理页 (新 Tab):
  ┌─────────────────────────────────┐
  │ 版本管理                         │
  │ + 新建版本                       │
  │                                 │
  │ V3.1  活跃    2026-06-01        │
  │  [重命名] [结算]                 │
  │                                 │
  │ V3.0  已结算  2026-05-01        │
  │  [重命名] [激活] [删除]          │
  │ ...                             │
  └─────────────────────────────────┘
```

## 权限

- 筛选已结算版本 → 看板只读，禁止拖拽编辑新建
- 筛选活跃/未分配/全部 → 正常操作

## API

```
GET/POST  /api/versions
PATCH/DELETE /api/versions/[id]
GET /api/tasks?versionId=X  (扩展)
```

## 文件变更

```
新增:
  src/lib/version-db.ts
  src/app/api/versions/route.ts
  src/app/api/versions/[id]/route.ts
  src/components/VersionPage.tsx
  src/components/VersionPage.module.css

修改:
  src/lib/types.ts           — Version 类型 + Task.versionId
  src/lib/db.ts              — versions 表 + task.version_id 列
  src/api.ts                 — 版本 API 客户端
  src/app/App.tsx            — activeVersionId state + VersionPage 路由
  src/components/TopNav/TopNav.tsx — 新增"版本管理" Tab
  src/components/FilterBar/FilterBar.tsx — 版本下拉筛选
  src/components/TaskModal/TaskModal.tsx — 版本关联字段
  src/components/KanbanBoard.tsx   — 只读模式
  src/components/Dashboard.tsx     — 版本过滤
  src/components/Report.tsx        — 版本过滤
```
