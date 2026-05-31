## MODIFIED Requirements

### Requirement: 创建任务
系统 SHALL 支持通过 Modal 表单创建新任务，包含标题、描述、状态、优先级、来源、对接人、负责人、截止日期字段。负责人选项 SHALL 从 users 表动态读取，而非硬编码列表。

#### Scenario: 从列底部创建任务
- **WHEN** 用户点击某列底部的"添加任务"按钮
- **THEN** 弹出新建任务 Modal，状态字段默认为该列对应状态

#### Scenario: 填写并提交新任务
- **WHEN** 用户填写标题（必填）和其他可选字段后点击"创建任务"
- **THEN** 任务保存到数据库，Modal 关闭，新任务出现在对应状态列中

#### Scenario: 负责人下拉动态加载
- **WHEN** 用户打开任务 Modal 的负责人下拉框
- **THEN** 下拉选项从 users 表动态获取，显示所有非管理员用户名

### Requirement: 编辑任务
系统 SHALL 支持通过 Modal 表单编辑已有任务的所有字段。负责人选项 SHALL 从 users 表动态读取。

#### Scenario: 双击打开编辑 Modal
- **WHEN** 用户双击任务卡片
- **THEN** 弹出编辑任务 Modal，所有字段预填充当前任务数据

#### Scenario: 编辑时负责人列表动态
- **WHEN** 用户在编辑 Modal 中打开负责人下拉
- **THEN** 下拉选项从 users 表动态获取
