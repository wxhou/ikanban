# 技术设计

## 1. 标签系统

### 数据层

tasks 表新增 `tags TEXT DEFAULT '[]'`，序列化 JSON 数组。

### 类型

```ts
// Task 接口新增
tags: string[];
```

### 前端

- TaskModal 基本信息 tab 新增"标签"输入框（逗号分隔）
- TaskCard 标签 badge 显示（蓝色小标签）
- FilterBar 暂不增加标签筛选（保持简单）

## 2. 人员负载面板

### 组件

Dashboard 的 sideCol 中新增"人员负载"面板，放在"完成进度"之后、"导出汇报"之前。

### 布局

```
┌─ 人员负载 ──────────────────┐
│ ● 张三  5个任务  ████░░ 40% │
│ ● 李四  3个任务  ██░░░░ 20% │
│ ...                         │
└─────────────────────────────┘
```

- 负载 = 进行中任务数 / 该人总任务数
- 进度条颜色：绿 (<40%) / 黄 (40-70%) / 红 (≥70%)

### 依赖

复用现有 `getAssigneeColor`、`getInitials`、`TEAM_MEMBERS`

## 3. 列分布图

### 组件

Dashboard 的 sideCol 中新增"列分布"面板，放在"逾期任务预警"之后、"完成进度"之前。

### 布局

```
┌─ 列分布 ────────────────────┐
│ ● 待办    3  ████████░░  60%│
│ ● 进行中  2  ██████░░░░  40%│
│ ● 审核中  2  ██████░░░░  40%│
│ ● 已阻塞  1  ███░░░░░░░  20%│
│ ● 已完成  2  ██████░░░░  40%│
└─────────────────────────────┘
```

- 柱宽 = 该列任务数 / 最大列任务数 × 100%

### 依赖

复用 `COLUMNS` 常量

## 文件变更

```
修改:
  src/lib/types.ts            — Task 新增 tags 字段
  src/lib/db.ts               — 建表加 tags 列，CRUD 更新
  src/components/TaskModal/TaskModal.tsx — 标签输入框
  src/components/TaskCard/TaskCard.tsx   — 标签 badge
  src/components/TaskCard/TaskCard.module.css — 标签样式
  src/components/Dashboard.tsx           — 人员负载 + 列分布面板
  src/components/Dashboard.module.css    — 对应样式
```
