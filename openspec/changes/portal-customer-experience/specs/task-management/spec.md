# Task Management (delta for portal-customer-experience)

## ADDED Requirements

### Requirement: 状态进入 verifying 时通知 portal 端

When a task's status transitions into `verifying` from any other value, the system MUST persist a portal-targeted notification so the client discovers the task awaiting their acceptance.

This requirement is intentionally a new requirement rather than a MODIFIED one — the existing `task-management` capability does not assert anything about notifications on status change, so there is no prior behavior to update.

#### Scenario: 从任意非 verifying 状态进入 verifying

- **WHEN** `updateTask` receives a status change where the previous status is not `verifying` and the new status is `verifying`
- **THEN** the system inserts one row into the `notifications` table with `audience = 'portal'`, `task_id` set to the affected task, and a `text` payload that includes the task title

#### Scenario: 同状态更新不重复通知

- **WHEN** `updateTask` is called with no status change (old status equals new status), even if new status is `verifying`
- **THEN** no new `audience = 'portal'` row is inserted

#### Scenario: 从 verifying 离开不通知 portal 端

- **WHEN** `updateTask` transitions a task from `verifying` to any other status
- **THEN** no new `audience = 'portal'` row is inserted for that transition
