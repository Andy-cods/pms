# Approval Workflow & Escalation Module

## Overview

The Approval module manages approval workflows for project deliverables with a **4-status workflow** (PENDING → APPROVED/REJECTED/CHANGES_REQUESTED) and **automated escalation** system (24h → 48h → 72h). It supports 5 approval types and maintains complete approval history for audit trails.

## Architecture

This module implements a **state machine-based approval workflow** with automated escalation via NestJS Scheduler (`@Cron`). It integrates with the project lifecycle to ensure deliverables are reviewed before projects progress to later stages.

**Key Design:** Approvals are immutable once responded to (APPROVED/REJECTED), but can be resubmitted if CHANGES_REQUESTED.

## Key Components

### Controllers

**`ApprovalController`** (`presentation/controllers/approval.controller.ts`)
- CRUD operations for approvals
- Approval actions (approve, reject, request changes)
- Pending approvals for approvers
- Dashboard statistics

### Services

**`ApprovalEscalationService`** (`modules/approval/approval-escalation.service.ts`)
- Automated escalation cron job (runs hourly)
- Escalation level logic (Level 1 at 24h, Level 2 at 48h, Level 3 at 72h)
- Notification dispatch for escalated approvals
- Manual escalation trigger for testing

## API Endpoints

### GET `/approvals`
**Description:** List approvals with filters and pagination
**Query Parameters:**
- `projectId`: Filter by project
- `status`: Filter by status (PENDING, APPROVED, REJECTED, CHANGES_REQUESTED)
- `type`: Filter by approval type
- `search`: Text search in title/description
- `page`, `limit`: Pagination
- `sortBy`, `sortOrder`: Sorting (default: submittedAt desc)

**Access Control:**
- **Admin:** See all approvals
- **Non-Admin:** See approvals for projects they are team members of

### GET `/approvals/pending`
**Description:** Get pending approvals for current approver
**Roles:** NVKD, ADMIN, SUPER_ADMIN
**Returns:** All approvals with `status: PENDING`, sorted by oldest first

### GET `/approvals/stats`
**Description:** Get approval statistics for dashboard
**Returns:**
```json
{
  "total": 150,
  "pending": 12,
  "approved": 120,
  "rejected": 8,
  "changesRequested": 10
}
```

### GET `/approvals/:id`
**Description:** Get single approval with full history
**Returns:** Approval with `history[]` array and `files[]` attachments

### POST `/approvals`
**Description:** Submit item for approval
**Request Body:**
```json
{
  "projectId": "uuid",
  "type": "CONTENT",
  "title": "Q1 Campaign Creative Assets",
  "description": "Social media creatives for review",
  "deadline": "2026-02-15T17:00:00Z",
  "fileIds": ["file-uuid-1", "file-uuid-2"]
}
```
**Auto-Actions:**
- Creates approval with `status: PENDING`
- Updates project lifecycle to `EVALUATION` (if not already)
- Records initial history entry

### PATCH `/approvals/:id`
**Description:** Resubmit approval after changes requested
**Restriction:** Only submitter can update, only if `status: CHANGES_REQUESTED`
**Request Body:**
```json
{
  "title": "Updated Creative Assets",
  "description": "Incorporated feedback",
  "deadline": "2026-02-20T17:00:00Z",
  "fileIds": ["file-uuid-3"]
}
```
**Auto-Actions:**
- Resets status to `PENDING`
- Records history entry

### PATCH `/approvals/:id/approve`
**Description:** Approve an approval request
**Roles:** NVKD, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "comment": "Creative assets look great, approved for launch"
}
```
**Auto-Actions:**
- Sets `status: APPROVED`, `respondedAt: now()`
- Updates project lifecycle based on current stage:
  - From `EVALUATION` → `NEGOTIATION`
  - From other stages → `ONGOING`
- Records history entry

### PATCH `/approvals/:id/reject`
**Description:** Reject an approval request
**Roles:** NVKD, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "comment": "Brand guidelines not followed, please revise"
}
```
**Auto-Actions:**
- Sets `status: REJECTED`, `respondedAt: now()`
- Reverts project lifecycle to `PLANNING`
- Records history entry

### PATCH `/approvals/:id/request-changes`
**Description:** Request changes on an approval
**Roles:** NVKD, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "comment": "Please update color scheme to match new brand palette"
}
```
**Auto-Actions:**
- Sets `status: CHANGES_REQUESTED`, `respondedAt: now()`
- Submitter can now resubmit via `PATCH /approvals/:id`
- Records history entry

## Business Rules & Domain Logic

### Approval Workflow State Machine

```
[SUBMIT] → PENDING → APPROVED (terminal)
              ↓
              ↓ → REJECTED (terminal)
              ↓
              ↓ → CHANGES_REQUESTED → [RESUBMIT] → PENDING
