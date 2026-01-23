# Phase 3: Workflow & Calendar (Week 7-9)

**Duration:** 3 weeks | **Status:** [x] COMPLETE (with minor items deferred) | **Depends on:** Phase 2 (Complete)
**Code Review:** See `reports/260123-phase3-phase4-code-review.md` for detailed analysis

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
+-----------------------------------------------------------------+
|                        API Layer                                  |
+----------------+---------------+---------------+------------------+
| ApprovalModule | CalendarModule| NotifyModule  | CommentModule    |
+----------------+---------------+---------------+------------------+
|   Workflow     |    Events     |  Telegram Bot |   Threaded       |
|   Engine       |    Recurring  |  In-App       |   Replies        |
+----------------+---------------+---------------+------------------+
         |                |              |
         +----------------+--------------+
                         |
                    Redis (Queues)
```

---

## Technical Prerequisites

### Dependencies to Install

**Backend:**
```bash
cd backend
npm install node-telegram-bot-api rrule bullmq
npm install -D @types/node-telegram-bot-api
```

**Frontend:**
```bash
cd frontend
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

### Environment Variables (Add to .env)
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Redis (for notification queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Implementation Steps

### Week 7: Approval Workflow

#### Day 43-44: Approval Domain & Application Layer

- [ ] **Task 7.1:** Create Approval DTOs
  - **File:** `backend/src/application/dto/approval/approval.dto.ts`
  - **Content:**
    - `ApprovalType` enum: PLAN, CONTENT, BUDGET, FILE
    - `ApprovalStatus` enum: PENDING, APPROVED, REJECTED, CHANGES_REQUESTED
    - `CreateApprovalDto`: projectId, type, title, description, deadline?, fileIds[]
    - `UpdateApprovalDto`: status, comment
    - `ApprovalListQueryDto`: projectId?, status?, type?, page, limit
    - `ApprovalResponseDto`: all fields + submittedBy, approvedBy, files, history
    - `ApprovalHistoryDto`: fromStatus, toStatus, comment, changedBy, changedAt
  - **Acceptance Criteria:** DTOs validate all input with class-validator
  - **Effort:** 2 hours

- [ ] **Task 7.2:** Create ApprovalController
  - **File:** `backend/src/presentation/controllers/approval.controller.ts`
  - **Endpoints:**
    ```
    POST   /api/approvals              - Submit for approval
    GET    /api/approvals              - List approvals (filter by status, type, project)
    GET    /api/approvals/pending      - Pending approvals for current user (NVKD only)
    GET    /api/approvals/:id          - Get approval with history
    PATCH  /api/approvals/:id/approve  - Approve (NVKD role)
    PATCH  /api/approvals/:id/reject   - Reject with comment (NVKD role)
    PATCH  /api/approvals/:id/request-changes - Request changes (NVKD role)
    ```
  - **Implementation Pattern:**
    - Use `@UseGuards(JwtAuthGuard, RolesGuard)`
    - Use `@Roles(UserRole.NVKD)` for approval actions
    - Include `checkProjectAccess()` helper
    - Include `mapToResponse()` helper
    - Record history on every status change
  - **Acceptance Criteria:** All endpoints protected by appropriate roles
  - **Effort:** 4 hours

- [ ] **Task 7.3:** Create ApprovalModule
  - **File:** `backend/src/modules/approval/approval.module.ts`
  - **Content:**
    ```typescript
    @Module({
      imports: [PrismaModule],
      controllers: [ApprovalController],
      providers: [ApprovalEscalationService],
      exports: [],
    })
    export class ApprovalModule {}
    ```
  - **Update:** `backend/src/app.module.ts` - Add ApprovalModule to imports
  - **Effort:** 30 minutes

#### Day 45-46: Approval Escalation & Business Logic

- [ ] **Task 7.4:** Create Escalation Cron Service
  - **File:** `backend/src/modules/approval/approval-escalation.service.ts`
  - **Content:**
    ```typescript
    @Injectable()
    export class ApprovalEscalationService {
      constructor(private prisma: PrismaService) {}

      @Cron('0 * * * *') // Every hour
      async checkPendingApprovals() {
        // Find PENDING approvals > 24h, 48h, 72h
        // Level 1 (24h): Send reminder to original approvers
        // Level 2 (48h): Escalate to PM
        // Level 3 (72h): Escalate to Admin
        // Update escalationLevel and escalatedAt
      }
    }
    ```
  - **Logic:**
    - Level 0 -> 1: After 24h, send Telegram reminder
    - Level 1 -> 2: After 48h total, notify PM
    - Level 2 -> 3: After 72h total, notify Admin
  - **Acceptance Criteria:** Auto-escalation works correctly, logged
  - **Effort:** 3 hours

- [ ] **Task 7.5:** Approval Status Transition Logic
  - **Location:** Within ApprovalController methods
  - **Rules:**
    - Only PENDING can transition to APPROVED, REJECTED, CHANGES_REQUESTED
    - CHANGES_REQUESTED can be resubmitted (back to PENDING)
    - APPROVED/REJECTED are terminal states
    - Each transition creates ApprovalHistory record
    - Update Project.stage on APPROVED (UNDER_REVIEW -> PROPOSAL_PITCH/ONGOING)
  - **Acceptance Criteria:** Invalid transitions throw BadRequestException
  - **Effort:** 2 hours

#### Day 47-49: Approval Frontend

- [ ] **Task 7.6:** Create Approvals API Layer
  - **File:** `frontend/src/lib/api/approvals.ts`
  - **Content:**
    - Type definitions matching backend DTOs
    - `approvalsApi` object with all API functions
    - `ApprovalStatusColors`, `ApprovalStatusLabels`
    - `ApprovalTypeLabels`
  - **Pattern:** Follow `frontend/src/lib/api/projects.ts` structure
  - **Effort:** 1 hour

- [ ] **Task 7.7:** Create Approvals Hooks
  - **File:** `frontend/src/hooks/use-approvals.ts`
  - **Content:**
    ```typescript
    export const approvalKeys = {
      all: ['approvals'] as const,
      lists: () => [...approvalKeys.all, 'list'] as const,
      list: (params) => [...approvalKeys.lists(), params] as const,
      pending: () => [...approvalKeys.all, 'pending'] as const,
      details: () => [...approvalKeys.all, 'detail'] as const,
      detail: (id) => [...approvalKeys.details(), id] as const,
    };

    export function useApprovals(params?) {...}
    export function usePendingApprovals() {...}
    export function useApproval(id) {...}
    export function useSubmitApproval() {...}
    export function useApproveApproval() {...}
    export function useRejectApproval() {...}
    export function useRequestChanges() {...}
    ```
  - **Pattern:** Follow `frontend/src/hooks/use-projects.ts` structure
  - **Effort:** 1 hour

- [ ] **Task 7.8:** Create Approval List Page
  - **File:** `frontend/src/app/dashboard/approvals/page.tsx`
  - **Features:**
    - Tabs: All, Pending, Approved, Rejected, Changes Requested
    - Table columns: Project, Type, Title, Submitted By, Date, Status, Actions
    - Quick action buttons for NVKD users
    - Filter by project, type
    - Click row to open detail modal
  - **Components to create:**
    - `frontend/src/components/approval/approval-table.tsx`
    - `frontend/src/components/approval/approval-status-badge.tsx`
  - **Effort:** 4 hours

- [ ] **Task 7.9:** Create Approval Detail Modal
  - **File:** `frontend/src/components/approval/approval-detail-modal.tsx`
  - **Features:**
    - Show: project info, type, title, description
    - Attached files list with download links
    - Timeline of status changes (history)
    - Action buttons: Approve, Reject, Request Changes (for NVKD)
    - Comment textarea for rejection/changes
  - **Effort:** 3 hours

- [ ] **Task 7.10:** Create Submit Approval Modal
  - **File:** `frontend/src/components/approval/submit-approval-modal.tsx`
  - **Features:**
    - Type selector (Plan, Content, Budget, File)
    - Title and description inputs
    - File attachment (integrate with existing file uploader)
    - Optional deadline picker
    - Submit button
  - **Trigger:** Add to Project detail page
  - **Effort:** 2 hours

- [ ] **Task 7.11:** Integrate Approval Status in Project Detail
  - **File:** `frontend/src/app/dashboard/projects/[id]/page.tsx` (UPDATE)
  - **Features:**
    - Show current approval status badge if UNDER_REVIEW
    - Show last approval result with date
    - "Submit for Approval" button for Planners
    - Link to approvals list filtered by project
  - **Effort:** 2 hours

- [ ] **Task 7.12:** Update Sidebar Navigation
  - **File:** `frontend/src/components/layout/sidebar.tsx` (UPDATE)
  - **Add:** Approvals menu item with pending count badge
  - **Effort:** 30 minutes

---

### Week 8: Calendar Module

#### Day 50-52: Calendar Domain & Application Layer

- [ ] **Task 8.1:** Create Event DTOs
  - **File:** `backend/src/application/dto/event/event.dto.ts`
  - **Content:**
    - `EventType` enum: MEETING, DEADLINE, MILESTONE, REMINDER
    - `AttendeeStatus` enum: pending, accepted, declined
    - `CreateEventDto`: title, description, type, startTime, endTime, isAllDay, recurrence?, location?, meetingLink?, projectId?, attendeeIds[]
    - `UpdateEventDto`: Partial of CreateEventDto + updateScope (this/all for recurring)
    - `EventListQueryDto`: start, end, type?, projectId?
    - `EventResponseDto`: all fields + attendees with status
    - `RespondToEventDto`: status (accepted/declined)
  - **Acceptance Criteria:** RRULE format validated for recurrence
  - **Effort:** 2 hours

- [ ] **Task 8.2:** Create RRULE Service
  - **File:** `backend/src/modules/calendar/rrule.service.ts`
  - **Content:**
    ```typescript
    @Injectable()
    export class RRuleService {
      // Parse RRULE string and expand occurrences
      expandRecurrence(rrule: string, startTime: Date, rangeStart: Date, rangeEnd: Date): Date[] {...}

      // Generate RRULE from simple options
      generateRRule(frequency: 'daily' | 'weekly' | 'monthly', interval?: number, until?: Date): string {...}
    }
    ```
  - **Library:** Use `rrule` npm package
  - **Effort:** 2 hours

- [ ] **Task 8.3:** Create EventController
  - **File:** `backend/src/presentation/controllers/event.controller.ts`
  - **Endpoints:**
    ```
    POST   /api/events              - Create event
    GET    /api/events              - List events in date range
    GET    /api/events/deadlines    - Get task deadlines as events
    GET    /api/events/:id          - Get single event
    PATCH  /api/events/:id          - Update event
    DELETE /api/events/:id          - Delete event
    POST   /api/events/:id/respond  - Accept/decline invitation
    ```
  - **Key Logic:**
    - List endpoint expands recurring events within range
    - Deadlines endpoint generates events from Task.deadline
    - Attendee management with status tracking
  - **Effort:** 4 hours

- [ ] **Task 8.4:** Create CalendarModule
  - **File:** `backend/src/modules/calendar/calendar.module.ts`
  - **Content:**
    ```typescript
    @Module({
      imports: [PrismaModule],
      controllers: [EventController],
      providers: [RRuleService, DeadlineSyncService],
      exports: [RRuleService],
    })
    export class CalendarModule {}
    ```
  - **Update:** `backend/src/app.module.ts`
  - **Effort:** 30 minutes

#### Day 53-54: Calendar Infrastructure

- [ ] **Task 8.5:** Create Deadline Sync Service
  - **File:** `backend/src/modules/calendar/deadline-sync.service.ts`
  - **Purpose:** Auto-create/update DEADLINE events when tasks are created/updated
  - **Implementation:**
    - Option A: Event-driven (subscribe to task changes)
    - Option B: On-demand (generate in EventController.getDeadlines)
  - **Recommendation:** Use Option B (simpler, no event bus needed)
  - **Effort:** 2 hours

- [ ] **Task 8.6:** Add recurring event exception handling
  - **Location:** EventController update/delete methods
  - **Features:**
    - Delete single occurrence: Store exception date in metadata
    - Modify single occurrence: Create new event linked to parent
    - Update all: Update parent event
  - **Effort:** 2 hours

#### Day 55-56: Calendar Frontend

- [ ] **Task 8.7:** Create Events API Layer
  - **File:** `frontend/src/lib/api/events.ts`
  - **Content:**
    - Type definitions
    - `eventsApi` object
    - `EventTypeColors`, `EventTypeLabels`
  - **Effort:** 1 hour

- [ ] **Task 8.8:** Create Events Hooks
  - **File:** `frontend/src/hooks/use-events.ts`
  - **Content:**
    - Query key factory
    - `useEvents(start, end, filters)` - list with date range
    - `useDeadlines(start, end)` - task deadlines
    - `useEvent(id)`
    - Mutation hooks for CRUD
    - `useRespondToEvent()`
  - **Effort:** 1 hour

- [ ] **Task 8.9:** Create Calendar View Component
  - **File:** `frontend/src/components/calendar/calendar-view.tsx`
  - **Library:** `react-big-calendar` with `date-fns` localizer
  - **Features:**
    - Month view (default)
    - Week view toggle
    - Color-coded by event type
    - Click event to show detail modal
    - Click empty slot to create event
    - Navigation (prev/next month)
    - Vietnamese locale
  - **Configuration:**
    ```typescript
    import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
    import { format, parse, startOfWeek, getDay } from 'date-fns';
    import vi from 'date-fns/locale/vi';
    ```
  - **Effort:** 5 hours

- [ ] **Task 8.10:** Create Event Form Modal
  - **File:** `frontend/src/components/calendar/event-form-modal.tsx`
  - **Features:**
    - Title, description inputs
    - Type selector (Meeting, Deadline, Milestone, Reminder)
    - Date/time pickers for start and end
    - All-day toggle
    - Recurrence selector (None, Daily, Weekly, Monthly)
    - Attendees multi-select (from project team or all users)
    - Location / meeting link
    - Project selector (optional)
  - **Effort:** 4 hours

- [ ] **Task 8.11:** Create Event Detail Modal
  - **File:** `frontend/src/components/calendar/event-detail-modal.tsx`
  - **Features:**
    - Display all event info
    - Attendees list with status badges
    - Accept/Decline buttons for current user (if attendee)
    - Edit/Delete buttons for creator
    - Link to related project/task if applicable
  - **Effort:** 2 hours

- [ ] **Task 8.12:** Create Calendar Page
  - **File:** `frontend/src/app/dashboard/calendar/page.tsx`
  - **Layout:**
    - Full-page calendar view (main content)
    - Right sidebar: Upcoming events list (next 7 days)
    - Top: Filter by type, project
    - Create event button (floating or header)
  - **Effort:** 2 hours

- [ ] **Task 8.13:** Update Sidebar Navigation
  - **File:** `frontend/src/components/layout/sidebar.tsx` (UPDATE)
  - **Add:** Calendar menu item with today's event count badge
  - **Effort:** 30 minutes

---

### Week 9: Notifications & Comments

#### Day 57-59: Telegram Bot Integration

- [ ] **Task 9.1:** Create Telegram Service
  - **File:** `backend/src/infrastructure/external-services/telegram/telegram.service.ts`
  - **Content:**
    ```typescript
    @Injectable()
    export class TelegramService {
      private bot: TelegramBot;

      constructor(private configService: ConfigService) {
        this.bot = new TelegramBot(configService.get('TELEGRAM_BOT_TOKEN'));
      }

      async sendMessage(chatId: string, message: string, options?: {...}): Promise<void> {...}

      formatApprovalMessage(approval: Approval): string {...}
      formatTaskAssignedMessage(task: Task): string {...}
      formatDeadlineReminderMessage(task: Task): string {...}
      formatMeetingReminderMessage(event: Event): string {...}
    }
    ```
  - **Install:** `npm install node-telegram-bot-api`
  - **Effort:** 2 hours

- [ ] **Task 9.2:** Create Telegram Module
  - **File:** `backend/src/infrastructure/external-services/telegram/telegram.module.ts`
  - **Content:**
    ```typescript
    @Module({
      providers: [TelegramService],
      exports: [TelegramService],
    })
    export class TelegramModule {}
    ```
  - **Update:** Add to app.module.ts imports
  - **Effort:** 30 minutes

- [ ] **Task 9.3:** Create User Telegram Linking
  - **Endpoints in UsersController or SettingsController:**
    ```
    POST /api/users/telegram/generate-code  - Generate 6-digit link code
    POST /api/users/telegram/link           - Link with code
    DELETE /api/users/telegram/unlink       - Unlink Telegram
    ```
  - **Telegram Bot Commands:**
    - `/start` - Welcome message with instructions
    - `/link <code>` - Link account with code
  - **Database:** Add `telegramChatId` field to User model or store in `notificationPrefs` JSON
  - **Effort:** 3 hours

- [ ] **Task 9.4:** Create Notification Templates
  - **File:** `backend/src/modules/notification/notification-templates.ts`
  - **Templates:**
    ```typescript
    export const NotificationTemplates = {
      TASK_ASSIGNED: (task, project) => ({
        title: `New task assigned: ${task.title}`,
        content: `You've been assigned to "${task.title}" in ${project.name}`,
        telegramText: `*New Task*\n${task.title}\nProject: ${project.name}\nDeadline: ${task.deadline || 'None'}`,
      }),
      APPROVAL_PENDING: (...) => {...},
      APPROVAL_RESULT: (...) => {...},
      MEETING_REMINDER: (...) => {...},
      DEADLINE_REMINDER: (...) => {...},
      COMMENT_MENTION: (...) => {...},
    };
    ```
  - **Effort:** 2 hours

#### Day 60-61: In-App Notifications

- [ ] **Task 9.5:** Create Notification DTOs
  - **File:** `backend/src/application/dto/notification/notification.dto.ts`
  - **Content:**
    - `NotificationType` enum
    - `NotificationResponseDto`
    - `NotificationListQueryDto`: unreadOnly?, page, limit
    - `NotificationPreferencesDto`
  - **Effort:** 1 hour

- [ ] **Task 9.6:** Create NotificationController
  - **File:** `backend/src/presentation/controllers/notification.controller.ts`
  - **Endpoints:**
    ```
    GET   /api/notifications              - List for current user
    GET   /api/notifications/unread-count - Badge count
    PATCH /api/notifications/:id/read     - Mark as read
    PATCH /api/notifications/read-all     - Mark all as read
    GET   /api/notifications/preferences  - Get user preferences
    PATCH /api/notifications/preferences  - Update preferences
    ```
  - **Effort:** 2 hours

- [ ] **Task 9.7:** Create NotificationService
  - **File:** `backend/src/modules/notification/notification.service.ts`
  - **Content:**
    ```typescript
    @Injectable()
    export class NotificationService {
      constructor(
        private prisma: PrismaService,
        private telegramService: TelegramService,
      ) {}

      async create(userId: string, type: string, data: {...}): Promise<Notification> {...}

      async sendViaPreferredChannels(userId: string, notification: Notification): Promise<void> {...}

      // Cleanup old notifications (30 days)
      @Cron('0 0 * * *') // Daily at midnight
      async cleanupOldNotifications() {...}
    }
    ```
  - **Effort:** 3 hours

- [ ] **Task 9.8:** Update NotificationModule
  - **File:** `backend/src/modules/notification/notification.module.ts` (UPDATE existing stub)
  - **Content:**
    ```typescript
    @Module({
      imports: [PrismaModule, TelegramModule],
      controllers: [NotificationController],
      providers: [NotificationService],
      exports: [NotificationService],
    })
    export class NotificationModule {}
    ```
  - **Effort:** 30 minutes

- [ ] **Task 9.9:** Create Notification UI Components
  - **Files:**
    - `frontend/src/lib/api/notifications.ts`
    - `frontend/src/hooks/use-notifications.ts`
    - `frontend/src/components/notification/notification-bell.tsx`
    - `frontend/src/components/notification/notification-dropdown.tsx`
    - `frontend/src/components/notification/notification-preferences.tsx`
  - **Features:**
    - Bell icon in navbar with unread count badge
    - Dropdown with recent notifications (last 10)
    - Click notification to navigate + mark as read
    - "Mark all as read" button
    - "View all" link to full notifications page
    - Preferences toggle for each notification type + Telegram
  - **Effort:** 4 hours

- [ ] **Task 9.10:** Update Navbar with Notification Bell
  - **File:** `frontend/src/components/layout/navbar.tsx` (UPDATE)
  - **Add:** NotificationBell component next to user avatar
  - **Effort:** 30 minutes

#### Day 62-63: Comments System

- [ ] **Task 9.11:** Create Comment DTOs
  - **File:** `backend/src/application/dto/comment/comment.dto.ts`
  - **Content:**
    - `CreateCommentDto`: content, projectId?, taskId?, parentId?
    - `UpdateCommentDto`: content
    - `CommentListQueryDto`: projectId?, taskId?
    - `CommentResponseDto`: id, content, author, createdAt, replies[]
  - **Effort:** 1 hour

- [ ] **Task 9.12:** Create CommentController
  - **File:** `backend/src/presentation/controllers/comment.controller.ts`
  - **Endpoints:**
    ```
    POST   /api/comments           - Create comment
    GET    /api/comments           - List for project/task
    PATCH  /api/comments/:id       - Edit own comment
    DELETE /api/comments/:id       - Delete own comment (soft)
    ```
  - **Features:**
    - Parse @mentions in content
    - Trigger notifications for mentioned users
    - Only author can edit/delete
    - Threaded replies via parentId
  - **Effort:** 3 hours

- [ ] **Task 9.13:** Create Mention Parser
  - **File:** `backend/src/modules/notification/mention-parser.ts`
  - **Content:**
    ```typescript
    export function parseMentions(content: string): string[] {
      const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
      const matches = content.matchAll(mentionRegex);
      return [...matches].map(m => m[1]);
    }
    ```
  - **Effort:** 30 minutes

- [ ] **Task 9.14:** Create Comment UI Components
  - **Files:**
    - `frontend/src/lib/api/comments.ts`
    - `frontend/src/hooks/use-comments.ts`
    - `frontend/src/components/comment/comment-list.tsx`
    - `frontend/src/components/comment/comment-item.tsx`
    - `frontend/src/components/comment/comment-input.tsx`
    - `frontend/src/components/comment/mention-picker.tsx`
  - **Features:**
    - Threaded display (up to 3 levels)
    - Reply button opens nested input
    - @mention autocomplete with team members
    - Edit/Delete buttons for own comments
    - Relative time display (e.g., "2 hours ago")
  - **Effort:** 5 hours

- [ ] **Task 9.15:** Integrate Comments in Project/Task Detail
  - **Files to update:**
    - `frontend/src/app/dashboard/projects/[id]/page.tsx`
    - Task detail modal (if exists) or create one
  - **Features:**
    - Comments section at bottom of detail page
    - Load comments on demand
    - Add comment form
  - **Effort:** 2 hours

---

## Todo Checklist

### Week 7
- [x] Approval DTOs and enums
- [x] Approval controller with all endpoints
- [x] Approval module wired up
- [x] Escalation cron service
- [x] Frontend API and hooks
- [x] Approval list page with tabs
- [x] Approval detail modal
- [x] Submit approval modal
- [x] Project detail integration
- [x] Sidebar navigation update

### Week 8
- [x] Event DTOs
- [x] RRULE service
- [x] Event controller with recurring support
- [x] Calendar module
- [x] Deadline sync service (on-demand implementation)
- [x] Frontend API and hooks
- [x] Calendar view component (react-big-calendar)
- [x] Event form modal
- [x] Event detail modal
- [x] Calendar page
- [x] Sidebar navigation update

### Week 9
- [ ] Telegram service (DEFERRED - stub implementation)
- [ ] Telegram module (DEFERRED - stub implementation)
- [ ] User Telegram linking (DEFERRED)
- [x] Notification templates (partial - in-app only)
- [x] Notification DTOs and controller
- [x] Notification service with cleanup cron
- [x] Notification UI (bell, dropdown, preferences)
- [x] Navbar integration
- [x] Comment DTOs and controller
- [x] Mention parser
- [x] Comment UI components
- [x] Project/Task detail integration

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Approval workflow | End-to-end test | Works correctly |
| Escalation | 24h pending | Reminder sent |
| Calendar load | 50 events/month | < 2s |
| Recurring events | Expand daily for 1 year | < 500ms |
| Telegram delivery | Message sent | < 5s |
| Notification display | Unread count | Real-time (polling) |
| Comment threading | 3 levels deep | Displays correctly |
| @mention autocomplete | Team members | < 200ms response |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Telegram API rate limits | Medium | Medium | Queue messages, batch, respect 30 msgs/sec |
| Recurring event complexity | Medium | Medium | Limit to daily/weekly/monthly, use rrule lib |
| Escalation timing issues | Low | High | Comprehensive logging, unit tests |
| Notification spam | Medium | Medium | User preferences, daily digest option |
| Timezone bugs | Medium | High | UTC in DB, frontend converts to UTC+7 |
| Comment @mention XSS | Low | High | Sanitize input, escape output |

---

## Security Considerations

- Telegram bot token in environment variables only
- Users can only see their own notifications
- Comments visible only to project team members
- Approval actions logged in AuditLog
- @mentions only suggest team members (not all users)
- Validate RRULE to prevent DoS (limit expansion range)
- Rate limit notification endpoints

---

## Definition of Done

- [ ] All tasks have acceptance criteria met
- [ ] Approval workflow tested with all paths (submit, approve, reject, request changes, resubmit)
- [ ] Escalation tested with mocked time
- [ ] Calendar displays correctly across timezones (UTC+7 default)
- [ ] Recurring events expand correctly for month view
- [ ] Telegram integration tested with real device
- [ ] Notification preferences saved and respected
- [ ] Comments display with proper threading
- [ ] @mentions trigger notifications
- [ ] No memory leaks from cron jobs
- [ ] All new endpoints have Swagger documentation

---

## Dependencies

- **Phase 2:** Project and Task modules for linking (COMPLETE)
- **External:** Telegram Bot API (BotFather registration needed)
- **Libraries:** node-telegram-bot-api, rrule, react-big-calendar

---

## Notes

- Approval deadline is soft - escalation is the enforcement mechanism
- Calendar timezone should be Vietnam (UTC+7) by default
- Telegram messages should be concise - link to PMS for details
- Consider WebSocket for real-time notification updates in v2
- Comment @mentions use username format: @nguyen.van.a
- For recurring events, store exception dates in event metadata JSON field
- Daily notification digest can be added in future iteration
