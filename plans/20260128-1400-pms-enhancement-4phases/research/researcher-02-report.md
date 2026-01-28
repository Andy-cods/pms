# Research Report: RBAC Permission Matrix & Budget Spending Systems

**Date:** 2026-01-28 | **Version:** 1.0

---

## Executive Summary

RBAC permission matrices organize role hierarchies (Admin, Manager, Member) against features/actions in structured tables for UI display and API validation. NestJS implementations leverage decorators (@Roles, @UseGuards) with casl/nest-casl for fine-grained permissions. Budget spending ticket systems follow create→pending→approved→paid workflows with auto-calculation from transactions, threshold alerts at 80%/100%, and visual donut charts for category breakdowns. Both require clean separation of concerns (DTOs, services, guards) and comprehensive audit logging.

---

## Topic 1: RBAC Permission Matrix for Project Management

### Permission Matrix Design

**Structure:** Matrix maps Roles (rows) × Features/Actions (columns) with CRUD permissions:

```
| Role    | Projects | Teams | Budget | Reports | Media Plans |
|---------|----------|-------|--------|---------|-------------|
| Admin   | CRUD     | CRUD  | CRUD   | R       | CRUD        |
| Manager | CR-D*    | CRU   | RU     | R       | CRUD        |
| Member  | R        | R     | R      | R       | R           |
```
(*D=limited delete, R=read, U=update, C=create)

**NestJS Implementation:**

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles?.includes(user.role);
  }
}

// use in controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
@Post('projects')
createProject(@Body() dto: CreateProjectDto) { }
```

**Advanced Pattern (nest-casl):** Define ability rules for object-level permissions:

```typescript
export class ProjectsAbility implements ForbiddenException {
  can: (action: string, subject: string, fields?: string[]) => boolean;
}

// project.service.ts - check before operations
checkAbility(action: 'create' | 'read' | 'update' | 'delete', project: Project, user: User) {
  this.casl.authorize(user, action, project);
}
```

### UI Permission Matrix Display Patterns

1. **Table View (Default):** Rows=roles, columns=features, cells=checkboxes/radio for permission levels
2. **Inline Editing:** Click checkbox to toggle → PATCH /roles/{roleId}/permissions
3. **Settings Modal:** Group permissions by feature area (Projects, Budgets, Reports)
4. **Icon Legend:** Use symbols (R=view eye, W=edit pen, D=delete trash)

**Frontend Component Pattern:**
```typescript
// RolePermissionMatrix.tsx
<Table>
  {roles.map(role => (
    <Row>
      <Cell>{role.name}</Cell>
      {features.map(feature => (
        <Cell>
          <Checkbox
            checked={hasPermission(role, feature)}
            onChange={(val) => updatePermission(role.id, feature.id, val)}
          />
        </Cell>
      ))}
    </Row>
  ))}
</Table>
```

### Workload Visualization for Team Members

- **Bar Chart:** Hours allocated vs. capacity per team member
- **Pie/Donut:** Task distribution by project or status
- **Timeline/Gantt:** Task deadlines and dependencies
- **Metrics Card:** Active tasks, in-progress %, completion rate

**Data Structure:**
```typescript
interface MemberWorkload {
  memberId: string;
  allocatedHours: number;
  capacityHours: number;
  activeTaskCount: number;
  completedTasksThisWeek: number;
  tasksOverdue: number;
}
```

### Security Considerations

- Never expose permissions in JWT (calculate server-side per request)
- Audit log all permission changes with timestamp + actor
- Implement permission caching (5-10 min TTL) for performance
- Validate permissions at both guard (HTTP) and service (DB) layers
- Use row-level security (RLS) in PostgreSQL for additional protection

---

## Topic 2: Budget Spending Ticket Systems

### Spending Ticket Workflow

```
[Create] → [Pending] → [Approved] → [Paid]
   ↓          ↓          ↓          ↓
Initial    Awaiting    Budget   Transaction
Submission Manager     Deducted Complete
```

**State Machine:**
```typescript
enum TicketStatus {
  DRAFT = 'draft',
  PENDING = 'pending',        // Awaiting approval
  APPROVED = 'approved',      // Approved, deducts from budget
  PAID = 'paid',              // Payment executed
  REJECTED = 'rejected'       // Denied by manager
}

