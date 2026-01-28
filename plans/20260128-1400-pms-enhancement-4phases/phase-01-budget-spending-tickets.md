# Phase 1: Budget Spending Tickets

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** None (extends existing BudgetEvent model)
- **Blocks:** Phase 4 reuses same controller/service pattern

## Overview

- **Date:** 2026-01-28
- **Description:** Add category and status to budget events, redesign budget tab with donut chart, filterable tickets table, threshold alerts, and approval workflow.
- **Priority:** HIGH
- **Implementation Status:** COMPLETED
- **Review Status:** COMPLETED

## Key Insights

1. `BudgetEvent` model already exists with fields: `id, projectId, mediaPlanId, stage, amount, type (ALLOC/SPEND/ADJUST), note, createdById, createdAt`. We add `category` and `status` fields.
2. `spentAmount` on `ProjectBudget` is currently manually set. We auto-compute it as SUM of APPROVED SPEND events.
3. Existing `BudgetEventController` at `projects/:projectId/budget-events` with `list` + `create`. We add `PATCH /:id/status` for approval.
4. Frontend budget tab at `frontend/src/app/dashboard/projects/[id]/page.tsx` lines 947-1071 needs complete redesign.
5. `recharts` v3.7 already installed; use `PieChart` + `Cell` for donut chart.
6. `sonner` toast already imported in project detail page for threshold alerts.

## Requirements

1. Add `BudgetEventCategory` enum: `FIXED_AD, AD_SERVICE, CONTENT, DESIGN, MEDIA, OTHER`
2. Add `BudgetEventStatus` enum: `PENDING, APPROVED, REJECTED, PAID`
3. Add `category` (required) and `status` (default PENDING) fields to `BudgetEvent` model
4. Create Prisma migration
5. Update backend DTO with `category` and `status` fields
6. Update service: auto-calculate `spentAmount` from SUM of APPROVED SPEND events
7. Add PATCH endpoint for status updates (ADMIN/PM/NVKD only)
8. Add budget threshold check (80%/100%) returning warning level in response
9. Frontend: 3-column summary cards (Total | Spent | Remaining)
10. Frontend: Donut chart by category using recharts PieChart
11. Frontend: Spending tickets table with filters (category, status, date range)
12. Frontend: Spending ticket create form as dialog modal
13. Frontend: Threshold alerts via sonner toast on mount when >=80%

## Architecture

```
backend/
  prisma/schema.prisma                        # Add enums + fields
  prisma/migrations/XXXX_budget_event_enhancements/
  src/application/dto/budget-event.dto.ts      # Add category, status to DTO
  src/modules/project/budget-event.service.ts  # Add recalc, status update, threshold
  src/presentation/controllers/budget-event.controller.ts  # Add PATCH /:id/status

frontend/
  src/lib/api/budget-events.ts                 # Add category, status types + updateStatus API
  src/hooks/use-budget-events.ts               # Add useUpdateBudgetEventStatus mutation
  src/app/dashboard/projects/[id]/page.tsx     # Redesign budget tab section
  src/components/project/budget-donut-chart.tsx # NEW: Donut chart component
  src/components/project/spending-ticket-modal.tsx # NEW: Create ticket dialog
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | MODIFY | Add `BudgetEventCategory`, `BudgetEventStatus` enums; add `category`, `status` fields to `BudgetEvent` |
| `backend/src/application/dto/budget-event.dto.ts` | MODIFY | Add category, status to `CreateBudgetEventDto`, `BudgetEventQueryDto`, `BudgetEventResponse` |
| `backend/src/modules/project/budget-event.service.ts` | MODIFY | Add `updateStatus()`, `recalcSpent()`, `getThreshold()` methods |
| `backend/src/presentation/controllers/budget-event.controller.ts` | MODIFY | Add `PATCH /:id/status` endpoint with `@Roles()` guard |
| `backend/src/modules/project/project.module.ts` | NO CHANGE | Already imports `BudgetEventService` |
| `frontend/src/lib/api/budget-events.ts` | MODIFY | Add `BudgetEventCategory`, `BudgetEventStatus` types; add `updateStatus()` API call |
| `frontend/src/hooks/use-budget-events.ts` | MODIFY | Add `useUpdateBudgetEventStatus` mutation |
| `frontend/src/app/dashboard/projects/[id]/page.tsx` | MODIFY | Redesign budget tab (lines 947-1071) |
| `frontend/src/components/project/budget-donut-chart.tsx` | CREATE | Recharts PieChart donut with category breakdown |
| `frontend/src/components/project/spending-ticket-modal.tsx` | CREATE | Dialog form for creating spending tickets |
| `frontend/src/types/index.ts` | MODIFY | Add budget event category/status enums for shared use |

## Implementation Steps

### Step 1: Prisma Schema Update

Add to `backend/prisma/schema.prisma` after the `BudgetEventType` enum (line 552):

```prisma
enum BudgetEventCategory {
  FIXED_AD
  AD_SERVICE
  CONTENT
  DESIGN
  MEDIA
  OTHER
}

