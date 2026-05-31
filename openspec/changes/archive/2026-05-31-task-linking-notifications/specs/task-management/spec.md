## ADDED Requirements

### Requirement: 任务关联字段
Task 实体 SHALL 包含 `linkedTasks` 字段，存储与该任务关联的其他任务关系。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| linkedTasks | { id, linkedTaskId, linkType }[] | 否 | 关联的任务列表 |

#### Scenario: 查看任务时加载关联
- **WHEN** 系统加载任务详情
- **THEN** linkedTasks 字段包含该任务所有关联关系（阻塞/被阻塞/关联）

## MODIFIED Requirements

### Requirement: 任务字段定义
系统 SHALL 支持以下任务字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| desc | string | 否 | 详细描述 |
| status | enum | 是 | todo/inprogress/review/verifying/blocked/done |
| priority | enum | 是 | high/medium/low |
| source | enum | 是 | jiafang（甲方）/ internal（内部） |
| requester | string | 否 | 甲方对接人（source=jiafang 时展示） |
| assignees | string[] | 否 | 负责人列表，可多选 |
| due | date | 否 | 截止日期 |
| linkedTasks | { id, linkedTaskId, linkType }[] | 否 | 关联的任务列表 |

#### Scenario: 甲方任务显示对接人选择
- **WHEN** 用户在创建/编辑 Modal 中选择来源为"甲方任务"
- **THEN** 表单展示"甲方对接人"选择区域

#### Scenario: 内部任务隐藏对接人
- **WHEN** 用户在创建/编辑 Modal 中选择来源为"内部任务"
- **THEN** "甲方对接人"字段不展示

### Requirement: 任务卡片展示
任务卡片 SHALL 展示优先级指示点、标题、描述（两行截断）、来源标签、对接人标签、关联标签、截止日期、负责人头像。

#### Scenario: 多负责人展示
- **WHEN** 任务有多个负责人
- **THEN** 卡片底部展示最多 3 个头像（带颜色区分，堆叠），超出显示 +N

#### Scenario: 负责人颜色一致性
- **WHEN** 同一负责人出现在不同任务卡片
- **THEN** 该负责人的头像颜色在所有卡片中保持一致

#### Scenario: 关联关系展示
- **WHEN** 任务有关联任务
- **THEN** 卡片标签行展示关联徽章（如"阻塞 #42"、"被 #15 阻塞"、"关联 #17"）
