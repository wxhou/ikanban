# Navigation

## Purpose

视图通过真实路由导航，URL 反映当前视图，刷新、浏览器后退/前进、分享/收藏链接均保持视图位置。

## Requirements

### Requirement: 视图路由
系统 SHALL 为四个视图提供独立路由：`/home/kanban`（看板）、`/home/dashboard`（总览）、`/home/report`（汇报）、`/home/versions`（版本）。

#### Scenario: 直接访问视图路由
- **WHEN** 用户直接访问 `/home/dashboard`
- **THEN** 页面展示总览视图，导航栏"总览"按钮高亮

#### Scenario: 访问根路径
- **WHEN** 用户访问 `/`
- **THEN** 系统重定向到默认视图 `/home/kanban`

### Requirement: URL 语义
系统 SHALL 让当前视图反映在 URL 中，刷新、浏览器后退/前进、分享/收藏链接后仍停留在同一视图。

#### Scenario: 刷新保持视图
- **WHEN** 用户在 `/home/report` 刷新页面
- **THEN** 页面重新加载后仍展示汇报视图

#### Scenario: 浏览器后退
- **WHEN** 用户从 `/home/dashboard` 导航到 `/home/kanban` 后点击浏览器后退
- **THEN** 页面回到 `/home/dashboard` 总览视图

#### Scenario: 分享链接
- **WHEN** 用户复制当前视图 URL 并分享给他人
- **THEN** 打开该链接的人直接进入对应视图

### Requirement: 导航链接
系统 SHALL 让顶部导航栏的视图切换按钮以链接形式导航，当前视图对应按钮高亮。

#### Scenario: 点击导航切换视图
- **WHEN** 用户点击导航栏中的"总览"链接
- **THEN** 浏览器地址变为 `/home/dashboard`，页面展示总览视图

#### Scenario: 当前视图高亮
- **WHEN** 用户位于 `/home/versions`
- **THEN** 导航栏"版本"按钮高亮，其余按钮不高亮

### Requirement: 筛选参数与视图共存
系统 SHALL 在看板视图保留现有筛选查询参数（`f`、`p`、`q`、`v`、`a`、`d`、`ds`、`de`），并允许其与视图路由共存于 URL。

#### Scenario: 带筛选参数的视图 URL
- **WHEN** 用户访问 `/home/kanban?f=jiafang&q=巡检`
- **THEN** 看板视图加载并应用甲方来源筛选与"巡检"搜索词