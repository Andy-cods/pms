# Phase 3: Workflow & Calendar (Week 7-9)

**Duration:** 3 weeks | **Status:** [ ] Not Started | **Depends on:** Phase 2

---

## Context

BC Agency currently uses Telegram for manual approval workflows. This phase automates the approval process, adds a built-in calendar for meetings/deadlines, and integrates Telegram for notifications. Comments system enables team discussions within the platform.

---

## Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 7 | Approval Workflow | Submit, Approve, Reject, Escalation, UI |
| Week 8 | Calendar Module | Events, Meetings, Deadlines, Calendar UI |
| Week 9 | Notifications & Comments | Telegram bot, In-app notifications, Comments |

---

## Requirements

### Functional
- Submit items for approval (Plan, Content, Budget, File)
- Approvers (NVKD) can approve, reject, or request changes
- Auto-escalation after 24h/48h/72h
- Calendar shows meetings and task deadlines
- Monthly and weekly calendar views
- Telegram notifications for key events
- In-app notification center
- Threaded comments on projects and tasks

### Non-Functional
- Approval response time tracked
- Calendar loads < 2s with 50 events/month
- Telegram message delivery < 5s
- Notifications stored for 30 days

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
├────────────────┬───────────────┬───────────────┬────────────────┤
│ ApprovalModule │ CalendarModule│ NotifyModule  │ CommentModule  │
├────────────────┼───────────────┼───────────────┼────────────────┤
│   Workflow     │    Events     │  Telegram Bot │   Threaded     │
│   Engine       │    Recurring  │  In-App       │   Replies      │
└────────────────┴───────────────┴───────────────┴────────────────┘
         │                │              │
         └────────────────┴──────────────┘
                         │
                    Redis (Queues)
