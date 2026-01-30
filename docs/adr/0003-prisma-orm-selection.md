# ADR-0003: Prisma ORM Selection

## Status

Accepted

## Context

The PMS application requires a robust Object-Relational Mapping (ORM) solution to interact with the PostgreSQL 16 database. The system manages approximately 25 models with complex relationships:

- Projects, tasks, and subtasks with hierarchical relationships
- Users with role-based permissions (7 internal roles + client role)
- Approval workflows with multi-stage transitions
- Media plans with budget tracking and line items
- Audit logs and activity tracking

Key requirements for the ORM:

- **Type Safety**: Strong TypeScript support to prevent runtime errors
- **Migration Management**: Schema versioning and safe database migrations
- **Query Performance**: Efficient queries with support for joins, filtering, pagination
- **Developer Experience**: Intuitive API and good documentation
- **Relationship Handling**: Support for one-to-many, many-to-many, and self-referential relations
- **Transaction Support**: ACID compliance for critical operations

We evaluated four options:

1. **TypeORM**: Mature ORM with Active Record and Data Mapper patterns
2. **Drizzle ORM**: Lightweight, SQL-like ORM with excellent TypeScript inference
3. **Prisma**: Schema-first ORM with auto-generated TypeScript client
4. **Raw SQL with pg**: Direct PostgreSQL driver without ORM abstraction

## Decision

We will use **Prisma 7** as the ORM for the PMS application.

**Key Features Leveraged**:

- **Schema-First Approach**: Single source of truth in `schema.prisma` file
- **Auto-Generated Client**: Type-safe client generated from schema
- **Migration System**: `prisma migrate` for version-controlled schema changes
- **Prisma Studio**: Visual database browser for development and debugging
- **Query Optimization**: Automatic query optimization and connection pooling
- **Relation Queries**: Intuitive API for nested reads and writes
- **Middleware**: Hooks for logging, soft deletes, and audit trails

**Version**: Prisma 7.x (latest stable)

**Core Packages**:
- `@prisma/client`: Generated TypeScript client
- `prisma`: CLI tool for migrations and schema management

## Consequences

### Positive

- **Excellent Type Safety**: Auto-generated types eliminate type mismatches between code and database
- **Schema as Documentation**: `schema.prisma` serves as clear documentation of data model
- **Migration Safety**: Prisma detects schema changes and generates safe migrations
- **Developer Experience**: Intuitive API reduces boilerplate (e.g., `prisma.user.findUnique()`)
- **Relation Handling**: Nested reads/writes handle complex relationships elegantly
- **Prisma Studio**: Visual tool for exploring and editing data during development
- **Active Development**: Frequent updates with performance improvements and new features
- **NestJS Integration**: Excellent integration with NestJS via `PrismaService`
- **Single Source of Truth**: Schema file prevents drift between models and database

### Negative

- **Less SQL Control**: Complex queries may require raw SQL with `prisma.$queryRaw`
- **Schema Rigidity**: Schema changes require migration generation (not as flexible as query builders)
- **Bundle Size**: Generated client adds to bundle size (not relevant for backend)
- **Learning Curve**: Prisma-specific syntax differs from traditional ORMs and SQL
- **Migration Conflicts**: Multiple developers changing schema can cause merge conflicts in migrations

### Neutral

- **Connection Pooling**: Prisma handles pooling internally (less control than `pg-pool`)
- **Performance**: Slightly slower than raw SQL but faster than TypeORM for most operations
- **Vendor Lock-in**: Switching ORMs requires significant refactoring of data access layer

## Alternatives Considered

### TypeORM
- **Pros**: Mature, supports Active Record pattern, extensive features
- **Cons**: Less type-safe, verbose syntax, migration issues, slower queries
- **Reason Not Chosen**: Weaker TypeScript support and developer experience

### Drizzle ORM
- **Pros**: Excellent TypeScript inference, SQL-like syntax, lightweight
- **Cons**: Smaller ecosystem, less mature, fewer community resources
- **Reason Not Chosen**: Newer project with less production usage

### Raw SQL with pg
- **Pros**: Maximum control, best performance, no abstraction overhead
- **Cons**: No type safety, manual query building, no migration tooling, verbose code
- **Reason Not Chosen**: Too low-level for a large application with 25 models

## Related Decisions

- ADR-0001: Clean Architecture Pattern (Prisma implements Infrastructure layer)
- ADR-0002: NestJS Framework Selection (Prisma integrates well with NestJS)
- ADR-0006: Repository Pattern for MediaPlan Module (Prisma repository implementation)

## Notes

### Schema Organization

The `schema.prisma` file is organized by domain:

```prisma
// User Management
model User { ... }
model Role { ... }

// Project Management
model Project { ... }
model Task { ... }

// Media Planning
model MediaPlan { ... }
model MediaPlanLineItem { ... }
```

### Migration Strategy

- **Development**: Use `prisma migrate dev` to create and apply migrations
- **Production**: Use `prisma migrate deploy` in CI/CD pipeline
- **Schema Changes**: Always create migrations, never edit database directly

### Performance Optimization

- Use `select` to limit returned fields
- Use `include` judiciously to avoid N+1 queries
- Leverage Prisma's query optimization for complex joins
- Use raw SQL (`$queryRaw`) for complex analytical queries

The schema file serves as the single source of truth for the entire data model, with the generated Prisma client providing type-safe access throughout the application.
