## Purpose

服务端认证守卫：未登录用户无法获取任务、用户、版本等业务数据，登录/登出由服务端会话驱动。

## ADDED Requirements

### Requirement: 服务端认证守卫
系统 SHALL 在服务端校验受保护页面的会话（`sid` cookie），无有效会话时渲染登录页，不向客户端注入任何业务数据。

#### Scenario: 未登录访问受保护页面
- **WHEN** 未登录用户访问 `/home/kanban`
- **THEN** 页面渲染登录界面，且响应中不包含任务、用户、版本等业务数据

#### Scenario: 已登录访问受保护页面
- **WHEN** 已登录用户访问 `/home/kanban`
- **THEN** 页面正常渲染看板视图

#### Scenario: 会话过期
- **WHEN** 用户会话已过期（超过 8 小时）后访问受保护页面
- **THEN** 页面渲染登录界面，用户需重新登录

### Requirement: 登录由服务端会话驱动
系统 SHALL 让登录成功后由服务端设置会话 cookie，客户端不自行维护登录状态。

#### Scenario: 登录成功
- **WHEN** 用户在登录页提交有效凭据
- **THEN** 服务端校验通过并设置 `sid` cookie，页面进入默认视图

#### Scenario: 登出
- **WHEN** 已登录用户点击登出
- **THEN** 服务端清除会话，页面回到登录界面