```

---

## Implementation Steps

### Week 7: Approval Workflow

#### Day 43-44: Approval Domain & Application Layer
- [ ] **Task 7.1:** Create Approval entity (Domain)
  - Properties: id, projectId, type, status, submittedBy, approvedBy
  - ApprovalType: PLAN, CONTENT, BUDGET, FILE
  - ApprovalStatus: PENDING, APPROVED, REJECTED, CHANGES_REQUESTED
  - Escalation fields: escalatedAt, escalationLevel
  - **Subtasks:**
    - Create `approval.entity.ts`
    - Create status and type value objects
    - Define status transition rules
  - **Acceptance Criteria:** Entity validates workflow states
  - **Dependencies:** Project module from Phase 2
  - **Effort:** 3 hours

- [ ] **Task 7.2:** Create ApprovalHistory entity
  - Track all status changes
  - Store: fromStatus, toStatus, comment, changedBy, changedAt
  - **Acceptance Criteria:** Full audit trail maintained
  - **Effort:** 1 hour

- [ ] **Task 7.3:** Create Approval use cases
  - `SubmitForApprovalUseCase`:
    - Validate user can submit
    - Create approval record
    - Update project stage to UNDER_REVIEW
    - Notify approvers
  - `ApproveUseCase`:
    - Validate user is approver (NVKD role)
    - Update status, add history
    - Update project stage to PROPOSAL_PITCH or ONGOING
    - Notify submitter
  - `RejectUseCase`:
    - Add rejection reason
    - Update project stage back
    - Notify submitter
  - `RequestChangesUseCase`:
    - Add change requests
    - Keep status in CHANGES_REQUESTED
    - Notify submitter
  - **Acceptance Criteria:** All workflow paths work
  - **Effort:** 5 hours

#### Day 45-46: Approval Escalation & Infrastructure
- [ ] **Task 7.4:** Create Escalation service
  - Check for pending approvals > 24h, > 48h, > 72h
  - Escalation levels:
    - Level 1 (24h): Reminder to approver
    - Level 2 (48h): Escalate to PM
    - Level 3 (72h): Escalate to Admin
  - Use Redis for scheduled checks (cron job)
  - **Subtasks:**
    - Create EscalationService
    - Schedule cron job (every hour)
    - Track escalation level
  - **Acceptance Criteria:** Auto-escalation works correctly
  - **Effort:** 4 hours

- [ ] **Task 7.5:** Create Approval endpoints
  - `POST /api/approvals` - submit for approval
  - `GET /api/approvals` - list (filter: status, type, project)
  - `GET /api/approvals/pending` - pending for current user
  - `GET /api/approvals/:id` - get with history
  - `PATCH /api/approvals/:id/approve` - approve
  - `PATCH /api/approvals/:id/reject` - reject
  - `PATCH /api/approvals/:id/request-changes` - request changes
  - **Acceptance Criteria:** All endpoints protected by roles
  - **Effort:** 3 hours

- [ ] **Task 7.6:** Create ApprovalModule
  - Wire up services with DI
  - Register cron job for escalation
  - Export for notification integration
  - **Acceptance Criteria:** Module initializes correctly
  - **Effort:** 1 hour

#### Day 47-49: Approval UI
- [ ] **Task 7.7:** Create Approval list page
  - Tabs: Pending, Approved, Rejected, All
  - Table: Project, Type, Submitted by, Submitted at, Status
  - Quick actions: Approve, Reject buttons
  - **Subtasks:**
    - Create `useApprovals` hook
    - Create ApprovalTable component
    - Add tab navigation
  - **Acceptance Criteria:** Approvers can see pending items
  - **Effort:** 4 hours

- [ ] **Task 7.8:** Create Approval detail modal
  - Show: project info, approval type, description
  - Attached files (if FILE type)
  - Timeline of status changes (history)
  - Action buttons: Approve, Reject, Request Changes
  - Comment input for rejection/changes reason
  - **Acceptance Criteria:** Full context shown before decision
  - **Effort:** 3 hours

- [ ] **Task 7.9:** Create Submit for Approval modal
  - Select approval type
  - Add title and description
  - Attach files (optional)
  - Set deadline (optional)
  - Preview who will be notified
  - **Acceptance Criteria:** Users can submit from project detail
  - **Effort:** 3 hours

- [ ] **Task 7.10:** Add approval status to Project detail
  - Show current approval status if UNDER_REVIEW
  - Show last approval result
  - Quick submit button for Planners
  - **Acceptance Criteria:** Approval visible in project context
  - **Effort:** 2 hours

---

### Week 8: Calendar Module

#### Day 50-52: Calendar Domain & Application Layer
- [ ] **Task 8.1:** Create Event entity (Domain)
  - Properties: id, title, description, type, startTime, endTime
  - EventType: MEETING, DEADLINE, MILESTONE, REMINDER
  - Recurrence: RRULE format support
  - Location, meetingLink
  - **Subtasks:**
    - Create `event.entity.ts`
    - Create recurrence parser utility
  - **Acceptance Criteria:** Events support all types
  - **Effort:** 3 hours

- [ ] **Task 8.2:** Create EventAttendee entity
  - Link users to events
  - Status: pending, accepted, declined
  - Support external attendees (email only)
  - **Acceptance Criteria:** Attendees tracked correctly
  - **Effort:** 1 hour

- [ ] **Task 8.3:** Create Calendar use cases
  - `CreateEventUseCase`:
    - Validate time, attendees
    - Send invitations
  - `UpdateEventUseCase`:
    - Handle recurring event updates (this/all instances)
  - `DeleteEventUseCase`:
    - Handle recurring deletions
  - `GetEventsUseCase`:
    - Filter by date range, type, project
    - Expand recurring events
  - `GetDeadlinesUseCase`:
    - Auto-generate from task deadlines
  - **Acceptance Criteria:** Calendar operations work
  - **Effort:** 4 hours

#### Day 53-54: Calendar Infrastructure
- [ ] **Task 8.4:** Create Calendar endpoints
  - `POST /api/events` - create event
  - `GET /api/events` - list with date range
  - `GET /api/events/deadlines` - task deadlines
  - `GET /api/events/:id` - get event
  - `PATCH /api/events/:id` - update
  - `DELETE /api/events/:id` - delete
  - `POST /api/events/:id/respond` - accept/decline
  - **Acceptance Criteria:** CRUD works correctly
  - **Effort:** 3 hours

- [ ] **Task 8.5:** Create recurring event expansion
  - Parse RRULE format
  - Expand occurrences within date range
  - Handle exceptions (deleted/modified instances)
  - Use `rrule` npm package
  - **Acceptance Criteria:** Recurring events display correctly
  - **Effort:** 3 hours

- [ ] **Task 8.6:** Create deadline sync service
  - Listen to task create/update events
  - Auto-create/update deadline events
  - Mark as DEADLINE type
  - **Acceptance Criteria:** Task deadlines appear in calendar
  - **Effort:** 2 hours

#### Day 55-56: Calendar UI
- [ ] **Task 8.7:** Create CalendarView component
  - Month view (default)
  - Week view (optional)
  - Color-coded by event type
  - Click to view event details
  - **Subtasks:**
    - Use `react-big-calendar` or `fullcalendar`
    - Custom event rendering
    - Navigation (prev/next month)
  - **Acceptance Criteria:** Calendar displays events correctly
  - **Effort:** 5 hours

- [ ] **Task 8.8:** Create Event form modal
  - Title, description
  - Type selector
  - Date/time pickers (start, end, all-day toggle)
  - Recurrence selector (none, daily, weekly, monthly)
  - Attendees picker
  - Location / meeting link
  - **Acceptance Criteria:** Events can be created from UI
  - **Effort:** 4 hours

- [ ] **Task 8.9:** Create Event detail modal
  - Show all event info
  - List attendees with status
  - Accept/Decline buttons for current user
  - Edit/Delete buttons for creator
  - **Acceptance Criteria:** Event details accessible
  - **Effort:** 2 hours

- [ ] **Task 8.10:** Create Calendar page
  - Full-page calendar view
  - Sidebar: upcoming events list
  - Filter by: type, project
  - Create event button
  - **Acceptance Criteria:** Calendar page functional
  - **Effort:** 2 hours

---

### Week 9: Notifications & Comments

#### Day 57-59: Telegram Bot
- [ ] **Task 9.1:** Setup Telegram bot
  - Register bot with BotFather
  - Get bot token
  - Add to environment variables
  - **Acceptance Criteria:** Bot responds to /start
  - **Effort:** 1 hour

- [ ] **Task 9.2:** Create Telegram service
  - Send message function
  - Format messages with Markdown
  - Handle rate limits
  - **Subtasks:**
    - Use `node-telegram-bot-api` package
    - Create message templates
  - **Acceptance Criteria:** Messages send successfully
  - **Effort:** 2 hours

- [ ] **Task 9.3:** Create user linking flow
  - `/start` command generates link code
  - User enters code in PMS settings
  - Link Telegram chat ID to user account
  - **Acceptance Criteria:** Users can link their Telegram
  - **Effort:** 3 hours

- [ ] **Task 9.4:** Create notification templates
  - Task assigned: project, task title, deadline
  - Approval pending: project, type, deadline
  - Approval result: project, result, comment
  - Meeting reminder: title, time, attendees
  - Deadline reminder: task, deadline
  - **Acceptance Criteria:** All templates render correctly
  - **Effort:** 2 hours

#### Day 60-61: In-App Notifications
- [ ] **Task 9.5:** Create Notification entity and service
  - Properties: userId, type, title, content, link, isRead
  - Types: task_assigned, approval_pending, comment_mention, etc.
  - Mark as read, mark all as read
  - **Acceptance Criteria:** Notifications stored correctly
  - **Effort:** 2 hours

- [ ] **Task 9.6:** Create Notification endpoints
  - `GET /api/notifications` - list for current user
  - `PATCH /api/notifications/:id/read` - mark as read
  - `PATCH /api/notifications/read-all` - mark all as read
  - `GET /api/notifications/unread-count` - badge count
  - **Acceptance Criteria:** Endpoints work correctly
  - **Effort:** 2 hours

- [ ] **Task 9.7:** Create notification queue
  - Use Redis for queue
  - Process notifications async
  - Send both in-app and Telegram (based on user prefs)
  - **Acceptance Criteria:** Notifications processed reliably
  - **Effort:** 3 hours

- [ ] **Task 9.8:** Create Notification UI
  - Bell icon in navbar with unread count
  - Dropdown with recent notifications
  - Click to navigate to relevant page
  - Mark as read on click
  - View all link
  - **Acceptance Criteria:** Users see notifications
  - **Effort:** 3 hours

- [ ] **Task 9.9:** Create User notification preferences
  - Toggle for each notification type
  - Toggle for Telegram vs in-app
  - Do not disturb hours
  - **Acceptance Criteria:** Users control their notifications
  - **Effort:** 2 hours

#### Day 62-63: Comments System
- [ ] **Task 9.10:** Create Comment entity and service
  - Properties: id, projectId/taskId, content, parentId, authorId
  - Threaded replies (parentId)
  - @mentions detection
  - **Acceptance Criteria:** Comments stored correctly
  - **Effort:** 2 hours

- [ ] **Task 9.11:** Create Comment endpoints
  - `POST /api/comments` - create (with projectId or taskId)
  - `GET /api/comments` - list for project/task
  - `PATCH /api/comments/:id` - edit
  - `DELETE /api/comments/:id` - delete (soft)
  - **Acceptance Criteria:** CRUD works correctly
  - **Effort:** 2 hours

- [ ] **Task 9.12:** Create Comments UI
  - Comment list with author, time, content
  - Reply button (nested replies)
  - Add comment input
  - @mention autocomplete (project team members)
  - Edit/delete own comments
  - **Subtasks:**
    - Create CommentItem component
    - Create CommentInput component
    - Create MentionPicker component
  - **Acceptance Criteria:** Users can discuss in context
  - **Effort:** 4 hours

- [ ] **Task 9.13:** Create mention notifications
  - Parse @username in content
  - Create notification for mentioned user
  - Link to comment location
  - **Acceptance Criteria:** Mentions trigger notifications
  - **Effort:** 2 hours

---

## Todo Checklist

### Week 7
- [ ] Approval workflow backend complete
- [ ] Escalation cron job running
- [ ] Approval list and detail UI
- [ ] Submit for approval modal
- [ ] Project shows approval status

### Week 8
- [ ] Event CRUD backend complete
- [ ] Recurring events working
- [ ] Task deadlines sync to calendar
- [ ] Calendar view (month/week)
- [ ] Event creation and detail modals

### Week 9
- [ ] Telegram bot linked to users
- [ ] Notification templates ready
- [ ] In-app notification center
- [ ] User notification preferences
- [ ] Comments with @mentions working

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Approval workflow | End-to-end test | Works correctly |
| Escalation | 24h pending | Reminder sent |
| Calendar load | 50 events/month | < 2s |
| Telegram delivery | Message sent | < 5s |
| Notification display | Unread count | Real-time |
| Comment threading | 3 levels deep | Displays correctly |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Telegram API rate limits | Medium | Medium | Queue messages, respect limits |
| Recurring event complexity | Medium | Medium | Use proven rrule library |
| Escalation timing issues | Low | High | Comprehensive testing, logging |
| Notification spam | Medium | Medium | User preferences, batching |

---

## Security Considerations

- Telegram bot token in environment variables
- Users can only see their own notifications
- Comments visible only to project team
- Approval actions logged in AuditLog
- @mentions only suggest team members (not all users)

---

## Definition of Done

- [ ] All tasks have acceptance criteria met
- [ ] Approval workflow tested with all paths
- [ ] Calendar displays correctly across timezones
- [ ] Telegram integration tested with real device
- [ ] Notification preferences saved correctly
- [ ] Comments display with proper threading
- [ ] No memory leaks from cron jobs

---

## Dependencies

- **Phase 2:** Project and Task modules for linking
- **External:** Telegram Bot API

---

## Notes

- Approval deadline is soft - escalation is the enforcement mechanism
- Calendar timezone should be Vietnam (UTC+7) by default
- Telegram messages should be concise - link to PMS for details
- Consider WebSocket for real-time notification updates in v2
- Comment @mentions use username format: @nguyen.van.a
