# ADR-0005: Unified Project Entity

## Status

Accepted

## Context

The PMS application manages the complete lifecycle of advertising projects from initial lead capture through final delivery. Projects transition through multiple stages:

**Sales Pipeline**:
1. **LEAD**: Initial contact or inquiry from potential client
2. **QUALIFIED**: Lead has been assessed and meets criteria for pursuit
3. **WON**: Client has agreed to proceed with project

**Project Execution**:
4. **PLANNING**: Project scope, timeline, and resources being defined
5. **UNDER_REVIEW**: Plans are being reviewed by stakeholders
6. **PROPOSAL_PITCH**: Formal proposal being presented to client

**Delivery**:
7. **ONGOING**: Active project execution and deliverable creation
8. **FINAL_REVIEW**: Final deliverables under review
9. **COMPLETED**: All deliverables approved and delivered
10. **CLOSED**: Project closed, invoiced, and archived

We evaluated two architectural approaches:

1. **Separate Entities**: Distinct entities for Lead, Opportunity, and Project with data migration between stages
2. **Unified Entity**: Single Project entity with `status` and `stage` fields to track lifecycle position

Key considerations:

- **Data Continuity**: Information captured at lead stage must be available throughout lifecycle
- **Reporting**: Need to analyze conversion rates across stages (lead → qualified → won → completed)
- **Query Complexity**: Avoid complex joins when fetching project data
- **Stage Transitions**: Ensure valid stage progressions and prevent invalid state transitions
- **Field Relevance**: Some fields only applicable at certain stages (e.g., `pitchDate` only relevant during PROPOSAL_PITCH)

## Decision

We will use a **single unified Project entity** for the entire project lifecycle, with two key fields to track position:

