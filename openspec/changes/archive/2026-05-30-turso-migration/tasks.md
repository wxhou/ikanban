## Phase 1: 数据层

- [x] 1.1 安装 @libsql/client，移除 better-sqlite3
- [x] 1.2 db.ts — 改为 async 客户端
- [x] 1.3 version-db.ts — 改为 async 客户端

## Phase 2: API 适配

- [x] 2.1 所有 API route handler 加 await

## Phase 3: 验证

- [x] 3.1 tsc 通过
- [x] 3.2 本地启动可正常运行
