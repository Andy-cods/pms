# Media Plan Management Module (Clean Architecture)

## Overview

The Media Plan module manages advertising media plans, campaign line items, and budget allocation using **Clean Architecture with the Repository Pattern**. This module serves as the **reference implementation** of Clean Architecture in the PMS codebase, demonstrating proper separation of domain, application, and infrastructure layers.

## Architecture

This module implements **Clean Architecture layers** with dependency injection:

```
┌─────────────────────────────────────────┐
│  Presentation Layer                     │
│  - Controllers (HTTP endpoints)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Application Layer                      │
│  - MediaPlanService (business logic)    │
│  - DTOs (data transfer objects)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Domain Layer                           │
│  - IMediaPlanRepository (interface)     │
│  - Domain models & types                │
└─────────────────────────────────────────┘
              ↑ (implements)
┌─────────────────────────────────────────┐
│  Infrastructure Layer                   │
│  - PrismaMediaPlanRepository (impl)     │
│  - PrismaService                        │
└─────────────────────────────────────────┘
```

**Key Design:** The application layer depends on the repository **interface** (not implementation), enabling:
- Easy unit testing with mock repositories
- Swapping ORMs without changing business logic
- Clear separation of concerns

## Key Components

### Application Layer

**`MediaPlanService`** (`application/services/media-plan.service.ts`)
- Business logic for media plan CRUD
- Budget validation and calculations
- Access control and authorization
- Line item management
- Integration with `BudgetEventService`

**Dependency Injection:**
```typescript
constructor(
  @Inject(MEDIA_PLAN_REPOSITORY)
  private readonly repository: IMediaPlanRepository,
  private readonly prisma: PrismaService,
) {}
```

### Domain Layer

**`IMediaPlanRepository`** (`domain/ports/media-plan.repository.ts`)
- Repository interface defining data access contracts
- **NO IMPLEMENTATION** - only method signatures
- Independent of Prisma or any ORM

**Repository Methods:**
```typescript
interface IMediaPlanRepository {
  findById(id: string, projectId: string): Promise<MediaPlanWithItems | null>;
  findAll(filters: MediaPlanFilters): Promise<{ data: MediaPlanWithItems[]; total: number }>;
  create(data: CreateMediaPlanData): Promise<MediaPlanWithItems>;
  update(id: string, data: UpdateMediaPlanData): Promise<MediaPlanWithItems>;
  delete(id: string): Promise<void>;
  createItem(data: CreateMediaPlanItemData): Promise<MediaPlanItem>;
  updateItem(id: string, data: UpdateMediaPlanItemData): Promise<MediaPlanItem>;
  deleteItem(id: string): Promise<void>;
  reorderItems(mediaPlanId: string, itemIds: string[]): Promise<void>;
}
```

### Infrastructure Layer

**`PrismaMediaPlanRepository`** (`infrastructure/database/repositories/prisma-media-plan.repository.ts`)
- Implements `IMediaPlanRepository` interface
- Uses `PrismaService` for database access
- Handles Prisma-specific query logic

**DI Token:** `MEDIA_PLAN_REPOSITORY` (defined in module)

## API Endpoints

