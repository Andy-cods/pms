# BC Agency PMS - Test Plan (IEEE 829)

## 1. Test Plan Identifier
- **ID:** PMS-TP-001
- **Version:** 1.2
- **Date:** 2026-01-30
- **Author:** BC Agency Development Team

## 2. Introduction

This test plan covers the testing strategy and execution plan for the BC Agency Project Management System (PMS). The system is a full-stack web application managing projects, tasks, approvals, and team workflows for an advertising agency.

### 2.1 Referenced Documents

| Document | Location | Relevance |
|---|---|---|
| SQA Plan (IEEE 730) | `docs/SQA_PLAN.md` | Quality standards, coding standards, review process |
| Architecture Document (IEEE 1016) | `docs/ARCHITECTURE.md` | System design, module boundaries, data model |
| API Reference | `docs/API.md` | API endpoint specifications for E2E tests |
| Test Report Template (IEEE 829) | `docs/TEST_REPORT_TEMPLATE.md` | Template for test execution reports |
| Deployment Guide | `docs/DEPLOYMENT.md` | Test environment setup instructions |

## 3. Test Items

| Item | Version | Technology |
|------|---------|------------|
| Backend API | 0.1.0 | NestJS 11 + TypeScript 5.7 |
| Frontend Web | 0.1.0 | Next.js 16 + React 19 |
| Database | - | PostgreSQL 16 + Prisma 7 |
| Cache | - | Redis 7 |

## 4. Features to be Tested

### 4.1 Unit Tests (Jest 30)

#### 4.1.1 Service Tests

| Module | Test File | Test Cases | Priority | Status |
|--------|-----------|------------|----------|--------|
| Auth | auth.service.spec.ts | 22 | CRITICAL | IMPLEMENTED |
| Auth | token-blacklist.service.spec.ts | 15 | HIGH | IMPLEMENTED |
| Approval | approval-escalation.service.spec.ts | 11 | HIGH | IMPLEMENTED |
| Calendar | rrule.service.spec.ts | 17 | MEDIUM | IMPLEMENTED |
| Report | report.service.spec.ts | 23 | MEDIUM | IMPLEMENTED |
| Project Phase | project-phase.service.spec.ts | 15 | MEDIUM | IMPLEMENTED |
| Ads Report | ads-report.service.spec.ts | 22 | MEDIUM | IMPLEMENTED |
| Metrics | metrics.service.spec.ts | 18 | LOW | IMPLEMENTED |
| Budget Event | budget-event.service.spec.ts | 23 | HIGH | IMPLEMENTED |
| Strategic Brief | strategic-brief.service.spec.ts | 25 | MEDIUM | IMPLEMENTED |
| Media Plan | media-plan.service.spec.ts | 26 | HIGH | IMPLEMENTED |
| **Subtotal** | **11 files** | **217** | | |

#### 4.1.2 Guard, Interceptor, and Middleware Tests

| Component | Test File | Test Cases | Priority | Status |
|-----------|-----------|------------|----------|--------|
| JWT Auth Guard | jwt-auth.guard.spec.ts | 9 | CRITICAL | IMPLEMENTED |
| Roles Guard | roles.guard.spec.ts | 8 | HIGH | IMPLEMENTED |
| Client Auth Guard | client-auth.guard.spec.ts | 8 | HIGH | IMPLEMENTED |
| Metrics Interceptor | metrics.interceptor.spec.ts | 6 | MEDIUM | IMPLEMENTED |
| CSRF Middleware | csrf.middleware.spec.ts | 20 | HIGH | IMPLEMENTED |
| **Subtotal** | **5 files** | **51** | | |

**Grand Total: 17 test files, 269 unit tests** (plus 22 integration-style tests = **291 total**)

### 4.2 E2E Tests - Backend (Supertest)

| Module | Test File | Coverage | Priority |
|--------|-----------|----------|----------|
| Auth | auth.e2e-spec.ts | Login, refresh, logout | CRITICAL |
| Projects | projects.e2e-spec.ts | CRUD, lifecycle, team | CRITICAL |
| Tasks | tasks.e2e-spec.ts | CRUD, status, assignment | HIGH |
| Approvals | approvals.e2e-spec.ts | Submit, approve, reject | HIGH |

