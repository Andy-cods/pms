# Test Report

**IEEE 829-2008 Compliant**

---

## Report Header

| Field                | Value                                           |
| -------------------- | ----------------------------------------------- |
| **Report ID**        | PMS-TR-YYYY-MM-DD-NNN                           |
| **Date**             | YYYY-MM-DD                                      |
| **Tester**           | [Name / Team]                                   |
| **Application**      | PMS - Project Management System (BC Agency)     |
| **Version / Build**  | v0.0.0 / build #000                             |
| **Environment**      | [ ] Development  [ ] Staging  [ ] Production    |
| **Branch / Commit**  | branch-name / abc1234                           |
| **CI/CD Run**        | [GitHub Actions Run URL]                        |

---

## 1. Summary

**Test Objective:**
> Briefly describe the purpose and scope of this test execution (e.g., "Verify release v1.2.0 quality gates before production deployment").

**Overall Result:**

| Category          | Total | Passed | Failed | Skipped | Pass Rate |
| ----------------- | ----- | ------ | ------ | ------- | --------- |
| Unit Tests        |       |        |        |         |       %   |
| E2E Tests         |       |        |        |         |       %   |
| **Total**         |       |        |        |         |       %   |

**Key Findings:**
> Summarize major findings, blockers, or notable observations from this test execution.

---

## 2. Unit Test Results

### 2.1 Module-Level Results

| # | Module              | Total Tests | Passed | Failed | Skipped | Line Coverage | Branch Coverage | Status       |
|---|---------------------|-------------|--------|--------|---------|---------------|-----------------|--------------|
| 1 | Auth                |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 2 | Users               |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 3 | Clients             |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 4 | Projects            |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 5 | Tasks               |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 6 | Approvals           |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 7 | Events              |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 8 | Files               |             |        |        |         |           %   |             %   | PASS / FAIL  |
| 9 | Admin               |             |        |        |         |           %   |             %   | PASS / FAIL  |
|10 | Notifications       |             |        |        |         |           %   |             %   | PASS / FAIL  |
|11 | Shared / Utils      |             |        |        |         |           %   |             %   | PASS / FAIL  |
|   | **TOTAL**           |             |        |        |         |           %   |             %   |              |

### 2.2 Coverage Against Target

| Metric             | Target   | Actual   | Status       |
| ------------------ | -------- | -------- | ------------ |
| Line Coverage      | >= 80%   |      %   | PASS / FAIL  |
| Branch Coverage    | >= 70%   |      %   | PASS / FAIL  |
| Function Coverage  | >= 80%   |      %   | PASS / FAIL  |

### 2.3 Failed Unit Tests (if any)

| # | Test Name                                 | Module    | Error Message                            | Root Cause / Notes            |
|---|-------------------------------------------|-----------|------------------------------------------|-------------------------------|
| 1 |                                           |           |                                          |                               |
| 2 |                                           |           |                                          |                               |
| 3 |                                           |           |                                          |                               |

---

## 3. End-to-End (E2E) Test Results

### 3.1 Test Suite Results

| # | Test Suite                          | Browser   | Total | Passed | Failed | Skipped | Duration  | Status      |
|---|-------------------------------------|-----------|-------|--------|--------|---------|-----------|-------------|
| 1 | Authentication Flow                 | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 2 | Authentication Flow                 | Firefox   |       |        |        |         |       s   | PASS / FAIL |
| 3 | Authentication Flow                 | WebKit    |       |        |        |         |       s   | PASS / FAIL |
| 4 | Project Lifecycle                   | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 5 | Task Management (Kanban)            | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 6 | Approval Workflow                   | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 7 | File Upload & Download              | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 8 | Admin - User Management             | Chromium  |       |        |        |         |       s   | PASS / FAIL |
| 9 | Admin - Client Management           | Chromium  |       |        |        |         |       s   | PASS / FAIL |
|10 | Calendar & Events                   | Chromium  |       |        |        |         |       s   | PASS / FAIL |
|   | **TOTAL**                           | **All**   |       |        |        |         |       s   |             |

### 3.2 E2E Pass Rate Against Target

| Metric             | Target   | Actual   | Status       |
| ------------------ | -------- | -------- | ------------ |
| E2E Pass Rate      | 100%     |      %   | PASS / FAIL  |

### 3.3 Failed E2E Tests (if any)

