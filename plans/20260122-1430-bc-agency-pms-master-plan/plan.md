# BC Agency PMS - Master Plan

**Version:** 1.0 | **Date:** 2026-01-22 | **Duration:** 12 Weeks | **Team:** Single Developer

---

## Project Summary

Web-based Project Management System for BC Agency Vietnam, replacing 3+ Excel files (46 sheets, 135 columns) with:
- Single source of truth for all projects
- Automated approval workflow
- Client portal with access codes
- Built-in calendar and Telegram notifications
- Self-hosted file storage (MinIO)

**Tech Stack:** NestJS + Next.js 14 + PostgreSQL + Redis + MinIO + Docker

---

## Timeline Overview

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| [Phase 1](./phase-01-foundation.md) | Week 1-3 | Infrastructure, Auth, UI Foundation | [x] Complete |
| [Phase 2](./phase-02-core-features.md) | Week 4-6 | Project, Task, File, Dashboard | [x] Complete |
| [Phase 3](./phase-03-workflow-calendar.md) | Week 7-9 | Approval, Calendar, Notifications | [ ] In Progress |
| [Phase 4](./phase-04-client-portal-polish.md) | Week 10-12 | Client Portal, Reports, Deploy | [ ] Pending |

---

## Key Milestones

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| W3 | Auth Complete | Login working (internal + client) |
| W6 | Core MVP | Projects + Tasks + Files functional |
| W9 | Workflow Ready | Approval + Calendar + Notifications |
| W12 | Go Live | Production deployment |

---

## Success Criteria

- [ ] 100 users supported (50 internal + 50 clients)
- [ ] 20 concurrent users without performance degradation
- [ ] Page load time < 3 seconds
- [ ] 99.5% uptime
- [ ] All Excel data migrated successfully
- [ ] Telegram notifications working

---

## Deferred to v2

- Gantt chart view
- Advanced analytics dashboard
- Mobile native app
- Google Calendar sync
- AI-powered recommendations

---

## References

- [Brainstorm Report](../../BC-Agency-PMS-Brainstorm-Report.md)
- [NestJS Architecture Research](./research/researcher-01-nestjs-architecture.md)
- [Frontend & Monitoring Research](./research/researcher-02-frontend-monitoring.md)
