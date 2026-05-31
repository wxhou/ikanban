## Context

项目是企业内部运维管理平台，8 人团队使用。交互动画集中在 LoginPage，其他页面几乎无动画。看板拖拽功能完整，缺快速添加和更好的视觉反馈。

当前状态：
- CSS 变量体系完备（15 个语义变量），可直接利用
- 动画：LoginPage 有 6 个 keyframe，其他页面仅有 3 个
- 看板：拖拽功能完整，缺快速添加和更好的视觉反馈

## Goals / Non-Goals

**Goals:**
- 关键交互有动画反馈（页面切换、卡片出现、拖拽状态）
- 看板支持快速添加任务（不弹 Modal）

**Non-Goals:**
- 不做移动端适配
- 不做登录页重设计
- 不引入 Framer Motion 等动画库
- 不改变现有功能逻辑

## Decisions

### 1. 动画：纯 CSS，统一变量

**选择**：在 globals.css 新增 `--motion-enter`、`--motion-exit` 变量，配合已有的 `--motion-fast`、`--motion-base`、`--ease-standard`。关键动画：卡片 stagger 入场（animation-delay 递增）、Modal fade+scale、页面视图切换 fade。

**理由**：不引入 JS 动画库，保持零依赖。CSS 动画性能更好（GPU 加速），且项目已有变量体系可复用。

### 2. 快速添加：列底部内联输入

**选择**：点击列底部"添加任务"按钮后，原地展开一个内联输入框（标题 only），回车创建。更详细的编辑仍走 TaskModal。

**理由**：降低创建任务的摩擦。类似 Trello 的快速添加卡片模式。只收集标题，其他字段后续编辑。

## Risks / Trade-offs

- **[动画性能]** → 大量卡片同时入场动画可能卡顿。缓解：使用 `will-change: transform` 和 `transform` 而非 `left/top`，限制 stagger 数量。
