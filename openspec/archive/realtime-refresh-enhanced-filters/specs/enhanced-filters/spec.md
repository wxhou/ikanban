## ADDED Requirements

### Requirement: Filter by assignee
The system SHALL allow users to filter tasks by assignee(s).

#### Scenario: Single assignee filter
- **WHEN** user selects one assignee from the dropdown
- **THEN** only tasks assigned to that person are displayed

#### Scenario: Multiple assignee filter
- **WHEN** user selects multiple assignees from the dropdown
- **THEN** only tasks assigned to any of the selected people are displayed

#### Scenario: Clear assignee filter
- **WHEN** user clears the assignee selection
- **THEN** all tasks are displayed (regardless of assignee)

#### Scenario: Assignee list source
- **WHEN** assignee dropdown is opened
- **THEN** it shows all team members from `/api/users/members`

### Requirement: Filter by date range
The system SHALL allow users to filter tasks by creation date range.

#### Scenario: Preset date filter - Today
- **WHEN** user selects "Today"
- **THEN** only tasks created today are displayed

#### Scenario: Preset date filter - This Week
- **WHEN** user selects "This Week"
- **THEN** only tasks created in the current week (Monday to Sunday) are displayed

#### Scenario: Preset date filter - This Month
- **WHEN** user selects "This Month"
- **THEN** only tasks created in the current month are displayed

#### Scenario: Custom date range
- **WHEN** user selects "Custom" and specifies start/end dates
- **THEN** only tasks created within that date range are displayed

#### Scenario: Clear date filter
- **WHEN** user clears the date selection
- **THEN** all tasks are displayed (regardless of creation date)

### Requirement: Persist filters in URL
The system SHALL persist active filter selections in URL search parameters.

#### Scenario: Filter reflected in URL
- **WHEN** user applies assignee or date filters
- **THEN** URL updates to include filter parameters (e.g., `?f=张三&d=this-week`)

#### Scenario: URL restores filters on load
- **WHEN** user opens a URL with filter parameters
- **THEN** page loads with those filters pre-applied

#### Scenario: Share filtered view
- **WHEN** user copies and shares the URL
- **THEN** recipient sees the same filtered view

### Requirement: Portal supports enhanced filters
The system SHALL apply the same enhanced filtering capabilities to the Portal view.

#### Scenario: Portal assignee filter
- **WHEN** Portal user selects assignee filter
- **THEN** only tasks assigned to that person are displayed

#### Scenario: Portal date filter
- **WHEN** Portal user selects date filter
- **THEN** only tasks matching the date range are displayed

#### Scenario: Portal filters in URL
- **WHEN** Portal user applies filters
- **THEN** URL updates to reflect filter state

### Requirement: API supports assignee filtering
The `/api/tasks` endpoint SHALL support filtering by assignee.

#### Scenario: API assignee parameter
- **WHEN** client sends `GET /api/tasks?assignee=张三`
- **THEN** API returns only tasks where `assignees` JSON array contains "张三"

#### Scenario: API multiple assignees
- **WHEN** client sends `GET /api/tasks?assignee=张三&assignee=李四`
- **THEN** API returns tasks assigned to either 张三 or 李四

### Requirement: API supports date range filtering
The `/api/tasks` endpoint SHALL support filtering by creation date range.

#### Scenario: API date range parameters
- **WHEN** client sends `GET /api/tasks?createdAfter=2026-05-01&createdBefore=2026-05-31`
- **THEN** API returns only tasks created within that date range

#### Scenario: API single date boundary
- **WHEN** client sends `GET /api/tasks?createdAfter=2026-05-01`
- **THEN** API returns tasks created on or after that date
