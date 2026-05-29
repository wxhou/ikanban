# 智慧运维管理平台 V3

基于 Next.js + SQLite 的看板任务管理系统，支持拖拽排序。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite (better-sqlite3)
- **包管理**: Bun
- **样式**: CSS Modules + CSS Variables

## 功能特性

- 看板视图（待办 / 进行中 / 已完成）
- 拖拽排序（支持同列重排、跨列移动）
- 任务筛选（全部/甲方/内部/我的）
- 任务搜索
- 任务编辑（双击打开）

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 构建生产版本
bun build
```

## 项目结构

```
src/
├── app/              # Next.js App Router
├── components/       # React 组件
├── lib/             # 业务逻辑和类型定义
├── api/             # API 路由
└── utils/           # 工具函数
```

## 许可证

MIT