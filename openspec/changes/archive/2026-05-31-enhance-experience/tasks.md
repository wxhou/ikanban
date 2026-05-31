## 1. 全局动画基础设施

- [x] 1.1 在 globals.css 新增动画 CSS 变量（`--motion-enter`, `--motion-exit`, `--ease-out`）
- [x] 1.2 在 globals.css 新增通用入场动画关键帧（fade-in, slide-up, fade-slide-in）
- [x] 1.3 在 App.tsx 中为视图切换添加 fade 过渡（CSS class 切换）

## 2. 动画/过渡优化

- [x] 2.1 TaskCard 入场动画：fade+slide-up，相邻卡片 animation-delay 递增 30ms
- [x] 2.2 TaskModal 打开/关闭动画：overlay fade + modal scale+fade
- [x] 2.3 KanbanColumn 拖拽高亮：拖入时列边框高亮 + 背景微变
- [x] 2.4 页面视图切换 fade 过渡

## 3. 看板 UX 增强

- [x] 3.1 KanbanColumn 底部"添加任务"改为内联输入框（回车创建，Escape 关闭）
- [x] 3.2 拖拽放置区域视觉增强（dropTarget 样式优化）

## 4. 验证

- [x] 4.1 TypeScript 类型检查通过
- [ ] 4.2 桌面端看板/仪表盘/Portal 功能正常
- [ ] 4.3 动画流畅，无卡顿
