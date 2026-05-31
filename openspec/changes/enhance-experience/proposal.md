## Why

项目核心功能已完成，但日常使用体验还有提升空间：交互动画缺失导致操作生硬、看板缺少常用快捷操作。现在技术债已清理，是打磨体验的好时机。

## What Changes

1. **动画/过渡优化**：页面切换淡入、卡片出现错位动画、拖拽反馈增强、Modal 打开/关闭过渡。减少生硬的瞬间切换。
2. **看板视图增强**：列拖拽高亮反馈、快速添加任务内联输入（替代弹 Modal）。

## Capabilities

### New Capabilities
- `motion-design`: 页面/组件动画过渡系统
- `kanban-ux`: 看板交互体验增强

### Modified Capabilities
（无现有 spec 需修改）

## Impact

- **前端 CSS**：新增动画关键帧、拖拽高亮样式
- **组件改动**：KanbanBoard/KanbanColumn/TaskCard（动画+交互）、App.tsx（页面切换过渡）
- **globals.css**：新增动画相关 CSS 变量（时长、缓动函数）
- **无 API 变更**：纯前端改动，不影响后端
- **无依赖新增**：不引入动画库，用原生 CSS 动画
