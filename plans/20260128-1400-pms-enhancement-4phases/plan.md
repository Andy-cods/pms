# PMS Enhancement Plan - 4 Phases

**Date:** 2026-01-28
**Project:** BC Agency PMS (Project Management System)
**Description:** Four-phase enhancement covering budget spending tickets, teams management, Apple HIG redesign, and ads reporting with Zapier integration.

---

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 1 | Budget Spending Tickets | HIGH | COMPLETED | [phase-01](./phase-01-budget-spending-tickets.md) |
| 2 | Teams Enhancement | MEDIUM | COMPLETED | [phase-02](./phase-02-teams-enhancement.md) |
| 3 | Apple HIG Color Redesign | MEDIUM | COMPLETED | [phase-03](./phase-03-apple-hig-redesign.md) |
| 4 | Ads Report + Zapier | HIGH | COMPLETED | [phase-04](./phase-04-ads-report-zapier.md) |

## Dependencies & Prerequisites

- **Phase 1** has no blockers; builds on existing `BudgetEvent` model and `budget-event.service.ts`
- **Phase 2** independent; extends existing teams page (`/dashboard/teams`) and admin-users API
- **Phase 3** pure CSS/styling; no backend changes; can run in parallel with any phase
- **Phase 4** depends on Phase 1 pattern (follows same service/controller/DTO structure); needs Zapier account for integration testing

**Execution order:** Phase 1 -> Phase 4 (reuses patterns); Phase 2 and Phase 3 can run in parallel at any time.

## Tech Stack

- **Frontend:** Next.js 16.1.4, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand v5, Recharts v3.7
- **Backend:** NestJS v11, Prisma v7.3, PostgreSQL
- **Auth:** JWT + RolesGuard + @Roles() decorator
- **10 Roles:** SUPER_ADMIN, ADMIN, TECHNICAL, NVKD, PM, PLANNER, ACCOUNT, CONTENT, DESIGN, MEDIA

## Overall Success Criteria

1. Budget tab shows 3-column summary, donut chart, filterable tickets table, threshold alerts
2. Teams page has 3 tab views, inline role editing, workload stats, permission matrix
3. All UI components use updated Apple HIG 2025 colors with enhanced glassmorphism, dark mode works
4. Ads reports display KPI cards, trend chart, data table; Zapier webhook ingests data correctly
5. All new endpoints protected by JWT + appropriate role guards
6. No regressions in existing features
7. Prisma migrations run cleanly

## Unresolved Questions

- Zapier plan tier needed for webhook triggers (free tier has limitations)
- Whether budget threshold notifications should also fire Telegram alerts (existing notification system supports it)
