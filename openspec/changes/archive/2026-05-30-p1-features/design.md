# 技术设计

## 任务删除

### API

已有 `DELETE /api/tasks/[id]` — 需新增 route handler（当前只有 PATCH）。

### 前端

- TaskModal footer 新增 `btn-danger` 删除按钮
- 仅 `!isNew` 时显示
- confirm() 确认后调用 deleteTask API
- 删除成功后 onClose，App.tsx 从 tasks 数组中移除

### 文件变更

```
新增:
  src/app/api/tasks/[id]/route.ts  — 新增 DELETE handler

修改:
  src/components/TaskModal/TaskModal.tsx   — 删除按钮
  src/components/TaskModal/TaskModal.module.css — danger 按钮样式
  src/api.ts                              — 新增 deleteTask 客户端函数
  src/app/App.tsx                         — handleDeleteTask 回调
```

## 汇报表格视图

### 布局

- App.tsx view 状态新增 `"report"`
- TopNav 新增第三个 tab "汇报"
- 新组件 `Report.tsx`

### 表格列

| # | 任务名称 | 来源 | 优先级 | 状态 | 负责人 | 截止日期 | 子任务 | 备注 |

- 逾期行加 `overdue-row` 样式（红色文字）
- 子任务列显示 `done/total` + 简易进度条
- 适配打印样式 `@media print`

### 文件变更

```
新增:
  src/components/Report.tsx
  src/components/Report.module.css

修改:
  src/app/App.tsx          — 新增 report view + handleDeleteTask
  src/components/TopNav/TopNav.tsx — 新增汇报 tab
```
