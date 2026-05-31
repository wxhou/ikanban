## Why

当前项目看板是一个单 HTML 文件原型（914 行，React CDN + Babel 浏览器内编译），数据硬编码在内存中，刷新即丢失。需要将其迁移为正式的 React + TypeScript 应用，使用 Bun 构建、SQLite 持久化，作为可日常使用的内部工具交付。

## What Changes

- 从 `index.html` 原型中提取 React 组件、CSS tokens、交互逻辑，拆分为标准 React + TypeScript 项目结构
- 使用 Next.js App Router 作为框架，Bun 作为包管理器和运行时
- 用 Next.js API Routes + bun:sqlite 替代内存数据，实现任务数据的增删改查持久化
- CSS 方案采用 CSS Modules + 现有 CSS Variables（Next.js 原生支持，从原型直接迁移 token 体系）
- 路由使用 state 切换（看板/汇报两个视图），不引入 react-router
- 保留原型中的所有功能：看板拖拽、任务 CRUD Modal、筛选搜索、CSV 导出、Dashboard 统计

## Capabilities

### New Capabilities

- `kanban-board`: 看板视图——五列（待办/进行中/审核中/已阻塞/已完成）拖拽移动、任务卡片展示、筛选（全部/甲方/内部/我的）、搜索、列计数
- `task-management`: 任务 CRUD——Modal 创建/编辑任务，字段包括标题、描述、状态、优先级、来源（甲方/内部）、对接人、负责人（多选）、截止日期
- `dashboard`: 汇报视图——统计卡片（总任务/完成率/进行中/已阻塞）、完成进度条（甲方 vs 内部）、任务清单表格、CSV 导出
- `data-persistence`: 数据持久化层——Next.js API Routes + bun:sqlite，tasks 表 CRUD，seed 初始数据

### Modified Capabilities

（无已有 capability 需修改）

## Impact

- **框架**：Next.js App Router（内置 React、TypeScript、CSS Modules、构建工具链）
- **新增依赖**：next（核心框架已包含 react、react-dom）
- **运行时**：Bun（包管理 + 运行 Next.js + bun:sqlite）
- **数据文件**：新增 `data/kanban.db` SQLite 数据库文件
- **原型文件**：`index.html` 保留为参考，不作为生产入口
