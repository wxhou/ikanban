# P0 UX：全局 Toast + 拖拽撤销 + 错误提示

## 背景

当前操作没有任何反馈：保存静默、拖拽静默、错误只打 console。缺少现代应用的基本 UX 底线。

## 范围

### 1. 全局 Toast 系统

- 底部居中弹出，3 秒自动消失
- 三种类型：成功(绿)、错误(红)、信息(蓝)
- 支持可选的操作按钮（如"撤销"）
- React Context 全局管理

### 2. 拖拽撤销

- 拖移卡片到新列后，弹出 toast："已移至「XX」" + 撤销按钮
- 点击撤销：恢复原状态 + 调用 API 回滚

### 3. 错误提示可见

- 所有 API 失败处弹出红色 toast 替代 console.error
- 保存、删除、评论等操作失败时用户能感知

## 不做什么

- 不引入第三方库
- 不做多 toast 堆叠动画
- 不做 loading 状态（骨架屏等）

## 技术方案

- `src/components/Toast/Toast.tsx` — Toast 组件
- `src/lib/toast-context.tsx` — ToastContext + Provider
- App.tsx 包裹 ToastProvider
- 各处使用 `useToast()` hook 替换 console.error
