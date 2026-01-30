# ADR-0001: Adopt Clean Architecture Pattern

## Status

Accepted

## Context

The PMS (Project Management System) is a NestJS-based monolithic application designed to manage projects, tasks, team members, and approval workflows for an advertising agency. The system currently handles approximately 25 Prisma models and 15+ modules, supporting multiple user roles and complex business logic.

When designing the application architecture, we evaluated several architectural patterns:

1. **Model-View-Controller (MVC)**: Traditional pattern with tight coupling between layers
2. **Clean Architecture (Hexagonal/Ports-and-Adapters)**: Dependency rule with layers pointing inward
3. **Microservices Architecture**: Distributed services with independent deployments

Key considerations:

- The system is a monolithic application (not distributed)
- Complex business logic spanning multiple domains (projects, tasks, approvals, media planning)
- Need for high testability and maintainability
- Team familiarity with layered architectures
- Future scalability requirements without immediate need for microservices
- Integration with external services (email, file storage, payment gateways)

## Decision

We will adopt **Clean Architecture** with the Hexagonal/Ports-and-Adapters pattern, implementing four distinct layers:

1. **Domain Layer** (innermost): Contains business entities, domain logic, and interfaces (ports)
2. **Application Layer**: Contains use cases, DTOs, and application-specific business rules
3. **Infrastructure Layer**: Contains implementations of ports (adapters), external service integrations, database access
4. **Presentation Layer** (outermost): Contains controllers, REST APIs, GraphQL resolvers

**Dependency Rule**: Dependencies point inward only. The Domain layer has no dependencies on outer layers. Application layer depends only on Domain. Infrastructure and Presentation layers depend on Application and Domain.

**Implementation Guidelines**:
- Use dependency injection to wire adapters to ports
- Define repository interfaces in Domain/Application layer
- Implement repositories in Infrastructure layer using Prisma
- Keep controllers thin - delegate to use cases in Application layer
- Use DTOs for data transfer between layers

## Consequences

### Positive

- **Better Testability**: Business logic can be tested independently by mocking infrastructure dependencies
- **Clear Boundaries**: Each layer has well-defined responsibilities, reducing cognitive load
- **Technology Independence**: Easy to swap ORM, framework, or external services without touching business logic
- **Maintainability**: Changes to business rules are isolated to Domain/Application layers
- **Scalability Path**: Clean boundaries make it easier to extract microservices later if needed
- **Team Collaboration**: Multiple developers can work on different layers with minimal conflicts

### Negative

- **More Boilerplate**: Requires more files and abstractions than simple MVC (interfaces, DTOs, mappers)
- **Steeper Learning Curve**: Team members need to understand layer responsibilities and dependency rules
- **Initial Development Overhead**: Takes more time to set up initial structure compared to MVC
- **Potential Over-Engineering**: For simple CRUD operations, the layering may feel excessive

### Risks and Mitigations

- **Risk**: Developers may bypass layers and create direct dependencies
  - **Mitigation**: Enforce architectural constraints through code reviews and linting rules

- **Risk**: Inconsistent application of pattern across modules
  - **Mitigation**: Provide reference implementation (e.g., MediaPlan module) and documentation

- **Risk**: Performance overhead from mapping between layers
  - **Mitigation**: Use efficient mapping libraries and only map when crossing layer boundaries

## Related Decisions

- ADR-0002: NestJS Framework Selection (NestJS DI container supports Clean Architecture)
- ADR-0003: Prisma ORM Selection (Prisma implements Infrastructure layer)
- ADR-0006: Repository Pattern for MediaPlan Module (reference implementation)

## Notes

The MediaPlan module serves as the reference implementation of Clean Architecture in this codebase, demonstrating:
- Repository interfaces in domain layer
- Use case classes in application layer
- Prisma repository implementation in infrastructure layer
- Thin controllers delegating to use cases

Other modules are gradually being refactored to follow this pattern.
