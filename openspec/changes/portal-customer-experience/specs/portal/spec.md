# Portal (Customer Experience)

## Purpose

External client-facing delivery board at `/portal`. Lets the 甲方 (client) see only jiafang (甲方) tasks, filter them by version / assignee / date range, comment on them, export the filtered view, and discover when a task is awaiting their acceptance.

## Requirements

### Requirement: Portal shows only jiafang tasks

The system SHALL display only tasks where `source = 'jiafang'` on `/portal`. Internal-only tasks MUST NOT be reachable from any portal API or page.

#### Scenario: Client opens the portal

- **WHEN** an authenticated user navigates to `/portal`
- **THEN** the page shows the list of jiafang tasks in the active version (or the version selected via the dropdown or `?v=` query parameter)

#### Scenario: Internal task is not visible

- **WHEN** a client inspects the network response from `/api/portal/tasks`
- **THEN** the response body contains zero tasks where `source = 'internal'`

### Requirement: Portal filtering

The system SHALL allow the client to filter the visible task set by version, assignee, and date range. The same filters SHALL be honored by the CSV export endpoint.

#### Scenario: Version filter

- **WHEN** the client selects a different version from the dropdown
- **THEN** the task list refreshes to show only tasks in that version

#### Scenario: Assignee filter

- **WHEN** the client selects an assignee from the filter
- **THEN** the task list refreshes to show only tasks where that person is in `assignees`

#### Scenario: Date range filter

- **WHEN** the client enters `from` and `to` dates
- **THEN** the task list shows only tasks whose `due` falls within the range

### Requirement: Portal comments carry the client's real identity

The system SHALL persist portal-side comments with the session `userName` resolved from the `sid` cookie, and SHALL notify each task assignee that a new comment was posted.

#### Scenario: Comment written from a logged-in client

- **WHEN** a logged-in client submits a comment from a portal task
- **THEN** the comment's `user` field equals the client's session `userName`
- **THEN** one notification row is written to the `notifications` table per task assignee, with `audience = 'team'`

#### Scenario: No client notification is created for client comments

- **WHEN** a client comment is persisted
- **THEN** no row with `audience = 'portal'` is created for the comment author

### Requirement: Portal CSV export

The system SHALL provide a CSV export of the currently-filtered portal view, served as a downloadable file with a `Content-Disposition: attachment` header.

#### Scenario: Export current filter

- **WHEN** the client clicks the "导出 CSV" button
- **THEN** a CSV file is downloaded whose rows match exactly the tasks currently visible on screen
- **THEN** the CSV includes columns: title, status, priority, assignee, due, overdue days, comments count, source

#### Scenario: No internal-only fields are leaked

- **WHEN** the client exports the CSV
- **THEN** the file does NOT contain a row for any task where `source = 'internal'`
- **THEN** the file does NOT contain raw database `id` columns

### Requirement: Verifying-acceptance notification for the client

When a task's status transitions into `verifying`, the system SHALL write a notification row with `audience = 'portal'` so the client sees a "待我验收 N" badge on the portal.

#### Scenario: Transition into verifying notifies the client

- **WHEN** `updateTask` changes a task's status from any other value to `verifying`
- **THEN** one row is inserted into `notifications` with `audience = 'portal'` and the task title in the text payload
- **THEN** the `/api/portal/notifications` endpoint returns the row within 30 seconds

#### Scenario: Re-entering verifying does not duplicate notifications

- **WHEN** a task already in `verifying` is updated with no status change
- **THEN** no new `audience = 'portal'` notification is written

#### Scenario: Transition out of verifying does not notify

- **WHEN** `updateTask` changes a task's status from `verifying` to another value (e.g. `done`)
- **THEN** no new `audience = 'portal'` notification is written for the transition

### Requirement: Portal notifications are scoped to portal users

The system SHALL only return notifications where `audience = 'portal'` from `/api/portal/notifications`. Notifications with `audience = 'team'` MUST NOT be returned from any portal route.

#### Scenario: Portal route does not return team notifications

- **WHEN** a client calls `GET /api/portal/notifications`
- **THEN** the response contains only rows where `audience = 'portal'`