enum BudgetEventStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}
```

Add fields to `BudgetEvent` model (after line 154 `type` field):

```prisma
  category     BudgetEventCategory
  status       BudgetEventStatus    @default(PENDING)
```

Add index:
```prisma
  @@index([status])
  @@index([category])
```

### Step 2: Generate Migration

```bash
cd backend
npx prisma migrate dev --name budget_event_category_status
```

### Step 3: Update Backend DTO

In `backend/src/application/dto/budget-event.dto.ts`:

```typescript
export const BudgetEventCategories = ['FIXED_AD', 'AD_SERVICE', 'CONTENT', 'DESIGN', 'MEDIA', 'OTHER'] as const;
export type BudgetEventCategory = (typeof BudgetEventCategories)[number];

export const BudgetEventStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] as const;
export type BudgetEventStatus = (typeof BudgetEventStatuses)[number];

// Add to CreateBudgetEventDto:
@IsIn(BudgetEventCategories)
category!: BudgetEventCategory;

// Add to BudgetEventQueryDto:
@IsOptional()
@IsIn(BudgetEventCategories)
category?: BudgetEventCategory;

@IsOptional()
@IsIn(BudgetEventStatuses)
status?: BudgetEventStatus;

// New DTO:
export class UpdateBudgetEventStatusDto {
  @IsIn(BudgetEventStatuses)
  status!: BudgetEventStatus;
}