- **`status`**: Operational status (ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
- **`stage`**: Lifecycle stage (LEAD, QUALIFIED, WON, PLANNING, etc.)

### Schema Design

```prisma
model Project {
  id                String         @id @default(uuid())
  name              String
  description       String?

  // Lifecycle tracking
  status            ProjectStatus  @default(ACTIVE)
  stage             ProjectStage   @default(LEAD)

  // Stage-specific fields (nullable)
  leadSource        String?        // Relevant in LEAD stage
  qualificationNotes String?       // Relevant in QUALIFIED stage
  pitchDate         DateTime?      // Relevant in PROPOSAL_PITCH stage
  kickoffDate       DateTime?      // Relevant in PLANNING stage
  deadline          DateTime?      // Relevant from PLANNING onwards
  completedAt       DateTime?      // Set in COMPLETED stage

  // Relationships
  client            Client         @relation(...)
  tasks             Task[]
  mediaPlans        MediaPlan[]

  // Audit
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

enum ProjectStatus {
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum ProjectStage {
  LEAD
  QUALIFIED
  WON
  PLANNING
  UNDER_REVIEW
  PROPOSAL_PITCH
  ONGOING
  FINAL_REVIEW
  COMPLETED
  CLOSED
}
```

### Stage Progression Logic

Stage transitions are enforced in the Application layer:

```typescript
// Valid stage transitions
const STAGE_TRANSITIONS = {
  LEAD: ['QUALIFIED', 'CANCELLED'],
  QUALIFIED: ['WON', 'LEAD', 'CANCELLED'],
  WON: ['PLANNING', 'CANCELLED'],
  PLANNING: ['UNDER_REVIEW', 'ON_HOLD'],
  UNDER_REVIEW: ['PROPOSAL_PITCH', 'PLANNING'],
  PROPOSAL_PITCH: ['ONGOING', 'PLANNING', 'CANCELLED'],
  ONGOING: ['FINAL_REVIEW', 'ON_HOLD'],
  FINAL_REVIEW: ['COMPLETED', 'ONGOING'],
  COMPLETED: ['CLOSED'],
  CLOSED: [] // Terminal state
};
```

## Consequences

### Positive

- **Simplified Queries**: No joins required to fetch complete project history
- **Data Continuity**: All data captured at lead stage remains with project throughout lifecycle
- **Simplified Reporting**: Easy to analyze conversion funnels and stage durations
- **Atomic Transitions**: Stage changes are simple field updates, not entity migrations
- **Single ID**: Project maintains same ID from lead to completion (simpler integrations)
- **Audit Trail**: All stage transitions logged in single audit table
- **Reduced Complexity**: Fewer tables to manage, no data migration logic between entities

### Negative

- **Nullable Fields**: Some fields only relevant at certain stages, leading to many nullable columns
- **Schema Complexity**: Single table contains all fields for entire lifecycle (can be overwhelming)
- **Validation Complexity**: Field requirements vary by stage (e.g., `deadline` required in PLANNING)
- **Potential for Invalid State**: Risk of fields being set at inappropriate stages without proper validation
- **Query Performance**: Large table with many columns (mitigated with proper indexing)

### Neutral

- **Stage-Specific Views**: Can create database views for specific stages if needed
- **Migration Path**: If separate entities needed in future, can split by copying data and filtering by stage

## Validation Rules by Stage

To prevent invalid states, validation rules are enforced in the Application layer:

| Stage           | Required Fields                           | Optional Fields                  |
|-----------------|-------------------------------------------|----------------------------------|
| LEAD            | name, leadSource                          | description                      |
| QUALIFIED       | name, leadSource, qualificationNotes      | description                      |
| WON             | name, client                              | description, pitchDate           |
| PLANNING        | name, client, kickoffDate, deadline       | description, budget              |
| UNDER_REVIEW    | name, client, deadline                    | description, budget              |
| PROPOSAL_PITCH  | name, client, pitchDate                   | description, budget              |
| ONGOING         | name, client, deadline, assignedTeam      | description, budget, mediaPlans  |
| FINAL_REVIEW    | name, client, deadline                    | description, budget              |
| COMPLETED       | name, client, completedAt                 | description, budget              |
| CLOSED          | name, client, completedAt                 | description, budget, invoice     |

## Reporting and Analytics

The unified entity simplifies reporting:

```typescript
// Conversion funnel analysis
const conversionFunnel = await prisma.project.groupBy({
  by: ['stage'],
  _count: true,
  where: {
    createdAt: { gte: startDate, lte: endDate }
  }
});

// Average time in each stage
const stageAnalytics = await prisma.$queryRaw`
  SELECT
    stage,
    AVG(stage_duration) as avg_duration
  FROM project_stage_history
  GROUP BY stage
`;
```

## Alternatives Considered

### Separate Entities (Lead, Opportunity, Project)

**Pros**:
- Clear separation of concerns
- Tables only contain relevant fields for each stage
- Enforces stage-specific validation at schema level

**Cons**:
- Complex data migration logic between entities
- Requires joins to get complete project history
- Different IDs for same logical project across stages
- Difficult to track conversion metrics across entities
- Potential data loss during migrations

**Reason Not Chosen**: Complexity of data migration and loss of data continuity outweigh benefits of schema clarity.

### Polymorphic Entity with Inheritance

**Pros**:
- Separate tables for stage-specific data
- Shared base table for common fields

**Cons**:
- Complex joins required for most queries
- ORM support for inheritance patterns limited
- Difficult to implement in Prisma

**Reason Not Chosen**: Prisma doesn't support table inheritance, would require raw SQL for complex queries.

## Related Decisions

- ADR-0001: Clean Architecture Pattern (Stage transition logic in Application layer)
- ADR-0003: Prisma ORM Selection (Unified entity simplifies Prisma queries)

## Notes

### Stage History Tracking

To track stage transitions, a separate audit table is used:

```prisma
model ProjectStageHistory {
  id          String       @id @default(uuid())
  projectId   String
  project     Project      @relation(...)
  fromStage   ProjectStage?
  toStage     ProjectStage
  changedBy   String
  changedAt   DateTime     @default(now())
  notes       String?
}
```

This allows querying:
- How long a project stayed in each stage
- Who moved the project between stages
- Conversion rates between stages

### Future Considerations

If the schema becomes too complex, consider:
- Extracting stage-specific data to JSON fields
- Creating separate tables for stage-specific data (with foreign key to Project)
- Implementing database views for stage-specific queries

The unified entity approach prioritizes data continuity and query simplicity over schema purity, aligning with the reporting and analytics needs of the business.