### GET `/projects/:projectId/media-plans`
**Description:** List media plans for a project
**Query Parameters:**
- `status`: Filter by status (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
- `type`: Filter by type (MONTHLY, QUARTERLY, CAMPAIGN)
- `month`, `year`: Filter by planning period
- `search`: Text search in name
- `page`, `limit`: Pagination
- `sortBy`, `sortOrder`: Sorting

### GET `/projects/:projectId/media-plans/:id`
**Description:** Get single media plan with all line items
**Returns:** Media plan with:
- `items[]` - Line items (channels, campaigns)
- `itemCount` - Number of line items
- `allocatedBudget` - Sum of all line item budgets
- `createdBy` - User who created the plan

### POST `/projects/:projectId/media-plans`
**Description:** Create new media plan
**Roles:** PM, MEDIA, PLANNER, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "name": "Q1 2026 Media Plan",
  "type": "QUARTERLY",
  "month": 1,
  "year": 2026,
  "totalBudget": 50000,
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "notes": "Focus on digital channels"
}
```
**Auto-Actions:**
- Creates media plan with `status: DRAFT`, `version: 1`
- Logs budget allocation event (ALLOC) to `BudgetEvent` table

### PATCH `/projects/:projectId/media-plans/:id`
**Description:** Update media plan
**Roles:** PM, MEDIA, PLANNER, ADMIN, SUPER_ADMIN
**Request Body:**
```json
{
  "name": "Q1 2026 Media Plan (Revised)",
  "totalBudget": 55000,
  "status": "ACTIVE"
}
```
**Auto-Actions:**
- If `totalBudget` changed, logs ADJUST event to `BudgetEvent` table

### DELETE `/projects/:projectId/media-plans/:id`
**Description:** Delete media plan
**Roles:** PM, MEDIA, PLANNER, ADMIN, SUPER_ADMIN

### Line Item Management

**POST `/projects/:projectId/media-plans/:mediaPlanId/items`**
- **Description:** Add campaign line item to media plan
- **Request Body:**
```json
{
  "channel": "Facebook Ads",
  "campaignType": "Traffic",
  "objective": "Drive website traffic",
  "budget": 10000,
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "targetReach": 50000,
  "targetClicks": 5000,
  "targetLeads": 500,
  "targetCPL": 20,
  "targetCPC": 2,
  "targetROAS": 3.5
}
```

**PATCH `/projects/:projectId/media-plans/:mediaPlanId/items/:itemId`**
- **Description:** Update line item

**DELETE `/projects/:projectId/media-plans/:mediaPlanId/items/:itemId`**
- **Description:** Remove line item

**PATCH `/projects/:projectId/media-plans/:mediaPlanId/items/reorder`**
- **Description:** Reorder line items
- **Request Body:**
```json
{
  "itemIds": ["item-uuid-1", "item-uuid-2", "item-uuid-3"]
}
```

## Business Rules & Domain Logic

### Media Plan Types

1. **MONTHLY** - Single month planning
2. **QUARTERLY** - 3-month planning period
3. **CAMPAIGN** - Specific campaign (custom dates)

### Media Plan Statuses

```
DRAFT → ACTIVE → COMPLETED → ARCHIVED
```

- **DRAFT:** Plan being created, not yet active
- **ACTIVE:** Plan in execution
- **COMPLETED:** All campaigns finished
- **ARCHIVED:** Historical record

### Budget Tracking

**Total Budget vs. Allocated Budget:**
- `totalBudget`: Overall budget for the media plan
- `allocatedBudget`: SUM of all line item budgets

**Validation:**
- System allows `allocatedBudget > totalBudget` (over-allocation warning)
- Business logic should validate before setting status to ACTIVE

**Integration with BudgetEvent:**
```typescript
// On create
BudgetEvent.create({
  type: 'ALLOC',
  amount: totalBudget,
  note: 'Khởi tạo kế hoạch media'
});

// On update (if budget changed)
BudgetEvent.create({
  type: 'ADJUST',
  amount: newTotalBudget,
  note: 'Điều chỉnh ngân sách kế hoạch media'
});
```

### Line Item Fields

**Required:**
- `channel`: Advertising channel (Facebook, Google, TikTok, etc.)
- `campaignType`: Campaign type (Traffic, Conversion, Awareness, etc.)
- `objective`: Campaign objective (text description)
- `budget`: Line item budget
- `startDate`, `endDate`: Campaign duration

**Optional (Performance Targets):**
- `targetReach`: Expected audience reach
- `targetClicks`: Expected clicks
- `targetLeads`: Expected lead generation
- `targetCPL`: Target cost-per-lead
- `targetCPC`: Target cost-per-click
- `targetROAS`: Target return on ad spend

**Auto-Generated:**
- `orderIndex`: Used for reordering items (auto-set based on creation order)

### Access Control

**Who Can Create/Edit Media Plans:**
- **PM** (Project Manager)
- **MEDIA** (Media specialist)
- **PLANNER**
- **ADMIN**, **SUPER_ADMIN**

**Who Can View:**
- All team members on the project
- Admin users

**Project Access Validation:**
- Service checks if user is project team member
- Throws `ForbiddenException` if not authorized

### Date Validation

**Business Rule:** `endDate` must be after `startDate`

Validated in service layer:
```typescript
private validateDates(startDate: string, endDate: string): void {
  if (new Date(endDate) < new Date(startDate)) {
    throw new BadRequestException('End date must be after start date');
  }
}
```

## Repository Pattern Implementation

### Why Repository Pattern?

This module implements the Repository Pattern (ADR-0006) to:
1. **Decouple** business logic from data access
2. **Enable** easy unit testing with mock repositories
3. **Allow** swapping Prisma for another ORM without changing service code
4. **Enforce** Clean Architecture principles

### Repository Interface (Domain Layer)

Located in `domain/ports/media-plan.repository.ts`:
```typescript
export const MEDIA_PLAN_REPOSITORY = 'MEDIA_PLAN_REPOSITORY';