| # | Test Name                                 | Browser   | Error / Screenshot                       | Root Cause / Notes            |
|---|-------------------------------------------|-----------|------------------------------------------|-------------------------------|
| 1 |                                           |           |                                          |                               |
| 2 |                                           |           |                                          |                               |
| 3 |                                           |           |                                          |                               |

---

## 4. Defects Found

### 4.1 Defect Summary

| Severity      | New  | Open | Fixed | Deferred | Total |
| ------------- | ---- | ---- | ----- | -------- | ----- |
| Critical      |      |      |       |          |       |
| High          |      |      |       |          |       |
| Medium        |      |      |       |          |       |
| Low           |      |      |       |          |       |
| **Total**     |      |      |       |          |       |

### 4.2 Defect Details

| # | Defect ID   | Severity  | Module       | Description                                         | Steps to Reproduce                        | Status      | Assigned To  |
|---|-------------|-----------|--------------|-----------------------------------------------------|-------------------------------------------|-------------|--------------|
| 1 |             | Critical  |              |                                                     |                                           | Open/Fixed  |              |
| 2 |             | High      |              |                                                     |                                           | Open/Fixed  |              |
| 3 |             | Medium    |              |                                                     |                                           | Open/Fixed  |              |
| 4 |             | Low       |              |                                                     |                                           | Open/Fixed  |              |

### 4.3 Severity Definitions

| Severity  | Definition                                                                        |
| --------- | --------------------------------------------------------------------------------- |
| Critical  | System crash, data loss, security breach, complete feature failure                |
| High      | Major feature broken, no workaround available, significant user impact            |
| Medium    | Feature partially broken, workaround exists, moderate user impact                 |
| Low       | Minor issue, cosmetic defect, minimal user impact                                 |

---

## 5. Quality Gate Verification

### 5.1 Quality Gate Checklist

| # | Quality Gate                                     | Target          | Actual   | Result           |
|---|--------------------------------------------------|-----------------|----------|------------------|
| 1 | Unit test coverage >= 80% lines                  | >= 80%          |      %   | [ ] PASS [ ] FAIL|
| 2 | E2E test pass rate = 100%                        | 100%            |      %   | [ ] PASS [ ] FAIL|
| 3 | ESLint errors = 0                                | 0               |          | [ ] PASS [ ] FAIL|
| 4 | TypeScript compilation succeeds                  | 0 errors        |          | [ ] PASS [ ] FAIL|
| 5 | Build succeeds                                   | Success         |          | [ ] PASS [ ] FAIL|
| 6 | No critical or high severity defects open         | 0               |          | [ ] PASS [ ] FAIL|
| 7 | No security vulnerabilities (critical/high)       | 0               |          | [ ] PASS [ ] FAIL|
| 8 | API response time p95 < 500ms                    | < 500ms         |      ms  | [ ] PASS [ ] FAIL|

### 5.2 Overall Pass/Fail Decision

> **[ ] PASS** -- All quality gates met. Approved for release/merge.
>
> **[ ] FAIL** -- One or more quality gates not met. See details above.

**Decision Rationale:**
> Provide reasoning for the pass/fail decision, especially if any gates are waived.

---

## 6. Test Environment Details

| Component          | Version / Configuration                          |
| ------------------ | ------------------------------------------------ |
| Node.js            |                                                  |
| TypeScript         |                                                  |
| Jest               |                                                  |
| Playwright         |                                                  |
| PostgreSQL         |                                                  |
| Redis              |                                                  |
| Docker             |                                                  |
| OS (CI runner)     |                                                  |

---

## 7. Notes

> Add any additional observations, risks, recommendations, or context relevant to this test execution.

-
-
-

---

## 8. Sign-Off

| Role              | Name           | Signature   | Date       | Decision          |
| ----------------- | -------------- | ----------- | ---------- | ----------------- |
| Tester            | ______________ | ___________ | __________ | Report submitted  |
| QA Owner          | ______________ | ___________ | __________ | Reviewed          |
| Dev Team Lead     | ______________ | ___________ | __________ | Acknowledged      |
| Project Manager   | ______________ | ___________ | __________ | Release approved  |

---

**Document History:**

| Version | Date       | Author  | Changes                            |
| ------- | ---------- | ------- | ---------------------------------- |
| 1.0     | 2026-01-30 | QA Team | Initial test report template       |

---

*This template follows IEEE 829-2008: IEEE Standard for Software and System Test Documentation.*
