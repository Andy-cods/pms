# Phase 4: Client Portal & Polish (Week 10-12)

**Duration:** 3 weeks | **Status:** [x] Week 10-11 COMPLETE | Week 12 IN PROGRESS | **Depends on:** Phase 3
**Code Review:** See `reports/260123-phase3-phase4-code-review.md` for detailed analysis

---

## Context

Final phase delivers client-facing features and prepares for production. Client portal allows external stakeholders to view project progress without internal access. Reports enable data export. Admin panel centralizes system management. Data migration moves BC Agency from Excel to PMS.

---

## Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 10 | Client Portal & Reports | Client entity, Access codes, Limited view, PDF/Excel export |
| Week 11 | Admin Panel & Migration | User management, Settings, Audit logs, Excel migration |
| Week 12 | Testing & Deployment | Integration tests, E2E tests, Monitoring, Go live |

---

## Requirements

### Functional
- Clients login with access codes (format: BC-CLIENTNAME-YY-XXXX)
- Client portal shows limited project view (no budget details, no internal tasks)
- Watermark on all client-visible content
- Export reports to PDF and Excel
- Admin panel: user CRUD, system settings, audit logs viewer
- Migrate existing Excel data to PostgreSQL
- Production deployment with monitoring

### Non-Functional
- Client login < 3s
- PDF generation < 10s for 10-page report
- Data migration handles 50 projects without data loss
- Production uptime > 99.5%
- Monitoring alerts within 1 minute of issues

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Stack                          │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│ Client Portal │  Admin Panel  │   Reports     │   Monitoring    │
│ (Limited View)│ (Full Access) │  (PDF/Excel)  │(Prom+Graf+Loki) │
├───────────────┴───────────────┴───────────────┴─────────────────┤
│                         NestJS + Next.js                         │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │   Redis   │   MinIO   │   Prometheus   │  Grafana │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Week 10: Client Portal & Reports

#### Day 64-66: Client Entity & Authentication
- [ ] **Task 10.1:** Create Client entity
  - Properties: id, companyName, contactName, contactEmail, accessCode, isActive
  - Access code format: BC-{CLIENT}-{YY}-{RAND4}
  - Link to multiple projects
  - **Subtasks:**
    - Create `client.entity.ts`
    - Create AccessCodeService for generation
  - **Acceptance Criteria:** Clients stored correctly
  - **Dependencies:** Auth module from Phase 1
  - **Effort:** 2 hours

- [ ] **Task 10.2:** Create Client authentication use case
  - `ClientLoginUseCase`:
    - Validate access code
    - Optional 2FA via email/SMS
    - Generate limited JWT (client role)
    - Log access
  - **Acceptance Criteria:** Clients can log in with code
  - **Effort:** 3 hours

- [ ] **Task 10.3:** Create ClientAccessGuard
  - Check JWT has client role
  - Only allow access to client portal routes
  - Verify client owns requested project
  - **Acceptance Criteria:** Clients restricted to their projects
  - **Effort:** 2 hours

- [ ] **Task 10.4:** Create Client endpoints
  - `POST /api/auth/client-login` - login with code
  - `GET /api/client/projects` - list client's projects
  - `GET /api/client/projects/:id` - get project (limited data)
  - **Acceptance Criteria:** Client API works correctly
  - **Effort:** 2 hours

#### Day 67-69: Client Portal UI
- [ ] **Task 10.5:** Create Client login page
  - Access code input (formatted as BC-XXXX-XX-XXXX)
  - Optional 2FA step
  - Different styling from internal login
  - BC Agency branding
  - **Acceptance Criteria:** Clients can log in
  - **Effort:** 3 hours

- [ ] **Task 10.6:** Create Client dashboard
  - List of accessible projects
  - Project cards with: name, status, stage, progress
  - No internal metrics visible
  - **Acceptance Criteria:** Clients see their projects
  - **Effort:** 3 hours

- [ ] **Task 10.7:** Create Client project detail page
  - Project overview: name, status, stage progress
  - Timeline: start date, end date, milestones
  - Key metrics: Leads, CPL (sanitized values)
  - Reports section: list of shared reports
  - **Hidden:** Budget details, internal tasks, team details
  - **Acceptance Criteria:** Clients see limited info
  - **Effort:** 4 hours

