# Strategic Brief Module

## Overview

The Strategic Brief module manages structured campaign strategy documents with a fixed 16-section template. Each project gets exactly one brief (1:1 relationship) that progresses through a state machine from DRAFT through review to APPROVED. Section completion is tracked as a percentage, and submission requires 100% completion.

## Architecture

This module uses direct Prisma access (no repository pattern) since the domain logic is straightforward: section updates, completion tracking, and status transitions. The service layer contains the state machine and validation logic.

**Key Design:** One brief per project (`projectId` has `@unique` constraint). The brief is auto-created with 16 empty sections when a project is accepted (WON stage).

## Key Components

### Services

**`StrategicBriefService`** (`strategic-brief.service.ts`)
- `create(projectId)` – Creates brief with 16 empty sections
- `updateSection(briefId, sectionNum, dto)` – Updates section data and/or completion flag
- `recalculateCompletion(briefId)` – Recomputes `completionPct` after section changes
- `canTransition(from, to)` – Pure state machine validation
- `submit(briefId)` – Submits brief (requires 100% completion)
- `approve(briefId, userId)` – Approves submitted brief
- `requestRevision(briefId)` – Sends brief back for revision

### Configuration

**`BRIEF_SECTIONS`** (`brief-sections.config.ts`) – Defines the 16-section template:

| # | Key | Title (Vietnamese) |
|---|-----|-------------------|
| 1 | `objectives` | Muc tieu chien dich |
| 2 | `market_research` | Nghien cuu thi truong |
| 3 | `customer_research` | Nghien cuu khach hang |
| 4 | `competitor_analysis` | Phan tich doi thu |
| 5 | `internal_swot` | SWOT noi bo |
| 6 | `strategic_recommendation` | De xuat chien luoc |
| 7 | `channel_strategy` | Chien luoc kenh |
| 8 | `creative_direction` | Dinh huong sang tao |
| 9 | `media_execution` | Media & Execution Logic |
| 10 | `timeline` | Timeline |
| 11 | `budget_logic` | Budget Logic |
| 12 | `kpi_measurement` | KPI & Measurement |
| 13 | `risk_mitigation` | Rui ro & Giai phap |
| 14 | `governance` | Governance |
| 15 | `planner_notes` | Ghi chu Planner |
| 16 | `quotation` | Bao gia |

### Controllers

**`StrategicBriefController`** (`presentation/controllers/strategic-brief.controller.ts`)

## API Endpoints

| Method | Route | Roles | Purpose |
|--------|-------|-------|---------|
| POST | `/strategic-briefs` | All authenticated | Create brief with 16 sections |
| GET | `/strategic-briefs/:id` | All authenticated | Get brief by ID |
| GET | `/strategic-briefs/by-project/:projectId` | All authenticated | Get brief by project |
| PATCH | `/strategic-briefs/:id/sections/:sectionNum` | All authenticated | Update section |
| POST | `/strategic-briefs/:id/submit` | All authenticated | Submit for approval |
| POST | `/strategic-briefs/:id/approve` | PM, ADMIN, SUPER_ADMIN | Approve brief |
| POST | `/strategic-briefs/:id/request-revision` | PM, ADMIN, SUPER_ADMIN | Request revision |

## Business Rules & Domain Logic

### Status State Machine

```
DRAFT → SUBMITTED → APPROVED        (happy path)
                  → REVISION_REQUESTED → SUBMITTED  (revision loop)
```

Valid transitions:
```typescript
DRAFT              → [SUBMITTED]
SUBMITTED          → [APPROVED, REVISION_REQUESTED]
REVISION_REQUESTED → [SUBMITTED]
APPROVED           → []  // Terminal state
```

### Section Completion Logic

1. Each section has `isComplete: boolean` field
2. Sections updated via `updateSection()` with optional `data` (JSON) and `isComplete` flag
3. After each update, `recalculateCompletion()` runs automatically
4. **Formula:** `completionPct = Math.round((completedSections / 16) * 100)`
5. **Submission requires:** `completionPct >= 100` (all 16 sections complete)

### Composite Unique Key

Sections use `@@unique([briefId, sectionNum])` — ensures exactly 16 sections per brief, no duplicates.

### Section Data Structure

Section `data` is stored as `Json?` (flexible JSON), allowing each section type to have its own structure. This supports varied content like SWOT matrices, timeline tables, and budget breakdowns without schema changes.

## Data Model

### StrategicBrief

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `projectId` | string | FK to Project (unique, cascade) |
| `status` | BriefStatus | DRAFT, SUBMITTED, APPROVED, REVISION_REQUESTED |
| `completionPct` | int | 0–100 (auto-calculated) |
| `submittedAt` | DateTime? | Submission timestamp |
| `approvedAt` | DateTime? | Approval timestamp |
| `approvedById` | string? | FK to approving User |

### BriefSection

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `briefId` | string | FK to StrategicBrief (cascade) |
| `sectionNum` | int | 1–16 |
| `sectionKey` | string | e.g., `objectives`, `quotation` |
| `title` | string | Display title |
| `data` | Json? | Flexible section content |
| `isComplete` | boolean | Completion flag |

## Dependencies

### Internal
- `PrismaService` – Database access
- `JwtAuthGuard` / `RolesGuard` – Authentication & authorization

### External
- `@prisma/client` – ORM
- `class-validator` – DTO validation
- `sanitizeInput()` – XSS prevention for revision comments

## Related ADRs

- **ADR-0005**: Unified Project Entity (brief auto-created on project acceptance)
- **ADR-0001**: Clean Architecture Pattern (service in Application layer)
