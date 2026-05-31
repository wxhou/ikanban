## ADDED Requirements

### Requirement: 创建任务
系统 SHALL 支持通过 Modal 表单创建新任务，包含标题、描述、状态、优先级、来源、对接人、负责人、截止日期字段。

#### Scenario: 从列底部创建任务
- **WHEN** 用户点击某列底部的"添加任务"按钮
- **THEN** 弹出新建任务 Modal，状态字段默认为该列对应状态

#### Scenario: 填写并提交新任务
- **WHEN** 用户填写标题（必填）和其他可选字段后点击"创建任务"
- **THEN** 任务保存到数据库，Modal 关闭，新任务出现在对应状态列中

#### Scenario: 标题为空时阻止提交
- **WHEN** 用户未填写任务标题就点击"创建任务"
- **THEN** 按钮无响应，任务不创建

### Requirement: 编辑任务
系统 SHALL 支持通过 Modal 表单编辑已有任务的所有字段。

#### Scenario: 双击打开编辑 Modal
- **WHEN** 用户双击任务卡片
- **THEN** 弹出编辑任务 Modal，所有字段预填充当前任务数据

#### Scenario: 保存修改
- **WHEN** 用户修改字段后点击"保存修改"
- **THEN** 任务数据更新到数据库，Modal 关闭，卡片显示更新后的内容

### Requirement: 任务字段定义
系统 SHALL 支持以下任务字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| desc | string | 否 | 详细描述 |
| status | enum | 是 | todo/inprogress/review/blocked/done |
| priority | enum | 是 | high/medium/low |
| source | enum | 是 | jiafang（甲方）/ internal（内部） |
| requester | string | 否 | 甲方对接人（source=jiafang 时展示） |
| assignees | string[] | 否 | 负责人列表，可多选 |
| due | date | 否 | 截止日期 |

#### Scenario: 甲方任务显示对接人选择
- **WHEN** 用户在创建/编辑 Modal 中选择来源为"甲方任务"
- **THEN** 表单展示"甲方对接人"选择区域

#### Scenario: 内部任务隐藏对接人
- **WHEN** 用户在创建/编辑 Modal 中选择来源为"内部任务"
- **THEN** "甲方对接人"字段不展示

### Requirement: 任务卡片展示
任务卡片 SHALL 展示优先级指示点、标题、描述（两行截断）、来源标签、对接人标签、截止日期、负责人头像。

#### Scenario: 多负责人展示
- **WHEN** 任务有多个负责人
- **THEN** 卡片底部展示最多 3 个头像（带颜色区分，堆叠），超出显示 +N

#### Scenario: 负责人颜色一致性
- **WHEN** 同一负责人出现在不同任务卡片
- **THEN** 该负责人的头像颜色在所有卡片中保持一致
