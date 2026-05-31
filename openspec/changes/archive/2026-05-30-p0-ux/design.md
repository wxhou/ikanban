# 技术设计

## Toast 系统

### 类型

```ts
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}
```

### Context

```ts
interface ToastContextValue {
  show(message: string, type?: ToastType, action?: ToastItem["action"]): void;
}
```

### 组件结构

```
App.tsx
└─ ToastProvider
   ├─ App 内容
   └─ ToastContainer (fixed, bottom-center, z-1000)
      └─ ToastItem (animate in/out, auto-dismiss 3s)
```

### 样式

```
┌─────────────────────────────────┐
│ ✓ 已移至「进行中」    [撤销]    │  ← 绿色成功 toast
└─────────────────────────────────┘
        3s 后自动消失
```

## 拖拽撤销

KanbanBoard 的 handleDrop 中：
1. 先乐观更新 UI
2. 调用 API
3. 成功：弹出 success toast + 撤销按钮
4. 失败：回滚 UI + 弹出 error toast

撤销逻辑：恢复 `previousStatus`（用 ref 保存旧状态）

## 错误提示

所有 catch 块从 `console.error` 改为 `toast.show(message, "error")`：
- 保存失败："保存失败，请重试"
- 删除失败："删除失败，请重试"
- 评论失败："评论发送失败"
- 拖拽失败已在上述撤销逻辑覆盖

## 文件变更

```
新增:
  src/components/Toast/Toast.tsx
  src/components/Toast/Toast.module.css
  src/lib/toast-context.tsx

修改:
  src/app/App.tsx          — 包裹 ToastProvider
  src/components/KanbanBoard.tsx — 拖拽撤销 toast
  src/components/TaskModal/TaskModal.tsx — 错误 toast
  src/app/layout.tsx       — wrapper 相关
```
