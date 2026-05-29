## Context

当前项目看板是一个 914 行的单 HTML 文件原型，使用 React 18 CDN + Babel standalone 在浏览器内编译 JSX。数据硬编码在 `INITIAL_TASKS` 数组中，刷新即丢失。原型已具备完整的 UI 设计（CSS variables token 体系、5 列看板、任务 Modal、Dashboard 统计、拖拽、筛选搜索、CSV 导出）。

目标是将其迁移为正式的 React + TypeScript 应用，使用 Next.js + Bun 构建，SQLite 持久化，作为内部工具日常使用。

## Goals / Non-Goals

**Goals:**

- 从原型提取所有组件、样式、交互逻辑到 Next.js 项目
- SQLite 持久化任务数据，支持 CRUD
- 保持与原型视觉和交互完全一致
- Bun 作为包管理器和运行时，`bun dev` 开发 / `bun run build` + `bun start` 生产

**Non-Goals:**

- 不做多用户认证/权限系统（后续迭代）
- 不做多项目管理（当前只支持单项目）
- 不引入 Tailwind（保持现有 CSS Variables + CSS Modules）

## Decisions

### 1. 框架：Next.js App Router + Bun

**选择**：Next.js App Router（最新稳定版）+ Bun 作为包管理器和运行时

**理由**：
- 用户明确要求 Next.js
- 内置 API Routes 替代手搭后端服务器
- 内置 CSS Modules 支持，零配置
- 内置 React、TypeScript、构建工具链，不需要手动配置 tsconfig/webpack
- Server Components 减少客户端 JS 体积
- Bun 作为包管理器和运行时，同时使用 better-sqlite3 作为 SQLite 驱动

**替代方案**：Vite + React（需手搭后端）、Remix（Next.js 已足够）

### 2. CSS 方案：CSS Modules + CSS Variables

**选择**：从原型提取 CSS variables 到 `app/globals.css`，组件样式使用 CSS Modules（`*.module.css`）

**理由**：
- 原型 CSS 已有完善的 token 体系（颜色、间距、字体、圆角、阴影、动效），直接迁移零重写
- Next.js 原生支持 CSS Modules，无需额外配置
- 零运行时开销

**替代方案**：Tailwind（需全量改写）、CSS-in-JS（运行时开销）

### 3. 数据层：API Routes + better-sqlite3

**选择**：Next.js API Route Handlers 中使用 better-sqlite3 操作数据库，前端通过 fetch 调用

**理由**：
- Next.js 使用 Node.js 运行时，`bun:sqlite` 不可用，better-sqlite3 是最佳替代
- better-sqlite3 同步 API，零回调，与 bun:sqlite 用法几乎一致
- Next.js API Routes 替代独立后端服务器，架构更简单
- 单进程运行，`bun start` 一条命令启动

**架构**：

```
┌─────────────────────────────────────────────┐
│  Next.js (Bun runtime)                      │
│                                             │
│  Client Components     API Routes           │
│  ┌───────────────┐    ┌──────────────────┐  │
│  │ KanbanBoard   │    │ /api/tasks       │  │
│  │ Dashboard     │───►│ GET  → list all  │  │
│  │ TaskModal     │    │ POST → create    │  │
│  │ TopNav        │    │ PATCH → update   │  │
│  └───────────────┘    └────────┬─────────┘  │
│                                │            │
│                          ┌─────▼─────┐      │
│                          │better-sqlite3│     │
│                          │ data/     │      │
│                          │ kanban.db │      │
│                          └───────────┘      │
└─────────────────────────────────────────────┘
```

**API 设计**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取所有任务 |
| POST | /api/tasks | 创建任务 |
| PATCH | /api/tasks/:id | 更新任务 |

**数据库设计**：

```sql
CREATE TABLE tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  desc       TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'todo',
  priority   TEXT NOT NULL DEFAULT 'medium',
  source     TEXT NOT NULL DEFAULT 'internal',
  requester  TEXT,
  assignees  TEXT NOT NULL DEFAULT '[]',  -- JSON array
  due        TEXT,
  created    TEXT NOT NULL DEFAULT (date('now')),
  updated    TEXT NOT NULL DEFAULT (date('now'))
);
```

**替代方案**：Hono 独立服务器（多一层部署）、Drizzle ORM（过度设计）、PostgreSQL（过重）

### 4. 组件拆分策略

**选择**：按功能域拆分，每个组件独立目录。使用 "use client" 标记客户端组件。

```
xmpkanban/
├── app/
│   ├── layout.tsx              根布局（引入 globals.css）
│   ├── page.tsx                主页（Server Component，获取初始数据）
│   ├── globals.css             tokens + reset（从原型提取）
│   └── api/
│       └── tasks/
│           └── route.ts        任务 CRUD API
├── components/
│   ├── TopNav/
│   ├── FilterBar/
│   ├── TaskCard/
│   ├── KanbanColumn/
│   ├── TaskModal/
│   ├── StatCard/
│   └── ProgressBar/
├── lib/
│   ├── db.ts                   SQLite 初始化、CRUD、seed
│   └── types.ts                Task 接口、常量
├── utils.ts                    getInitials、getAssigneeColor 等
├── data/                       SQLite 数据库文件
│   └── kanban.db
├── package.json
└── tsconfig.json
```

**理由**：原型组件边界已清晰（TopNav、FilterBar、TaskCard、KanbanColumn、TaskModal、Dashboard），按原结构拆即可。Next.js App Router 自动处理路由，不需要手动配置。

### 5. 状态管理：React useState + useCallback

**选择**：继续使用 React 原生状态管理

**理由**：
- 原型已用 useState + useCallback 实现，逻辑清晰
- 两个视图、一个 tasks 数组，复杂度不需要引入 zustand/redux
- 数据操作通过 API Routes，前端通过 fetch 调用

**替代方案**：zustand（过度设计）、Context API（不必要）

## Risks / Trade-offs

- **better-sqlite3 需要原生编译** → `npm rebuild better-sqlite3` 解决，部署时需确保构建环境有编译工具链
- **单文件 SQLite 并发写入** → 内部工具并发低，WAL 模式下足够。如需多用户可迁移到 PostgreSQL
- **Next.js 包体积** → 内部工具不敏感，开发效率更重要
- **无认证** → 内部网络部署，信任环境。后续迭代加 auth