- [ ] **Task 10.8:** Create Watermark system
  - CSS watermark overlay
  - Shows: BC AGENCY LOGO, CONFIDENTIAL, Client name, Date
  - Applied to all client portal pages
  - Non-removable via CSS
  - **Acceptance Criteria:** Watermark visible on screenshots
  - **Effort:** 2 hours

- [ ] **Task 10.9:** Create Client layout
  - Separate from internal layout
  - Simpler navigation (Home, Projects)
  - Logout button
  - Contact support link
  - **Acceptance Criteria:** Client experience is clean
  - **Effort:** 2 hours

#### Day 70: Reports Module
- [ ] **Task 10.10:** Create Report service
  - Generate weekly report data
  - Generate monthly report data
  - Aggregate KPIs, activities, milestones
  - **Acceptance Criteria:** Report data accurate
  - **Effort:** 3 hours

- [ ] **Task 10.11:** Create PDF export
  - Use Puppeteer for HTML-to-PDF
  - Report template with BC Agency branding
  - Include charts (render as images)
  - **Subtasks:**
    - Create report HTML template
    - Setup Puppeteer in Docker
    - Handle large reports (pagination)
  - **Acceptance Criteria:** PDF generates correctly
  - **Effort:** 4 hours

- [ ] **Task 10.12:** Create Excel export
  - Use ExcelJS library
  - Multiple sheets: Summary, Tasks, Budget, KPIs
  - Formatted with headers and styling
  - **Acceptance Criteria:** Excel opens in Microsoft Excel
  - **Effort:** 3 hours

- [ ] **Task 10.13:** Create Report UI
  - Report type selector (Weekly, Monthly, Custom)
  - Date range picker
  - Project selector
  - Preview and download buttons
  - Format selector (PDF, Excel)
  - **Acceptance Criteria:** Reports can be generated from UI
  - **Effort:** 3 hours

---

### Week 11: Admin Panel & Data Migration

#### Day 71-73: Admin Panel
- [ ] **Task 11.1:** Create User management endpoints
  - `GET /api/admin/users` - list all users
  - `POST /api/admin/users` - create user
  - `PATCH /api/admin/users/:id` - update user
  - `PATCH /api/admin/users/:id/deactivate` - deactivate
  - `POST /api/admin/users/:id/reset-password` - reset password
  - **Acceptance Criteria:** Admin can manage users
  - **Effort:** 3 hours

- [ ] **Task 11.2:** Create User management UI
  - Users table: Name, Email, Role, Status, Last login
  - Create user modal: name, email, role, initial password
  - Edit user modal: update info, change role
  - Deactivate with confirmation
  - Reset password (send email)
  - **Acceptance Criteria:** Full user management from UI
  - **Effort:** 4 hours

- [ ] **Task 11.3:** Create Client management UI
  - Clients table: Company, Contact, Access code, Projects
  - Create client modal
  - Regenerate access code
  - Link/unlink projects
  - **Acceptance Criteria:** Admin can manage clients
  - **Effort:** 3 hours

- [ ] **Task 11.4:** Create System settings
  - Company info: name, logo
  - Email settings: SMTP config (if needed)
  - Telegram settings: bot token
  - Notification defaults
  - **Subtasks:**
    - Create SystemSetting entity
    - Create settings endpoints
    - Create settings UI
  - **Acceptance Criteria:** Settings configurable from UI
  - **Effort:** 3 hours

- [ ] **Task 11.5:** Create Audit logs viewer
  - List: User, Action, Entity, Timestamp
  - Filters: user, action type, date range
  - Detail view: old/new values diff
  - Export to CSV
  - **Acceptance Criteria:** Admins can review all actions
  - **Effort:** 3 hours

#### Day 74-75: Data Migration
- [ ] **Task 11.6:** Create migration script structure
  - Read Excel files (xlsx package)
  - Map columns to database fields
  - Handle 135 columns normalization
  - **Subtasks:**
    - Create column mapping config
    - Handle data type conversions
    - Handle missing/invalid data
  - **Acceptance Criteria:** Script reads all Excel data
  - **Effort:** 4 hours

- [ ] **Task 11.7:** Create migration validation
  - Validate required fields
  - Check referential integrity
  - Log errors with row numbers
  - Generate validation report
  - **Acceptance Criteria:** Invalid data identified before import
  - **Effort:** 3 hours

