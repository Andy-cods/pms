# BC Agency PMS - Documentation

Welcome to the BC Agency Project Management System documentation.

## Documentation Overview

This directory contains comprehensive documentation for the BC Agency PMS system. Choose the documentation that best fits your needs:

### For End Users

**[USER_GUIDE.md](./USER_GUIDE.md)** - Vietnamese User Guide
- How to login (internal staff and clients)
- Dashboard overview
- Managing projects and tasks
- Approval workflow
- Calendar and events
- Generating reports
- File management
- Admin panel operations

### For System Administrators

**[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Admin Operations Guide
- User and client management
- System settings and configuration
- Audit logs and security
- Data migration and backup strategies
- Troubleshooting common issues

### For DevOps/Deployment

**[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment Guide
- Server prerequisites and setup
- Docker deployment (development and production)
- SSL certificate configuration
- Monitoring and alerting setup
- Backup and restore procedures
- Comprehensive troubleshooting

### For Developers

**[API.md](./API.md)** - API Reference
- Complete API endpoint documentation
- Authentication methods
- Request/response formats
- Error handling
- Code examples
- Interactive Swagger UI: `/api/docs` (development only)

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Software Design Description (IEEE 1016)
- System architecture & component design
- Clean Architecture layers
- Data design & entity relationships
- Security design & deployment topology

**[project-overview-pdr.md](./project-overview-pdr.md)** - Project Overview
- System architecture
- Tech stack
- Feature roadmap

### For Quality Assurance

**[SQA_PLAN.md](./SQA_PLAN.md)** - Software Quality Assurance Plan (IEEE 730)
- QA tasks, schedule & tools
- Coding & testing standards
- Quality metrics & targets
- Risk management

**[TEST_REPORT_TEMPLATE.md](./TEST_REPORT_TEMPLATE.md)** - Test Report Template (IEEE 829)
- Reusable template for test execution reports
- Unit test & E2E results tables
- Quality gate verification checklist

**[../backend/test/TEST_PLAN.md](../backend/test/TEST_PLAN.md)** - Test Plan (IEEE 829)
- Test items & coverage goals
- Pass/fail criteria
- Test environment & schedule

## Quick Start

### I'm a new user
Start with **[USER_GUIDE.md](./USER_GUIDE.md)** to learn how to use the system.

### I'm deploying the system
Follow **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step deployment instructions.

### I'm developing integrations
Reference **[API.md](./API.md)** for complete API documentation.

### I'm managing the system
Use **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** for administrative tasks.

## System Architecture

**Frontend:**
- Next.js 14 with TypeScript
- TailwindCSS + shadcn/ui
- React Query for data fetching

**Backend:**
- NestJS with TypeScript
- PostgreSQL database
- Redis caching
- MinIO object storage

**Deployment:**
- Docker & Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL

## Support

**Technical Issues:**
- Email: tech@bcagency.com
- Emergency: +84-xxx-xxx-xxx

**User Support:**
- Email: admin@bcagency.com

**Documentation Updates:**
- Last Updated: 2026-01-30
- Version: 1.1.0

## Contributing

To update documentation:
1. Edit the relevant `.md` file
2. Follow existing structure and formatting
3. Update "Last Updated" date
4. Submit for review

---

**BC Agency** | Project Management System
