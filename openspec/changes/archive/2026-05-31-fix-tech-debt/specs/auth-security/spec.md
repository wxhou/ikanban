## ADDED Requirements

### Requirement: 密码哈希存储
系统 SHALL 使用 bcrypt 哈希存储用户密码，不再存储明文密码。

#### Scenario: 设置新密码时哈希存储
- **WHEN** 用户通过 `set-password` API 设置新密码
- **THEN** 密码使用 bcrypt 哈希后存储到数据库，原始密码不被保存

#### Scenario: 验证密码时使用哈希比较
- **WHEN** 用户登录输入密码
- **THEN** 系统使用 bcrypt.compare 验证输入密码与存储的哈希值

### Requirement: 明文密码渐进迁移
系统 SHALL 在用户登录时自动将明文密码升级为 bcrypt 哈希。

#### Scenario: 旧用户明文密码登录
- **WHEN** 数据库中存储的是明文密码且用户输入正确密码登录
- **THEN** 系统验证通过后，自动将密码升级为 bcrypt 哈希存储，后续登录使用哈希验证

#### Scenario: 已迁移用户登录
- **WHEN** 数据库中存储的是 bcrypt 哈希且用户输入正确密码
- **THEN** 系统直接使用 bcrypt.compare 验证，无需迁移
