# Report Module

## Overview

The Report module generates project management reports in PDF and Excel formats. It supports 4 report types (Weekly, Weekly Per Project, Monthly, Custom date range) with role-scoped data aggregation covering project health, task status breakdowns, and completion metrics. All content is rendered in Vietnamese.

## Architecture

This module is self-contained with service, controller, DTOs, and tests in a single directory. It uses `pdfkit` for PDF generation and `exceljs` for Excel workbooks, both producing `Buffer` output streamed to the HTTP response.

**Key Design:** Data aggregation happens at the service level using Prisma queries, then the same `FullReportData` object feeds both PDF and Excel generators — ensuring format-independent consistency.

## Key Components

### Services

**`ReportService`** (`report.service.ts`)
- `generateReport(dto, userId, userRole)` – Main entry point, delegates to format-specific generators
- `calculateDateRange(dto)` – Resolves preset date ranges (weekly/monthly) to concrete dates
- `aggregateReportData(...)` – Collects projects, tasks, and computes statistics
- `generatePdfReport(data, type)` – Renders PDF with pdfkit
- `generateExcelReport(data, type)` – Renders 4-sheet Excel workbook

### Controllers

**`ReportController`** (`presentation/controllers/report.controller.ts`)
- Single endpoint: `POST /reports/generate`
- Sets appropriate MIME type and filename headers
- Streams Buffer response

## API Endpoints

| Method | Route | Roles | Purpose |
|--------|-------|-------|---------|
| POST | `/reports/generate` | SUPER_ADMIN, ADMIN, PM, PLANNER, ACCOUNT | Generate report |

### Request Body

```json
{
  "type": "WEEKLY | WEEKLY_PER_PROJECT | MONTHLY | CUSTOM",
  "format": "PDF | EXCEL",
  "projectId": "uuid (optional, required for WEEKLY_PER_PROJECT)",
  "startDate": "ISO date (required for CUSTOM)",
  "endDate": "ISO date (required for CUSTOM)"
}
```

### Validations
- `startDate` must be before `endDate`
- Date range cannot exceed 365 days
- `WEEKLY_PER_PROJECT` requires `projectId`
- `CUSTOM` requires both `startDate` and `endDate`

## Business Rules & Domain Logic

### Report Types

| Type | Date Range |
|------|-----------|
| `WEEKLY` | Monday of current week → today |
| `WEEKLY_PER_PROJECT` | Same as WEEKLY, filtered by projectId |
| `MONTHLY` | 1st of current month → today |
| `CUSTOM` | User-provided startDate/endDate |

### Data Aggregation

1. **Project filtering**: Exclude archived projects (`archivedAt: null`)
2. **Role scoping**: Admin/SUPER_ADMIN see all; others see only their team's projects
3. **Task date filter**: Tasks where `createdAt` OR `updatedAt` falls within the date range
4. **Per-project stats**: Task counts by status (TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED, CANCELLED)
5. **Completion %**: `(done tasks / total tasks) × 100` per project and overall
6. **Health breakdown**: Count of projects by health status (STABLE, WARNING, CRITICAL)

### PDF Structure

- Title: "BAO CAO DU AN" (Vietnamese)
- Report type and date range header
- **Summary section**: Total projects/tasks, completion rate, status breakdowns
- **Projects section**: Per-project details (code, name, client, health, stage, progress)
- **Tasks section**: Grouped by project (title, status, priority, assignees, deadline)
- Auto-pagination with page numbers in footer

### Excel Structure (4 Worksheets)

| Sheet | Vietnamese Name | Content |
|-------|----------------|---------|
| 1 | Tong quan | Summary statistics, report metadata |
| 2 | Du an | Project table with health, stage, completion |
| 3 | Cong viec | Task table with status, priority, assignees |
| 4 | Tien do | Per-project task breakdown with subtotals |

Formatting: Blue headers with white bold text, optimized column widths, cell alignment.

### Vietnamese Translations

All status/stage labels are rendered in Vietnamese:
- Health: STABLE → "On dinh", WARNING → "Canh bao", CRITICAL → "Nghiem trong"
- Task status: TODO → "Chua lam", IN_PROGRESS → "Dang lam", DONE → "Hoan thanh"
- Task priority: LOW → "Thap", MEDIUM → "Trung binh", HIGH → "Cao", URGENT → "Khan cap"

## Data Flow

```
Request → Validate → Calculate Date Range → Aggregate Data → Generate Format → Buffer → HTTP Response
                                                ↓
                                    FullReportData {
                                      summary: ReportSummary
                                      projects: ProjectReportData[]
                                      tasks: TaskReportData[]
                                    }
```

## Dependencies

### Internal
- `PrismaService` – Database queries (Project, Task, Client, User)
- `JwtAuthGuard` / `RolesGuard` – Authentication & authorization

### External
- `pdfkit` (^0.13.0) – PDF generation (stream-based)
- `exceljs` (^4.3.0) – Excel workbook generation
- `@prisma/client` – ORM

## Related ADRs

- **ADR-0001**: Clean Architecture Pattern (report service in Application layer)
- **ADR-0005**: Unified Project Entity (reports query single Project model across all stages)