- [ ] **Task 11.8:** Create migration execution
  - Transaction-based import
  - Progress reporting
  - Rollback on critical errors
  - Handle duplicates (update or skip)
  - **Acceptance Criteria:** Data migrates successfully
  - **Effort:** 3 hours

- [ ] **Task 11.9:** Create migration UI
  - Upload Excel file
  - Show mapping preview
  - Validation results
  - Execute migration button
  - Progress bar
  - **Acceptance Criteria:** Admin can migrate from UI
  - **Effort:** 3 hours

- [ ] **Task 11.10:** Run test migration
  - Use sample data (not production)
  - Verify all data migrated
  - Check relationships correct
  - Performance test with full dataset
  - **Acceptance Criteria:** Test migration passes
  - **Effort:** 2 hours

---

### Week 12: Testing & Deployment

#### Day 76-78: Testing
- [ ] **Task 12.1:** Write integration tests
  - Auth endpoints
  - Project CRUD
  - Task CRUD
  - Approval workflow
  - File upload
  - **Subtasks:**
    - Setup Jest with Supertest
    - Create test database
    - Write tests for each module
  - **Acceptance Criteria:** >80% API coverage
  - **Effort:** 6 hours

- [ ] **Task 12.2:** Write E2E tests
  - Login flow (internal + client)
  - Create project flow
  - Task management flow
  - Approval workflow
  - File upload flow
  - **Subtasks:**
    - Setup Playwright
    - Write test scenarios
    - CI integration
  - **Acceptance Criteria:** Critical paths tested
  - **Effort:** 6 hours

- [ ] **Task 12.3:** Performance testing
  - API load testing (50 concurrent users)
  - Database query performance
  - File upload stress test
  - **Subtasks:**
    - Use k6 or Artillery
    - Identify bottlenecks
    - Document findings
  - **Acceptance Criteria:** Meets performance requirements
  - **Effort:** 3 hours

- [ ] **Task 12.4:** Security audit
  - Check authentication flows
  - Test authorization (role bypass attempts)
  - Input validation (SQL injection, XSS)
  - File upload security
  - **Acceptance Criteria:** No critical vulnerabilities
  - **Effort:** 3 hours

#### Day 79-80: Monitoring Setup
- [ ] **Task 12.5:** Setup Prometheus
  - Add prom-client to NestJS
  - Expose /metrics endpoint
  - Configure Prometheus scraper
  - **Metrics:**
    - Request duration
    - Request count by status
    - Active connections
    - Database query duration
  - **Acceptance Criteria:** Metrics collected
  - **Effort:** 3 hours

- [ ] **Task 12.6:** Setup Grafana dashboards
  - Application dashboard: requests, errors, latency
  - Database dashboard: connections, query time
  - System dashboard: CPU, memory, disk
  - **Acceptance Criteria:** Dashboards visualize metrics
  - **Effort:** 3 hours

- [ ] **Task 12.7:** Setup Loki for logs
  - Configure Promtail for log collection
  - Setup Loki in Docker Compose
  - Create Grafana log panel
  - **Acceptance Criteria:** Logs searchable in Grafana
  - **Effort:** 2 hours

- [ ] **Task 12.8:** Setup alerting
  - Alert: Error rate > 1%
  - Alert: Response time p95 > 3s
  - Alert: Database connection pool exhausted
  - Alert: Disk usage > 80%
  - Notification channel: Telegram
  - **Acceptance Criteria:** Alerts trigger correctly
  - **Effort:** 2 hours

#### Day 81-84: Production Deployment
- [ ] **Task 12.9:** Prepare production environment
  - Server setup (2 vCPU / 4 GB RAM)
  - Install Docker, Docker Compose
  - Configure firewall (80, 443 only)
  - Setup SSH access
  - **Acceptance Criteria:** Server ready for deployment
  - **Effort:** 2 hours

- [ ] **Task 12.10:** Setup SSL certificates
  - Configure Let's Encrypt with Certbot
  - Auto-renewal cron job
  - Nginx SSL configuration
  - **Acceptance Criteria:** HTTPS working
  - **Effort:** 2 hours

