# Phase 3 Analysis Report
**Date:** 2026-01-23
**Phase:** Workflow & Calendar (Week 7-9)
**Status:** Pre-implementation Analysis

---

## 1. Codebase Pattern Analysis

### 1.1 Backend Architecture (NestJS + Prisma)

**Module Structure Pattern:**
```
backend/src/modules/{feature}/
  - {feature}.module.ts     # NestJS module with DI wiring
```

**Controller Pattern:**
```
backend/src/presentation/controllers/{feature}.controller.ts
```

**DTO Pattern:**
```
backend/src/application/dto/{feature}/{feature}.dto.ts
```

**Key Observations:**
- Controllers use `PrismaService` directly (no repository layer)
- Guards: `JwtAuthGuard`, `RolesGuard` with `@Roles()` decorator
- DTOs use class-validator decorators (`@IsString`, `@IsEnum`, etc.)
- Response mapping done via `mapToResponse()` private method in controllers
- Access control via `checkProjectAccess()` helper method pattern

**Controller Boilerplate (from project.controller.ts):**
```typescript
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, user: {...}, requireEdit = false) {...}
  private mapToResponse(entity: {...}): ResponseDto {...}
}
```

### 1.2 Frontend Architecture (Next.js 14 + TanStack Query)

**API Layer Pattern:**
```
frontend/src/lib/api/{feature}.ts
  - Type definitions (interfaces, enums)
  - API functions object: {feature}Api = { list, getById, create, update, delete }
  - UI helpers (Colors, Labels records)
```

**Hooks Pattern:**
```
frontend/src/hooks/use-{feature}.ts
  - Query keys factory: {feature}Keys = { all, lists, list, details, detail }
  - Query hooks: use{Feature}s(), use{Feature}()
  - Mutation hooks: useCreate{Feature}(), useUpdate{Feature}(), useDelete{Feature}()
  - Uses TanStack Query v5 patterns
```

**Component Pattern:**
```
frontend/src/components/{feature}/
  - {feature}-form.tsx       # Form component using react-hook-form + zod
  - {feature}-table.tsx      # Data table component
  - {feature}-card.tsx       # Card component for list views
```

**Page Pattern:**
```
frontend/src/app/dashboard/{feature}/
  - page.tsx                 # List page
  - [id]/page.tsx            # Detail page
  - new/page.tsx             # Create page (optional)
```

### 1.3 Prisma Schema (Phase 3 Entities Already Defined)

**Approval Entity - READY:**
```prisma
model Approval {
  id, projectId, type, status, title, description
  submittedById, approvedById, comment, deadline
  escalatedAt, escalationLevel, submittedAt, respondedAt
  // Relations: project, submittedBy, approvedBy, files, history
}

model ApprovalHistory {
  id, approvalId, fromStatus, toStatus, comment, changedById, changedAt
}
```

**Event Entity - READY:**
```prisma
model Event {
  id, title, description, type, startTime, endTime, isAllDay
  recurrence (RRULE format), location, meetingLink
  projectId, taskId, createdById, reminderBefore
}

model EventAttendee {
  id, eventId, userId, email, name, status
}
```

**Notification Entity - READY:**
```prisma
model Notification {
  id, userId, type, title, content, link
  isRead, readAt, telegramSent
}
```

**Comment Entity - READY:**
```prisma
model Comment {
  id, projectId, taskId, content, parentId, authorId
  // Self-relation for threaded replies
}
```

---

## 2. Dependencies & Pre-existing Assets

### 2.1 Backend Dependencies
- `@nestjs/schedule` - Already imported in app.module.ts (for cron jobs)
- Redis - Need to check if BullMQ/Redis is configured for queues
- Prisma Client - Ready with all Phase 3 models

### 2.2 Frontend Dependencies
- `react-hook-form` + `zod` - Already in use
- `@tanstack/react-query` - Already in use
- `date-fns` with Vietnamese locale - Already in use
- shadcn/ui components - Extensive library available

### 2.3 Missing Dependencies (To Install)
**Backend:**
- `node-telegram-bot-api` - For Telegram bot integration
- `rrule` - For recurring event parsing
- `bullmq` / `@nestjs/bullmq` - For notification queue (if not Redis directly)

**Frontend:**
- `react-big-calendar` or `@fullcalendar/react` - For calendar UI
- `@dnd-kit/core` + `@dnd-kit/sortable` - For drag-drop if needed

### 2.4 Stub Module Exists
`backend/src/modules/notification/notification.module.ts` - Empty stub ready for implementation

---

## 3. Implementation Gap Analysis

### 3.1 Week 7: Approval Workflow

**Required Files:**
| Category | File Path | Status |
|----------|-----------|--------|
| Controller | `backend/src/presentation/controllers/approval.controller.ts` | CREATE |
| DTO | `backend/src/application/dto/approval/approval.dto.ts` | CREATE |
| Module | `backend/src/modules/approval/approval.module.ts` | CREATE |
| Cron Service | `backend/src/modules/approval/approval-escalation.service.ts` | CREATE |
| API | `frontend/src/lib/api/approvals.ts` | CREATE |
| Hooks | `frontend/src/hooks/use-approvals.ts` | CREATE |
| Pages | `frontend/src/app/dashboard/approvals/page.tsx` | CREATE |
| Components | `frontend/src/components/approval/approval-*.tsx` | CREATE |

**Integration Points:**
- Update ProjectController to show approval status
- Trigger notifications when approval created/updated

