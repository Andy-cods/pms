# ADR-0006: Repository Pattern for MediaPlan Module

## Status

Accepted

## Context

The MediaPlan module is a core component of the PMS application, managing advertising media plans, budget allocation, and line items. As part of implementing Clean Architecture (ADR-0001), we need to decouple the business logic from the data access layer.

**Current State**:
- Most modules directly inject `PrismaService` into service classes
- Business logic and database queries are mixed in service methods
- Difficult to unit test services without mocking Prisma client
- No clear boundary between Application and Infrastructure layers

**MediaPlan Module Requirements**:
- Complex queries with multiple relations (line items, projects, clients)
- Budget calculations and aggregations
- Transaction support for atomic updates
- Need for comprehensive unit testing without database dependency

We evaluated three approaches:

1. **Direct PrismaService Usage**: Continue injecting `PrismaService` directly into services
2. **Repository Pattern with Interface**: Define repository interface in domain layer, implement in infrastructure
3. **Generic Repository**: Create a generic repository base class for all entities

## Decision

We will implement the **Repository Pattern with dependency injection token** for the MediaPlan module, serving as a reference implementation for Clean Architecture in the codebase.

### Architecture

**Domain Layer** (`src/domain/repositories`):
- Define `IMediaPlanRepository` interface
- Define repository method signatures (independent of Prisma)
- No implementation details, only contracts

**Infrastructure Layer** (`src/infrastructure/database/repositories`):
- Implement `PrismaMediaPlanRepository` class
- Inject `PrismaService` dependency
- Implement all methods defined in `IMediaPlanRepository`

**Application Layer** (`src/application/services`):
- Inject `IMediaPlanRepository` via DI token `MEDIA_PLAN_REPOSITORY`
- Depend only on interface, not implementation
- Business logic uses repository methods, not Prisma client directly

**Presentation Layer** (`src/presentation/controllers`):
- Controllers inject service classes (not repositories)
- Thin controllers delegating to application services

### Implementation Details

**Repository Interface** (`src/domain/repositories/media-plan.repository.interface.ts`):

```typescript
export interface IMediaPlanRepository {
  findById(id: string): Promise<MediaPlan | null>;
  findAll(filters?: MediaPlanFilters): Promise<MediaPlan[]>;
  findByProjectId(projectId: string): Promise<MediaPlan[]>;
  create(data: CreateMediaPlanDto): Promise<MediaPlan>;
  update(id: string, data: UpdateMediaPlanDto): Promise<MediaPlan>;
  delete(id: string): Promise<void>;
  calculateTotalBudget(id: string): Promise<number>;
}
```

**Repository Implementation** (`src/infrastructure/database/repositories/prisma-media-plan.repository.ts`):

```typescript
@Injectable()
export class PrismaMediaPlanRepository implements IMediaPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MediaPlan | null> {
    return this.prisma.mediaPlan.findUnique({
      where: { id },
      include: { lineItems: true, project: true }
    });
  }

  // ... other methods
}
```

**Dependency Injection Setup** (`src/media-plan/media-plan.module.ts`):

```typescript
export const MEDIA_PLAN_REPOSITORY = 'MEDIA_PLAN_REPOSITORY';

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

**Service Usage** (`src/application/services/media-plan.service.ts`):

```typescript
@Injectable()
export class MediaPlanService {
  constructor(
    @Inject(MEDIA_PLAN_REPOSITORY)
    private readonly repository: IMediaPlanRepository,
  ) {}

  async getMediaPlan(id: string): Promise<MediaPlan> {
    const mediaPlan = await this.repository.findById(id);
    if (!mediaPlan) throw new NotFoundException('Media plan not found');
    return mediaPlan;
  }

