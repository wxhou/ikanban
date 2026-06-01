## Why

The /portal view (external client-facing delivery board) is functionally reachable and shows 6 jiafang (甲方) tasks, but it leaves three gaps that hurt the customer experience: (1) clients have no signal when a task lands in `verifying` (待验收) — they must poll the portal to discover work awaiting their acceptance, (2) the portal has no way to export the visible task set so clients can forward status to their own leadership, and (3) client-side comments are written under a hard-coded `user: "甲方"` identity, so internal team members receive no notification and cannot tell which stakeholder said what. These were surfaced by a structured client-perspective review of the live portal at http://localhost:4789/portal.

## What Changes

- **Tasks entering `verifying` notify the client.** When `updateTask` (or any code path) transitions a task's status to `verifying`, persist a notification row tagged for portal-side delivery. The portal polls `/api/portal/notifications` and surfaces a new "待我验收" badge in the header. Unread count is exposed in the same payload.
- **Portal adds a "导出 CSV" button** next to the version filter. Reuses the existing `exportToExcel` helper in `src/utils.ts` but with portal-scoped columns (title / status / priority / assignee / due / overdue days / comments count / source) and the client's current filter set.
- **Portal comments carry the real user identity and notify the team.** Replace the hard-coded `user: "甲方"` on `createComment` (called from `src/app/portal/page.tsx:200`) with the actual session `userName` (already available via `/api/auth/me`). After the comment is persisted, enqueue a notification to every task assignee so the team is aware of client feedback. Notification row is the existing `notifications` table; no schema change.

## Capabilities

### New Capabilities

- `portal`: external client-facing delivery board at `/portal`, including filtering, commenting, exporting, and the verifying-acceptance notification flow.

### Modified Capabilities

- `task-management`: the requirement that "task status transitions are observable to the team" is being extended to also include client-side observers on the `→ verifying` transition. Adds a delta spec under `specs/task-management/spec.md` for the new scenario only.

## Impact

- **Code**: `src/lib/db.ts` (add `notifyOnVerifying` hook in `updateTask` and a portal notification write path on `createComment`); `src/app/portal/page.tsx` (add export button, replace hard-coded user, add "待我验收" badge + unread poll); new route `src/app/api/portal/notifications/route.ts`; new `src/app/api/portal/export/route.ts` (or a client-side download — TBD in design).
- **Schema**: `notifications` table needs a new column `audience` (`'team' | 'portal'`) so portal-targeted notifications don't pollute the internal notification dropdown. This is a small additive migration.
- **Auth**: portal already authenticates via the `sid` cookie (added in `auth-cookie-session`). No new auth code.
- **Backward compat**: existing notifications rows default `audience = 'team'`. Existing portal behavior unchanged for tasks not in `verifying` and for clients who don't comment.
- **Out of scope**: 4-digit password hardening, blocked-task `blockedSince` field, multi-version client filtering (all surfaced in the same review but not in this change).