// Update BudgetEventResponse interface:
category: BudgetEventCategory;
status: BudgetEventStatus;
```

### Step 4: Update Backend Service

In `backend/src/modules/project/budget-event.service.ts`:

Add to `list()` where clause: filter by `category` and `status` from query.

Add `updateStatus()` method:
```typescript
async updateStatus(eventId: string, projectId: string, dto: UpdateBudgetEventStatusDto): Promise<BudgetEventResponse> {
  const event = await this.prisma.budgetEvent.findFirst({
    where: { id: eventId, projectId },
  });
  if (!event) throw new NotFoundException('Budget event not found');

  const updated = await this.prisma.budgetEvent.update({
    where: { id: eventId },
    data: { status: dto.status },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  // Recalculate spentAmount when status changes
  if (event.type === 'SPEND') {
    await this.recalcSpent(projectId);
  }

  return this.map(updated);
}
```

Add `recalcSpent()` method:
```typescript
async recalcSpent(projectId: string): Promise<void> {
  const result = await this.prisma.budgetEvent.aggregate({
    where: { projectId, type: 'SPEND', status: 'APPROVED' },
    _sum: { amount: true },
  });
  const spent = result._sum.amount ?? 0;

  await this.prisma.projectBudget.updateMany({
    where: { projectId },
    data: { spentAmount: spent },
  });
}
```

Add `getThreshold()` method:
```typescript
async getThreshold(projectId: string): Promise<{ level: 'ok' | 'warning' | 'critical'; percent: number }> {
  const budget = await this.prisma.projectBudget.findUnique({ where: { projectId } });
  if (!budget || Number(budget.totalBudget) === 0) return { level: 'ok', percent: 0 };

  const percent = Math.round((Number(budget.spentAmount) / Number(budget.totalBudget)) * 100);
  const level = percent >= 100 ? 'critical' : percent >= 80 ? 'warning' : 'ok';
  return { level, percent };
}
```

Update `map()` to include `category` and `status`.

Also call `recalcSpent()` after `create()` when type is SPEND and status is APPROVED.

### Step 5: Update Backend Controller

In `backend/src/presentation/controllers/budget-event.controller.ts`:

```typescript
import { Patch } from '@nestjs/common';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';

// Add RolesGuard to the class-level UseGuards
@UseGuards(JwtAuthGuard, RolesGuard)

@Patch(':id/status')
@Roles('SUPER_ADMIN', 'ADMIN', 'PM', 'NVKD')
async updateStatus(
  @Param('projectId') projectId: string,
  @Param('id') id: string,
  @Body() dto: UpdateBudgetEventStatusDto,
): Promise<BudgetEventResponse> {
  return this.budgetEventService.updateStatus(id, projectId, dto);
}

@Get('threshold')
async getThreshold(
  @Param('projectId') projectId: string,
): Promise<{ level: string; percent: number }> {
  return this.budgetEventService.getThreshold(projectId);
}
```

### Step 6: Update Frontend API Client

In `frontend/src/lib/api/budget-events.ts`:

```typescript
export type BudgetEventCategory = 'FIXED_AD' | 'AD_SERVICE' | 'CONTENT' | 'DESIGN' | 'MEDIA' | 'OTHER';
export type BudgetEventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export const BudgetEventCategoryLabels: Record<BudgetEventCategory, string> = {
  FIXED_AD: 'Chi phí cố định',
  AD_SERVICE: 'Dịch vụ quảng cáo',
  CONTENT: 'Content',
  DESIGN: 'Design',
  MEDIA: 'Media',
  OTHER: 'Khác',
};

export const BudgetEventStatusLabels: Record<BudgetEventStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã thanh toán',
};

// Add to BudgetEvent interface:
category: BudgetEventCategory;
status: BudgetEventStatus;

// Add to budgetEventsApi:
updateStatus: async (projectId: string, eventId: string, status: BudgetEventStatus): Promise<BudgetEvent> => {
  const { data } = await api.patch(`/projects/${projectId}/budget-events/${eventId}/status`, { status });
  return data;
},
getThreshold: async (projectId: string): Promise<{ level: string; percent: number }> => {
  const { data } = await api.get(`/projects/${projectId}/budget-events/threshold`);
  return data;
},
```

### Step 7: Update Frontend Hook

In `frontend/src/hooks/use-budget-events.ts`, add:

```typescript
export function useUpdateBudgetEventStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: BudgetEventStatus }) =>
      budgetEventsApi.updateStatus(projectId, eventId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-events', projectId] });
      qc.invalidateQueries({ queryKey: ['project-budget', projectId] });
    },
  });
}

export function useBudgetThreshold(projectId: string) {
  return useQuery({
    queryKey: ['budget-threshold', projectId],
    queryFn: () => budgetEventsApi.getThreshold(projectId),
    enabled: !!projectId,
  });
}
```

### Step 8: Create Donut Chart Component

Create `frontend/src/components/project/budget-donut-chart.tsx`:

Uses recharts `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`. Groups budget events by category, sums amounts for APPROVED SPEND events. Color map per category:
- FIXED_AD: `#0071e3` (blue)
- AD_SERVICE: `#5856d6` (indigo)
- CONTENT: `#34c759` (green)
- DESIGN: `#af52de` (purple)
- MEDIA: `#ff9f0a` (orange)
- OTHER: `#8e8e93` (gray)

Inner radius 60, outer radius 90 for donut effect. Center label shows total spent.

### Step 9: Create Spending Ticket Modal

Create `frontend/src/components/project/spending-ticket-modal.tsx`:

shadcn `Dialog` with form fields:
- Type select (ALLOC/SPEND/ADJUST) - existing
- Category select (6 options) - NEW
- Amount number input
- Stage text input
- Note textarea
- MediaPlan select (optional, fetched from project media plans)

