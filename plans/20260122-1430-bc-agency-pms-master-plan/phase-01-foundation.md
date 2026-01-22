# Phase 1: Foundation (Week 1-3)

**Duration:** 3 weeks | **Status:** [ ] Not Started

---

## Context

This phase establishes the technical foundation for BC Agency PMS. Infrastructure must be stable before building features. Authentication is critical - all subsequent features depend on user identity and roles.

---

## Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 1 | Infrastructure + Scaffold | Docker Compose, NestJS, Next.js, Prisma |
| Week 2 | Authentication | JWT backend, RBAC guards, Login UI, Auth state |
| Week 3 | UI Foundation | Shadcn/ui, Layout components, Responsive design |

---

## Requirements

### Functional
- Docker Compose orchestrates all services (PostgreSQL, Redis, MinIO, Nginx)
- Backend follows Clean Architecture (Domain > Application > Infrastructure > Presentation)
- JWT authentication with refresh tokens
- Role-based access control (10 roles as defined in Brainstorm Report)
- Login for internal users (email/password) and clients (access code)
- Responsive layout with sidebar navigation

### Non-Functional
- Page load < 3s on 4G connection
- Support 20 concurrent users
- SSL/HTTPS enabled
- Mobile-responsive (down to 375px width)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (80, 443)                     │
├─────────────────────────────────────────────────────────┤
│        Frontend (3000)    │     Backend (3001)          │
│        Next.js 14         │     NestJS 10               │
├───────────────────────────┼─────────────────────────────┤
│                           │  PostgreSQL │ Redis │ MinIO │
│                           │    (5432)   │(6379) │(9000) │
└───────────────────────────┴─────────────────────────────┘
```

---

## Implementation Steps

### Week 1: Infrastructure & Scaffold

#### Day 1-2: Docker Compose Setup
- [ ] **Task 1.1:** Create `docker-compose.yml`
  - PostgreSQL 16-alpine with healthcheck
  - Redis 7-alpine with persistence
  - MinIO with console (9000, 9001)
  - Nginx with SSL config placeholder
  - **Acceptance Criteria:** `docker-compose up` starts all services, healthchecks pass
  - **Effort:** 4 hours

- [ ] **Task 1.2:** Configure Nginx reverse proxy
  - Route `/` to frontend:3000
  - Route `/api` to backend:3001
  - Rate limiting for auth endpoints
  - **Acceptance Criteria:** Requests routed correctly
  - **Effort:** 2 hours

- [ ] **Task 1.3:** Setup environment files
  - `.env.example` with all variables
  - `.env.development` for local
  - `.env.production` template
  - **Acceptance Criteria:** All services read env vars correctly
  - **Effort:** 1 hour

#### Day 3-4: NestJS Backend Scaffold
- [ ] **Task 1.4:** Initialize NestJS project
  - `@nestjs/cli` with TypeScript strict mode
  - Clean Architecture folder structure
  - **Acceptance Criteria:** `npm run start:dev` works
  - **Effort:** 2 hours

- [ ] **Task 1.5:** Setup NestJS modules structure
  ```
  src/
  ├── domain/entities, interfaces, value-objects
  ├── application/use-cases, dto, mappers
  ├── infrastructure/persistence, external-services
  ├── presentation/controllers, guards, filters
  ├── modules/auth, project, task, file, notification
  └── shared/constants, decorators, utils
  ```
  - **Acceptance Criteria:** All folders created, module imports work
  - **Effort:** 3 hours

- [ ] **Task 1.6:** Install core dependencies
  - `@nestjs/config`, `@nestjs/jwt`, `@prisma/client`
  - `bcrypt`, `class-validator`, `class-transformer`
  - `minio`, `ioredis`
  - **Acceptance Criteria:** All packages installed, no version conflicts
  - **Effort:** 1 hour

#### Day 5: Next.js Frontend Scaffold
- [ ] **Task 1.7:** Initialize Next.js 14 project
  - App Router structure
  - TypeScript strict mode
  - **Acceptance Criteria:** `npm run dev` works
  - **Effort:** 2 hours

- [ ] **Task 1.8:** Setup frontend folder structure
  ```
  src/
  ├── app/(auth), (dashboard), (admin), (client-portal)
  ├── components/ui, common, project, task
  ├── hooks/
  ├── lib/api, auth, utils
  ├── stores/auth, ui
  └── types/
  ```
  - **Acceptance Criteria:** Folder structure matches spec
  - **Effort:** 1 hour

- [ ] **Task 1.9:** Install frontend dependencies
  - `zustand`, `@tanstack/react-query`
  - `axios`, `date-fns`, `zod`
  - **Acceptance Criteria:** All packages work with Next.js 14
  - **Effort:** 1 hour

#### Day 6-7: Prisma Schema & Migrations
- [ ] **Task 1.10:** Create complete Prisma schema
  - All entities from Brainstorm Report
  - Enums: UserRole, ProjectStatus, TaskStatus, etc.
  - Relations and indexes
  - **Acceptance Criteria:** `prisma validate` passes
  - **Effort:** 4 hours

- [ ] **Task 1.11:** Generate initial migration
  - `prisma migrate dev --name init`
  - Verify all tables created
  - **Acceptance Criteria:** Database has all tables
  - **Effort:** 1 hour

- [ ] **Task 1.12:** Create seed data
  - Admin user (super_admin role)
  - Sample roles and test users
  - **Acceptance Criteria:** `prisma db seed` creates test data
  - **Effort:** 2 hours

---

### Week 2: Authentication System

#### Day 8-9: JWT Authentication Backend
- [ ] **Task 2.1:** Create AuthModule
  - Domain: User entity, session entity
  - Application: LoginUseCase, LogoutUseCase, RefreshTokenUseCase
  - **Acceptance Criteria:** Use cases handle all auth flows
  - **Effort:** 4 hours

- [ ] **Task 2.2:** Implement JWT service
  - Access token (15min expiry)
  - Refresh token (7 days expiry)
  - Token blacklist in Redis
  - **Acceptance Criteria:** Tokens generated and validated correctly
  - **Effort:** 3 hours

- [ ] **Task 2.3:** Create auth endpoints
  - `POST /api/auth/login` (email + password)
  - `POST /api/auth/client-login` (access code)
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - **Acceptance Criteria:** All endpoints return correct responses
  - **Effort:** 3 hours

#### Day 10-11: Role-Based Access Control
- [ ] **Task 2.4:** Implement JwtAuthGuard
  - Extract token from Authorization header
  - Verify token validity
  - Attach user to request
  - **Acceptance Criteria:** Protected routes reject invalid tokens
  - **Effort:** 2 hours

- [ ] **Task 2.5:** Implement RolesGuard
  - `@Roles()` decorator
  - Check user roles against required roles
  - **Acceptance Criteria:** Users can only access permitted endpoints
  - **Effort:** 2 hours

- [ ] **Task 2.6:** Implement ProjectAccessGuard
  - Check user is member of project
  - Check role within project context
  - **Acceptance Criteria:** Users can only access their projects
  - **Effort:** 3 hours

- [ ] **Task 2.7:** Create audit logging
  - Log all auth events (login, logout, failed attempts)
  - Store in AuditLog table
  - **Acceptance Criteria:** All auth events logged with IP, user agent
  - **Effort:** 2 hours

#### Day 12-14: Login UI & State Management
- [ ] **Task 2.8:** Create internal login page
  - Email/password form
  - Form validation with Zod
  - Error handling
  - **Acceptance Criteria:** Users can log in, see errors
  - **Effort:** 3 hours

- [ ] **Task 2.9:** Create client login page
  - Access code input
  - Styled differently from internal login
  - **Acceptance Criteria:** Clients can log in with code
  - **Effort:** 2 hours

- [ ] **Task 2.10:** Setup Zustand auth store
  - User state, tokens, login/logout actions
  - Persist to localStorage
  - Auto-refresh token logic
  - **Acceptance Criteria:** Auth state persists across refreshes
  - **Effort:** 3 hours

- [ ] **Task 2.11:** Setup Axios interceptors
  - Attach auth token to requests
  - Handle 401 responses (redirect to login)
  - Refresh token on expiry
  - **Acceptance Criteria:** API calls authenticated automatically
  - **Effort:** 2 hours

---

### Week 3: UI Foundation

#### Day 15-16: Shadcn/ui Setup
- [ ] **Task 3.1:** Initialize Shadcn/ui
  - `npx shadcn-ui@latest init`
  - Configure with Tailwind CSS
  - Setup `components/ui` directory
  - **Acceptance Criteria:** Shadcn CLI works
  - **Effort:** 1 hour

- [ ] **Task 3.2:** Add core components
  - Button, Card, Dialog, DropdownMenu
  - Input, Label, Select, Checkbox
  - Table, Tabs, Toast, Avatar
  - Badge, Skeleton, Separator
  - **Acceptance Criteria:** All components render correctly
  - **Effort:** 2 hours

- [ ] **Task 3.3:** Setup theme system
  - Light and dark mode support
  - BC Agency brand colors
  - CSS variables for theming
  - **Acceptance Criteria:** Theme toggle works
  - **Effort:** 2 hours

#### Day 17-18: Layout Components
- [ ] **Task 3.4:** Create Sidebar component
  - Navigation links (role-based visibility)
  - Collapsible for mobile
  - Active state highlighting
  - **Acceptance Criteria:** Navigation works, collapses on mobile
  - **Effort:** 4 hours

- [ ] **Task 3.5:** Create Navbar component
  - User avatar and dropdown
  - Notification bell (placeholder)
  - Theme toggle
  - **Acceptance Criteria:** All navbar elements functional
  - **Effort:** 3 hours

- [ ] **Task 3.6:** Create Dashboard layout
  - Sidebar + Navbar + Main content area
  - Protected route wrapper
  - Loading states
  - **Acceptance Criteria:** Layout wraps all dashboard pages
  - **Effort:** 2 hours

#### Day 19-21: Common Components & Responsive
- [ ] **Task 3.7:** Create DataTable component
  - Sorting, pagination
  - Column visibility toggle
  - Row selection
  - Based on TanStack Table
  - **Acceptance Criteria:** Table handles 100+ rows smoothly
  - **Effort:** 4 hours

- [ ] **Task 3.8:** Create StatusBadge component
  - Project status (STABLE, WARNING, CRITICAL)
  - Task status (TODO, IN_PROGRESS, etc.)
  - Color-coded
  - **Acceptance Criteria:** All statuses display correctly
  - **Effort:** 1 hour

- [ ] **Task 3.9:** Create common form components
  - FormField wrapper
  - Error messages display
  - Loading button state
  - **Acceptance Criteria:** Forms consistent across app
  - **Effort:** 2 hours

- [ ] **Task 3.10:** Implement responsive design
  - Mobile breakpoints (375px, 640px, 768px, 1024px)
  - Sidebar collapses to hamburger menu
  - Tables scroll horizontally on mobile
  - **Acceptance Criteria:** All pages usable on mobile
  - **Effort:** 4 hours

- [ ] **Task 3.11:** Create empty states
  - No projects, no tasks illustrations
  - Call-to-action buttons
  - **Acceptance Criteria:** Empty states guide users
  - **Effort:** 2 hours

---

## Todo Checklist

### Week 1
- [ ] Docker Compose with all services running
- [ ] NestJS backend with Clean Architecture structure
- [ ] Next.js frontend with App Router
- [ ] Prisma schema complete and migrated
- [ ] Seed data for testing

### Week 2
- [ ] JWT authentication working
- [ ] Role-based guards implemented
- [ ] Login pages (internal + client)
- [ ] Auth state management with Zustand
- [ ] Audit logging for auth events

### Week 3
- [ ] Shadcn/ui components installed
- [ ] Theme system (light/dark) working
- [ ] Layout components (Sidebar, Navbar)
- [ ] DataTable component functional
- [ ] Responsive design tested on mobile

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| All services start | `docker-compose up` | 0 errors |
| Auth endpoints work | API tests | 100% pass |
| Login flow | Manual test | < 5 clicks to dashboard |
| Page load | Lighthouse | < 3s on Fast 3G |
| Mobile responsive | Visual test | No horizontal scroll |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Docker config issues on Windows | Medium | High | Test on Linux VM, document workarounds |
| Prisma migration conflicts | Low | Medium | Use `prisma migrate reset` for dev |
| Next.js 14 App Router unfamiliarity | Medium | Medium | Follow official docs, start simple |
| CORS issues between frontend/backend | High | Low | Configure early, test with Postman |

---

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT secrets from environment variables (not hardcoded)
- HTTPS enforced in production
- Rate limiting on auth endpoints (5/min for login)
- Input validation on all endpoints (class-validator)
- CORS configured to allow only frontend origin

---

## Definition of Done

- [ ] All tasks have acceptance criteria met
- [ ] Code reviewed (self-review checklist)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Unit tests for auth use cases (>80% coverage)
- [ ] Documentation updated (API endpoints, env vars)
- [ ] Works on both development and staging environments

---

## Dependencies

- **External:** None (all self-hosted)
- **Internal:** This phase blocks Phase 2 (all features need auth)

---

## Notes

- Start with internal login first, client login can wait until Day 12
- Focus on auth security - this protects all subsequent features
- Sidebar navigation items can be placeholder links initially
- DataTable is reused heavily - invest time to make it robust
