# ADR-0002: NestJS Framework Selection

## Status

Accepted

## Context

The PMS application requires a robust backend framework to handle complex business logic, user authentication, role-based access control, and integration with external services. The system needs to support:

- Multiple user roles (7 internal staff roles + external client role)
- RESTful API with comprehensive validation
- Dependency injection for testability
- Guards and interceptors for cross-cutting concerns
- Swagger/OpenAPI documentation
- WebSocket support for real-time features (future requirement)

We evaluated four major Node.js frameworks:

1. **Express.js**: Minimalist, unopinionated framework with large ecosystem
2. **Fastify**: Performance-focused framework with plugin architecture
3. **NestJS**: Angular-inspired framework with built-in DI, decorators, and module system
4. **Hono**: Lightweight edge-compatible framework

Key evaluation criteria:

- TypeScript support and developer experience
- Built-in dependency injection
- Architectural structure and scalability
- Ecosystem and third-party integrations
- Team familiarity and learning curve
- Performance characteristics

## Decision

We will use **NestJS 11** as the backend framework for the PMS application.

**Key Features Leveraged**:

- **Module System**: Organize code into feature modules (projects, tasks, approvals, media-plan)
- **Dependency Injection**: Built-in IoC container for managing dependencies and testability
- **Decorators**: Clean, declarative syntax for routing, validation, guards, and interceptors
- **Guards**: Built-in support for authentication and authorization (JWT guards, role guards)
- **Interceptors**: Cross-cutting concerns like logging, transformation, error handling
- **Pipes**: Request validation using class-validator and class-transformer
- **Swagger Integration**: Auto-generate API documentation with `@nestjs/swagger`
- **First-Class TypeScript**: Built for TypeScript from the ground up

**Framework Version**: NestJS 11.x (latest stable)

**Core Packages**:
- `@nestjs/core`, `@nestjs/common`: Core framework
- `@nestjs/platform-express`: Express adapter (can swap to Fastify if needed)
- `@nestjs/jwt`: JWT authentication
- `@nestjs/passport`: Passport.js integration
- `@nestjs/swagger`: API documentation
- `@nestjs/config`: Configuration management

## Consequences

### Positive

- **Structured Architecture**: Opinionated structure prevents inconsistency across modules
- **Excellent TypeScript Support**: Strong typing reduces runtime errors and improves IDE support
- **Built-in DI Container**: Makes testing easier with mock dependencies
- **Decorator-Based Routing**: Clean, readable controller definitions
- **Guards and Interceptors**: Built-in patterns for authentication, authorization, logging, error handling
- **Swagger Integration**: Auto-generated API documentation stays in sync with code
- **Large Ecosystem**: Extensive third-party packages (Prisma, Redis, Bull queues, etc.)
- **Microservices Ready**: Can split into microservices using NestJS microservices package
- **Active Community**: Strong community support and regular updates

### Negative

- **Steeper Learning Curve**: More concepts to learn (modules, providers, decorators) compared to Express
- **More Boilerplate**: Requires more setup than minimalist frameworks like Express or Hono
- **Abstraction Overhead**: Multiple layers of abstraction can make debugging harder for beginners
- **Performance**: Slightly slower than Fastify or Hono (acceptable for business applications)
- **Opinionated Structure**: Less flexibility for unconventional architectures

### Neutral

- **Express Under the Hood**: Uses Express by default (can swap to Fastify adapter for performance)
- **Learning Curve Offset**: Team familiarity with Angular/TypeScript reduces ramp-up time
- **Framework Lock-in**: Significant refactoring required to migrate away from NestJS

## Alternatives Considered

### Express.js
- **Pros**: Minimal, flexible, huge ecosystem, team familiarity
- **Cons**: No built-in DI, requires manual setup for structure, validation, error handling
- **Reason Not Chosen**: Too much manual setup for enterprise-grade features

### Fastify
- **Pros**: Better performance, schema-based validation, plugin architecture
- **Cons**: Smaller ecosystem, less opinionated structure, no built-in DI
- **Reason Not Chosen**: Lack of built-in DI and architectural guidance

### Hono
- **Pros**: Ultra-lightweight, edge-compatible, great performance
- **Cons**: Too minimal for complex applications, no DI, small ecosystem
- **Reason Not Chosen**: Designed for edge computing, not enterprise monoliths

## Related Decisions

- ADR-0001: Clean Architecture Pattern (NestJS DI supports Clean Architecture)
- ADR-0003: Prisma ORM Selection (NestJS integrates well with Prisma)
- ADR-0004: JWT Authentication Strategy (NestJS Passport integration)

## Notes

NestJS's Angular-inspired design patterns align well with the team's TypeScript expertise and the need for a structured, maintainable codebase. The built-in DI container is critical for implementing Clean Architecture (ADR-0001) and the Repository Pattern (ADR-0006).

The framework's opinionated nature is considered a feature, not a limitation, as it enforces consistency across the 15+ modules in the application.