Uses `useCreateBudgetEvent` on submit.

### Step 10: Redesign Budget Tab in Project Detail

Replace lines 947-1071 of `frontend/src/app/dashboard/projects/[id]/page.tsx`:

Layout:
```
[3-col summary: Total Budget | Spent | Remaining]
[2-col grid]
  [Left: Donut chart + Tickets table with filters]
  [Right: Budget card + Create ticket button]
```

Summary cards show amounts formatted as VND. Remaining card changes color:
- Green if <80%
- Orange if 80-99%
- Red if >=100%

Table columns: Date | Type | Category | Amount | Status | Creator | Actions
Filters above table: category dropdown, status dropdown, date range picker.

Add `useEffect` with threshold check:
```typescript
const { data: threshold } = useBudgetThreshold(projectId);
useEffect(() => {
  if (threshold?.level === 'warning') toast.warning('Ngan sach da su dung 80%!');
  if (threshold?.level === 'critical') toast.error('Ngan sach da vuot 100%!');
}, [threshold]);
```

### Step 11: Update Types

In `frontend/src/types/index.ts`, add at the end:

```typescript
// BUDGET EVENT
export enum BudgetEventCategory {
  FIXED_AD = 'FIXED_AD',
  AD_SERVICE = 'AD_SERVICE',
  CONTENT = 'CONTENT',
  DESIGN = 'DESIGN',
  MEDIA = 'MEDIA',
  OTHER = 'OTHER',
}

export enum BudgetEventStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}
```

## Todo List

- [x] Step 1: Add enums and fields to Prisma schema
- [x] Step 2: Generate and run Prisma migration
- [x] Step 3: Update backend DTO (category, status, UpdateBudgetEventStatusDto)
- [x] Step 4: Update backend service (updateStatus, recalcSpent, getThreshold)
- [x] Step 5: Update backend controller (PATCH status, GET threshold)
- [x] Step 6: Update frontend API client (types, labels, new endpoints)
- [x] Step 7: Update frontend hook (useUpdateBudgetEventStatus, useBudgetThreshold)
- [x] Step 8: Create budget donut chart component
- [x] Step 9: Create spending ticket modal component
- [x] Step 10: Redesign budget tab in project detail page
- [x] Step 11: Add enums to frontend types/index.ts

## Success Criteria

1. `npx prisma migrate dev` succeeds with new migration
2. `POST /projects/:id/budget-events` accepts `category` field
3. `PATCH /projects/:id/budget-events/:eventId/status` updates status; only ADMIN/PM/NVKD/SUPER_ADMIN
4. `GET /projects/:id/budget-events/threshold` returns `{ level, percent }`
5. After approving a SPEND event, `ProjectBudget.spentAmount` auto-recalculates
6. Budget tab shows 3-column summary, donut chart, filterable table
7. Toast fires at 80% and 100% threshold
8. Creating ticket via modal works and refreshes data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing budget events lack `category` field | Migration fails | Make `category` nullable OR set default `OTHER` in migration |
| Decimal precision on aggregate SUM | Wrong totals | Use `Decimal` throughout, cast only at API boundary |
| Concurrent status updates | Race condition on spentAmount recalc | Use Prisma transaction in `updateStatus` |

**Recommendation:** Set `category` default to `OTHER` for existing rows:
```sql
ALTER TABLE budget_events ADD COLUMN category TEXT NOT NULL DEFAULT 'OTHER';
```

## Security Considerations

- `PATCH /:id/status` restricted to `SUPER_ADMIN, ADMIN, PM, NVKD` via `@Roles()` decorator
- Budget event creation remains JWT-guarded (any authenticated user)
- Threshold endpoint is read-only, no extra restriction needed
- Input validation via `class-validator` decorators on all DTOs
- `amount` validated as number; negative amounts should be rejected (`@Min(0)`)

## Next Steps

- After Phase 1, proceed to Phase 4 which follows the same service/controller/DTO pattern for `AdsReport`
- Consider adding email/Telegram notification when threshold is hit
- Budget approval could integrate with the existing `Approval` model for audit trail
