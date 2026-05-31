# 任务清单

## Phase 1: 任务删除

- [x] 1.1 src/app/api/tasks/[id]/route.ts — 新增 DELETE handler
- [x] 1.2 src/api.ts — 新增 deleteTask 客户端函数
- [x] 1.3 TaskModal — 新增删除按钮 + confirm
- [x] 1.4 App.tsx — handleDeleteTask 回调

## Phase 2: 汇报表格视图

- [x] 2.1 src/components/Report.tsx — 报表组件
- [x] 2.1b src/components/Report.module.css — 报表样式
- [x] 2.2 TopNav — 新增"汇报" tab
- [x] 2.3 App.tsx — 接入 report view

## Phase 3: 验证

- [x] 3.1 tsc 通过
- [x] 3.2 功能验证：删除任务、汇报表格展示
