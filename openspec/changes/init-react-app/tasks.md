## 1. 项目初始化

- [x] 1.1 使用 `bunx create-next-app@latest` 初始化 Next.js 项目（App Router, TypeScript, CSS Modules, Bun）
- [x] 1.2 创建 data/ 目录，确保 .gitignore 包含 data/*.db

## 2. 数据层

- [x] 2.1 创建 lib/types.ts，定义 Task 接口（id, title, desc, status, priority, source, requester, assignees, due, created, updated）和 COLUMNS、TEAM_MEMBERS、JIAFANG_SOURCES 常量
- [x] 2.2 创建 lib/db.ts，实现 SQLite 初始化（建表 + WAL 模式）、getAllTasks()、createTask()、updateTask()，处理 assignees JSON 序列化/反序列化
- [x] 2.3 在 lib/db.ts 中集成种子数据：首次启动插入 10 条任务（覆盖全部状态/优先级/来源），非首次跳过
- [x] 2.4 创建 app/api/tasks/route.ts，实现 GET（列表）、POST（创建）、PATCH/[id]（更新）API Route Handler

## 3. 全局样式与工具

- [x] 3.1 创建 app/globals.css，从 index.html 原型提取所有 CSS variables（:root token）+ 全局 reset 样式
- [x] 3.2 创建 utils.ts，从原型移植 getInitials()、getAssigneeColor()、formatDate()、exportToExcel()

## 4. SVG 图标

- [x] 4.1 创建 components/Icons.tsx，从原型提取所有 SVG 图标组件

## 5. 组件

- [x] 5.1 创建 components/TopNav/（TopNav.tsx "use client" + TopNav.module.css）
- [x] 5.2 创建 components/FilterBar/（FilterBar.tsx "use client" + FilterBar.module.css）
- [x] 5.3 创建 components/TaskCard/（TaskCard.tsx "use client" + TaskCard.module.css）
- [x] 5.4 创建 components/KanbanColumn/（KanbanColumn.tsx "use client" + KanbanColumn.module.css）
- [x] 5.5 创建 components/TaskModal/（TaskModal.tsx "use client" + TaskModal.module.css）
- [x] 5.6 创建 components/StatCard/（StatCard.tsx + StatCard.module.css）
- [x] 5.7 创建 components/ProgressBar/（ProgressBar.tsx + ProgressBar.module.css）

## 6. 页面视图

- [x] 6.1 创建 components/KanbanBoard.tsx（"use client"），整合 FilterBar + KanbanColumn + 拖拽 + 筛选搜索 + fetch API
- [x] 6.2 创建 components/Dashboard.tsx（"use client"），整合 StatCard + ProgressBar + 任务表格 + CSV 导出

## 7. 页面组装

- [x] 7.1 创建 app/page.tsx，服务端获取初始任务数据，传递给客户端组件（KanbanBoard + Dashboard + TaskModal + TopNav）
- [x] 7.2 确认 app/layout.tsx 引入 globals.css，设置 lang="zh-CN"、viewport、字体

## 8. 验证

- [x] 8.1 `bun dev` 启动，确认前端页面 + API 正常工作
- [x] 8.2 验证看板拖拽功能正常，状态变更通过 API 持久化到 SQLite
- [x] 8.3 验证任务创建/编辑 Modal 功能正常
- [x] 8.4 验证筛选和搜索功能正常
- [x] 8.5 验证 Dashboard 统计数据正确、CSV 导出正常
- [x] 8.6 验证重启后数据持久化（`bun start` 后数据不丢失）
- [x] 8.7 TypeScript 类型检查通过
