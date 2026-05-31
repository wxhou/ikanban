# 技术设计

## 1. 角色系统

### 类型

```ts
export type UserRole = "manager" | "guest";
```

### 实现

- App.tsx 新增 `role` state，默认为 `manager`
- TopNav 新增角色切换下拉
- `role` 通过 props 传递到 KanbanBoard、Dashboard
- KanbanBoard：`role === "guest"` 时仅显示 `source=jiafang` 任务
- Dashboard：`role === "guest"` 时隐藏人员负载、内部任务进度

## 2. 待验收状态

### 类型

```ts
export type TaskStatus = "todo" | "inprogress" | "review" | "verifying" | "blocked" | "done";
```

新增 `verifying` 状态，颜色用紫色。

### 列顺序

待办 → 进行中 → 审核中 → 待验收 → 已完成（已阻塞 在最后）

### 状态流转规则

```
审核中 ──(项目方)──▶ 待验收 ──(甲方)──▶ 已完成
```

- 甲方角色：只能将「待验收」→「已完成」
- 项目方角色：可以将任意状态拖动到任意列，包括推到「待验收」

## 3. 快速评论

### TaskCard 变更

- 卡片底部新增折叠的评论输入区
- 点击评论数图标展开输入框
- 输入框 + 回车发送按钮
- 调用 `createComment` API，实时更新

### 样式

```
┌─ TaskCard ────────────┐
│ 标题 ...               │
│ 标签 ...               │
│ 日期 · 负责人           │
│ 💬 2 ▸ (点击展开)       │
│ ┌──────────────────┐   │
│ │ 快速评论...  [发送] │   │
│ └──────────────────┘   │
└───────────────────────┘
```

## 文件变更

```
修改:
  src/lib/types.ts              — 新增 UserRole, verifying 状态
  src/app/App.tsx               — role state
  src/components/TopNav/TopNav.tsx      — 角色切换
  src/components/KanbanBoard.tsx        — 甲方过滤
  src/components/FilterBar/FilterBar.tsx — 甲方模式锁定筛选
  src/components/TaskCard/TaskCard.tsx   — 快速评论 + 验证标签
  src/components/TaskCard/TaskCard.module.css — 快评样式
  src/components/Dashboard.tsx           — 甲方模式调整
  src/components/KanbanColumn/KanbanColumn.tsx — 新增验证列
  src/components/TaskModal/TaskModal.tsx  — status 选项加待验收
```
