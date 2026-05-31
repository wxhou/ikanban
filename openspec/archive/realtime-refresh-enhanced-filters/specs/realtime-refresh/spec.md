## ADDED Requirements

### Requirement: Auto-refresh polling for KanbanBoard
The system SHALL automatically poll `/api/tasks` at regular intervals to fetch updated task data.

#### Scenario: Normal polling on visible page
- **WHEN** KanbanBoard is mounted and page is visible
- **THEN** system polls `/api/tasks` every 30 seconds

#### Scenario: Pause polling when page hidden
- **WHEN** `document.hidden` becomes `true` (user switches tab or minimizes)
- **THEN** system pauses polling

#### Scenario: Resume polling when page visible
- **WHEN** `document.hidden` becomes `false` (user returns to tab)
- **THEN** system resumes polling immediately and resets interval

#### Scenario: Smooth data update
- **WHEN** polling fetches new task data
- **THEN** system updates tasks without disrupting user's current interaction (no scroll reset, no modal close)

### Requirement: Auto-refresh polling for Portal
The system SHALL automatically poll `/api/portal/tasks` at regular intervals to fetch updated task data for the client portal.

#### Scenario: Normal polling on visible portal
- **WHEN** Portal page is mounted and page is visible
- **THEN** system polls `/api/portal/tasks` every 15 seconds

#### Scenario: Pause polling when portal hidden
- **WHEN** `document.hidden` becomes `true`
- **THEN** system pauses polling

#### Scenario: Resume polling when portal visible
- **WHEN** `document.hidden` becomes `false`
- **THEN** system resumes polling immediately and resets interval

### Requirement: Polling resource optimization
The system SHALL optimize polling to minimize unnecessary resource consumption.

#### Scenario: Skip polling when modal open
- **WHEN** TaskModal is open (user editing a task)
- **THEN** system pauses polling until modal closes

#### Scenario: Cleanup on unmount
- **WHEN** component unmounts (user navigates away)
- **THEN** system clears polling interval

#### Scenario: Prevent concurrent requests
- **WHEN** previous poll request is still in flight
- **THEN** system skips this poll cycle