### 4.3 E2E Tests - Frontend (Playwright 1.57)

| Module | Test File | Coverage | Priority |
|--------|-----------|----------|----------|
| Auth | auth.spec.ts | Login/logout flows | CRITICAL |
| Projects | projects.spec.ts | Project pages | HIGH |
| Tasks | tasks.spec.ts | Task management | HIGH |
| Client Portal | client-portal.spec.ts | Client access | MEDIUM |

## 5. Features Not Tested (Planned for Future)

- File upload/download module
- Calendar/event CRUD
- Notification delivery (Telegram)
- Dashboard statistics aggregation
- Admin user/client management
- Media plan creation
- Strategic brief forms
- Ads report import

## 6. Approach

### 6.1 Unit Testing Strategy
- **Framework:** Jest 30 with ts-jest
- **Mocking:** Custom PrismaService mock (`test-utils/prisma.mock.ts`)
- **Pattern:** Arrange-Act-Assert with NestJS TestingModule
- **Coverage Target:** >= 80% lines for tested services

### 6.2 E2E Testing Strategy
- **Backend:** Supertest against real PostgreSQL + Redis (Docker)
- **Frontend:** Playwright with Chromium browser
- **Data:** Test fixtures with seed data for consistent state
- **Isolation:** Database reset between test suites

### 6.3 CI/CD Integration
- GitHub Actions runs all tests on push/PR to master/develop
- Coverage reports uploaded as artifacts
- Build verification after tests pass

## 7. Pass/Fail Criteria

| Criterion | Threshold |
|-----------|-----------|
| Unit test coverage (lines) | >= 80% |
| Unit test coverage (branches) | >= 60% |
| Unit test coverage (functions) | >= 70% |
| All unit tests pass | 100% |
| All E2E tests pass | 100% (critical paths) |
| No regressions | 0 new failures |
| CI pipeline status | GREEN |

## 8. Test Environment

### 8.1 Development
- Node.js 22 LTS
- PostgreSQL 16 (Docker, port 5433)
- Redis 7 (Docker, port 6380)
- MinIO (Docker, ports 9000/9001)

### 8.2 CI/CD
- Ubuntu Latest (GitHub Actions)
- PostgreSQL 16 Alpine (service container)
- Redis 7 Alpine (service container)
- Node.js 22

## 9. Responsibilities

| Role | Responsibility |
|------|---------------|
| Developer | Write unit tests, fix failures |
| QA Lead | Review test plan, approve coverage targets |
| CI/CD | Automated test execution on push/PR |
| PM | Review test reports, approve releases |

## 10. Test Deliverables

| Deliverable | Location |
|-------------|----------|
| Test Plan | `backend/test/TEST_PLAN.md` |
| Unit Tests | `backend/src/modules/*/__tests__/*.spec.ts` |
| E2E Tests (Backend) | `backend/test/**/*.e2e-spec.ts` |
| E2E Tests (Frontend) | `frontend/e2e/*.spec.ts` |
| Test Utilities | `backend/src/test-utils/` |
| Test Fixtures | `backend/test/setup/fixtures.ts` |
| Coverage Reports | `backend/coverage/` (generated) |
| Test Report Template | `docs/TEST_REPORT_TEMPLATE.md` |

## 11. Schedule

| Phase | Items | Status |
|-------|-------|--------|
| Phase 1 | Auth tests (22 + 15 cases) | DONE |
| Phase 2 | Approval + Calendar + Report + Phase tests (66 cases) | DONE |
| Phase 3 | Service coverage expansion: AdsReport, Metrics, BudgetEvent, StrategicBrief, MediaPlan (114 cases) | DONE |
| Phase 4 | Guard, Interceptor, Middleware tests (51 cases) | DONE |
| Phase 5 | E2E test stabilization | PLANNED |
| Phase 6 | Frontend component tests | PLANNED |

## 12. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Flaky E2E tests | Medium | Medium | Retry mechanism, database isolation |
| Low coverage on complex services | Medium | Low | Focus on critical paths first |
| Test environment differences | Low | High | Docker-based consistent environments |
| Mocking complexity | Medium | Low | Shared mock utilities (prisma.mock.ts) |

