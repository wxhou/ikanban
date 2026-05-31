## ADDED Requirements

### Requirement: Portal displays current in-progress tasks
Portal SHALL display all 甲方 (source === "jiafang") tasks that are not in "done" status, grouped as "当前进行中".

#### Scenario: Shows active client tasks
- **WHEN** 用户访问 `/portal` 页面
- **THEN** 页面展示所有来源为甲方的未完成任务，每个任务显示标题、状态、负责人、截止日期

#### Scenario: Empty state when no active tasks
- **WHEN** 某版本内没有进行中的甲方任务
- **THEN** 显示"暂无进行中的任务"提示

### Requirement: Portal displays overall progress
Portal SHALL display an overall progress section showing the count of pending and delivered 甲方 tasks with a completion progress bar.

#### Scenario: Shows progress statistics
- **WHEN** 用户访问 `/portal` 页面
- **THEN** 显示待交付任务数、已交付任务数、整体交付进度百分比

#### Scenario: Progress bar reflects completion rate
- **WHEN** 已交付 6 项、总共 14 项甲方任务
- **THEN** 进度条显示 43%（6/14），展示"已交付 6 项 / 待交付 8 项"

### Requirement: Portal displays delivered tasks list
Portal SHALL display a collapsible list of completed (status === "done") 甲方 tasks.

#### Scenario: Delivered tasks shown collapsed by default
- **WHEN** 用户访问 `/portal` 页面
- **THEN** 已交付任务列表默认折叠，显示"已交付 N 项"标题，点击可展开

#### Scenario: Expanded list shows completed task details
- **WHEN** 用户点击"已交付 N 项"标题
- **THEN** 展开显示每个已完成任务名称和完成日期

### Requirement: Portal supports version filtering
Portal SHALL provide a version selector to filter 甲方 tasks by version.

#### Scenario: Version switch filters tasks
- **WHEN** 用户选择特定版本
- **THEN** 页面只显示该版本的甲方任务，统计数字同步更新

#### Scenario: Default shows active version
- **WHEN** 用户首次访问 `/portal`
- **THEN** 默认显示当前活跃版本的任务

### Requirement: Portal supports client comments
Portal SHALL allow adding comments to 甲方 tasks without authentication, using "甲方" as the comment author.

#### Scenario: Client can add comment on portal
- **WHEN** 用户在 portal 的任务卡片中输入评论并回车
- **THEN** 评论以"甲方"身份添加到任务，其他已登录用户可在看板中看到该评论

#### Scenario: Comment input visible on each task
- **WHEN** 用户查看 portal 页面
- **THEN** 每个当前进行中的任务下方显示评论输入框