### 3.2 Week 8: Calendar Module

**Required Files:**
| Category | File Path | Status |
|----------|-----------|--------|
| Controller | `backend/src/presentation/controllers/event.controller.ts` | CREATE |
| DTO | `backend/src/application/dto/event/event.dto.ts` | CREATE |
| Module | `backend/src/modules/calendar/calendar.module.ts` | CREATE |
| RRULE Service | `backend/src/modules/calendar/rrule.service.ts` | CREATE |
| Deadline Sync | `backend/src/modules/calendar/deadline-sync.service.ts` | CREATE |
| API | `frontend/src/lib/api/events.ts` | CREATE |
| Hooks | `frontend/src/hooks/use-events.ts` | CREATE |
| Pages | `frontend/src/app/dashboard/calendar/page.tsx` | CREATE |
| Components | `frontend/src/components/calendar/calendar-*.tsx` | CREATE |

**Integration Points:**
- Listen to Task deadline changes for auto-sync
- Link events to projects for project-specific calendar view

### 3.3 Week 9: Notifications & Comments

**Required Files:**
| Category | File Path | Status |
|----------|-----------|--------|
| Telegram Service | `backend/src/infrastructure/external-services/telegram/telegram.service.ts` | CREATE |
| Telegram Module | `backend/src/infrastructure/external-services/telegram/telegram.module.ts` | CREATE |
| Notification Controller | `backend/src/presentation/controllers/notification.controller.ts` | CREATE |
| Notification Service | `backend/src/modules/notification/notification.service.ts` | CREATE |
| Comment Controller | `backend/src/presentation/controllers/comment.controller.ts` | CREATE |
| Comment DTO | `backend/src/application/dto/comment/comment.dto.ts` | CREATE |
| API | `frontend/src/lib/api/notifications.ts`, `comments.ts` | CREATE |
| Hooks | `frontend/src/hooks/use-notifications.ts`, `use-comments.ts` | CREATE |
| Components | `frontend/src/components/notification/notification-*.tsx` | CREATE |
| Components | `frontend/src/components/comment/comment-*.tsx` | CREATE |

---

## 4. Risk Assessment

### 4.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Telegram API rate limits | Medium | Medium | Implement queue with rate limiting |
| RRULE complexity | Medium | Medium | Use proven `rrule` library, limit recurrence options |
| Real-time notifications | Low | Medium | Start with polling, add WebSocket later |
| Timezone handling | Medium | High | Use UTC in DB, convert on frontend |
| Cron job reliability | Low | High | Add logging, health checks, error handling |

### 4.2 Integration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Project stage update conflicts | Low | Medium | Transaction-based updates |
| Notification spam | Medium | Medium | User preferences, rate limiting |
| Comment @mention parsing | Low | Low | Use regex with proper escaping |

---

## 5. Recommended Implementation Order

### Week 7: Approval Workflow
1. DTOs and enums (foundation)
2. ApprovalController with CRUD
3. Escalation cron service
4. Frontend API + hooks
5. Approval list page
6. Submit/detail modals
7. Integration with Project detail

### Week 8: Calendar Module
1. Install `rrule` dependency
2. RRULE service
3. EventController with CRUD
4. Deadline sync service
5. Install `react-big-calendar`
6. Frontend API + hooks
7. Calendar page + components

### Week 9: Notifications & Comments
1. Telegram service + user linking
2. Notification queue
3. Notification UI (bell icon + dropdown)
4. Comment controller
5. Comment components with @mentions
6. Notification preferences

---

## 6. File Path Summary for Implementation

```
backend/
  src/
    modules/
      approval/
        approval.module.ts
        approval-escalation.service.ts
      calendar/
        calendar.module.ts
        rrule.service.ts
        deadline-sync.service.ts
      notification/
        notification.module.ts (UPDATE existing stub)
        notification.service.ts
    presentation/
      controllers/
        approval.controller.ts
        event.controller.ts
        notification.controller.ts
        comment.controller.ts
    application/
      dto/
        approval/
          approval.dto.ts
        event/
          event.dto.ts
        notification/
          notification.dto.ts
        comment/
          comment.dto.ts
    infrastructure/
      external-services/
        telegram/
          telegram.module.ts
          telegram.service.ts

frontend/
  src/
    lib/
      api/
        approvals.ts
        events.ts
        notifications.ts
        comments.ts
    hooks/
      use-approvals.ts
      use-events.ts
      use-notifications.ts
      use-comments.ts
    app/
      dashboard/
        approvals/
          page.tsx
        calendar/
          page.tsx
    components/
      approval/
        approval-table.tsx
        approval-form.tsx
        approval-detail-modal.tsx
        submit-approval-modal.tsx
      calendar/
        calendar-view.tsx
        event-form.tsx
        event-detail-modal.tsx
      notification/
        notification-bell.tsx
        notification-dropdown.tsx
        notification-preferences.tsx
      comment/
        comment-list.tsx
        comment-input.tsx
        mention-picker.tsx
```

---

## 7. Unresolved Questions

1. **Redis Configuration:** Is BullMQ already configured or should we use simple Redis pub/sub?
2. **Telegram Bot Token:** Where should the token be stored? `.env` file structure?
3. **Calendar Library:** Prefer `react-big-calendar` (simpler) or `@fullcalendar/react` (more features)?
4. **Notification Batching:** Should we batch multiple notifications into digest emails/messages?
5. **Comment Edit History:** Should we track edit history for comments or just `updatedAt`?