- [ ] **Task 12.11:** Configure production environment
  - Create .env.production
  - Secure secrets (JWT, database, MinIO)
  - Configure backup schedule
  - **Acceptance Criteria:** Production config ready
  - **Effort:** 2 hours

- [ ] **Task 12.12:** Deploy to production
  - Build production images
  - Push to server
  - Run docker-compose up -d
  - Verify all services running
  - **Acceptance Criteria:** Application accessible at domain
  - **Effort:** 2 hours

- [ ] **Task 12.13:** Run production migration
  - Backup current Excel files
  - Run migration script
  - Verify data integrity
  - Create rollback plan
  - **Acceptance Criteria:** All data migrated correctly
  - **Effort:** 2 hours

- [ ] **Task 12.14:** Post-deployment verification
  - Smoke test all features
  - Check monitoring dashboards
  - Test alerts
  - Performance check
  - **Acceptance Criteria:** Production working correctly
  - **Effort:** 2 hours

- [ ] **Task 12.15:** Create documentation
  - User guide: how to use PMS
  - Admin guide: system administration
  - API documentation: Swagger export
  - Runbook: common operations, troubleshooting
  - **Acceptance Criteria:** Documentation complete
  - **Effort:** 4 hours

---

## Todo Checklist

### Week 10
- [x] Client entity and access codes
- [x] Client authentication working
- [x] Client portal UI with limited view
- [ ] Watermark system implemented (NEEDS VERIFICATION)
- [x] PDF and Excel export working
- [x] Reports UI complete

### Week 11
- [x] User management CRUD
- [x] Client management
- [x] System settings configurable
- [x] Audit logs viewer
- [ ] Migration script ready (SEPARATE TASK)
- [ ] Test migration successful (SEPARATE TASK)

### Week 12 (IN PROGRESS)
- [ ] Integration tests (>80% coverage)
- [ ] E2E tests for critical paths
- [ ] Performance tests passing
- [ ] Security audit complete
- [ ] Monitoring setup (Prometheus, Grafana, Loki)
- [ ] Alerts configured
- [ ] Production deployed
- [ ] Data migrated
- [ ] Documentation complete

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Client login | Access code auth | Works correctly |
| Report generation | 10-page PDF | < 10s |
| Data migration | 50 projects | 0 data loss |
| Test coverage | Integration tests | > 80% |
| Production uptime | After deploy | > 99.5% |
| Alert response | Issue detection | < 1 minute |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration errors | Medium | High | Validation, dry run, rollback plan |
| PDF generation slow | Medium | Medium | Optimize templates, queue long jobs |
| Production config issues | Low | High | Test on staging first |
| SSL certificate issues | Low | Medium | Test renewal before expiry |

---

## Security Considerations

- Client access codes are unique, 16+ characters
- Client JWT has limited permissions
- Reports exclude sensitive data for clients
- Admin actions logged
- Production secrets in environment variables, not committed
- Database backups encrypted

---

## Definition of Done

- [ ] All tasks have acceptance criteria met
- [ ] Client portal tested with real client scenario
- [ ] All data migrated and verified
- [ ] Monitoring dashboards working
- [ ] Alerts tested
- [ ] Documentation reviewed
- [ ] Handover to operations team complete
- [ ] Production running stable for 48 hours

---

## Dependencies

- **Phase 3:** All features for migration testing
- **External:**
  - Domain (pms.bcagency.com) DNS configured
  - SSL certificates from Let's Encrypt
  - Production server provisioned

---

## Notes

- Keep Excel files as backup for 1 month after migration
- Client portal MVP is read-only; file upload deferred to v2
- Consider blue-green deployment for zero-downtime updates in v2
- Schedule go-live for low-activity period (weekend)
- Have rollback plan ready for first 48 hours
- Monitor closely during first week of production

---

## Contingency Plans

### If migration fails:
1. Restore from backup
2. Fix migration script
3. Run validation again
4. Retry migration
5. If critical, keep using Excel temporarily

### If production issues:
1. Check monitoring dashboards
2. Review logs in Grafana/Loki
3. Identify root cause
4. Apply fix or rollback
5. Post-mortem and document

### If behind schedule:
1. Cut: Advanced admin features (defer to v2)
2. Cut: Detailed audit log viewer (basic list only)
3. Cut: Some E2E tests (keep critical paths)
4. Keep: Migration, core testing, deployment
