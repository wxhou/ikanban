# 数据库迁移：better-sqlite3 → Turso

## 背景

开发环境用本地 SQLite，生产环境应该用 Turso（托管 SQLite），保证数据持久化和多实例共享。

## 方案

统一使用 `@libsql/client`，本地开发和远程 Turso 共用一套代码，仅通过环境变量切换连接。

```bash
# 本地开发
LIBSQL_URL=file:data/kanban.db

# 生产环境
LIBSQL_URL=libsql://your-db.turso.io
LIBSQL_AUTH_TOKEN=your-token
```

## 范围

- 替换依赖：`better-sqlite3` → `@libsql/client`
- 所有 DB 函数改为 async
- API 路由加 await
- 环境变量配置

## 影响

- db.ts（80+ 行改动）
- version-db.ts（80+ 行改动）
- 6 个 API route 文件（加 await）
- api.ts 客户端无需改动（已经是 fetch）

## 不做什么

- 不改前端组件
- 不改数据库 schema
