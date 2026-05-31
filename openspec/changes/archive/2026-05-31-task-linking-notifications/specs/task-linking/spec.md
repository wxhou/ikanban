## ADDED Requirements

### Requirement: 创建任务关联
系统 SHALL 支持在任务间建立关系，关系类型为 `blocks`（阻塞）、`blocked_by`（被阻塞）、`related`（关联）。

#### Scenario: 创建阻塞关系
- **WHEN** 用户在任务 A 的关联管理中，选择任务 B 并将关系设为"阻塞"
- **THEN** 系统在 task_links 中创建记录 (A blocks B)，且任务 B 的 TaskCard 显示"被 A 阻塞"

#### Scenario: 创建关联关系
- **WHEN** 用户在任务 A 的关联管理中，选择任务 B 并将关系设为"关联"
- **THEN** 系统创建双向关联记录，两侧任务均显示关联徽章

#### Scenario: 防止重复关联
- **WHEN** 用户尝试在已存在关联的两个任务间再次添加关联
- **THEN** 系统拒绝操作并返回错误

### Requirement: 删除任务关联
系统 SHALL 允许用户删除已建立的任务关联。

#### Scenario: 删除关联
- **WHEN** 用户在任务 A 的关联管理中点击删除与任务 B 的关联
- **THEN** 系统从 task_links 中移除对应记录，任务 B 的 TaskCard 不再显示关联徽章

### Requirement: 在 TaskCard 上展示关联
系统 SHALL 在 TaskCard 的标签行展示该任务的关联信息，包括阻塞和被阻塞的任务 ID。

#### Scenario: 展示阻塞关系
- **WHEN** 任务 A 阻塞任务 B
- **THEN** 任务 A 的 TaskCard 显示"阻塞 #B"徽章；任务 B 的 TaskCard 显示"被 A 阻塞"徽章

#### Scenario: 无关联时不展示
- **WHEN** 任务没有任何关联
- **THEN** TaskCard 不展示任何关联相关徽章

### Requirement: 在 TaskModal 中管理关联
系统 SHALL 在 TaskModal 新增"关联任务"Tab，允许用户查看、添加和删除关联。

#### Scenario: 添加关联
- **WHEN** 用户在"关联任务"Tab 中点击"+ 添加关联"，输入任务标题搜索并选择目标任务和关系类型
- **THEN** 系统创建关联并立即在列表中展示

#### Scenario: 查看已有关联
- **WHEN** 用户打开有 2 条关联的任务的"关联任务"Tab
- **THEN** 系统展示关联列表，每项显示关系类型、目标任务标题，点击可跳转查看
