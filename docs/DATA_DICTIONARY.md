# BC Agency PMS - Data Dictionary

**Document ID:** PMS-DD-001
**Version:** 1.0
**Last Updated:** 2026-01-30
**Database:** PostgreSQL
**ORM:** Prisma

---

## Table of Contents

1. [Overview](#overview)
2. [Core Models](#core-models)
   - [User](#user)
   - [Session](#session)
   - [Client](#client)
3. [Project Models](#project-models)
   - [Project](#project)
   - [ProjectTeam](#projectteam)
   - [ProjectPhase](#projectphase)
   - [ProjectPhaseItem](#projectphaseitem)
   - [BudgetEvent](#budgetevent)
   - [ProjectKPI](#projectkpi)
   - [ProjectLog](#projectlog)
   - [StageHistory](#stagehistory)
4. [Task Models](#task-models)
   - [Task](#task)
   - [TaskAssignee](#taskassignee)
   - [TaskDependency](#taskdependency)
5. [Approval & File Models](#approval--file-models)
   - [Approval](#approval)
   - [ApprovalHistory](#approvalhistory)
   - [File](#file)
6. [Event & Notification Models](#event--notification-models)
   - [Event](#event)
   - [EventAttendee](#eventattendee)
   - [Notification](#notification)
   - [Comment](#comment)
7. [Media & Ads Models](#media--ads-models)
   - [MediaPlan](#mediaplan)
   - [MediaPlanItem](#mediaplanitem)
   - [AdsReport](#adsreport)
8. [Strategic Brief Models](#strategic-brief-models)
   - [StrategicBrief](#strategicbrief)
   - [BriefSection](#briefsection)
9. [System Models](#system-models)
   - [AuditLog](#auditlog)
   - [SystemSetting](#systemsetting)
10. [Relationships](#relationships)
11. [Enumerations](#enumerations)

---

## Overview

This data dictionary documents all database models, fields, constraints, and relationships in the BC Agency PMS (Project Management System). The system uses PostgreSQL as the database and Prisma as the ORM layer.

The data model is organized around a unified Project entity that encompasses the entire lifecycle from sales pipeline through project execution to completion.

---

## Core Models

### User

User accounts with role-based access control.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| email | String | UNIQUE, indexed | User email address for authentication |
| password | String | required | Hashed password |
| name | String | required | Full name of the user |
| avatar | String | optional | URL or path to user avatar image |
| role | UserRole | required, indexed | User role (enum) |
| isActive | Boolean | default(true) | Account active status |
| lastLoginAt | DateTime | optional | Last successful login timestamp |
| createdAt | DateTime | default(now()) | Account creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |
| notificationPrefs | Json | optional | User notification preferences |

**Indexes:** email, role

**Relations:**
- approvalApproved → Approval[] (as approver)
- approvalSubmitted → Approval[] (as submitter)
- auditLogs → AuditLog[]
- comments → Comment[]
- eventsCreated → Event[]
- filesUploaded → File[]
- notifications → Notification[]
- projectTeams → ProjectTeam[]
- tasksAssigned → TaskAssignee[]
- tasksCreated → Task[] (as creator)
- tasksReviewing → Task[] (as reviewer)
- eventAttendees → EventAttendee[]
- mediaPlansCreated → MediaPlan[]
- budgetEvents → BudgetEvent[]
- adsReportsCreated → AdsReport[]
- projectsAsNVKD → Project[]
- projectsAsPM → Project[]
- projectsAsPlanner → Project[]

---

### Session

User session management for authentication.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| userId | String | required, indexed | Reference to User |
| token | String | UNIQUE, indexed | Session authentication token |
| expiresAt | DateTime | required | Session expiration timestamp |
| createdAt | DateTime | default(now()) | Session creation timestamp |
| userAgent | String | optional | Browser user agent string |
| ipAddress | String | optional | Client IP address |

**Indexes:** token, userId

---

### Client

Customer/client organizations.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| companyName | String | required | Client company name |
| contactName | String | optional | Primary contact person name |
| contactEmail | String | optional | Primary contact email |
| contactPhone | String | optional | Primary contact phone number |
| accessCode | String | UNIQUE, indexed | Unique client access code |
| isActive | Boolean | default(true) | Client active status |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** accessCode

**Relations:**
- projects → Project[]

---

## Project Models

### Project

Unified project entity merging sales pipeline, project execution, and budget management.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| dealCode | String | UNIQUE, indexed | Unique deal identifier (sales stage) |
| projectCode | String | UNIQUE, indexed, optional | Unique project code (post-won) |
| name | String | required | Project/deal name |
| description | String | optional | Project description |
| lifecycle | ProjectLifecycle | default(LEAD), indexed | Current lifecycle stage (enum) |
| healthStatus | HealthStatus | default(STABLE), indexed | Project health indicator (enum) |
| stageProgress | Int | default(0) | Stage completion percentage (0-100) |
| startDate | DateTime | optional | Project start date |
| endDate | DateTime | optional | Project end date |
| timelineProgress | Int | default(0) | Timeline completion percentage (0-100) |
| nvkdId | String | required, indexed | Sales representative user ID |
| pmId | String | optional, indexed | Project manager user ID |
| plannerId | String | optional, indexed | Planner user ID |
| clientId | String | optional, indexed | Client organization ID |
| clientType | String | optional | Type of client (NVKD fills) |
| productType | String | optional | Type of product/service (NVKD fills) |
| licenseLink | String | optional | Link to license/credentials |
| campaignObjective | String | optional | Campaign objective description |
| initialGoal | String | optional | Initial project goals |
| upsellOpportunity | String | optional | Potential upsell opportunities |
| totalBudget | Decimal(15,2) | optional | Total project budget |
| monthlyBudget | Decimal(15,2) | optional | Monthly recurring budget |
| spentAmount | Decimal(15,2) | default(0) | Total amount spent |
| fixedAdFee | Decimal(15,2) | optional | Fixed advertising fee |
| adServiceFee | Decimal(15,2) | optional | Ad service fee |
| contentFee | Decimal(15,2) | optional | Content creation fee |
| designFee | Decimal(15,2) | optional | Design service fee |
| mediaFee | Decimal(15,2) | optional | Media buying fee |
| otherFee | Decimal(15,2) | optional | Other miscellaneous fees |
| budgetPacing | Float | optional | Budget pacing metric |
| costNSQC | Decimal(15,2) | optional | NSQC cost (PM evaluation) |
| costDesign | Decimal(15,2) | optional | Design cost (PM evaluation) |
| costMedia | Decimal(15,2) | optional | Media cost (PM evaluation) |
| costKOL | Decimal(15,2) | optional | KOL/influencer cost (PM evaluation) |
| costOther | Decimal(15,2) | optional | Other costs (PM evaluation) |
| cogs | Decimal(15,2) | optional | Cost of goods sold |
| grossProfit | Decimal(15,2) | optional | Calculated gross profit |
| profitMargin | Float | optional | Profit margin percentage |
| clientTier | ClientTier | optional | Client tier classification (enum) |
| marketSize | String | optional | Market size assessment |
| competitionLevel | String | optional | Competition level assessment |
| productUSP | String | optional | Product unique selling proposition |
| averageScore | Float | optional | Average evaluation score |
| audienceSize | String | optional | Target audience size |
| productLifecycle | String | optional | Product lifecycle stage |
| scalePotential | String | optional | Scale potential assessment |
| decision | PipelineDecision | default(PENDING), indexed | Pipeline decision status (enum) |
| decisionDate | DateTime | optional | Decision made timestamp |
| decisionNote | String | optional | Decision rationale notes |
| weeklyNotes | Json | optional | Weekly project notes (JSONB) |
| driveLink | String | optional | Google Drive/shared folder link |
| planLink | String | optional | Project plan document link |
| trackingLink | String | optional | Tracking/analytics link |
| metadata | Json | optional | Additional metadata (JSONB) |
| createdAt | DateTime | default(now()), indexed | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |
| archivedAt | DateTime | optional | Archive timestamp |

**Indexes:** dealCode, projectCode, lifecycle, healthStatus, nvkdId, pmId, plannerId, decision, clientId, createdAt, [lifecycle + decision], [lifecycle + healthStatus]

**Relations:**
- nvkd → User (NVKD)
- pm → User (PM)
- planner → User (Planner)
- client → Client
- team → ProjectTeam[]
- phases → ProjectPhase[]
- tasks → Task[]
- budgetEvents → BudgetEvent[]
- kpis → ProjectKPI[]
- logs → ProjectLog[]
- stageHistory → StageHistory[]
- mediaPlans → MediaPlan[]
- adsReports → AdsReport[]
- strategicBrief → StrategicBrief
- approvals → Approval[]
- comments → Comment[]
- events → Event[]
- files → File[]

---

### ProjectTeam

Team member assignments to projects.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| userId | String | required, indexed | Reference to User |
| role | UserRole | required | User role on this project (enum) |
| isPrimary | Boolean | default(false) | Primary team member flag |
| joinedAt | DateTime | default(now()) | Team join timestamp |

**Unique Constraint:** [projectId, userId, role]

**Indexes:** projectId, userId

**Relations:**
- project → Project (cascade delete)
- user → User

---

### ProjectPhase

Major project phases with progress tracking.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| phaseType | ProjectPhaseType | required | Phase type (enum) |
| name | String | required | Phase display name |
| weight | Int | required | Phase weight for progress calculation |
| progress | Int | default(0) | Phase completion percentage (0-100) |
| orderIndex | Int | required | Display order index |
| startDate | DateTime | optional | Phase start date |
| endDate | DateTime | optional | Phase end date |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Unique Constraint:** [projectId, phaseType]

**Indexes:** projectId

**Relations:**
- project → Project (cascade delete)
- items → ProjectPhaseItem[]

---

### ProjectPhaseItem

Individual checklist items within project phases.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| phaseId | String | required, indexed | Reference to ProjectPhase |
| name | String | required | Item name |
| description | String | optional | Item description |
| weight | Float | default(0) | Item weight for phase progress |
| isComplete | Boolean | default(false) | Completion status flag |
| orderIndex | Int | default(0) | Display order index |
| pic | String | optional | Person in charge role (e.g., "Sale", "Planner") |
| support | String | optional | Support role (e.g., "Account/Team") |
| expectedOutput | String | optional | Expected deliverable description |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** phaseId

**Relations:**
- phase → ProjectPhase (cascade delete)
- tasks → Task[]

---

### BudgetEvent

Budget allocation, spending, and adjustment events.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| mediaPlanId | String | optional, indexed | Reference to MediaPlan |
| stage | String | optional | Project stage at time of event |
| amount | Decimal(15,2) | required | Transaction amount |
| type | BudgetEventType | required | Event type (enum: ALLOC/SPEND/ADJUST) |
| category | BudgetEventCategory | default(OTHER), indexed | Budget category (enum) |
| status | BudgetEventStatus | default(PENDING), indexed | Event status (enum) |
| note | String | optional | Event description/notes |
| createdById | String | required, indexed | Reference to User creator |
| createdAt | DateTime | default(now()) | Record creation timestamp |

**Indexes:** projectId, mediaPlanId, createdById, status, category, [projectId + category], [projectId + type]

**Relations:**
- project → Project (cascade delete)
- mediaPlan → MediaPlan
- createdBy → User

---

### ProjectKPI

Key performance indicators for projects.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| kpiType | String | required, indexed | KPI type identifier |
| targetValue | Float | optional | Target/goal value |
| actualValue | Float | optional | Actual measured value |
| unit | String | optional | Measurement unit (%, $, count, etc.) |
| metadata | Json | optional | Additional KPI metadata (JSONB) |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** projectId, kpiType

**Relations:**
- project → Project (cascade delete)

---

### ProjectLog

Project activity and issue logs.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| logDate | DateTime | required, indexed | Log entry date |
| rootCause | String | optional | Root cause analysis |
| action | String | optional | Action taken |
| nextAction | String | optional | Next planned action |
| notes | String | optional | Additional notes |
| createdAt | DateTime | default(now()) | Record creation timestamp |

**Indexes:** projectId, logDate

**Relations:**
- project → Project (cascade delete)

---

### StageHistory

Historical record of project lifecycle stage transitions.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| fromStage | ProjectLifecycle | optional | Previous lifecycle stage (enum) |
| toStage | ProjectLifecycle | required | New lifecycle stage (enum) |
| fromProgress | Int | default(0) | Previous stage progress percentage |
| toProgress | Int | default(0) | New stage progress percentage |
| changedById | String | required, indexed | User who made the change |
| reason | String | optional | Reason for stage change |
| createdAt | DateTime | default(now()), indexed | Change timestamp |

**Indexes:** projectId, createdAt, changedById

**Relations:**
- project → Project (cascade delete)

---

## Task Models

### Task

Project tasks with hierarchy and assignment support.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| parentId | String | optional, indexed | Parent task ID for subtasks |
| title | String | required | Task title |
| description | String | optional | Task description |
| status | TaskStatus | default(TODO), indexed | Task status (enum) |
| priority | TaskPriority | default(MEDIUM), indexed | Task priority (enum) |
| estimatedHours | Float | optional | Estimated hours to complete |
| actualHours | Float | optional | Actual hours spent |
| deadline | DateTime | optional, indexed | Task deadline |
| startedAt | DateTime | optional | Task start timestamp |
| completedAt | DateTime | optional | Task completion timestamp |
| reviewerId | String | optional, indexed | User ID of reviewer |
| createdById | String | required, indexed | User ID of creator |
| orderIndex | Int | default(0) | Display order index |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** projectId, parentId, status, priority, deadline, createdById, reviewerId, [projectId + status]

**Relations:**
- project → Project (cascade delete)
- parent → Task (self-reference)
- subtasks → Task[] (self-reference)
- createdBy → User
- reviewer → User
- assignees → TaskAssignee[]
- dependents → TaskDependency[] (tasks that depend on this)
- dependencies → TaskDependency[] (tasks this depends on)
- comments → Comment[]
- files → File[]
- phaseItems → ProjectPhaseItem[]

---

### TaskAssignee

Task assignment to users (many-to-many).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| taskId | String | required, indexed | Reference to Task |
| userId | String | required, indexed | Reference to User |
| assignedAt | DateTime | default(now()) | Assignment timestamp |

**Unique Constraint:** [taskId, userId]

**Indexes:** taskId, userId

**Relations:**
- task → Task (cascade delete)
- user → User

---

### TaskDependency

Task dependencies (blocking relationships).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| taskId | String | required | Task that has the dependency |
| dependsOnTaskId | String | required | Task that must be completed first |

**Unique Constraint:** [taskId, dependsOnTaskId]

**Relations:**
- task → Task (cascade delete)
- dependsOnTask → Task (cascade delete)

---

## Approval & File Models

### Approval

Approval workflows for various project artifacts.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| type | ApprovalType | required, indexed | Approval type (enum) |
| status | ApprovalStatus | default(PENDING), indexed | Approval status (enum) |
| title | String | required | Approval request title |
| description | String | optional | Detailed description |
| submittedById | String | required, indexed | User who submitted |
| approvedById | String | optional, indexed | User who approved/rejected |
| comment | String | optional | Approver comment |
| deadline | DateTime | optional | Response deadline |
| escalatedAt | DateTime | optional | Escalation timestamp |
| escalationLevel | Int | default(0) | Escalation level counter |
| submittedAt | DateTime | default(now()) | Submission timestamp |
| respondedAt | DateTime | optional | Response timestamp |

**Indexes:** projectId, status, type, submittedById, approvedById, [projectId + status]

**Relations:**
- project → Project (cascade delete)
- submittedBy → User
- approvedBy → User
- history → ApprovalHistory[]
- files → File[]

---

### ApprovalHistory

Historical record of approval status changes.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| approvalId | String | required, indexed | Reference to Approval |
| fromStatus | ApprovalStatus | required | Previous status (enum) |
| toStatus | ApprovalStatus | required | New status (enum) |
| comment | String | optional | Change comment |
| changedById | String | required, indexed | User who made the change |
| changedAt | DateTime | default(now()) | Change timestamp |

**Indexes:** approvalId, changedById

**Relations:**
- approval → Approval (cascade delete)

---

### File

File attachments with versioning support.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | optional, indexed | Reference to Project |
| taskId | String | optional, indexed | Reference to Task |
| approvalId | String | optional, indexed | Reference to Approval |
| name | String | required | System filename |
| originalName | String | required | Original uploaded filename |
| path | String | required | File storage path |
| size | Int | required | File size in bytes |
| mimeType | String | required | MIME type |
| category | FileCategory | default(OTHER), indexed | File category (enum) |
| version | Int | default(1) | Version number |
| previousId | String | optional | Previous version file ID |
| tags | String[] | required | File tags array |
| uploadedById | String | required, indexed | User who uploaded |
| uploadedAt | DateTime | default(now()) | Upload timestamp |

**Indexes:** projectId, taskId, approvalId, uploadedById, category

**Relations:**
- project → Project (cascade delete)
- task → Task (cascade delete)
- approval → Approval (cascade delete)
- uploadedBy → User
- previous → File (self-reference for versions)
- nextVersions → File[] (self-reference)

---

## Event & Notification Models

### Event

Calendar events and project milestones.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| title | String | required | Event title |
| description | String | optional | Event description |
| type | EventType | required, indexed | Event type (enum) |
| startTime | DateTime | required, indexed | Event start time |
| endTime | DateTime | optional | Event end time |
| isAllDay | Boolean | default(false) | All-day event flag |
| recurrence | String | optional | Recurrence rule (iCal format) |
| location | String | optional | Event location |
| meetingLink | String | optional | Virtual meeting link |
| projectId | String | optional, indexed | Reference to Project |
| taskId | String | optional | Reference to Task |
| createdById | String | required, indexed | User who created event |
| reminderBefore | Int | optional | Reminder time in minutes before event |
| createdAt | DateTime | default(now()) | Record creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** projectId, startTime, type, createdById

**Relations:**
- project → Project (cascade delete)
- createdBy → User
- attendees → EventAttendee[]

---

### EventAttendee

Event attendees (internal and external).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| eventId | String | required, indexed | Reference to Event |
| userId | String | optional, indexed | Reference to User (internal) |
| email | String | optional | External attendee email |
| name | String | optional | External attendee name |
| status | String | default("pending") | Attendance status |

**Indexes:** eventId, userId

**Relations:**
- event → Event (cascade delete)
- user → User (set null on delete)

---

### Notification

In-app and Telegram notifications.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| userId | String | required, indexed | Reference to User |
| type | String | required | Notification type |
| title | String | required | Notification title |
| content | String | required | Notification content |
| link | String | optional | Related resource link |
| isRead | Boolean | default(false), indexed | Read status flag |
| readAt | DateTime | optional | Read timestamp |
| telegramSent | Boolean | default(false) | Telegram delivery flag |
| createdAt | DateTime | default(now()), indexed | Creation timestamp |

**Indexes:** userId, isRead, createdAt

**Relations:**
- user → User (cascade delete)

---

### Comment

Comments on projects and tasks.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | optional, indexed | Reference to Project |
| taskId | String | optional, indexed | Reference to Task |
| content | String | required | Comment content |
| parentId | String | optional, indexed | Parent comment for replies |
| authorId | String | required, indexed | Comment author user ID |
| createdAt | DateTime | default(now()) | Creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** projectId, taskId, authorId, parentId

**Relations:**
- project → Project (cascade delete)
- task → Task (cascade delete)
- author → User
- parent → Comment (self-reference)
- replies → Comment[] (self-reference)

---

## Media & Ads Models

### MediaPlan

Media planning and campaign schedules.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| name | String | required | Plan name |
| type | MediaPlanType | default(ADS), indexed | Plan type (enum) |
| month | Int | required | Plan month (1-12) |
| year | Int | required | Plan year |
| version | Int | default(1) | Plan version number |
| status | MediaPlanStatus | default(DRAFT), indexed | Plan status (enum) |
| totalBudget | Decimal(15,2) | required | Total budget for plan |
| startDate | DateTime | required | Plan start date |
| endDate | DateTime | required | Plan end date |
| notes | String | optional | Additional notes |
| createdById | String | required, indexed | User who created plan |
| createdAt | DateTime | default(now()) | Creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** projectId, [projectId + type], status, createdById

**Relations:**
- project → Project (cascade delete)
- createdBy → User
- items → MediaPlanItem[]
- budgetEvents → BudgetEvent[]

---

### MediaPlanItem

Individual media campaigns within a plan.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| mediaPlanId | String | required, indexed | Reference to MediaPlan |
| channel | String | required | Media channel (Facebook, Google, etc.) |
| campaignType | String | required | Campaign type |
| objective | String | required | Campaign objective |
| budget | Decimal(15,2) | required | Campaign budget |
| startDate | DateTime | required | Campaign start date |
| endDate | DateTime | required | Campaign end date |
| targetReach | Int | optional | Target reach/impressions |
| targetClicks | Int | optional | Target clicks |
| targetLeads | Int | optional | Target leads/conversions |
| targetCPL | Decimal(10,2) | optional | Target cost per lead |
| targetCPC | Decimal(10,2) | optional | Target cost per click |
| targetROAS | Decimal(5,2) | optional | Target return on ad spend |
| status | String | default("planned") | Campaign status |
| orderIndex | Int | default(0) | Display order index |
| createdAt | DateTime | default(now()) | Creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** mediaPlanId

**Relations:**
- mediaPlan → MediaPlan (cascade delete)

---

### AdsReport

Advertising performance reports.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | required, indexed | Reference to Project |
| period | AdsReportPeriod | required, indexed | Report period (enum) |
| reportDate | DateTime | required, indexed | Report date |
| impressions | Int | default(0) | Ad impressions count |
| clicks | Int | default(0) | Ad clicks count |
| ctr | Float | default(0) | Click-through rate |
| cpc | Decimal(10,2) | default(0) | Cost per click |
| cpm | Decimal(10,2) | default(0) | Cost per mille (thousand impressions) |
| cpa | Decimal(10,2) | default(0) | Cost per acquisition |
| conversions | Int | default(0) | Conversion count |
| roas | Float | default(0) | Return on ad spend |
| adSpend | Decimal(15,2) | default(0) | Total ad spend |
| platform | AdsPlatform | required, indexed | Ad platform (enum) |
| campaignName | String | optional | Campaign name |
| source | AdsReportSource | default(MANUAL) | Data source (enum) |
| createdById | String | required, indexed | User who created report |
| createdAt | DateTime | default(now()) | Creation timestamp |

**Indexes:** projectId, reportDate, platform, period, createdById, [projectId + reportDate], [projectId + platform]

**Relations:**
- project → Project (cascade delete)
- createdBy → User

---

## Strategic Brief Models

### StrategicBrief

Strategic planning brief for projects.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| projectId | String | UNIQUE, required, indexed | Reference to Project (one-to-one) |
| status | BriefStatus | default(DRAFT), indexed | Brief status (enum) |
| completionPct | Int | default(0) | Completion percentage (0-100) |
| submittedAt | DateTime | optional | Submission timestamp |
| approvedAt | DateTime | optional | Approval timestamp |
| approvedById | String | optional | User who approved |
| createdAt | DateTime | default(now()) | Creation timestamp |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Indexes:** status, projectId

**Relations:**
- project → Project (cascade delete, one-to-one)
- sections → BriefSection[]

---

### BriefSection

Sections within a strategic brief.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| briefId | String | required, indexed | Reference to StrategicBrief |
| sectionNum | Int | required | Section number (order) |
| sectionKey | String | required | Section key identifier |
| title | String | required | Section title |
| data | Json | optional | Section data (JSONB) |
| isComplete | Boolean | default(false) | Section completion flag |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

**Unique Constraint:** [briefId, sectionNum]

**Indexes:** briefId

**Relations:**
- brief → StrategicBrief (cascade delete)

---

## System Models

### AuditLog

System-wide audit trail.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| userId | String | optional, indexed | User who performed action |
| action | String | required, indexed | Action type/name |
| entityType | String | required, indexed | Entity type affected |
| entityId | String | optional, indexed | Entity ID affected |
| oldValue | Json | optional | Previous value (JSONB) |
| newValue | Json | optional | New value (JSONB) |
| ipAddress | String | optional | Client IP address |
| userAgent | String | optional | Client user agent |
| createdAt | DateTime | default(now()), indexed | Action timestamp |

**Indexes:** userId, entityType, action, createdAt, [entityType + entityId], [userId + createdAt]

**Relations:**
- user → User

---

### SystemSetting

System configuration key-value store.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, default(cuid()) | Unique identifier |
| key | String | UNIQUE, required | Setting key |
| value | Json | required | Setting value (JSONB) |
| updatedAt | DateTime | auto-updated | Last modification timestamp |

---

## Relationships

### User Relationships

- **User → Project**: Multiple relationship types
  - As NVKD (sales representative): `Project.nvkdId → User.id`
  - As PM (project manager): `Project.pmId → User.id`
  - As Planner: `Project.plannerId → User.id`
- **User → ProjectTeam**: Many-to-many project membership
- **User → Task**: Multiple roles
  - As creator: `Task.createdById → User.id`
  - As reviewer: `Task.reviewerId → User.id`
  - As assignee: via `TaskAssignee`
- **User → Approval**: As submitter or approver
- **User → File**: As uploader
- **User → Event**: As creator
- **User → Comment**: As author
- **User → Notification**: As recipient
- **User → MediaPlan**: As creator
- **User → BudgetEvent**: As creator
- **User → AdsReport**: As creator

### Project Relationships

- **Project → Client**: Many-to-one (`Project.clientId → Client.id`)
- **Project → ProjectTeam**: One-to-many team members
- **Project → ProjectPhase**: One-to-many phases
- **Project → Task**: One-to-many tasks
- **Project → BudgetEvent**: One-to-many budget events
- **Project → ProjectKPI**: One-to-many KPIs
- **Project → ProjectLog**: One-to-many logs
- **Project → StageHistory**: One-to-many stage changes
- **Project → MediaPlan**: One-to-many media plans
- **Project → AdsReport**: One-to-many ad reports
- **Project → StrategicBrief**: One-to-one strategic brief
- **Project → Approval**: One-to-many approvals
- **Project → Comment**: One-to-many comments
- **Project → Event**: One-to-many events
- **Project → File**: One-to-many files

### Task Relationships

- **Task → Task**: Self-referencing hierarchy
  - Parent-child: `Task.parentId → Task.id`
- **Task → TaskDependency**: Many-to-many dependencies
  - `TaskDependency.taskId` → dependent task
  - `TaskDependency.dependsOnTaskId` → blocking task
- **Task → TaskAssignee**: Many-to-many user assignments
- **Task → ProjectPhaseItem**: Many-to-many phase item associations
- **Task → Comment**: One-to-many comments
- **Task → File**: One-to-many files

### File Relationships

- **File → File**: Self-referencing version chain
  - `File.previousId → File.id`
- **File → Project**: Optional attachment
- **File → Task**: Optional attachment
- **File → Approval**: Optional attachment

### MediaPlan Relationships

- **MediaPlan → Project**: Many-to-one
- **MediaPlan → MediaPlanItem**: One-to-many campaign items
- **MediaPlan → BudgetEvent**: One-to-many budget events

### Cascade Delete Behaviors

Most child entities cascade delete when parent is deleted:
- Deleting a **Project** cascades to: ProjectTeam, ProjectPhase, Task, BudgetEvent, ProjectKPI, ProjectLog, StageHistory, MediaPlan, AdsReport, StrategicBrief, Approval, Comment, Event, File
- Deleting a **Task** cascades to: TaskAssignee, TaskDependency, Comment, File
- Deleting an **Approval** cascades to: ApprovalHistory, File
- Deleting an **Event** cascades to: EventAttendee (with SetNull for user reference)

---

## Enumerations

### UserRole

User role types for role-based access control.

| Value | Description |
|---|---|
| SUPER_ADMIN | Super administrator with full system access |
| ADMIN | Administrator with elevated privileges |
| TECHNICAL | Technical staff |
| NVKD | Sales representative (Nhân Viên Kinh Doanh) |
| PM | Project manager |
| PLANNER | Project planner |
| ACCOUNT | Account manager |
| CONTENT | Content creator |
| DESIGN | Designer |
| MEDIA | Media buyer |

---

### ProjectLifecycle

Unified lifecycle stages combining sales pipeline and project execution.

| Value | Description |
|---|---|
| LEAD | Initial lead/opportunity |
| QUALIFIED | Qualified sales opportunity |
| EVALUATION | Under evaluation (client assessment) |
| NEGOTIATION | In negotiation phase |
| WON | Deal won, becoming project |
| LOST | Deal lost |
| PLANNING | Project planning phase |
| ONGOING | Project execution in progress |
| OPTIMIZING | Project optimization phase |
| CLOSED | Project completed and closed |

---

### HealthStatus

Project health indicator (replaces ProjectStatus).

| Value | Description |
|---|---|
| STABLE | Project on track, no issues |
| WARNING | Minor issues, needs attention |
| CRITICAL | Major issues, urgent action required |

---

### PipelineDecision

Sales pipeline decision status.

| Value | Description |
|---|---|
| PENDING | Awaiting decision |
| ACCEPTED | Accepted to proceed |
| DECLINED | Declined/rejected |

---

### ClientTier

Client tier classification for prioritization.

| Value | Description |
|---|---|
| A | Top tier client |
| B | High value client |
| C | Standard client |
| D | Low priority client |

---

### TaskStatus

Task workflow status.

| Value | Description |
|---|---|
| TODO | Not started |
| IN_PROGRESS | Work in progress |
| REVIEW | Under review |
| DONE | Completed |
| BLOCKED | Blocked by dependencies or issues |
| CANCELLED | Cancelled/abandoned |

---

### TaskPriority

Task priority levels.

| Value | Description |
|---|---|
| LOW | Low priority |
| MEDIUM | Medium priority (default) |
| HIGH | High priority |
| URGENT | Urgent, requires immediate attention |

---

### ApprovalType

Types of approval requests.

| Value | Description |
|---|---|
| PLAN | Project plan approval |
| CONTENT | Content approval |
| BUDGET | Budget approval |
| FILE | File/document approval |
| MEDIA_PLAN | Media plan approval |

---

### ApprovalStatus

Approval workflow status.

| Value | Description |
|---|---|
| PENDING | Awaiting review |
| APPROVED | Approved |
| REJECTED | Rejected |
| CHANGES_REQUESTED | Changes requested before approval |

---

### EventType

Calendar event types.

| Value | Description |
|---|---|
| MEETING | Meeting event |
| DEADLINE | Deadline/due date |
| MILESTONE | Project milestone |
| REMINDER | Reminder notification |

---

### FileCategory

File categorization for organization.

| Value | Description |
|---|---|
| BRIEF | Brief documents |
| PLAN | Planning documents |
| PROPOSAL | Proposals |
| REPORT | Reports |
| CREATIVE | Creative assets |
| RAW_DATA | Raw data files |
| CONTRACT | Contracts and agreements |
| OTHER | Other/miscellaneous (default) |

---

### MediaPlanType

Media plan type classification.

| Value | Description |
|---|---|
| ADS | Advertising/paid media plan |
| DESIGN | Design deliverables plan |
| CONTENT | Content creation plan |

---

### MediaPlanStatus

Media plan workflow status.

| Value | Description |
|---|---|
| DRAFT | Draft stage |
| PENDING_APPROVAL | Awaiting approval |
| APPROVED | Approved |
| ACTIVE | Active/in execution |
| COMPLETED | Completed |
| CANCELLED | Cancelled |

---

### BudgetEventType

Budget event transaction types.

| Value | Description |
|---|---|
| ALLOC | Budget allocation |
| SPEND | Budget spending/expense |
| ADJUST | Budget adjustment |

---

### BudgetEventCategory

Budget event categorization.

| Value | Description |
|---|---|
| FIXED_AD | Fixed advertising fee |
| AD_SERVICE | Ad service fee |
| CONTENT | Content creation costs |
| DESIGN | Design service costs |
| MEDIA | Media buying costs |
| OTHER | Other/miscellaneous (default) |

---

### BudgetEventStatus

Budget event approval workflow.

| Value | Description |
|---|---|
| PENDING | Pending approval |
| APPROVED | Approved |
| REJECTED | Rejected |
| PAID | Payment completed |

---

### BriefStatus

Strategic brief workflow status.

| Value | Description |
|---|---|
| DRAFT | Draft stage |
| SUBMITTED | Submitted for review |
| APPROVED | Approved |
| REVISION_REQUESTED | Revision requested |

---

### ProjectPhaseType

Standard project phase types.

| Value | Description |
|---|---|
| KHOI_TAO_PLAN | Plan initialization phase |
| SETUP_CHUAN_BI | Setup and preparation phase |
| VAN_HANH_TOI_UU | Operation and optimization phase |
| TONG_KET | Summary/wrap-up phase |

---

### AdsReportPeriod

Advertising report period types.

| Value | Description |
|---|---|
| DAILY | Daily report |
| WEEKLY | Weekly report |
| MONTHLY | Monthly report |

---

### AdsPlatform

Advertising platform identifiers.

| Value | Description |
|---|---|
| FACEBOOK | Facebook Ads |
| GOOGLE | Google Ads |
| TIKTOK | TikTok Ads |
| OTHER | Other platforms |

---

### AdsReportSource

Source of ads report data.

| Value | Description |
|---|---|
| MANUAL | Manually entered data |
| ZAPIER | Automatically imported via Zapier |

---

## Document Control

**Last Updated:** 2026-01-30
**Document Version:** 1.0
**Maintained By:** Development Team
**Review Frequency:** Quarterly or on schema changes

This document should be updated whenever the Prisma schema is modified to ensure accuracy and completeness of the data dictionary.