```

**Status Transitions:**
- **PENDING:** Can transition to APPROVED, REJECTED, or CHANGES_REQUESTED
- **APPROVED:** Terminal state (cannot change)
- **REJECTED:** Terminal state (cannot change)
- **CHANGES_REQUESTED:** Can resubmit, which resets to PENDING

### Approval Types (5 Types)

1. **PLAN** - Project plan approval
2. **CONTENT** - Content/creative deliverable approval
3. **BUDGET** - Budget allocation approval
4. **FILE** - General file approval
5. **MEDIA_PLAN** - Media plan strategy approval

### Escalation System

The approval escalation system automatically escalates pending approvals based on time elapsed since submission:

**Escalation Levels:**
- **Level 0 (Default):** 0-23 hours (no escalation)
- **Level 1 (Reminder):** 24-47 hours - Remind approvers (NVKD roles)
- **Level 2 (PM Escalation):** 48-71 hours - Notify project PM(s)
- **Level 3 (Admin Escalation):** 72+ hours - Notify ADMIN/SUPER_ADMIN

**Cron Job:**
```typescript
@Cron(CronExpression.EVERY_HOUR)
async checkPendingApprovals(): Promise<void> {
  // Runs every hour
  // Checks all PENDING approvals
  // Calculates hours elapsed since submittedAt
  // Updates escalationLevel and escalatedAt
  // Records escalation in history
  // Sends notifications
}
```

**Manual Trigger:**
- Endpoint: Internal service method `triggerEscalationCheck()`
- Returns: `{ checked: number, escalated: number }`

### Approval History Tracking

Every status change is recorded in the `ApprovalHistory` table:
```typescript
{
  id: string;
  approvalId: string;
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  comment: string | null;
  changedById: string;
  changedAt: Date;
}
```

**History Events:**
- Initial submission (PENDING → PENDING)
- Approval (PENDING → APPROVED)
- Rejection (PENDING → REJECTED)
- Changes requested (PENDING → CHANGES_REQUESTED)
- Resubmission (CHANGES_REQUESTED → PENDING)
- Auto-escalation (PENDING → PENDING with escalation note)

### Access Control

**Who Can Submit:**
- Any team member on the project

**Who Can Approve:**
- **NVKD** (Sales representatives)
- **ADMIN**
- **SUPER_ADMIN**

**Who Can Resubmit:**
- Only the original submitter, only if `status: CHANGES_REQUESTED`

**Visibility:**
- **Admin:** See all approvals
- **Non-Admin:** See approvals for their assigned projects only

## Project Lifecycle Integration

Approvals integrate with the project lifecycle:

**On Submit:**
- Project stage set to `EVALUATION` (if not already in review stage)

**On Approve:**
- Project progresses based on current stage:
  - `EVALUATION` → `NEGOTIATION`
  - Other stages → `ONGOING`

**On Reject:**
- Project reverts to `PLANNING` stage

This ensures projects cannot progress without proper approval of deliverables.

## File Attachments

Approvals support file attachments via the `File` entity:
- Files uploaded separately via file upload endpoint
- File IDs linked to approval via `fileIds[]` in request
- Files included in approval response for reviewer download

## Dependencies

### Internal Dependencies
- `PrismaService` - Database access
- `@nestjs/schedule` - Cron job for escalation

### External Dependencies
- Prisma Client - ORM
- NestJS Schedule - Automated escalation

## Related ADRs

- **ADR-0001: Clean Architecture Pattern** - Approval workflow as application service
- **ADR-0004: JWT Authentication Strategy** - Role-based approval authorization
- **ADR-0005: Unified Project Entity** - Integration with project lifecycle

## Escalation Configuration

Escalation thresholds are defined in `shared/constants/business-rules.js`:
```typescript
export const ESCALATION_HOURS = {
  LEVEL_1: 24,  // Reminder to approvers
  LEVEL_2: 48,  // Escalate to PM
  LEVEL_3: 72,  // Escalate to Admin
};
```

## Notification Integration

The escalation service logs notifications (currently to console, to be integrated with notification service):

**Level 1 (24h):**
```
[NOTIFICATION] Level 1 escalation: "Creative Assets Review" in Project XYZ
has been pending for 24+ hours. Submitted by John Doe.
```

**Level 2 (48h):**
```
[NOTIFICATION] Level 2 escalation to PM(s): "Creative Assets Review" in Project XYZ
has been pending for 48+ hours. PMs: Jane Smith, Bob Johnson
```

**Level 3 (72h):**
```
[NOTIFICATION] Level 3 escalation to ADMIN: "Creative Assets Review" in Project XYZ
has been pending for 72+ hours! Immediate attention required.
```

Future integration with `NotificationService` and `TelegramService` planned.

## Data Model Highlights

### Approval Entity Fields

**Core Fields:**
- `id`, `projectId`, `type`, `status`
- `title`, `description`, `comment`

**Timing:**
- `submittedAt`: When approval was first submitted
- `respondedAt`: When approver took action (approve/reject/request changes)
- `deadline`: Optional deadline for review

**Escalation:**
- `escalationLevel`: 0-3 (see Escalation System)
- `escalatedAt`: When last escalation occurred

**Relationships:**
- `project`: Project relation
- `submittedBy`: User who submitted
- `approvedBy`: User who responded (null if pending)
- `files[]`: Attached files
- `history[]`: ApprovalHistory entries

## Best Practices

1. **Set Realistic Deadlines:** Give approvers sufficient time to review
2. **Attach Relevant Files:** Include all materials needed for decision
3. **Descriptive Titles:** Use clear, specific approval titles
4. **Timely Responses:** Approvers should respond within 24 hours to avoid escalation
5. **Actionable Feedback:** When requesting changes, provide specific, actionable comments
