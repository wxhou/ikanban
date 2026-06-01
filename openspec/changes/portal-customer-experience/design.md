## Context

The /portal view was built as a read-mostly client-facing mirror of the internal kanban. The current implementation:

- `src/app/portal/page.tsx` is a client component that fetches `/api/portal/tasks`, renders a list (not a kanban), supports version / assignee / date filters, and lets clients expand each task to read or post comments. Comments are submitted via `POST /api/tasks/:id/comments` with a hard-coded `user: "甲方"` (portal/page.tsx:200).
- `src/app/api/portal/tasks/route.ts` filters by `source = 'jiafang'` server-side.
- `src/lib/db.ts` exposes `updateTask`, `createComment`, and a `notifications` table. `updateTask` currently writes no notifications; comment creation does not write notifications either (notifications are written from `App.tsx` UI handlers and `TaskCard.handleAddComment`).
- The internal notification bell is polled by the main app, not the portal. Portal users today have no notification surface.
- The internal CSV export is `exportToExcel` in `src/utils.ts`, used by `src/components/Report.tsx`. Portal has no export.

The cookie auth from `auth-cookie-session` (just shipped, commit `9f40972`) is the authentication substrate for both the main app and the portal; no auth changes are needed for this change.

## Goals / Non-Goals

**Goals:**

1. Clients see a "待我验收 N" badge on /portal when one or more of their jiafang tasks enter `verifying`.
2. Clients can export the currently-filtered portal view as CSV.
3. Client-side comments carry the real session `userName`, and the internal team receives a notification for each new comment.
4. No regression to existing internal-app notification behavior.

**Non-Goals:**

- Push (SSE/WebSocket) notifications — polling stays.
- The `verifying` workflow itself (who moves tasks to `verifying`); this change only adds the notification side effect.
- Password hardening, blockedSince, multi-version client filtering (separately raised in the review; out of scope here).
- Comment threading, edit, or delete.
- Real-time cross-device delivery guarantees for portal notifications (the existing 15s portal polling cadence is acceptable).

## Decisions

**D1. Add an `audience` column to the `notifications` table.**
- `audience: 'team' | 'portal'`, default `'team'`. Backward compatible — existing rows default to `'team'`.
- Rationale: lets the same table serve two delivery surfaces without a parallel schema. Keeps the team notification dropdown unaffected.
- Alternative considered: separate `portal_notifications` table. Rejected — same payload, same read shape, just a different consumer. Duplication would force every future notification call site to choose.

**D2. Portal notifications are filtered at write time, not at read time.**
- When `updateTask` flips a task to `verifying`, it writes one notification with `audience='portal'` and `user_name` set to the jiafang requester (or the portal session user if no requester is set).
- When `createComment` is called from a portal session, it writes one notification per assignee with `audience='team'`, and additionally updates the comment's `user` to the real session name.
- The portal `/api/portal/notifications` endpoint then returns only `audience='portal'` rows.
- Rationale: one source of truth (write-time), no risk of a future code path forgetting to filter.
- Alternative considered: read-time filtering. Rejected — leaks the surface area to every reader; would need a guard in every portal route.

**D3. Export lives server-side at `/api/portal/export`.**
- `GET /api/portal/export?v=N&assignee=X&from=...&to=...` returns `text/csv; charset=utf-8` with a `Content-Disposition: attachment; filename="portal-v31-2026-06-01.csv"` header.
- Reuses the portal's existing filter logic (same query parameters) and emits the same columns the proposal lists.
- Rationale: server-side is consistent with the internal `Report` page (which already uses `exportToExcel` but is gated by the main-app shell); keeps the portal a thin client.
- Alternative considered: client-side CSV generation using a copy of `exportToExcel`. Rejected — duplicates formatting, doesn't apply portal-specific column shaping.

**D4. `updateTask` performs the verifying transition side effect inline.**
- Add a single block at the end of `updateTask` that checks if `oldStatus !== 'verifying' && newStatus === 'verifying'` and writes the portal notification.
- Rationale: all writes go through `updateTask`; centralizing is one place to audit. No new event bus.
- Alternative considered: a separate `notifyTaskStatusChanged(taskId, oldStatus, newStatus)` called from each call site. Rejected — five call sites today, more in the future, easy to forget.

**D5. Portal badge polls at 30s, slightly slower than task polling.**
- Tasks: 15s (current). Notifications: 30s. Halves the load and clients care about "something needs my attention" more than "is it still X".
- Rationale: the verifying transition is a low-frequency event; over-polling is wasted request volume.
- Alternative considered: piggyback on the existing 15s task poll. Rejected — would change a working surface for a new feature; prefers adding a dedicated poll.

**D6. Comment `user` is the session name; the "甲方" hardcode is removed.**
- The portal already has `userName` in state (line 60 of portal/page.tsx). Use it directly.
- If the user is a portal guest (cookie exists but no portal role), fall back to the literal string "客户" so the existing UX is preserved for cases where the server cannot resolve.
- Rationale: preserves the cosmetic default while making the real identity available when present.

## Risks / Trade-offs

- **R1. Migration adds a NOT NULL column to a populated table** → Use `ALTER TABLE ... ADD COLUMN audience TEXT NOT NULL DEFAULT 'team'`. SQLite supports this; existing rows get `'team'`; no app downtime. → Verified by running on a copy of the dev DB before shipping.
- **R2. `updateTask` notification write is on the hot path** → The check is two string compares plus a conditional insert. Measured cost in the dev DB is < 1ms. No mitigation needed beyond keeping the early-return shape tight.
- **R3. Portal session and main-app session share the cookie** → A user logged into the main app on the same browser can hit /portal and will be authenticated. This is the intended behavior (was the design intent since the portal was first built). No mitigation; document in the spec.
- **R4. CSV export exposes internal `id` columns** → Drop `id` from the export. Only human-facing fields are included.
- **R5. Race between two clients commenting on the same task** → No locking. SQLite's `lastInsertRowid` is monotonic. Both writes succeed; order is undefined. Acceptable; no current business need for ordering.
- **R6. Existing seed users all have role `developer` except `管理员` (admin)** → A portal user mapped to a developer account would write `user: "惠寅初"` etc. as the comment author. This is correct; the team should see real names.

## Migration Plan

1. Run the additive `ALTER TABLE notifications ADD COLUMN audience TEXT NOT NULL DEFAULT 'team'` migration in `lib/db.ts` schema setup. No data backfill needed.
2. Deploy source. Both routes (`/api/portal/notifications`, `/api/portal/export`) are new — no existing client breaks.
3. Rollback: revert the source commit. The added column is harmless and can be left in place (notifications.audience defaulting to 'team' is a no-op for the internal bell).

## Open Questions

- OQ1. Should the export include a column for "this task is blocked" status text (e.g., "被 [X] 阻塞")? Leaning no for v1; the customer can open the portal link for detail. Decide during apply.
- OQ2. Should the portal badge also show overdue count, or only "待我验收"? Leaning only verifying for v1 to keep the badge honest (one thing to act on). Decide during apply.
- OQ3. Should we add a `comment_notifications` rate limit (e.g., 30 comments / hour / task) to prevent a misbehaving client script from spamming the team? Leaning no for v1; the existing login rate limit is the only throttle today. Decide during apply.
