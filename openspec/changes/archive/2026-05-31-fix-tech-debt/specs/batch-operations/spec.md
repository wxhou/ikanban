## ADDED Requirements

### Requirement: 批量修改任务
系统 SHALL 支持通过批量操作 API 同时修改多个任务的属性。

#### Scenario: 批量修改状态
- **WHEN** 用户选择多个任务并请求批量修改状态为 "done"
- **THEN** 所有选中任务的状态被更新为 "done"，返回 `{ updated: N }`

#### Scenario: 批量修改优先级
- **WHEN** 用户选择多个任务并请求批量修改优先级为 "high"
- **THEN** 所有选中任务的优先级被更新为 "high"

#### Scenario: 批量修改负责人
- **WHEN** 用户选择多个任务并请求批量修改负责人为 ["张三"]
- **THEN** 所有选中任务的负责人被更新为 ["张三"]，覆盖原有值

#### Scenario: 空 ids 不执行
- **WHEN** 请求 body 中 ids 为空数组
- **THEN** 返回 `{ updated: 0 }`，不执行任何更新

### Requirement: 看板多选模式
系统 SHALL 支持在看板页面进入多选模式选择任务。

#### Scenario: 进入多选模式
- **WHEN** 用户在看板页面按住 Ctrl/Cmd 点击任务卡片
- **THEN** 进入多选模式，被点中的任务显示选中状态

#### Scenario: 多选后修改状态
- **WHEN** 用户在多选模式下选择目标状态
- **THEN** 调用批量操作 API，所有选中任务状态更新
