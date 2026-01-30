# Software Quality Assurance Plan (SQA Plan)

**IEEE 730-2014 Compliant**

| Field            | Value                                         |
| ---------------- | --------------------------------------------- |
| **Project**      | PMS - Project Management System (BC Agency)   |
| **Document ID**  | PMS-SQA-001                                   |
| **Version**      | 1.2                                           |
| **Date**         | 2026-01-30                                    |
| **Author**       | QA Team - BC Agency                           |
| **Status**       | Approved                                      |

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Reference Documents](#2-reference-documents)
3. [Management Organization](#3-management-organization)
4. [QA Tasks and Schedule](#4-qa-tasks-and-schedule)
5. [Tools and Infrastructure](#5-tools-and-infrastructure)
6. [Coding Standards](#6-coding-standards)
7. [Testing Standards](#7-testing-standards)
8. [Review Standards](#8-review-standards)
9. [Quality Metrics](#9-quality-metrics)
10. [Risk Management](#10-risk-management)
11. [Problem Reporting and Corrective Action](#11-problem-reporting-and-corrective-action)
12. [Media Control](#12-media-control)
13. [Supplier Control](#13-supplier-control)
14. [Training Requirements](#14-training-requirements)
15. [Document Approval](#15-document-approval)

---

## 1. Purpose and Scope

### 1.1 Purpose

This Software Quality Assurance Plan defines the activities, processes, and standards necessary to ensure the PMS (Project Management System) meets its quality requirements. The plan establishes a systematic approach to quality assurance throughout the software development lifecycle, from requirements gathering through deployment and maintenance.

This document serves as the authoritative reference for all quality assurance activities performed on the PMS project and shall be followed by all team members involved in development, testing, and delivery.

### 1.2 Scope

This SQA Plan applies to the entire PMS system, including:

- **Frontend Application:** Next.js + TypeScript single-page application
- **Backend API:** NestJS RESTful API server
- **Database Layer:** PostgreSQL database with Prisma ORM
- **Infrastructure:** Docker containers, Nginx reverse proxy, Redis cache, MinIO object storage
- **CI/CD Pipeline:** GitHub Actions automated workflows

The plan covers the following quality activities:

- Code quality enforcement (linting, formatting, type checking)
- Automated testing (unit, integration, end-to-end)
- Code review processes
- Security auditing
- Performance monitoring
- Deployment verification

### 1.3 Definitions and Acronyms

| Term   | Definition                                                      |
| ------ | --------------------------------------------------------------- |
| PMS    | Project Management System                                       |
| SQA    | Software Quality Assurance                                      |
| CI/CD  | Continuous Integration / Continuous Deployment                   |
| PR     | Pull Request                                                    |
| E2E    | End-to-End                                                      |
| NVKD   | Nhan Vien Kinh Doanh (Sales/Business Staff)                     |
| PM     | Project Manager                                                 |
| SUT    | System Under Test                                               |
| LOC    | Lines of Code                                                   |

---

## 2. Reference Documents

| Document                          | Standard / Source                                     |
| --------------------------------- | ----------------------------------------------------- |
| IEEE 730-2014                     | IEEE Standard for Software Quality Assurance Processes |
| IEEE 1016-2009                    | IEEE Standard for Software Design Descriptions         |
| IEEE 829-2008                     | IEEE Standard for Software and System Test Documentation |
| IEEE 12207-2017                   | IEEE Standard for Software Life Cycle Processes        |
| PMS Architecture Document         | `docs/ARCHITECTURE.md`                                |
| PMS API Reference                 | `docs/API.md`                                         |
| PMS Deployment Guide              | `docs/DEPLOYMENT.md`                                  |
| PMS Test Report Template          | `docs/TEST_REPORT_TEMPLATE.md`                        |
| Conventional Commits Spec         | https://www.conventionalcommits.org/en/v1.0.0/        |
| Clean Architecture (Robert Martin)| ISBN 978-0134494166                                   |

---

## 3. Management Organization

### 3.1 Roles and Responsibilities

| Role                      | Responsibility                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **QA Owner**              | Overall quality strategy, SQA plan maintenance, metric analysis, quality gate enforcement, audit sign-off |
| **Dev Team Lead**         | Code review approval, architecture compliance, coding standard enforcement, technical debt management    |
| **Backend Developers**    | Unit tests for API modules, integration tests, API contract adherence, Prisma migration quality         |
| **Frontend Developers**   | Component unit tests, E2E test scenarios, accessibility compliance, UI/UX adherence                     |
| **DevOps Engineer**       | CI/CD pipeline maintenance, deployment verification, infrastructure monitoring, security patching        |
| **Project Manager (PM)**  | Schedule adherence, risk escalation, resource allocation, stakeholder communication                      |

### 3.2 Organization Chart

```
                    +-----------------+
                    |   QA Owner      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |  Dev Team Lead   |          |  DevOps Engineer |
     +--------+--------+          +-----------------+
              |
     +--------+--------+
     |                  |
  Backend Dev       Frontend Dev
```

### 3.3 Communication

- **Daily:** Standup meetings to flag quality issues
- **Weekly:** Quality review in sprint retrospective
- **Monthly:** Security audit review and metric analysis report
- **Ad hoc:** Critical defect triage meetings

---

## 4. QA Tasks and Schedule

### 4.1 QA Activity Matrix

| QA Activity              | Trigger / Frequency    | Owner              | Automated | Gate Type   |
| ------------------------ | ---------------------- | ------------------ | --------- | ----------- |
| Code Linting (ESLint)    | Per commit             | Developer          | Yes       | Hard gate   |
| Code Formatting          | Per commit             | Developer          | Yes       | Hard gate   |
| Type Checking (tsc)      | Per commit             | Developer          | Yes       | Hard gate   |
| Unit Testing             | Per push               | Developer          | Yes       | Hard gate   |
| E2E Testing              | Per push               | QA / Developer     | Yes       | Hard gate   |
| Code Review              | Per Pull Request       | Dev Team Lead      | Partial   | Hard gate   |
| Integration Testing      | Per PR merge to main   | CI/CD Pipeline     | Yes       | Hard gate   |
| Security Audit           | Monthly                | QA Owner / DevOps  | Partial   | Soft gate   |
| Performance Testing      | Per release            | DevOps             | Yes       | Soft gate   |
| Dependency Audit         | Weekly                 | DevOps             | Yes       | Soft gate   |
| Accessibility Audit      | Per release            | Frontend Dev       | Partial   | Soft gate   |

### 4.2 Gate Definitions

- **Hard gate:** Pipeline is blocked and merge is prevented until the check passes. No exceptions without QA Owner approval.
- **Soft gate:** Warning is raised and tracked. Development may proceed, but resolution is required before the next release milestone.

### 4.3 CI/CD Pipeline Stages

```
[Push/PR] --> [Lint + Format + Type Check] --> [Unit Tests] --> [E2E Tests] --> [Build] --> [Deploy]
                     |                              |                |              |
                  Hard Gate                     Hard Gate        Hard Gate      Verify
```

---

## 5. Tools and Infrastructure

### 5.1 Quality Toolchain

| Category              | Tool                    | Version   | Purpose                                         |
| --------------------- | ----------------------- | --------- | ----------------------------------------------- |
| **Linting**           | ESLint                  | 9.x       | Static code analysis, enforce coding rules       |
| **Formatting**        | Prettier                | 3.x       | Consistent code formatting                       |
| **Type Checking**     | TypeScript              | strict    | Static type analysis, compile-time error detection |
| **Unit Testing**      | Jest                    | 30.x      | Unit and integration test runner                 |
| **E2E Testing**       | Playwright              | 1.57.x    | Browser-based end-to-end testing                 |
| **CI/CD**             | GitHub Actions          | latest    | Automated pipeline execution                     |
| **Monitoring**        | Prometheus + Grafana    | latest    | Application and infrastructure monitoring        |
| **API Documentation** | Swagger / OpenAPI       | 3.0       | API contract documentation and validation        |
| **Security Scanning** | npm audit + Snyk        | latest    | Dependency vulnerability scanning                |
| **Git Hooks**         | husky + lint-staged     | latest    | Pre-commit and pre-push hook execution           |
| **Coverage Reporting**| Jest (built-in) + lcov  | -         | Code coverage collection and reporting           |

### 5.2 Infrastructure

| Component       | Technology         | Purpose                          |
| --------------- | ------------------ | -------------------------------- |
| Database        | PostgreSQL 16      | Primary data store               |
| ORM             | Prisma 7           | Database access and migrations   |
| Cache           | Redis              | Session and query caching        |
| Object Storage  | MinIO              | File upload storage              |
| Reverse Proxy   | Nginx              | Load balancing, SSL termination  |
| Containerization| Docker Compose     | Service orchestration            |

---

## 6. Coding Standards

### 6.1 TypeScript Strict Mode

All TypeScript code must compile with the following `tsconfig.json` strict options enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 6.2 ESLint + Prettier Enforcement

- ESLint and Prettier are enforced via **pre-commit hooks** using `husky` and `lint-staged`.
- Every commit is automatically linted and formatted before being accepted.
- The CI/CD pipeline independently runs lint checks as a verification layer.
- Zero ESLint errors are tolerated; warnings must be resolved before release.

**Pre-commit hook configuration (lint-staged):**

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml}": ["prettier --write"]
}
```

### 6.3 Conventional Commits

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Allowed types:**

| Type       | Description                                    |
| ---------- | ---------------------------------------------- |
| `feat`     | A new feature                                  |
| `fix`      | A bug fix                                      |
| `docs`     | Documentation only changes                     |
| `style`    | Formatting, missing semicolons, etc.           |
| `refactor` | Code change that neither fixes nor adds feature|
| `perf`     | Performance improvement                        |
| `test`     | Adding or updating tests                       |
| `chore`    | Build process or auxiliary tool changes         |
| `ci`       | CI configuration changes                       |
| `revert`   | Reverts a previous commit                      |

### 6.4 Clean Architecture

The codebase follows Clean Architecture principles with four distinct layers:

1. **Domain Layer:** Entities, value objects, domain events (no external dependencies)
2. **Application Layer:** Use cases, DTOs, interfaces (depends only on domain)
3. **Infrastructure Layer:** Database, external services, framework adapters (implements interfaces)
4. **Presentation Layer:** Controllers, middleware, API routes (depends on application layer)

**Rules:**
- Dependencies point inward only (presentation -> application -> domain)
- Domain layer has zero external dependencies
- Infrastructure implements interfaces defined in the application layer
- No business logic in controllers or middleware

---

## 7. Testing Standards

### 7.1 Unit Testing

| Criterion                      | Requirement                                           |
| ------------------------------ | ----------------------------------------------------- |
| **Coverage target**            | >= 80% line coverage across all modules               |
| **Mandatory coverage modules** | Services, use cases, utilities, validators             |
| **Test naming convention**     | `describe('ClassName', () => { it('should ...') })`   |
| **Isolation**                  | All external dependencies must be mocked               |
| **Execution time**             | Individual unit test < 500ms                           |
| **Framework**                  | Jest 30 with ts-jest                                   |

### 7.2 End-to-End Testing

| Criterion                      | Requirement                                           |
| ------------------------------ | ----------------------------------------------------- |
| **Coverage target**            | All critical user paths must be E2E tested             |
| **Pass rate**                  | 100% pass rate required for merge                     |
| **Framework**                  | Playwright 1.57                                       |
| **Browsers**                   | Chromium, Firefox, WebKit                              |
| **Environment**                | Dedicated test database, seeded with fixture data      |
| **Execution**                  | Runs on CI/CD pipeline on every push                   |

**Critical paths requiring E2E coverage:**

1. User authentication (login, logout, token refresh)
2. Project creation and lifecycle management
3. Task creation, assignment, status transitions (Kanban)
4. Approval workflow (submit, approve, reject, request changes)
5. File upload and download
6. Admin user and client management

### 7.3 Test Execution Policy

- All tests run automatically on CI/CD via GitHub Actions.
- Unit tests execute on every push to any branch.
- E2E tests execute on every push to any branch.
- Integration tests execute on PR merge to `main`/`master`.
- No code may be merged if any test fails.
- Test results are reported in the PR as status checks.

---

## 8. Review Standards

### 8.1 Pull Request Requirements

| Requirement                         | Enforced By         |
| ----------------------------------- | ------------------- |
| At least 1 PR approval required     | GitHub branch rules  |
| All automated checks must pass      | GitHub status checks |
| No unresolved review comments       | Reviewer discretion  |
| PR description must explain changes | PR template          |
| Linked issue or ticket required     | PR template          |

### 8.2 Code Review Checklist

Reviewers must verify the following before approving:

- [ ] Code compiles without errors or warnings
- [ ] All existing tests pass
- [ ] New/modified code has adequate test coverage
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is appropriate and consistent
- [ ] API changes are documented in Swagger/OpenAPI
- [ ] Database migrations are reversible
- [ ] No N+1 query patterns introduced
- [ ] Clean Architecture layer boundaries are respected
- [ ] Conventional Commit messages are correct
- [ ] No TODO/FIXME without an associated tracking issue

### 8.3 Review Turnaround

- PRs must be reviewed within **1 business day** of submission.
- Critical/hotfix PRs must be reviewed within **4 hours**.
- If the primary reviewer is unavailable, a secondary reviewer is assigned.

---

## 9. Quality Metrics

### 9.1 Quality Metrics Dashboard

| Metric                     | Target         | Measurement Method              | Frequency     | Escalation Threshold |
| -------------------------- | -------------- | ------------------------------- | ------------- | -------------------- |
| Unit Test Coverage         | >= 80% lines   | Jest coverage report (lcov)     | Per push      | < 70%                |
| E2E Test Pass Rate         | 100%           | Playwright test results         | Per push      | < 100%               |
| ESLint Errors              | 0 errors       | ESLint report                   | Per commit    | > 0                  |
| Build Success Rate         | > 95%          | GitHub Actions history          | Weekly        | < 90%                |
| PR Review Turnaround       | < 1 day        | GitHub PR metrics               | Weekly        | > 2 days             |
| Mean Time to Resolve (MTTR)| < 4 hours      | Issue tracking                  | Per incident  | > 8 hours            |
| Defect Escape Rate         | < 5%           | Production bugs / total defects | Monthly       | > 10%                |
| Security Vulnerabilities   | 0 critical/high| npm audit + Snyk                | Weekly        | > 0                  |
| API Response Time (p95)    | < 500ms        | Prometheus + Grafana            | Continuous    | > 1000ms             |
| Uptime                     | >= 99.5%       | Health check monitoring         | Continuous    | < 99%                |

### 9.2 Metric Collection Pipeline

#### 9.2.1 Automated Collection

| Metric Source | Collection Tool | Storage | Dashboard | Alert Channel |
|---|---|---|---|---|
| Test coverage | Jest + lcov | GitHub Actions artifacts | Coverage HTML report | PR status check |
| Build status | GitHub Actions | GitHub API | GitHub Actions dashboard | Email + Slack |
| API latency (p50/p95/p99) | Prometheus `httpRequestDuration` | Prometheus TSDB (15d retention) | Grafana | PagerDuty (p95 > 1s) |
| Error rate | Prometheus `httpRequestsTotal` | Prometheus TSDB | Grafana | Slack (> 5% 5xx) |
| Active connections | Prometheus `activeConnections` Gauge | Prometheus TSDB | Grafana | PagerDuty (> 500) |
| DB query duration | Prometheus `dbQueryDuration` | Prometheus TSDB | Grafana | Slack (p95 > 200ms) |
| Dependency vulnerabilities | npm audit / TruffleHog / CodeQL | GitHub Security tab | GitHub Security dashboard | Email (critical/high) |
| Uptime | Health check endpoint `/api/health` | UptimeRobot | Status page | SMS + Email (downtime) |

#### 9.2.2 Manual Collection

| Metric | Collector | Frequency | Report Location |
|---|---|---|---|
| Defect escape rate | QA Owner | Monthly | Monthly quality report |
| PR review turnaround | QA Owner | Weekly | Sprint retrospective |
| Test flakiness rate | Dev Team Lead | Weekly | Sprint retrospective |
| Technical debt ratio | Dev Team Lead | Monthly | Monthly quality report |

#### 9.2.3 Reporting Cadence

- **Per push:** Coverage report artifact uploaded to GitHub Actions.
- **Weekly:** QA Owner compiles sprint quality summary (coverage trend, defect count, review turnaround).
- **Monthly:** Comprehensive quality report covering all metrics in section 9.1, distributed to all stakeholders.
- **Quarterly:** Quality trend analysis with historical comparison and improvement recommendations.

---

## 10. Risk Management

### 10.1 Quality Risk Register

| Risk ID | Risk Description           | Likelihood | Impact   | Mitigation Strategy                                                                                          | Owner         | Status   |
| ------- | -------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------- | -------- |
| QR-001  | Regression bugs            | Medium     | High     | Comprehensive unit + E2E test suites; all tests must pass before merge; automated CI/CD gates                 | Dev Team Lead | Active   |
| QR-002  | Security vulnerabilities   | Medium     | Critical | Monthly security audits; weekly dependency scans (npm audit, Snyk); Helmet/CORS/CSRF/rate limiting in production; token blacklisting | DevOps        | Active   |
| QR-003  | Performance degradation    | Medium     | High     | Prometheus + Grafana monitoring with alerting; p95 latency thresholds; database query optimization; Redis caching; load testing per release | DevOps        | Active   |
| QR-004  | Data loss                  | Low        | Critical | Automated daily PostgreSQL backups (30-day retention); MinIO file backups; disaster recovery procedure tested quarterly; database replication | DevOps        | Active   |
| QR-005  | Test environment drift     | Medium     | Medium   | Docker Compose ensures consistent environments; test fixtures seeded identically; infrastructure-as-code      | DevOps        | Active   |
| QR-006  | Insufficient test coverage | Medium     | High     | 80% minimum coverage gate; coverage trends tracked in CI; new features require tests in PR                    | QA Owner      | Active   |
| QR-007  | Knowledge bus factor       | Low        | Medium   | Code review ensures shared knowledge; architecture documentation maintained; onboarding documentation          | PM            | Active   |

### 10.2 Risk Review Cadence

- Risks are reviewed in the **monthly quality review meeting**.
- New risks are added as they are identified during development or audits.
- Mitigated risks are moved to "Resolved" status but retained for historical reference.

---

## 11. Problem Reporting and Corrective Action

*IEEE 730-2014, Section 4.2.7*

### 11.1 Defect Lifecycle

```
[Open] --> [Triaged] --> [In Progress] --> [In Review] --> [Verified] --> [Closed]
                 |                                              |
                 +----- [Deferred] ----+                        +--- [Reopened] --+
                 |                     |                                          |
                 +----- [Won't Fix] ---+                                          |
                                                                                  v
                                                                            [In Progress]
```

### 11.2 Severity Classification and Response Times

| Severity | Definition | Response Time | Resolution Target | Escalation |
|---|---|---|---|---|
| **Critical (S1)** | System down, data loss, security breach | 1 hour | 4 hours | Immediate: PM + QA Owner |
| **High (S2)** | Major feature broken, no workaround | 4 hours | 1 business day | After 4h: Dev Team Lead |
| **Medium (S3)** | Feature degraded, workaround exists | 1 business day | 3 business days | After 2 days: QA Owner |
| **Low (S4)** | Minor issue, cosmetic defect | 2 business days | Next sprint | Monthly review |

### 11.3 Corrective Action Process

1. **Identification:** Defect reported via GitHub Issue with severity label and reproduction steps.
2. **Root cause analysis:** Developer documents root cause in the issue before implementing fix.
3. **Fix implementation:** Developer creates PR with fix and regression test.
4. **Verification:** QA Owner or reporter verifies fix in staging environment.
5. **Prevention:** If S1/S2, team conducts a brief retrospective (max 30 minutes) to identify process improvements.
6. **Documentation:** Lessons learned recorded in the monthly quality report.

### 11.4 Defect Tracking

- **Tool:** GitHub Issues with labels (`bug`, `severity:S1`-`severity:S4`, `module:*`)
- **Dashboard:** GitHub Project board with columns matching defect lifecycle states
- **Metrics tracked:** Open defects by severity, mean time to resolve (MTTR), defect escape rate

---

## 12. Media Control

*IEEE 730-2014, Section 4.2.8*

### 12.1 Source Code Control

| Item | Storage | Access Control | Backup |
|---|---|---|---|
| Application source code | GitHub (private repo) | Branch protection on `master`/`develop`; PR approval required | GitHub redundancy + daily mirror |
| Database migrations | `backend/prisma/migrations/` in repo | Same as source code; immutable once deployed | Same as source code |
| Infrastructure config | `docker-compose.yml`, Nginx configs | Restricted to DevOps role | Same as source code |
| Environment secrets | `.env` files (gitignored) | Only DevOps and PM have production secrets | Encrypted backup in vault |

### 12.2 Documentation Control

| Document | Location | Format | Version Control |
|---|---|---|---|
| SQA Plan (this document) | `docs/SQA_PLAN.md` | Markdown | Git versioned; changes via PR |
| Architecture Document | `docs/ARCHITECTURE.md` | Markdown | Git versioned; changes via PR |
| Test Plan | `backend/test/TEST_PLAN.md` | Markdown | Git versioned; changes via PR |
| API Documentation | `/api/docs` (Swagger) | OpenAPI 3.0 | Auto-generated from code decorators |
| ADRs | `docs/adr/*.md` | Markdown (MADR format) | Git versioned; immutable after accepted |

### 12.3 Build Artifacts

| Artifact | Storage | Retention | Access |
|---|---|---|---|
| Docker images | Container registry | Latest 10 tags | DevOps |
| Coverage reports | GitHub Actions artifacts | 14 days | Public (team) |
| Test reports | GitHub Actions artifacts | 14 days | Public (team) |
| Production builds | Docker volumes | Current + 2 previous versions | DevOps |

### 12.4 Test Data

- Fixture data is defined in `backend/prisma/seed.ts` and version-controlled.
- Test databases are ephemeral (created/destroyed per CI run).
- No production data is used in test environments.

---

## 13. Supplier Control

*IEEE 730-2014, Section 4.2.9*

### 13.1 Third-Party Dependency Management

| Category | Policy |
|---|---|
| **Selection criteria** | Active maintenance (commits within 6 months), adequate documentation, compatible license (MIT/Apache/ISC), no known critical vulnerabilities |
| **Approval process** | New dependencies require Dev Team Lead approval in PR review |
| **Version policy** | Use caret (`^`) ranges; lock exact versions via `package-lock.json`; update monthly |
| **Vulnerability scanning** | `npm audit --audit-level=high` in CI pipeline; TruffleHog secret scanning; CodeQL SAST |
| **Removal policy** | Unused dependencies flagged by `depcheck` tool; removed in maintenance sprints |

### 13.2 External Service SLAs

| Service | Provider | SLA Target | Monitoring | Fallback |
|---|---|---|---|---|
| PostgreSQL | Self-hosted (Docker) | 99.9% uptime | Health check via `pg_isready` | Daily backup restoration |
| Redis | Self-hosted (Docker) | 99.9% uptime | Health check via `redis-cli ping` | In-memory fallback for token blacklist |
| MinIO | Self-hosted (Docker) | 99.5% uptime | Health check endpoint | Local filesystem fallback |
| GitHub Actions | GitHub | 99.9% uptime | GitHub Status page | Manual build/deploy procedure |

### 13.3 Evaluation Criteria

External services and dependencies are evaluated annually against:
1. **Reliability:** Uptime history over 12 months
2. **Security:** CVE count and response time to patches
3. **Compatibility:** Breaking changes impact on our codebase
4. **Cost:** License and infrastructure costs
5. **Alternatives:** Availability of competitive alternatives

---

## 14. Training Requirements

*IEEE 730-2014, Section 4.2.10*

### 14.1 Onboarding Training

All new team members must complete the following within their first 2 weeks:

| Training Module | Duration | Delivered By | Materials |
|---|---|---|---|
| Codebase architecture walkthrough | 2 hours | Dev Team Lead | `docs/ARCHITECTURE.md`, ADRs |
| Development environment setup | 1 hour | DevOps | `docs/DEPLOYMENT.md` |
| QA process and standards | 1 hour | QA Owner | This SQA Plan |
| Testing patterns and coverage requirements | 1 hour | Dev Team Lead | `backend/test/TEST_PLAN.md`, existing test files |
| CI/CD pipeline overview | 30 min | DevOps | `.github/workflows/ci.yml` |
| Git workflow and PR process | 30 min | Dev Team Lead | PR template, branch protection rules |

### 14.2 Ongoing Training

| Activity | Frequency | Audience | Purpose |
|---|---|---|---|
| Security awareness briefing | Quarterly | All developers | OWASP Top 10 updates, dependency risks |
| New tool/library adoption review | As needed | Affected developers | Evaluate and onboard new dependencies |
| Architecture decision review | Monthly | All developers | Review new ADRs and design decisions |
| Quality metrics review | Monthly | All team members | Review quality trends and improvement actions |

### 14.3 Training Records

- Training completion is tracked in the project management system.
- Each team member's training history is maintained by the PM.
- Incomplete mandatory training is flagged in the monthly quality report.

---

## 15. Document Approval

| Role              | Name           | Signature   | Date       |
| ----------------- | -------------- | ----------- | ---------- |
| QA Owner          | ______________ | ___________ | __________ |
| Dev Team Lead     | ______________ | ___________ | __________ |
| Project Manager   | ______________ | ___________ | __________ |

---

**Document History:**

| Version | Date       | Author    | Changes                        |
| ------- | ---------- | --------- | ------------------------------ |
| 1.0     | 2026-01-30 | QA Team   | Initial SQA Plan creation      |
| 1.1     | 2026-01-30 | QA Team   | Added IEEE 730 sections 11-14: Problem Reporting, Media Control, Supplier Control, Training; expanded Metrics Collection Pipeline |
| 1.2     | 2026-01-30 | QA Team   | Final audit: verified all 15 sections present per IEEE 730-2014; cross-referenced with TEST_PLAN.md v1.2 and ARCHITECTURE.md v1.2 |

---

*This document follows IEEE 730-2014: IEEE Standard for Software Quality Assurance Processes.*
