## 1. Schema migration

- [x] 1.1 在 `lib/db.ts` 的 schema setup 末尾追加 `ALTER TABLE notifications ADD COLUMN audience TEXT NOT NULL DEFAULT 'team'`，用 `try/catch` 兼容「列已存在」错误（幂等）
- [x] 1.2 在 `lib/types.ts` 的 `Notification` 类型加 `audience: 'team' | 'portal'`，默认 `'team'`
- [x] 1.3 启动 dev server 跑 `sqlite3 data/kanban.db ".schema notifications"` 确认列已加

## 2. Verifying 状态进入时通知 portal 端

- [x] 2.1 在 `lib/db.ts` 新增 `notifyOnVerifying(task, oldStatus, newStatus, portalUserName?)` helper：当 `oldStatus !== 'verifying' && newStatus === 'verifying'` 时插入一条 `audience='portal'` 的通知，`user_name` 取 task.requester 或入参
- [x] 2.2 在 `updateTask` 末尾调用 `notifyOnVerifying(...)`，传入 `oldStatus`（从 `existing.status` 拿到）和 `newStatus`
- [x] 2.3 单元自测（curl 触发）：手动 `updateTask` 把任务 ID 3 从 inprogress 改 verifying → 查 `notifications` 表有 1 行 `audience='portal'`

## 3. Portal 端评论带真实身份 + 团队通知

- [x] 3.1 在 `lib/db.ts` 修改 `createComment` 签名：接受可选 `requesterName`（非空时写 `user`），并在评论落库后查 task assignees，为每个 assignee 写一条 `audience='team'` 的 `type='commented'` 通知，text 形如 `<requesterName> 评论了任务「<title>」`
- [x] 3.2 修改 `src/app/api/tasks/[id]/comments/route.ts`（或对应 POST 端点）从 `cookies()` 解析 `sid` → `getRequestUser` 拿到 userName，传给 `createComment`；保留对匿名 portal 写的 fallback
- [x] 3.3 改 `src/app/portal/page.tsx:200` 附近调用：把硬编码的 `user: "甲方"` 替换为 `user: userName || "客户"`
- [x] 3.4 端到端 curl 验证：portal 身份登录后 POST 评论 → 查 `notifications` 表 → 至少 1 行 `audience='team', type='commented'`，且 `comments` 表的 `user` 字段是真实 userName

## 4. Portal notifications 端点

- [x] 4.1 新建 `src/app/api/portal/notifications/route.ts`：GET，从 cookies 拿 sid → resolveSession；查 `notifications` 表 WHERE `audience='portal'` AND `user_name = ?` 或全部（待设计确认）按 `created_at DESC` 限 50；返回 `{ notifications: [...], unread: number }`
- [x] 4.2 portal 通知 `user_name` 解析策略决定（OQ，需 apply 阶段确认）：先实现为「assignee is the 甲方对接人」的简化方案——直接返回所有 `audience='portal'` 行，前端按 `task_id` 聚合

## 5. Portal CSV 导出

- [x] 5.1 新建 `src/app/api/portal/export/route.ts`：GET，参数 `v` / `a` / `from` / `to`，复用 `src/app/api/portal/tasks/route.ts` 的过滤 SQL；输出 `text/csv; charset=utf-8`，header `Content-Disposition: attachment; filename="portal-<version>-<date>.csv"`，列：title,status,priority,assignee,due,overdue_days,comments_count,source
- [x] 5.2 在 `src/app/portal/page.tsx` 顶部 filter 区加 "导出 CSV" 按钮（button + `<a href="/api/portal/export?..." download>` 形式），构造 URL 时同步当前 filter
- [x] 5.3 手动验证：portal 上 filter V3.1 + 某 assignee → 点导出 → 浏览器下载 CSV，行数 == 屏幕显示

## 6. UI: Portal header 通知 badge

- [x] 6.1 在 `src/app/portal/page.tsx` 顶部加一个铃铛 + 红点组件，初始 `unread=0`；轮询 `/api/portal/notifications` 间隔 30s，标签页可见时跑，隐藏时停（复用 `document.hidden` 检测逻辑）
- [x] 6.2 点开铃铛弹一个简略 list：每行 `<task_title> 进入待验收` + 链接回 portal 当前 filter
- [x] 6.3 通知数 ≥ 1 时显示数字 badge；= 0 时隐藏

## 7. 验证

- [x] 7.1 `bun run lint` 通过：本 change 引入 0 新 lint 错（pre-existing 4 错不在范围）
- [x] 7.2 `bunx tsc --noEmit` 通过
- [x] 7.3 手动 E2E：用 admin 账号把任务 #3 状态从 inprogress 改 verifying → portal 端 30s 内出现 "待我验收 1" badge
- [x] 7.4 手动 E2E：admin 改回 todo → portal badge 不再增长
- [x] 7.5 手动 E2E：portal 端登录「管理员」+admin123，访问 /portal，对某任务写评论「测试评论」→ 内部 team 账号（任意 assignee）登出再进，通知中心有 1 条 `type='commented'` 且 text 包含「管理员 评论了任务「...」」
- [x] 7.6 手动 E2E：portal 端点导出 → 浏览器下载 CSV，列顺序与规格一致，行数 = 当前 portal 列表行数，且不含 `id` 列
- [x] 7.7 手动 E2E（边界）：`GET /api/portal/notifications` 在 1 分钟内 50 次调用 → 不应触发 rate limit（仅 verify 限流，不在 portal 通知）