interface SpendingTicket {
  id: string;
  amount: number;
  category: 'ad_fees' | 'content' | 'design' | 'media';
  status: TicketStatus;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  paidDate?: Date;
}
```

### Category-Based Budget Tracking

**Budget Structure:**
```typescript
interface ProjectBudget {
  projectId: string;
  totalBudget: number;
  allocations: {
    ad_fees: { allocated: number; spent: number; remaining: number };
    content: { allocated: number; spent: number; remaining: number };
    design: { allocated: number; spent: number; remaining: number };
    media: { allocated: number; spent: number; remaining: number };
  };
}
```

**Auto-Calculation:** Spent amount = SUM of approved tickets (not pending/draft)

```typescript
// budget.service.ts
calculateSpent(projectId: string, category: string): Promise<number> {
  return this.ticketRepo.aggregate([
    { $match: { projectId, category, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
}
```

### Threshold Alerts

**Logic:**
- 80% spent: Yellow warning, suggest caution
- 100% spent: Red alert, block new non-critical tickets
- Over budget: Admin notification + audit log

**Frontend Display:**
```typescript
interface BudgetAlert {
  category: string;
  percentUsed: number;
  status: 'ok' | 'warning' | 'critical';
  remainingBudget: number;
}

// compute in frontend or service
const percentUsed = (spent / allocated) * 100;
const status = percentUsed >= 100 ? 'critical' : percentUsed >= 80 ? 'warning' : 'ok';
```

### Spending Visualization

**Donut Chart Data:**
```typescript
interface BudgetVisualization {
  labels: ['Ad Fees', 'Content', 'Design', 'Media'];
  datasets: [{
    data: [8000, 5000, 3000, 2000],  // spent amounts
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  }];
  meta: {
    totalBudget: 25000,
    totalSpent: 18000,
    percentUsed: 72
  }
}
```

**Display Strategy:**
- Center text: "72% used" or "Remaining: $7,000"
- Tooltip on hover: Show category name + amount
- Legend with remaining budget per category
- Responsive: Stack on mobile, side-by-side on desktop

### Best Practices for Financial Data

1. **Precision:** Store amounts in cents (integer) to avoid float rounding
2. **Timestamps:** Record every state transition (created, approved, paid)
3. **Audit Trail:** Log actor, action, old value, new value for compliance
4. **Reconciliation:** Weekly batch compare approved tickets vs. ledger
5. **Approval Workflow:** Manager review with comments before status change
6. **Notification:** Email approver + requester on status changes
7. **Exports:** CSV/PDF reports for accounting with digital signatures

**DTO Structure:**
```typescript
interface CreateSpendingTicketDto {
  amount: number;           // in cents
  category: string;
  description: string;
  attachments?: string[];   // receipts/invoices
}

interface ApproveTicketDto {
  status: 'approved' | 'rejected';
  comment?: string;
  approverNotes?: string;
}
```

---

## Implementation Roadmap

**Phase 1 (RBAC):**
- Define role-permission matrix in seed data
- Implement RolesGuard + casl integration
- Create permission UI table with inline editing
- Add audit logging decorator

**Phase 2 (Spending Tickets):**
- Build ticket CRUD API with state machine validation
- Implement auto-calculation service
- Add threshold alert logic
- Create visual dashboard with donut charts

**Phase 3 (Integration):**
- Connect RBAC to ticket approval workflows (only Managers can approve)
- Link budget tracking to project dashboard
- Add notifications on threshold breaches

---

## Unresolved Questions

- Should ticket rejection require mandatory approver comment for compliance?
- How to handle concurrent spending approvals against same budget allocation?
- Multi-level approval workflow needed (team lead → manager → finance)?
- Should budget year roll over unused amounts or reset?

---

**Sources:** NestJS Official Docs (auth, guards), casl/nest-casl Github, Project Management SaaS patterns (Asana, Monday.com), Financial data best practices (NIST, IFM standards), DOM accessibility guidelines.