export interface IMediaPlanRepository {
  findById(id: string, projectId: string): Promise<MediaPlanWithItems | null>;
  findAll(filters: MediaPlanFilters): Promise<PaginatedResult<MediaPlanWithItems>>;
  create(data: CreateMediaPlanData): Promise<MediaPlanWithItems>;
  update(id: string, data: UpdateMediaPlanData): Promise<MediaPlanWithItems>;
  // ... other methods
}
```

### Repository Implementation (Infrastructure Layer)

Located in `infrastructure/database/repositories/`:
```typescript
@Injectable()
export class PrismaMediaPlanRepository implements IMediaPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, projectId: string): Promise<MediaPlanWithItems | null> {
    return this.prisma.mediaPlan.findUnique({
      where: { id, projectId },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ... other implementations
}
```

### Dependency Injection Setup

In `media-plan.module.ts`:
```typescript
@Module({
  providers: [
    {
      provide: MEDIA_PLAN_REPOSITORY,
      useClass: PrismaMediaPlanRepository,
    },
    MediaPlanService,
  ],
  // ...
})
export class MediaPlanModule {}
```

### Service Usage

In `MediaPlanService`:
```typescript
@Injectable()
export class MediaPlanService {
  constructor(
    @Inject(MEDIA_PLAN_REPOSITORY)
    private readonly repository: IMediaPlanRepository,
    private readonly prisma: PrismaService,  // Only for project access check
  ) {}

  async findById(projectId: string, id: string, user: AuthUser): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user);
    const plan = await this.repository.findById(id, projectId);
    if (!plan) throw new NotFoundException('Media plan not found');
    return this.mapToResponse(plan);
  }
}
```

## Testing Strategy

### Unit Testing Services (with Mock Repository)

```typescript
describe('MediaPlanService', () => {
  let service: MediaPlanService;
  let repository: IMediaPlanRepository;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      // ... mock all methods
    };
    service = new MediaPlanService(repository, mockPrismaService);
  });

  it('should return media plan by id', async () => {
    const mockPlan = { id: '1', name: 'Q1 Plan', /* ... */ };
    jest.spyOn(repository, 'findById').mockResolvedValue(mockPlan);

    const result = await service.findById('project-1', '1', mockUser);

    expect(result.id).toBe('1');
    expect(repository.findById).toHaveBeenCalledWith('1', 'project-1');
  });
});
```

### Integration Testing Repositories (with Test Database)

```typescript
describe('PrismaMediaPlanRepository', () => {
  let repository: PrismaMediaPlanRepository;

  it('should create media plan with line items', async () => {
    const result = await repository.create({
      projectId: 'test-project',
      name: 'Q1 Media Plan',
      totalBudget: 50000,
      // ...
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Q1 Media Plan');
  });
});
```

## Dependencies

### Internal Dependencies
- `PrismaService` - Database access (only in repository implementation)
- `BudgetEventService` - Budget event logging

### External Dependencies
- Prisma Client - ORM (only in infrastructure layer)
- NestJS decorators - DI, guards, validation

## Related ADRs

- **ADR-0006: Repository Pattern for MediaPlan Module** - Complete repository pattern design
- **ADR-0001: Clean Architecture Pattern** - Overall architecture principles
- **ADR-0003: Prisma ORM Selection** - ORM choice for repository implementation

## Data Model Highlights

### MediaPlan Entity

**Fields:**
- `id`, `projectId`, `name`, `type`, `status`
- `month`, `year`: Planning period
- `version`: Plan version (for revision tracking)
- `totalBudget`: Overall budget
- `startDate`, `endDate`: Plan duration
- `notes`: Optional notes
- `createdById`: User who created the plan

**Relations:**
- `project`: Project relation
- `items[]`: MediaPlanItem[] (line items)
- `createdBy`: User relation
- `budgetEvents[]`: BudgetEvent[] (allocation/adjustment history)

### MediaPlanItem Entity

**Fields:**
- `id`, `mediaPlanId`
- `channel`, `campaignType`, `objective`
- `budget`, `startDate`, `endDate`
- `targetReach`, `targetClicks`, `targetLeads`
- `targetCPL`, `targetCPC`, `targetROAS`
- `status`: Item status (PENDING, ACTIVE, PAUSED, COMPLETED)
- `orderIndex`: Display order (for drag-drop reordering)

## Future Enhancements

- **Version Control:** Implement plan versioning for revision history
- **Budget Alerts:** Notify when allocatedBudget exceeds totalBudget
- **Template System:** Save media plans as templates for reuse
- **Performance Tracking:** Link actual campaign results to line items
- **Automated Optimization:** Suggest budget reallocation based on performance