## 13. Suspension and Resumption Criteria

*IEEE 829-2008 required section*

### 13.1 Suspension Criteria

Testing shall be suspended when any of the following conditions occur:

| Condition | Action | Authority |
|---|---|---|
| **Critical environment failure** (database down, CI runner unavailable) | Suspend all tests; notify DevOps | QA Lead |
| **Blocking defect** (test framework crash, mock system failure) | Suspend affected test suite; file S1 bug | Developer |
| **More than 30% of tests failing** in a single suite | Suspend suite; root cause investigation required | Dev Team Lead |
| **Security vulnerability discovered** in test infrastructure | Suspend tests; security patch priority | QA Lead + DevOps |
| **Major scope change** affecting test item specifications | Suspend affected tests; update test plan | PM |

### 13.2 Resumption Criteria

Testing shall resume when:

1. The root cause of suspension has been identified and resolved.
2. The fix has been verified in the test environment.
3. The QA Lead has confirmed the environment is stable.
4. Any necessary test plan updates have been made and approved.
5. A smoke test (critical path subset) passes before full suite re-execution.

## 14. Test Data Requirements

*IEEE 829-2008 required section*

### 14.1 Unit Test Data

Unit tests use **in-memory mock data** created via factory functions:

| Entity | Mock Factory | Key Fields |
|---|---|---|
| User | `mockUser()` | id, email, name, role, isActive |
| Project | `mockProject()` | id, name, status, totalBudget, spentAmount |
| BudgetEvent | `mockBudgetEvent()` | id, projectId, amount, type, category, status |
| StrategicBrief | `mockBrief()` | id, projectId, status, completionPct |
| BriefSection | `mockSection()` | id, briefId, sectionNum, data, isComplete |
| MediaPlan | `mockMediaPlan()` | id, projectId, name, status, totalBudget |
| Approval | `mockApproval()` | id, title, status, escalationLevel |

**Isolation rules:**
- Each `beforeEach()` creates fresh mock instances.
- `afterEach()` calls `jest.clearAllMocks()` to prevent state leakage.
- No shared mutable state between test cases.
- No file system or network access in unit tests.

### 14.2 E2E Test Data

| Data Set | Source | Entity Count | Purpose |
|---|---|---|---|
| Seed users | `prisma/seed.ts` | 5 users (1 per role) | Authentication testing |
| Seed projects | `prisma/seed.ts` | 3 projects (different stages) | Project lifecycle testing |
| Seed tasks | `prisma/seed.ts` | 10 tasks (various statuses) | Task management testing |
| Seed approvals | `prisma/seed.ts` | 4 approvals (various states) | Approval workflow testing |

**Isolation rules:**
- Each E2E test suite runs against a freshly migrated database.
- `prisma migrate deploy` + `prisma db seed` before each suite.
- Database is destroyed after CI run completes.
- No production data is ever used in test environments.

### 14.3 Sensitive Data Policy

- No real user credentials, emails, or personal data in test fixtures.
- All test passwords use `test-password-xxxx` format.
- JWT secrets in CI use dedicated test values (not production secrets).
- Environment variables containing secrets are stored in GitHub Actions secrets.

## 15. Approval

*IEEE 829-2008 required section*

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Owner | ______________ | ___________ | __________ |
| Dev Team Lead | ______________ | ___________ | __________ |
| Project Manager | ______________ | ___________ | __________ |

**Approval criteria:**
- All test items in Section 4 have been reviewed.
- Pass/fail criteria in Section 7 are agreed upon by all signatories.
- Test environment in Section 8 has been verified operational.
- Risk mitigations in Section 12 are deemed adequate.

---

**Document History:**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-01-30 | Dev Team | Initial Test Plan |
| 1.1 | 2026-01-30 | Dev Team | Updated test counts to 290; added Referenced Documents, Suspension/Resumption Criteria, Test Data Requirements, Approval section |
| 1.2 | 2026-01-30 | Dev Team | Final count: 291 tests (17 suites); added AppController spec; coverage 85.2% statements, 84.7% lines |
