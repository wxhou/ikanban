## ADDED Requirements

### Requirement: 页面视图切换动画
系统 SHALL 在看板/仪表盘/汇报/版本管理视图切换时使用淡入过渡。

#### Scenario: 切换视图
- **WHEN** 用户通过顶部导航切换视图
- **THEN** 新视图以 fade-in 动画进入，时长 200ms，使用 ease-out 缓动

### Requirement: 任务卡片入场动画
系统 SHALL 在看板加载和筛选结果更新时，任务卡片错位入场。

#### Scenario: 看板初始加载
- **WHEN** 看板页面首次渲染
- **THEN** 每列的卡片从下方 fade+slide 入场，相邻卡片延迟 30ms

#### Scenario: 筛选后卡片更新
- **WHEN** 用户修改筛选条件
- **THEN** 新出现的卡片以入场动画显示

### Requirement: Modal 过渡动画
系统 SHALL 在 TaskModal 打开和关闭时使用缩放+淡入淡出过渡。

#### Scenario: 打开 Modal
- **WHEN** 用户打开任务 Modal
- **THEN** 遮罩层淡入，Modal 从 95% 缩放 + 淡入到位，时长 200ms

#### Scenario: 关闭 Modal
- **WHEN** 用户关闭任务 Modal
- **THEN** Modal 淡出 + 缩小，遮罩层淡出，时长 150ms

### Requirement: 拖拽视觉反馈
系统 SHALL 在拖拽任务卡片时提供清晰的视觉反馈。

#### Scenario: 拖拽中卡片样式
- **WHEN** 用户拖拽任务卡片
- **THEN** 源卡片半透明旋转，目标列高亮边框
