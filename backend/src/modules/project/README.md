# Project Management & Lifecycle Module

## Overview

The Project module manages the complete lifecycle of advertising projects from initial lead through final delivery. It implements a **10-stage lifecycle pipeline** with automated financial calculations, team management, and pipeline decision workflow (ACCEPTED/DECLINED).

## Architecture

This module implements the **Unified Project Entity** pattern (ADR-0005), where a single `Project` entity tracks the entire lifecycle from LEAD to CLOSED, eliminating the need for separate Lead/Opportunity/Project entities and ensuring data continuity across all stages.

**Key Design:** All stages share one entity with stage-specific fields (nullable) and a state machine enforcing valid transitions.

## Key Components

### Controllers

**`ProjectController`** (`presentation/controllers/project.controller.ts`)
- CRUD operations for projects
- Sales pipeline endpoints (`/sale`, `/evaluate`, `/decide`)
- Lifecycle management (`/lifecycle`)
- Team management (`/team`)
- Stage history tracking

### Services

**`BudgetEventService`** (`modules/project/budget-event.service.ts`)
- Budget event tracking (ALLOC, SPEND, ADJUST)
- Auto-recalculation of `spentAmount` from approved SPEND events
- Budget threshold monitoring (warning at 75%, critical at 90%)
- Integration with media plans

**`ProjectPhaseService`** (`modules/project-phase/project-phase.service.ts`)
- Creates default project phases when project is accepted
- Manages phase completion tracking

## API Endpoints

### GET `/projects`
**Description:** List projects with filters and pagination
**Query Parameters:**
- `healthStatus`: Filter by health (STABLE, WARNING, CRITICAL)
- `lifecycle`: Filter by stages (array)
- `clientId`: Filter by client
- `nvkdId`: Filter by sales rep (admin only)
- `decision`: Filter by pipeline decision
- `search`: Text search in name/code/description
- `page`, `limit`: Pagination
- `sortBy`, `sortOrder`: Sorting

### POST `/projects`
**Description:** Create new project (starts as LEAD)
**Roles:** NVKD, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "name": "Q1 Brand Campaign",
  "description": "Digital campaign for product launch",
  "clientId": "uuid",
  "clientType": "NEW",
  "productType": "DIGITAL_ADS",
  "campaignObjective": "Brand awareness",
  "totalBudget": 50000,
  "monthlyBudget": 10000
}
```
**Lifecycle:** Auto-assigned `LEAD` stage and `dealCode` (e.g., DEAL-0001)

### PATCH `/projects/:id`
**Description:** Update project details
**Fields:** name, description, healthStatus, stageProgress, startDate, endDate, driveLink

### PATCH `/projects/:id/sale`
**Description:** Update sale-specific fields (NVKD only)
**Restriction:** Only editable when `decision: PENDING`
**Fields:** clientType, campaignObjective, totalBudget, monthlyBudget, fees, upsellOpportunity

### PATCH `/projects/:id/evaluate`
**Description:** PM/Planner evaluation with auto-calculation
**Roles:** PM, PLANNER, ADMIN
**Request Body:**
```json
{
  "costNSQC": 5000,
  "costDesign": 3000,
  "costMedia": 8000,
  "costKOL": 2000,
  "costOther": 1000
}
```
**Auto-Calculation:**
```typescript
COGS = costNSQC + costDesign + costMedia + costKOL + costOther
grossProfit = totalBudget - COGS
profitMargin = (grossProfit / totalBudget) * 100
```

### PATCH `/projects/:id/lifecycle`
**Description:** Transition to next lifecycle stage
**Validation:** Enforces state machine transitions (see Business Rules)

### POST `/projects/:id/decide`
**Description:** Accept (WON) or Decline (LOST) project
**Roles:** PM, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "decision": "ACCEPTED",  // or "DECLINED"
  "decisionNote": "Budget approved, moving forward"
}
```
**On ACCEPT:**
1. Generates `projectCode` (e.g., PRJ0001)
2. Transitions to `WON` stage
3. Creates default project phases
4. Creates strategic brief with 16 sections
5. Creates team from nvkd/pm/planner
6. Records stage history

**On DECLINE:**
1. Transitions to `LOST` stage
2. Records decision note
3. Project becomes read-only

### POST `/projects/:id/weekly-note`
**Description:** Add weekly progress note
**Request Body:**
```json
{
  "note": "Campaign performance exceeding expectations"
}
```

### Team Management

**GET `/projects/:id/team`** - Get team members with workload stats
**POST `/projects/:id/team`** - Add team member
**PATCH `/projects/:id/team/:memberId`** - Update team member role/primary status
**DELETE `/projects/:id/team/:memberId`** - Remove team member

## Business Rules & Domain Logic

### Lifecycle State Machine (10 Stages)

```
LEAD → QUALIFIED → EVALUATION → NEGOTIATION → WON → PLANNING → ONGOING → OPTIMIZING → CLOSED
  ↓                                                ↓
 LOST ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

**Valid Transitions:**
```typescript
LEAD → [QUALIFIED, LOST]
QUALIFIED → [EVALUATION, LOST]
EVALUATION → [NEGOTIATION, LOST]
NEGOTIATION → [WON, LOST]
WON → [PLANNING]
PLANNING → [ONGOING]
ONGOING → [OPTIMIZING]
OPTIMIZING → [CLOSED]
LOST → []  // Terminal
CLOSED → []  // Terminal
```

### Code Generation

**Deal Code:** Generated on project creation
- Format: `DEAL-####` (e.g., DEAL-0001, DEAL-0042)
- Auto-increments based on last deal code

