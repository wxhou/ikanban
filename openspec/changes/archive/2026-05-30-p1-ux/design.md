# 技术设计

## 1. 快捷键

- App.tsx 新增全局 `keydown` 监听
- `N` → 打开新建任务 Modal（status=todo）
- `/` → 聚焦搜索输入框（通过 id 定位）
- 仅 `view === "kanban"` 时生效，Modal 打开时不生效

## 2. 深度搜索

KanbanBoard `filtered` 中搜索条件扩展：
- 搜标签：`task.tags.some(tag => tag.includes(q))`
- 搜备注：`task.comments.some(c => c.text.includes(q))`

## 3. 即将到期预警

```ts
// utils.ts
export function isDueSoon(due: string | null): boolean {
  if (!due) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff > 0 && diff <= 3 * 86400000; // within 3 days
}
```

TaskCard：`isDueSoon && !isOverdue && status !== 'done'` → 黄色边框 + '即将到期'标签

## 4. Report 甲方过滤

Report.tsx 接收 `role` prop，过滤 tasks。

## 文件变更

```
修改:
  src/utils.ts                — 新增 isDueSoon
  src/app/App.tsx             — 快捷键监听
  src/components/KanbanBoard.tsx     — 深度搜索
  src/components/TaskCard/TaskCard.tsx — 即将到期样式
  src/components/TaskCard/TaskCard.module.css — dueSoon 样式
  src/components/Report.tsx   — 甲方过滤
  src/components/FilterBar/FilterBar.tsx — 搜索框加 id
```
