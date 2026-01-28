# Scout Report - PMS Enhancement 4 Phases

## Backend Files

### Budget
- `backend/prisma/schema.prisma` - ProjectBudget, BudgetEvent models, BudgetEventType enum (ALLOC/SPEND/ADJUST)
- `backend/src/application/dto/budget/budget.dto.ts` - Budget DTOs
- `backend/src/application/dto/budget-event.dto.ts` - BudgetEvent DTOs
- `backend/src/presentation/controllers/budget.controller.ts` - Budget CRUD endpoints
- `backend/src/presentation/controllers/budget-event.controller.ts` - BudgetEvent endpoints
- `backend/src/modules/project/budget-event.service.ts` - BudgetEvent business logic

### Teams/Roles
- `backend/src/application/dto/admin/admin-user.dto.ts` - User DTOs (Create/Update/Response)
- `backend/src/presentation/controllers/admin-user.controller.ts` - Admin user management (SUPER_ADMIN/ADMIN only)
- `backend/src/modules/auth/guards/roles.guard.ts` - RolesGuard RBAC
- `backend/src/modules/auth/decorators/roles.decorator.ts` - @Roles() decorator
- `backend/src/modules/users/users.module.ts` - Users module

### Reports
- `backend/src/modules/report/report.module.ts` - Report module
- `backend/src/application/dto/report/report.dto.ts` - Report DTOs (ReportType, ReportFormat)
- `backend/src/modules/report/report.service.ts` - Report generation (ExcelJS + PDFKit)
- `backend/src/presentation/controllers/report.controller.ts` - Report endpoints

### Integration/Webhook
- `backend/src/presentation/controllers/integration.controller.ts` - @Controller('integrations/pancake')

### Auth
- `backend/src/modules/auth/auth.module.ts` - JWT setup
- `backend/src/modules/auth/auth.controller.ts` - Login/logout/refresh
- `backend/src/modules/auth/auth.service.ts` - Token generation
- `backend/src/modules/auth/guards/jwt-auth.guard.ts` - JWT guard

## Frontend Files

### Budget UI
- `frontend/src/app/dashboard/projects/[id]/page.tsx` - Project detail w/ budget tab
- `frontend/src/components/project/budget-card.tsx` - Budget display card
- `frontend/src/components/project/budget-form-modal.tsx` - Budget edit modal
- `frontend/src/hooks/use-budget-events.ts` - Budget events hook
- `frontend/src/hooks/use-project-budget.ts` - Project budget hook
- `frontend/src/lib/api/budget-events.ts` - Budget events API
- `frontend/src/lib/api/budget.ts` - Budget API

### Teams UI
- `frontend/src/app/dashboard/teams/page.tsx` - Teams page (read-only user directory)
- `frontend/src/app/dashboard/admin/users/page.tsx` - Admin user management
- `frontend/src/components/project/team-member-modal.tsx` - Team member modal
- `frontend/src/components/admin/user-form-modal.tsx` - User form modal
- `frontend/src/hooks/use-admin-users.ts` - Admin users hook
- `frontend/src/lib/api/admin-users.ts` - Admin users API

### Reports UI
- `frontend/src/app/dashboard/reports/page.tsx` - Reports page
- `frontend/src/hooks/use-reports.ts` - Reports hook
- `frontend/src/lib/api/reports.ts` - Reports API

### Styling & Layout
- `frontend/src/app/globals.css` - Global styles (883 lines)
- `frontend/src/styles/apple-colors.css` - Apple color palette
- `frontend/src/styles/apple-design.css` - Apple design system
- `frontend/src/styles/client-portal.css` - Client portal styles
- `frontend/src/components/layout/dashboard-layout.tsx` - Dashboard layout
- `frontend/src/components/layout/navbar.tsx` - Navbar
- `frontend/src/components/layout/sidebar.tsx` - Sidebar

### Types
- `frontend/src/types/index.ts` - UserRole enum (10 roles), ProjectStatus, ProjectStage, Budget/Report/Task types

## Config & Schema

### Dependencies
- **Backend:** NestJS v11, Prisma v7.3, JWT, bcrypt, pdfkit, exceljs, ioredis, minio, prom-client, helmet
- **Frontend:** Next.js v16.1.4, React v19.2.3, Tailwind v4, shadcn/ui (Radix), TanStack Query v5, zustand v5, recharts v3.7, react-hook-form v7, zod v4, dnd-kit, lucide-react, sonner, next-themes

### Migrations (4 total)
1. `20260122042654_init` - Initial schema
2. `20260126065036_add_stage_history` - Stage history
3. `20260127081009_add_media_plan` - Media plans
4. `20260127100548_add_budget_events` - Budget events

### Media Plan (reference for Ads Report pattern)
- Backend: Full DDD structure (module/service/controller/repository/DTOs)
- Frontend: API client, hook, 4 components (form, card, items-table, item-form)
- Schema: MediaPlanItem has channels, campaign types, budget, reach, clicks, leads, CPL, CPC, ROAS