**Project Code:** Generated when project is accepted (WON)
- Format: `PRJ####` (e.g., PRJ0001, PRJ0123)
- Auto-increments based on last project code
- Only assigned to projects that reached WON stage

### Financial Auto-Calculation

When PM evaluates a project via `/evaluate`, the system automatically calculates:

1. **COGS (Cost of Goods Sold):**
   ```
   COGS = costNSQC + costDesign + costMedia + costKOL + costOther
   ```

2. **Gross Profit:**
   ```
   grossProfit = totalBudget - COGS
   ```

3. **Profit Margin (%):**
   ```
   profitMargin = (grossProfit / totalBudget) × 100
   ```

These are persisted to the database and available for reporting.

### Pipeline Decision Workflow

**State:** All new projects start with `decision: PENDING`

**Options:**
- **ACCEPTED:** Project moves to WON → PLANNING → ONGOING
- **DECLINED:** Project moves to LOST (terminal state)

**Lock Mechanism:** Once a decision is made (ACCEPTED or DECLINED), the following endpoints become read-only:
- `/projects/:id/sale`
- `/projects/:id/evaluate`

This prevents accidental modification of historical pipeline data.

### Team Management Rules

- **PM Required:** Cannot remove the last PM from a project
- **Role Types:** PM, NVKD, PLANNER, CONTENT, MEDIA, DESIGNER
- **Primary Flag:** One primary member per role (optional)
- **Workload Stats:** Auto-calculated (project tasks, total tasks, done, overdue)

### Access Control

**Admin (SUPER_ADMIN, ADMIN):** Full access to all projects

**NVKD:** Can see all projects assigned to them, can update sale fields

**Non-Admin (PM, PLANNER, etc.):**
- See projects where they are team members OR assigned as nvkd/pm/planner
- Edit access: PM and NVKD only
- Other roles: Read-only unless explicitly granted edit permission

## Budget Event Integration

The project module integrates with `BudgetEventService` for tracking budget allocation and spending:

**Event Types:**
- `ALLOC` - Budget allocation (e.g., media plan created)
- `SPEND` - Actual spending (requires approval)
- `ADJUST` - Budget adjustment

**Auto-Recalculation:**
When a SPEND event status changes to `APPROVED`, the project's `spentAmount` is automatically recalculated:
```typescript
spentAmount = SUM(amount) WHERE type='SPEND' AND status='APPROVED'
```

**Threshold Monitoring:**
- **Warning (75%):** `spentAmount >= 75% of totalBudget`
- **Critical (90%):** `spentAmount >= 90% of totalBudget`

## Stage History Tracking

Every lifecycle transition is recorded in the `StageHistory` table:
```typescript
{
  projectId: string;
  fromStage: ProjectLifecycle;
  toStage: ProjectLifecycle;
  fromProgress: number;
  toProgress: number;
  changedById: string;
  reason?: string;
  createdAt: Date;
}
```

**GET `/projects/:id/stage-history`** returns full history with user details.

## Dependencies

### Internal Dependencies
- `PrismaService` - Database access
- `ProjectPhaseService` - Phase creation
- `StrategicBriefService` - Brief creation (via BRIEF_SECTIONS config)

### External Dependencies
- Prisma Client - ORM
- NestJS decorators - Guards, validation

## Related ADRs

- **ADR-0005: Unified Project Entity** - Single entity for entire lifecycle (LEAD → CLOSED)
- **ADR-0001: Clean Architecture Pattern** - Project controller in Presentation layer
- **ADR-0004: JWT Authentication Strategy** - Role-based access control

## Data Model Highlights

### Project Entity Fields

**Core Fields:**
- `id`, `dealCode`, `projectCode`, `name`, `description`

**Lifecycle Tracking:**
- `lifecycle`: Current stage (LEAD, WON, ONGOING, etc.)
- `healthStatus`: Project health (STABLE, WARNING, CRITICAL)
- `stageProgress`: Completion percentage within current stage (0-100)

**Sales Data:**
- `clientType`, `campaignObjective`, `initialGoal`, `upsellOpportunity`, `licenseLink`

**Budget & Fees:**
- `totalBudget`, `monthlyBudget`, `spentAmount`
- `fixedAdFee`, `adServiceFee`, `contentFee`, `designFee`, `mediaFee`, `otherFee`

**PM Evaluation:**
- `costNSQC`, `costDesign`, `costMedia`, `costKOL`, `costOther`
- `cogs`, `grossProfit`, `profitMargin` (auto-calculated)

**Decision:**
- `decision`: PENDING | ACCEPTED | DECLINED
- `decisionDate`, `decisionNote`

**Team References:**
- `nvkdId`, `pmId`, `plannerId`
- `team[]`: ProjectTeam relation (many-to-many)

**Metadata:**
- `weeklyNotes`: JSON array of weekly progress notes
- `driveLink`, `planLink`, `trackingLink`