  // ... business logic methods
}
```

## Consequences

### Positive

- **Full Clean Architecture Compliance**: Clear separation between domain, application, and infrastructure layers
- **Testability**: Services can be unit tested with mock repository implementations
- **Flexibility**: Easy to swap Prisma for another ORM (e.g., TypeORM, Drizzle) by implementing new repository
- **Clear Contracts**: Repository interface serves as clear API documentation
- **Dependency Inversion**: Application layer depends on abstractions (interfaces), not concrete implementations
- **Reference Implementation**: MediaPlan module serves as example for refactoring other modules
- **Type Safety**: Repository methods are strongly typed, reducing runtime errors

### Negative

- **More Boilerplate**: Requires interface definition, implementation class, and DI setup
- **Learning Curve**: Team members need to understand repository pattern and DI tokens
- **Initial Overhead**: Takes more time to set up compared to direct `PrismaService` injection
- **Inconsistency**: Other modules still use `PrismaService` directly (gradual migration needed)

### Neutral

- **Testing Trade-off**: Unit testing becomes easier, but integration testing still requires database
- **Abstraction Layer**: Adds one more layer between service and database (minimal performance impact)

## Testing Benefits

### Unit Testing Services

```typescript
describe('MediaPlanService', () => {
  let service: MediaPlanService;
  let repository: IMediaPlanRepository;

  beforeEach(() => {
    // Mock repository implementation
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      // ... other methods
    };

    service = new MediaPlanService(repository);
  });

  it('should return media plan by id', async () => {
    const mockMediaPlan = { id: '1', name: 'Q1 Campaign' };
    jest.spyOn(repository, 'findById').mockResolvedValue(mockMediaPlan);

    const result = await service.getMediaPlan('1');

    expect(result).toEqual(mockMediaPlan);
    expect(repository.findById).toHaveBeenCalledWith('1');
  });
});
```

### Integration Testing Repositories

```typescript
describe('PrismaMediaPlanRepository', () => {
  let repository: PrismaMediaPlanRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Set up test database
  });

  it('should create media plan with line items', async () => {
    const data = {
      name: 'Q1 Campaign',
      projectId: 'project-1',
      lineItems: [{ platform: 'Facebook', budget: 1000 }]
    };

    const result = await repository.create(data);

    expect(result.id).toBeDefined();
    expect(result.lineItems).toHaveLength(1);
  });
});
```

## Migration Strategy

The repository pattern will be gradually adopted across modules:

1. **Phase 1**: MediaPlan module (reference implementation) ✅
2. **Phase 2**: Project module (high complexity, high value)
3. **Phase 3**: Task module (medium complexity)
4. **Phase 4**: User/Auth modules (low complexity)
5. **Phase 5**: Remaining modules (as needed)

### Guidelines for Other Modules

- Copy the structure from MediaPlan module
- Define repository interface in domain layer
- Implement Prisma repository in infrastructure layer
- Use DI tokens for injection
- Write unit tests with mock repositories

## Alternatives Considered

### Direct PrismaService Usage

**Pros**: Simple, minimal boilerplate, direct access to Prisma features

**Cons**: Tight coupling to Prisma, difficult to unit test, violates Clean Architecture

**Reason Not Chosen**: Doesn't support Clean Architecture goals (ADR-0001)

### Generic Repository Pattern

**Pros**: Single repository implementation for all entities, less code duplication

**Cons**: Loses type safety, difficult to add entity-specific methods, abstraction too high

**Reason Not Chosen**: Sacrifices type safety and flexibility for minimal code savings

### Active Record Pattern

**Pros**: Models contain their own persistence logic, less boilerplate

**Cons**: Violates Clean Architecture, couples domain models to database, difficult to test

**Reason Not Chosen**: Incompatible with Clean Architecture and Prisma's design

## Related Decisions

- ADR-0001: Clean Architecture Pattern (Repository pattern implements Infrastructure layer)
- ADR-0003: Prisma ORM Selection (Prisma implements repository)
- ADR-0002: NestJS Framework Selection (NestJS DI supports repository injection)

## Notes

### Repository Method Naming Conventions

- **find**: Returns single entity or null (`findById`, `findByEmail`)
- **findAll**: Returns array of entities (`findAll`, `findByProjectId`)
- **create**: Creates new entity
- **update**: Updates existing entity
- **delete**: Removes entity
- **count**: Returns count of entities
- **exists**: Returns boolean

### When to Add Custom Repository Methods

Add custom methods to repository when:
- Complex query logic specific to the entity
- Aggregations or calculations requiring database-level operations
- Transaction management needed
- Query performance optimizations (e.g., custom indexes, raw SQL)

### Repository vs. Service Responsibilities

**Repository Responsibilities**:
- CRUD operations
- Database queries and filtering
- Transaction management
- Data persistence concerns

**Service Responsibilities**:
- Business logic and validation
- Orchestration of multiple repositories
- Authorization checks
- Application-level calculations

The MediaPlan repository pattern serves as the gold standard for implementing Clean Architecture in the PMS codebase, with other modules gradually adopting this pattern over time.
