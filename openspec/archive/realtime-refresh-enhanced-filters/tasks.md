## 1. API Enhancement - Backend

- [x] 1.1 Add assignee filter support to `/api/tasks` route (query param `?assignee=张三`)
- [x] 1.2 Add date range filter support to `/api/tasks` route (query params `?createdAfter=YYYY-MM-DD&createdBefore=YYYY-MM-DD`)
- [x] 1.3 Add assignee filter support to `/api/portal/tasks` route
- [x] 1.4 Add date range filter support to `/api/portal/tasks` route
- [x] 1.5 Test API filters with multiple assignees and date ranges

## 2. Realtime Refresh - KanbanBoard

- [x] 2.1 Create `usePolling` custom hook with configurable interval, page visibility detection, and cleanup
- [x] 2.2 Integrate polling hook into KanbanBoard component (30s interval)
- [x] 2.3 Add TaskModal state awareness to pause polling when modal is open
- [x] 2.4 Implement smooth data update logic (avoid disrupting user interaction)
- [x] 2.5 Test polling behavior: normal polling, pause on hide, resume on visible, pause on modal

## 3. Realtime Refresh - Portal

- [x] 3.1 Create or adapt polling hook for Portal component (15s interval)
- [x] 3.2 Integrate polling hook into Portal page
- [x] 3.3 Test Portal polling behavior

## 4. Enhanced Filters - UI Components

- [x] 4.1 Add assignee multi-select dropdown to FilterBar component
- [x] 4.2 Populate assignee dropdown from `/api/users/members` endpoint
- [x] 4.3 Add date range selector with preset options (Today, This Week, This Month)
- [x] 4.4 Add custom date range picker (start date, end date inputs)
- [x] 4.5 Wire filter state to parent component (KanbanBoard, Portal)

## 5. Enhanced Filters - URL Persistence

- [x] 5.1 Add URL parameter sync for assignee filter (param: `f`)
- [x] 5.2 Add URL parameter sync for date filter (param: `d` for preset, `ds`/`de` for custom)
- [x] 5.3 Restore filter state from URL parameters on page load
- [x] 5.4 Test URL persistence: apply filters → copy URL → open in new tab → filters preserved

## 6. Integration & Polish

- [x] 6.1 Add loading indicator for polling requests (subtle, non-intrusive)
- [x] 6.2 Test filter combinations (assignee + date + existing filters)
- [x] 6.3 Test Portal filter parity with KanbanBoard
- [x] 6.4 Verify TypeScript types for new API parameters
- [x] 6.5 Run lint and typecheck to ensure code quality
