## Context

ikanban 是一个 Next.js 全栈应用，SQLite (Turso) 单库，CSS Modules 样式，无外部消息队列或实时通道。当前任务间无关联能力，通知依赖浏览器 `Notification` API。

## Goals / Non-Goals

**Goals:**
- 任务间支持"阻塞/被阻塞/关联"三种关系类型
- TaskCard 和 TaskModal 中直观展示关联任务
- TopNav 铃铛展示未读通知数，下拉面板展示通知列表
- 关键事件自动生成通知（分配、评论、到期）

**Non-Goals:**
- 不做实时推送（WebSocket/SSE），采用轮询方案
- 不做 @提及通知（需要富文本编辑器）
- 不过滤任务关系环（不做 DAG 校验）
- 不邮件/企业微信等外部通知

## Decisions

### 1. 数据模型设计

**task_links 表：**
```sql
CREATE TABLE task_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,       -- 源任务
  linked_task_id INTEGER NOT NULL, -- 目标关联任务
  link_type TEXT NOT NULL DEFAULT 'related', -- blocks | blocked_by | related
  created TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, linked_task_id)
);
```

- `blocks`: task_id 阻塞 linked_task_id
- `blocked_by`: task_id 被 linked_task_id 阻塞（等价于反向 blocks，但存为独立记录方便查询）
- `related`: 双向无向关联

**notifications 表：**
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,         -- 接收通知的用户名
  type TEXT NOT NULL,              -- assigned | due_soon | overdue | commented | completed
  task_id INTEGER,                -- 关联任务（可选）
  text TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_name, read, created);
```

### 2. 通知触发策略：前端即发

所有操作在前端成功后通过 `POST /api/notifications` 创建通知：
- **分配/评论/完成**：操作者前端调用 API 时顺带写入通知给被影响的用户
- **到期/逾期**：`App.tsx` 初始化时批量检测并写入（类似现有 overdue 提醒逻辑）

选择前端即发而非后端钩子，因为：
1. 与现有 `createComment` 模式一致
2. 不改动已有 API 语义
3. 冗余写入（同一通知多次写入）用 `read = 0` 的去重查询解决

### 3. 轮询策略

通知列表每 30s 轮询一次 `GET /api/notifications?user=xxx`，返回该用户所有未读通知。铃铛未读数实时更新。不轮询时仅在页面加载时获取一次。

### 4. UI 组件决策

- **关联徽章** 直接在 TaskCard 现有 tags 行展示，复用 `.tag` 样式
- **关联管理 Tab** 复用 TaskModal 已有的 Tab 切换模式（`subtaskList / commentList` 同级）
- **通知面板** 新建独立 `NotificationPanel` 组件，挂载在 TopNav 铃铛图标的 `onClick` 上

### 5. 不使用 will-change（性能）

通知面板和关联都是低频交互动画，不需要 `will-change` 预声明层提升。

## Risks / Trade-offs

- [风险] 前端即发通知失败时（网络中断），通知丢失 → 缓解：到期的通知在页面重新加载时批量补写
- [风险] task_links 删除任务时级联删除关联 → 已用 `ON DELETE CASCADE` 处理
- [风险] 30s 轮询在 8 人团队下不会造成负载问题，Turso 免费额度足够
- [权衡] `blocks` 和 `blocked_by` 存为独立记录而非依赖方向推断，增加存储但简化查询——8 人团队的数据量下存储不是瓶颈
