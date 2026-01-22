# 🧠 BC AGENCY PMS - BRAINSTORM REPORT

**Version:** 1.0  
**Date:** January 2025  
**Author:** Solution Brainstormer  
**Client:** BC Agency Vietnam

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Profile](#2-system-profile)
3. [Tech Stack Recommendation](#3-tech-stack-recommendation)
4. [Clean Architecture Design](#4-clean-architecture-design)
5. [Database Schema Design](#5-database-schema-design)
6. [System Architecture](#6-system-architecture)
7. [Feature Deep-Dive](#7-feature-deep-dive)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Risk Assessment](#9-risk-assessment)
10. [Appendix](#10-appendix)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Problem Statement

BC Agency hiện đang quản lý dự án Performance Marketing bằng **3+ Excel files** với **46 sheets** và **135 columns** cho mỗi project. Điều này gây ra:

- ❌ Data phân tán, khó đồng bộ
- ❌ Manual workflow qua Telegram
- ❌ Không có Client Portal bảo mật
- ❌ Không có automation (calendar, notifications)
- ❌ Khó scale khi số lượng projects tăng

### 1.2 Proposed Solution

Xây dựng **Project Management System (PMS)** web-based với:

- ✅ Single source of truth cho tất cả projects
- ✅ Approval workflow tự động
- ✅ Client Portal với access code
- ✅ Built-in calendar & notifications
- ✅ Self-hosted file storage (thay Google Drive)
- ✅ Clean Architecture cho maintainability

### 1.3 Key Metrics

| Metric | Target |
|--------|--------|
| Users | 100 (50 internal + 50 clients) |
| Concurrent users | 20 |
| Projects | 8-50 active |
| Page load time | 3-5 seconds |
| Uptime | 99.5% |

---

## 2. SYSTEM PROFILE

### 2.1 Infrastructure

| Component | Specification |
|-----------|---------------|
| Server | 2 vCPU / 4 GB RAM / 40 GB SSD (upgradeable) |
| OS | Ubuntu 24.04 |
| Container | Docker + Docker Compose |
| Domain | pms.bcagency.com |
| SSL | Let's Encrypt (auto-renewal) |

### 2.2 User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SUPER_ADMIN (Full system access)                              │
│       │                                                         │
│       ├── ADMIN (User management, System config)                │
│       │                                                         │
│       ├── TECHNICAL (System maintenance, not in projects)       │
│       │                                                         │
│       └── PROJECT ROLES (Hybrid: Role + Project based)          │
│               │                                                 │
│               ├── NVKD (Sales - Approver)                       │
│               ├── PM (Project Manager)                          │
│               ├── PLANNER (Strategy)                            │
│               ├── ACCOUNT (Client liaison)                      │
│               ├── CONTENT (Content creation)                    │
│               ├── DESIGN (Visual design)                        │
│               └── MEDIA (Ads management)                        │
│                                                                 │
│   CLIENT (External - View only via access code)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Permission Matrix

| Action | Super Admin | Admin | NVKD | PM | Planner | Account | Content | Design | Media | Client |
|--------|:-----------:|:-----:|:----:|:--:|:-------:|:-------:|:-------:|:------:|:-----:|:------:|
| Create User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Plan | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload File | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete File | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| View Project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

⚠️ = Limited view (own projects only, no sensitive data)

---

## 3. TECH STACK RECOMMENDATION

### 3.1 Technology Decisions

```
┌─────────────────────────────────────────────────────────────────┐
│                      TECH STACK OVERVIEW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   FRONTEND  │    │   BACKEND   │    │  DATABASE   │         │
│  │             │    │             │    │             │         │
│  │  Next.js 14 │◄──►│   NestJS    │◄──►│ PostgreSQL  │         │
│  │  + React 18 │    │ + Prisma    │    │    16+      │         │
│  │  + Tailwind │    │ + TypeScript│    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                  │                 │
│         │                  │                  │                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │     UI      │    │    CACHE    │    │   STORAGE   │         │
│  │             │    │             │    │             │         │
│  │  Shadcn/ui  │    │    Redis    │    │    MinIO    │         │
│  │  + Radix    │    │             │    │ (S3-compat) │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    INFRASTRUCTURE                        │   │
│  │  Docker Compose + Nginx + Let's Encrypt + Telegram Bot   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack Justification

#### Frontend: Next.js 14 + React 18

| Criteria | Score | Reasoning |
|----------|:-----:|-----------|
| DX with Claude Code | ⭐⭐⭐⭐⭐ | Excellent TypeScript support, great AI assistance |
| Performance | ⭐⭐⭐⭐⭐ | Server Components, automatic code splitting |
| Learning Curve | ⭐⭐⭐⭐ | Well-documented, large community |
| Bundle Size | ⭐⭐⭐⭐ | Optimized by default |
| SEO | ⭐⭐⭐⭐⭐ | Built-in SSR/SSG |

**Alternatives Considered:**
- Vue.js/Nuxt: Good but React ecosystem larger
- Angular: Overkill for this project size
- SvelteKit: Less mature ecosystem

#### Backend: NestJS + Prisma

| Criteria | Score | Reasoning |
|----------|:-----:|-----------|
| Clean Architecture | ⭐⭐⭐⭐⭐ | Built-in modular structure, DI container |
| TypeScript | ⭐⭐⭐⭐⭐ | Native support |
| Scalability | ⭐⭐⭐⭐ | Microservices-ready |
| Documentation | ⭐⭐⭐⭐⭐ | Excellent official docs |
| ORM Integration | ⭐⭐⭐⭐⭐ | Prisma works seamlessly |

**Alternatives Considered:**
- Express.js: Too basic, no structure
- Fastify: Good but NestJS better for Clean Architecture
- Go/Gin: Faster but higher learning curve

#### Database: PostgreSQL 16

| Criteria | Score | Reasoning |
|----------|:-----:|-----------|
| Reliability | ⭐⭐⭐⭐⭐ | Battle-tested, ACID compliant |
| JSON Support | ⭐⭐⭐⭐⭐ | JSONB for flexible fields |
| Performance | ⭐⭐⭐⭐ | Good for 50K+ rows |
| Docker Support | ⭐⭐⭐⭐⭐ | Official images |
| Backup/Restore | ⭐⭐⭐⭐⭐ | pg_dump, continuous archiving |

**Alternatives Considered:**
- MySQL: Less feature-rich than PostgreSQL
- MongoDB: Overkill, relational data fits better
- SQLite: Not suitable for multi-user

#### File Storage: MinIO

| Criteria | Score | Reasoning |
|----------|:-----:|-----------|
| Self-hosted | ⭐⭐⭐⭐⭐ | Full control, no vendor lock-in |
| S3 Compatible | ⭐⭐⭐⭐⭐ | Standard API, easy migration |
| Docker Support | ⭐⭐⭐⭐⭐ | Single container |
| UI Console | ⭐⭐⭐⭐ | Built-in web interface |
| Cost | ⭐⭐⭐⭐⭐ | Free, open source |

**Alternatives Considered:**
- AWS S3: Cost, vendor lock-in
- Google Cloud Storage: Same issues
- Local filesystem: No versioning, hard to scale

#### Cache: Redis

| Criteria | Score | Reasoning |
|----------|:-----:|-----------|
| Performance | ⭐⭐⭐⭐⭐ | In-memory, microsecond latency |
| Session Management | ⭐⭐⭐⭐⭐ | Perfect for auth sessions |
| Pub/Sub | ⭐⭐⭐⭐⭐ | Real-time notifications |
| Docker Support | ⭐⭐⭐⭐⭐ | Official images |

### 3.3 Full Stack Summary

```yaml
# docker-compose.yml structure
services:
  # Frontend
  frontend:
    image: node:20-alpine
    framework: Next.js 14
    port: 3000

  # Backend
  backend:
    image: node:20-alpine
    framework: NestJS 10
    port: 3001

  # Database
  postgres:
    image: postgres:16-alpine
    port: 5432

  # Cache
  redis:
    image: redis:7-alpine
    port: 6379

  # File Storage
  minio:
    image: minio/minio
    port: 9000, 9001

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    port: 80, 443
```

---

## 4. CLEAN ARCHITECTURE DESIGN

### 4.1 Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    PRESENTATION LAYER                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Controllers │ Guards │ Pipes │ Interceptors │ Filters  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                    APPLICATION LAYER                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │     Use Cases │ DTOs │ Application Services │ Mappers   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                      DOMAIN LAYER                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Entities │ Value Objects │ Domain Services │ Interfaces│   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                  INFRASTRUCTURE LAYER                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Repositories │ External APIs │ Database │ File Storage │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Project Structure (NestJS Backend)

```
backend/
├── src/
│   ├── domain/                          # 🔵 DOMAIN LAYER
│   │   ├── entities/
│   │   │   ├── project.entity.ts
│   │   │   ├── task.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── approval.entity.ts
│   │   │   ├── file.entity.ts
│   │   │   └── lead.entity.ts
│   │   │
│   │   ├── value-objects/
│   │   │   ├── project-status.vo.ts
│   │   │   ├── task-priority.vo.ts
│   │   │   ├── money.vo.ts
│   │   │   └── email.vo.ts
│   │   │
│   │   ├── interfaces/
│   │   │   ├── repositories/
│   │   │   │   ├── project.repository.interface.ts
│   │   │   │   ├── task.repository.interface.ts
│   │   │   │   └── user.repository.interface.ts
│   │   │   │
│   │   │   └── services/
│   │   │       ├── notification.service.interface.ts
│   │   │       └── file-storage.service.interface.ts
│   │   │
│   │   └── domain-services/
│   │       ├── approval-workflow.service.ts
│   │       └── budget-pacing.service.ts
│   │
│   ├── application/                     # 🟢 APPLICATION LAYER
│   │   ├── use-cases/
│   │   │   ├── project/
│   │   │   │   ├── create-project.use-case.ts
│   │   │   │   ├── update-project.use-case.ts
│   │   │   │   ├── get-project.use-case.ts
│   │   │   │   └── list-projects.use-case.ts
│   │   │   │
│   │   │   ├── task/
│   │   │   │   ├── create-task.use-case.ts
│   │   │   │   ├── assign-task.use-case.ts
│   │   │   │   └── complete-task.use-case.ts
│   │   │   │
│   │   │   ├── approval/
│   │   │   │   ├── submit-for-approval.use-case.ts
│   │   │   │   ├── approve.use-case.ts
│   │   │   │   └── reject.use-case.ts
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── login.use-case.ts
│   │   │       ├── client-login.use-case.ts
│   │   │       └── refresh-token.use-case.ts
│   │   │
│   │   ├── dto/
│   │   │   ├── project/
│   │   │   ├── task/
│   │   │   ├── user/
│   │   │   └── common/
│   │   │
│   │   ├── mappers/
│   │   │   ├── project.mapper.ts
│   │   │   ├── task.mapper.ts
│   │   │   └── user.mapper.ts
│   │   │
│   │   └── services/
│   │       ├── report.service.ts
│   │       └── dashboard.service.ts
│   │
│   ├── infrastructure/                  # 🟠 INFRASTRUCTURE LAYER
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── repositories/
│   │   │       ├── prisma-project.repository.ts
│   │   │       ├── prisma-task.repository.ts
│   │   │       └── prisma-user.repository.ts
│   │   │
│   │   ├── external-services/
│   │   │   ├── telegram/
│   │   │   │   └── telegram-notification.service.ts
│   │   │   │
│   │   │   └── minio/
│   │   │       └── minio-file-storage.service.ts
│   │   │
│   │   └── config/
│   │       ├── database.config.ts
│   │       ├── redis.config.ts
│   │       └── minio.config.ts
│   │
│   ├── presentation/                    # 🔴 PRESENTATION LAYER
│   │   ├── controllers/
│   │   │   ├── project.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── file.controller.ts
│   │   │   └── client-portal.controller.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── client-access.guard.ts
│   │   │   └── project-access.guard.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   │
│   ├── modules/                         # 🟣 NESTJS MODULES
│   │   ├── project/
│   │   │   └── project.module.ts
│   │   ├── task/
│   │   │   └── task.module.ts
│   │   ├── user/
│   │   │   └── user.module.ts
│   │   ├── auth/
│   │   │   └── auth.module.ts
│   │   ├── file/
│   │   │   └── file.module.ts
│   │   └── notification/
│   │       └── notification.module.ts
│   │
│   ├── shared/                          # ⚪ SHARED
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── exceptions/
│   │   └── utils/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── prisma/
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 4.3 Project Structure (Next.js Frontend)

```
frontend/
├── src/
│   ├── app/                             # 📱 APP ROUTER
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── client-login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # Dashboard home
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx             # List
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx         # Detail
│   │   │   │   │   ├── tasks/
│   │   │   │   │   ├── files/
│   │   │   │   │   └── settings/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx             # My tasks
│   │   │   │   ├── kanban/
│   │   │   │   ├── calendar/
│   │   │   │   └── gantt/
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── meetings/
│   │   │   │   └── deadlines/
│   │   │   │
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── profile/
│   │   │       └── notifications/
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── system/
│   │   │   └── audit-logs/
│   │   │
│   │   ├── (client-portal)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── [projectId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                         # API Routes (if needed)
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/                      # 🧩 COMPONENTS
│   │   ├── ui/                          # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── common/                      # Shared components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── FileUploader.tsx
│   │   │
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   └── ProjectTimeline.tsx
│   │   │
│   │   ├── task/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── GanttChart.tsx
│   │   │
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   └── EventForm.tsx
│   │   │
│   │   └── dashboard/
│   │       ├── StatsCard.tsx
│   │       ├── ProjectsWidget.tsx
│   │       └── TasksWidget.tsx
│   │
│   ├── hooks/                           # 🪝 CUSTOM HOOKS
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   └── useNotifications.ts
│   │
│   ├── lib/                             # 📚 UTILITIES
│   │   ├── api.ts                       # API client
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── stores/                          # 🗃️ STATE MANAGEMENT
│   │   ├── auth.store.ts
│   │   ├── project.store.ts
│   │   └── ui.store.ts
│   │
│   ├── types/                           # 📝 TYPESCRIPT TYPES
│   │   ├── project.ts
│   │   ├── task.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── themes/
│           ├── light.css
│           └── dark.css
│
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

### 4.4 Dependency Rule

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEPENDENCY DIRECTION                        │
│                                                                 │
│    Presentation ──────────────────────────────────────┐         │
│         │                                             │         │
│         │ depends on                                  │         │
│         ▼                                             │         │
│    Application ───────────────────────────┐           │         │
│         │                                 │           │         │
│         │ depends on                      │           │         │
│         ▼                                 │           │         │
│    Domain ◄───────────────────────────────┴───────────┘         │
│         ▲                                                       │
│         │ implements                                            │
│         │                                                       │
│    Infrastructure ──────────────────────────────────────        │
│                                                                 │
│  ✅ Domain has NO dependencies on outer layers                  │
│  ✅ Application depends only on Domain                          │
│  ✅ Infrastructure implements Domain interfaces                 │
│  ✅ Presentation uses Application use cases                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. DATABASE SCHEMA DESIGN

### 5.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA (ERD)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │    USER     │         │   PROJECT   │         │    TASK     │            │
│  ├─────────────┤         ├─────────────┤         ├─────────────┤            │
│  │ id          │◄───┐    │ id          │◄───────►│ id          │            │
│  │ email       │    │    │ code        │    ┌───►│ project_id  │            │
│  │ password    │    │    │ name        │    │    │ title       │            │
│  │ name        │    │    │ client_id   │────┤    │ description │            │
│  │ role        │    │    │ status      │    │    │ status      │            │
│  │ is_active   │    │    │ stage       │    │    │ priority    │            │
│  │ created_at  │    │    │ start_date  │    │    │ assignee_id │────┐       │
│  └─────────────┘    │    │ end_date    │    │    │ reviewer_id │────┤       │
│        │            │    │ budget      │    │    │ parent_id   │◄───┤       │
│        │            │    │ created_at  │    │    │ deadline    │    │       │
│        │            │    └─────────────┘    │    │ created_at  │    │       │
│        │            │           │           │    └─────────────┘    │       │
│        │            │           │           │           │            │       │
│        │            │           ▼           │           │            │       │
│        │            │    ┌─────────────┐    │           │            │       │
│        │            │    │PROJECT_TEAM │    │           │            │       │
│        │            │    ├─────────────┤    │           │            │       │
│        │            └───►│ project_id  │    │           │            │       │
│        │                 │ user_id     │◄───┘           │            │       │
│        │                 │ role        │                │            │       │
│        │                 └─────────────┘                │            │       │
│        │                                                │            │       │
│        │                                                ▼            │       │
│        │            ┌─────────────┐         ┌─────────────┐         │       │
│        │            │   CLIENT    │         │TASK_ASSIGNEE│         │       │
│        │            ├─────────────┤         ├─────────────┤         │       │
│        │            │ id          │         │ task_id     │◄────────┤       │
│        │            │ company     │         │ user_id     │◄────────┘       │
│        │            │ access_code │         └─────────────┘                 │
│        │            │ is_active   │                                         │
│        │            └─────────────┘                                         │
│        │                                                                    │
│        │            ┌─────────────┐         ┌─────────────┐                 │
│        │            │  APPROVAL   │         │    FILE     │                 │
│        │            ├─────────────┤         ├─────────────┤                 │
│        └───────────►│ id          │         │ id          │                 │
│                     │ project_id  │         │ project_id  │                 │
│                     │ type        │         │ task_id     │                 │
│                     │ status      │         │ name        │                 │
│                     │ submitted_by│         │ path        │                 │
│                     │ approved_by │         │ size        │                 │
│                     │ comment     │         │ mime_type   │                 │
│                     │ created_at  │         │ version     │                 │
│                     └─────────────┘         │ uploaded_by │                 │
│                                             └─────────────┘                 │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐         ┌─────────────┐                │
│  │   EVENT     │    │NOTIFICATION │         │  AUDIT_LOG  │                │
│  ├─────────────┤    ├─────────────┤         ├─────────────┤                │
│  │ id          │    │ id          │         │ id          │                │
│  │ title       │    │ user_id     │         │ user_id     │                │
│  │ type        │    │ type        │         │ action      │                │
│  │ project_id  │    │ title       │         │ entity_type │                │
│  │ start_time  │    │ content     │         │ entity_id   │                │
│  │ end_time    │    │ is_read     │         │ old_value   │                │
│  │ recurrence  │    │ created_at  │         │ new_value   │                │
│  │ created_by  │    └─────────────┘         │ ip_address  │                │
│  └─────────────┘                            │ created_at  │                │
│                                             └─────────────┘                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Handling 135 Columns Problem

**Strategy: Normalization + JSONB for Flexible Fields**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               135 COLUMNS → NORMALIZED STRUCTURE                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BEFORE (Excel - 135 flat columns):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │ project_name | nvkd | planner | budget | kpi1 | kpi2 | ... | col135 │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  AFTER (Normalized):                                                         │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │    PROJECT      │     │  PROJECT_TEAM   │     │  PROJECT_BUDGET │        │
│  ├─────────────────┤     ├─────────────────┤     ├─────────────────┤        │
│  │ Core fields     │────►│ Team assignments│     │ Budget breakdown│        │
│  │ (15 columns)    │     │ (role-based)    │     │ (by category)   │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│          │                                                                   │
│          │               ┌─────────────────┐     ┌─────────────────┐        │
│          │               │  PROJECT_KPI    │     │  PROJECT_LOG    │        │
│          │               ├─────────────────┤     ├─────────────────┤        │
│          └──────────────►│ KPI metrics     │     │ Optimization    │        │
│                          │ (flexible JSONB)│     │ history         │        │
│                          └─────────────────┘     └─────────────────┘        │
│                                                                              │
│  Benefits:                                                                   │
│  ✅ Normalized relations (no data duplication)                              │
│  ✅ JSONB for flexible/dynamic fields                                       │
│  ✅ Easy to query and filter                                                │
│  ✅ Better indexing                                                         │
│  ✅ Scalable for new fields                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  TECHNICAL
  NVKD        // Sales
  PM          // Project Manager
  PLANNER
  ACCOUNT
  CONTENT
  DESIGN
  MEDIA
}

enum ProjectStatus {
  STABLE      // 🟢 Ổn định
  WARNING     // 🟡 Cảnh báo
  CRITICAL    // 🔴 Nguy hiểm
}

enum ProjectStage {
  INTAKE              // Tiếp nhận brief
  DISCOVERY           // Discovery & Audit
  PLANNING            // Lập kế hoạch
  UNDER_REVIEW        // Chờ duyệt
  PROPOSAL_PITCH      // Proposal/Pitch
  ONGOING             // Đang triển khai
  OPTIMIZATION        // Tối ưu
  COMPLETED           // Hoàn thành
  CLOSED              // Đóng
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  BLOCKED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ApprovalType {
  PLAN
  CONTENT
  BUDGET
  FILE
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CHANGES_REQUESTED
}

enum EventType {
  MEETING
  DEADLINE
  MILESTONE
  REMINDER
}

enum FileCategory {
  BRIEF
  PLAN
  PROPOSAL
  REPORT
  CREATIVE
  RAW_DATA
  CONTRACT
  OTHER
}

// ============================================
// USER & AUTH
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  avatar        String?
  role          UserRole
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  projectTeams     ProjectTeam[]
  tasksAssigned    TaskAssignee[]
  tasksReviewing   Task[]          @relation("TaskReviewer")
  tasksCreated     Task[]          @relation("TaskCreator")
  approvalSubmitted Approval[]     @relation("ApprovalSubmitter")
  approvalApproved  Approval[]     @relation("ApprovalApprover")
  filesUploaded    File[]
  eventsCreated    Event[]
  notifications    Notification[]
  auditLogs        AuditLog[]
  comments         Comment[]

  // Notification preferences
  notificationPrefs Json?        // JSONB for flexible settings

  @@index([email])
  @@index([role])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  userAgent    String?
  ipAddress    String?

  @@index([token])
  @@index([userId])
  @@map("sessions")
}

// ============================================
// CLIENT
// ============================================

model Client {
  id           String    @id @default(cuid())
  companyName  String
  contactName  String?
  contactEmail String?
  contactPhone String?
  accessCode   String    @unique
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  projects     Project[]

  @@index([accessCode])
  @@map("clients")
}

// ============================================
// PROJECT
// ============================================

model Project {
  id              String         @id @default(cuid())
  code            String         @unique  // e.g., QC09
  name            String
  description     String?
  productType     String?        // Loại sản phẩm
  
  // Status & Stage
  status          ProjectStatus  @default(STABLE)
  stage           ProjectStage   @default(INTAKE)
  stageProgress   Int            @default(0)  // 0-100%
  
  // Timeline
  startDate       DateTime?
  endDate         DateTime?
  timelineProgress Int           @default(0)  // Auto-calculated
  
  // Client
  clientId        String?
  client          Client?        @relation(fields: [clientId], references: [id])
  
  // Links
  driveLink       String?
  planLink        String?
  trackingLink    String?
  
  // Metadata
  metadata        Json?          // JSONB for flexible fields
  
  // Timestamps
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  archivedAt      DateTime?

  // Relations
  team            ProjectTeam[]
  budget          ProjectBudget?
  kpis            ProjectKPI[]
  logs            ProjectLog[]
  tasks           Task[]
  files           File[]
  approvals       Approval[]
  events          Event[]
  comments        Comment[]

  @@index([code])
  @@index([status])
  @@index([stage])
  @@index([clientId])
  @@map("projects")
}

model ProjectTeam {
  id         String   @id @default(cuid())
  projectId  String
  userId     String
  role       UserRole
  isPrimary  Boolean  @default(false)  // Primary contact for this role
  joinedAt   DateTime @default(now())
  
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])

  @@unique([projectId, userId, role])
  @@index([projectId])
  @@index([userId])
  @@map("project_teams")
}

model ProjectBudget {
  id                String   @id @default(cuid())
  projectId         String   @unique
  
  // Budget breakdown (from Excel columns)
  totalBudget       Decimal  @db.Decimal(15, 2)  // Tổng NSQC
  monthlyBudget     Decimal? @db.Decimal(15, 2)  // Ngân sách/Tháng
  spentAmount       Decimal  @default(0) @db.Decimal(15, 2)  // Chi phí đã dùng
  
  // Fee categories
  fixedAdFee        Decimal? @db.Decimal(15, 2)  // (1) Phí DV Quảng Cáo Cố Định
  adServiceFee      Decimal? @db.Decimal(15, 2)  // (2) Phí DV Quảng Cáo
  contentFee        Decimal? @db.Decimal(15, 2)  // (3) Phí DV Nội Dung
  designFee         Decimal? @db.Decimal(15, 2)  // (4) Phí DV Thiết Kế
  mediaFee          Decimal? @db.Decimal(15, 2)  // (5) Phí DV Media
  otherFee          Decimal? @db.Decimal(15, 2)  // (6) Phí DV Khác
  
  // Calculated
  budgetPacing      Float?   // Auto-calculated %
  
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("project_budgets")
}

model ProjectKPI {
  id              String   @id @default(cuid())
  projectId       String
  
  // KPI Type
  kpiType         String   // CPL, CPA, CPQL, ROAS, ROI, CTR, etc.
  
  // Values
  targetValue     Float?
  actualValue     Float?
  unit            String?  // VND, %, count, etc.
  
  // Metadata
  metadata        Json?    // Additional flexible data
  
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
  @@index([kpiType])
  @@map("project_kpis")
}

model ProjectLog {
  id              String   @id @default(cuid())
  projectId       String
  
  // Log entry (from Optimization columns)
  logDate         DateTime
  rootCause       String?  // Root Cause Analysis
  action          String?  // Hành động
  nextAction      String?  // Hành động tiếp theo
  notes           String?
  
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())

  @@index([projectId])
  @@index([logDate])
  @@map("project_logs")
}

// ============================================
// TASK
// ============================================

model Task {
  id              String       @id @default(cuid())
  projectId       String
  parentId        String?      // For subtasks (3 levels)
  
  // Task info
  title           String
  description     String?
  status          TaskStatus   @default(TODO)
  priority        TaskPriority @default(MEDIUM)
  
  // Time
  estimatedHours  Float?
  actualHours     Float?
  deadline        DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Assignment
  reviewerId      String?
  createdById     String
  
  // Order for Kanban
  orderIndex      Int          @default(0)
  
  // Timestamps
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relations
  project         Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent          Task?        @relation("TaskHierarchy", fields: [parentId], references: [id])
  subtasks        Task[]       @relation("TaskHierarchy")
  reviewer        User?        @relation("TaskReviewer", fields: [reviewerId], references: [id])
  createdBy       User         @relation("TaskCreator", fields: [createdById], references: [id])
  assignees       TaskAssignee[]
  files           File[]
  comments        Comment[]
  dependencies    TaskDependency[] @relation("DependentTask")
  dependents      TaskDependency[] @relation("DependsOnTask")

  @@index([projectId])
  @@index([parentId])
  @@index([status])
  @@index([deadline])
  @@map("tasks")
}

model TaskAssignee {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  assignedAt DateTime @default(now())
  
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([userId])
  @@map("task_assignees")
}

model TaskDependency {
  id              String @id @default(cuid())
  taskId          String // The task that depends
  dependsOnTaskId String // The task it depends on
  
  task            Task   @relation("DependentTask", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTask   Task   @relation("DependsOnTask", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnTaskId])
  @@map("task_dependencies")
}

// ============================================
// APPROVAL
// ============================================

model Approval {
  id              String         @id @default(cuid())
  projectId       String
  
  // Approval info
  type            ApprovalType
  status          ApprovalStatus @default(PENDING)
  title           String
  description     String?
  
  // Participants
  submittedById   String
  approvedById    String?
  
  // Feedback
  comment         String?
  deadline        DateTime?
  
  // Escalation
  escalatedAt     DateTime?
  escalationLevel Int            @default(0)
  
  // Timestamps
  submittedAt     DateTime       @default(now())
  respondedAt     DateTime?
  
  // Relations
  project         Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  submittedBy     User           @relation("ApprovalSubmitter", fields: [submittedById], references: [id])
  approvedBy      User?          @relation("ApprovalApprover", fields: [approvedById], references: [id])
  files           File[]
  history         ApprovalHistory[]

  @@index([projectId])
  @@index([status])
  @@index([type])
  @@map("approvals")
}

model ApprovalHistory {
  id           String         @id @default(cuid())
  approvalId   String
  fromStatus   ApprovalStatus
  toStatus     ApprovalStatus
  comment      String?
  changedById  String
  changedAt    DateTime       @default(now())
  
  approval     Approval       @relation(fields: [approvalId], references: [id], onDelete: Cascade)

  @@index([approvalId])
  @@map("approval_histories")
}

// ============================================
// FILE
// ============================================

model File {
  id            String       @id @default(cuid())
  
  // Location
  projectId     String?
  taskId        String?
  approvalId    String?
  
  // File info
  name          String
  originalName  String
  path          String       // MinIO path
  size          Int          // bytes
  mimeType      String
  category      FileCategory @default(OTHER)
  
  // Versioning
  version       Int          @default(1)
  previousId    String?      // Link to previous version
  
  // Tags
  tags          String[]
  
  // Upload info
  uploadedById  String
  uploadedAt    DateTime     @default(now())

  // Relations
  project       Project?     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task          Task?        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  approval      Approval?    @relation(fields: [approvalId], references: [id], onDelete: Cascade)
  uploadedBy    User         @relation(fields: [uploadedById], references: [id])
  previous      File?        @relation("FileVersions", fields: [previousId], references: [id])
  nextVersions  File[]       @relation("FileVersions")

  @@index([projectId])
  @@index([taskId])
  @@index([category])
  @@map("files")
}

// ============================================
// CALENDAR & EVENTS
// ============================================

model Event {
  id            String    @id @default(cuid())
  
  // Event info
  title         String
  description   String?
  type          EventType
  
  // Time
  startTime     DateTime
  endTime       DateTime?
  isAllDay      Boolean   @default(false)
  
  // Recurrence
  recurrence    String?   // RRULE format
  
  // Location
  location      String?
  meetingLink   String?
  
  // Association
  projectId     String?
  taskId        String?
  
  // Creator
  createdById   String
  
  // Reminder
  reminderBefore Int?     // minutes
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  project       Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy     User      @relation(fields: [createdById], references: [id])
  attendees     EventAttendee[]

  @@index([projectId])
  @@index([startTime])
  @@index([type])
  @@map("events")
}

model EventAttendee {
  id        String   @id @default(cuid())
  eventId   String
  userId    String?
  email     String?  // For external attendees
  name      String?
  status    String   @default("pending") // pending, accepted, declined
  
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@map("event_attendees")
}

// ============================================
// NOTIFICATION
// ============================================

model Notification {
  id          String   @id @default(cuid())
  userId      String
  
  // Content
  type        String   // task_assigned, approval_pending, etc.
  title       String
  content     String
  
  // Link
  link        String?
  
  // Status
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  // Telegram
  telegramSent Boolean @default(false)
  
  // Timestamps
  createdAt   DateTime @default(now())

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

// ============================================
// COMMENT
// ============================================

model Comment {
  id          String   @id @default(cuid())
  
  // Location
  projectId   String?
  taskId      String?
  
  // Content
  content     String
  
  // Reply
  parentId    String?
  
  // Author
  authorId    String
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task        Task?     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author      User      @relation(fields: [authorId], references: [id])
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")

  @@index([projectId])
  @@index([taskId])
  @@map("comments")
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  
  // Action
  action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType  String   // Project, Task, User, etc.
  entityId    String?
  
  // Changes
  oldValue    Json?
  newValue    Json?
  
  // Metadata
  ipAddress   String?
  userAgent   String?
  
  // Timestamp
  createdAt   DateTime @default(now())

  // Relations
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// SYSTEM SETTINGS
// ============================================

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}
```

### 5.4 Column Mapping (135 → Normalized)

| Excel Category | Table | Notes |
|----------------|-------|-------|
| Basic Info (10 cols) | `projects` | Core fields |
| Team Assignment (15 cols) | `project_teams` | Role-based relations |
| Budget (10 cols) | `project_budgets` | Dedicated table |
| KPIs (30 cols) | `project_kpis` | Type-based rows |
| Timeline (5 cols) | `projects` | Core fields |
| Status History (40 cols) | `project_logs` | Log entries |
| Optimization (25 cols) | `project_logs` + `metadata` | JSONB for flexible |

---

## 6. SYSTEM ARCHITECTURE

### 6.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           INTERNET                                   │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NGINX (Reverse Proxy)                            │   │
│  │                    + Let's Encrypt SSL                              │   │
│  │                    Port: 80, 443                                    │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│          ┌───────────────────────┼───────────────────────┐                 │
│          │                       │                       │                 │
│          ▼                       ▼                       ▼                 │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐          │
│  │   FRONTEND    │      │   BACKEND     │      │    MINIO      │          │
│  │   (Next.js)   │      │   (NestJS)    │      │   Console     │          │
│  │   Port: 3000  │      │   Port: 3001  │      │   Port: 9001  │          │
│  └───────┬───────┘      └───────┬───────┘      └───────┬───────┘          │
│          │                      │                      │                   │
│          │                      │                      │                   │
│          │              ┌───────┴───────┐              │                   │
│          │              │               │              │                   │
│          │              ▼               ▼              │                   │
│          │      ┌───────────┐   ┌───────────┐         │                   │
│          │      │ PostgreSQL│   │   Redis   │         │                   │
│          │      │ Port: 5432│   │ Port: 6379│         │                   │
│          │      └───────────┘   └───────────┘         │                   │
│          │                                             │                   │
│          │              ┌───────────────┐              │                   │
│          │              │    MinIO      │◄─────────────┘                   │
│          │              │  (Storage)    │                                  │
│          │              │  Port: 9000   │                                  │
│          │              └───────────────┘                                  │
│          │                                                                 │
│          │              ┌───────────────┐                                  │
│          └─────────────►│ Telegram Bot  │                                  │
│                         │    Server     │                                  │
│                         └───────────────┘                                  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      DOCKER COMPOSE NETWORK                          │  │
│  │                         (bc-agency-net)                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Docker Compose Configuration

```yaml
# docker-compose.yml

version: '3.8'

services:
  # ============================================
  # FRONTEND
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bc-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
      - NEXT_PUBLIC_MINIO_URL=http://minio:9000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - bc-agency-net

  # ============================================
  # BACKEND
  # ============================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bc-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://bc_user:bc_password@postgres:5432/bc_pms
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - bc-agency-net

  # ============================================
  # DATABASE
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: bc-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=bc_user
      - POSTGRES_PASSWORD=bc_password
      - POSTGRES_DB=bc_pms
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bc_user -d bc_pms"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bc-agency-net

  # ============================================
  # CACHE
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: bc-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bc-agency-net

  # ============================================
  # FILE STORAGE
  # ============================================
  minio:
    image: minio/minio
    container_name: bc-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - bc-agency-net

  # ============================================
  # REVERSE PROXY
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: bc-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
      - minio
    networks:
      - bc-agency-net

  # ============================================
  # SSL CERTIFICATE
  # ============================================
  certbot:
    image: certbot/certbot
    container_name: bc-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - bc-agency-net

# ============================================
# VOLUMES
# ============================================
volumes:
  postgres_data:
  redis_data:
  minio_data:

# ============================================
# NETWORKS
# ============================================
networks:
  bc-agency-net:
    driver: bridge
```

### 6.3 Nginx Configuration

```nginx
# nginx/nginx.conf

events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:3001;
    }

    upstream minio_console {
        server minio:9001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Main server
    server {
        listen 80;
        server_name pms.bcagency.com;

        # Certbot challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name pms.bcagency.com;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/pms.bcagency.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pms.bcagency.com/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # File upload size
        client_max_body_size 20M;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints (stricter rate limiting)
        location /api/auth {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # MinIO Console (admin only)
        location /minio-console/ {
            proxy_pass http://minio_console/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }
    }
}
```

---

## 7. FEATURE DEEP-DIVE

### 7.1 Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPROVAL WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │ PLANNER │────►│   SUBMIT    │────►│UNDER_REVIEW │────►│    NVKD     │   │
│  │ creates │     │ for review  │     │  (pending)  │     │   reviews   │   │
│  │  plan   │     └─────────────┘     └─────────────┘     └──────┬──────┘   │
│  └─────────┘                                                     │          │
│                                                                  │          │
│       ┌──────────────────────────┬──────────────────────────────┤          │
│       │                          │                              │          │
│       ▼                          ▼                              ▼          │
│  ┌─────────┐               ┌─────────┐                    ┌─────────┐      │
│  │APPROVED │               │REJECTED │                    │ REQUEST │      │
│  │         │               │         │                    │ CHANGES │      │
│  └────┬────┘               └────┬────┘                    └────┬────┘      │
│       │                         │                              │           │
│       │                         │                              │           │
│       ▼                         ▼                              ▼           │
│  ┌─────────────┐          ┌─────────────┐              ┌─────────────┐    │
│  │ Stage →     │          │ Back to     │              │ Planner     │    │
│  │ ONGOING     │          │ PLANNER     │              │ revises     │    │
│  │             │          │ (with reason)│              │ (with notes)│    │
│  └─────────────┘          └─────────────┘              └──────┬──────┘    │
│       │                                                       │           │
│       ▼                                                       │           │
│  ┌─────────────┐                                              │           │
│  │ NOTIFY:     │                                              │           │
│  │ - Planner   │◄─────────────────────────────────────────────┘           │
│  │ - Team      │                                                          │
│  │ - Client    │                                                          │
│  └─────────────┘                                                          │
│                                                                           │
│  ESCALATION RULES:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • After 24h without response → Reminder notification                │  │
│  │ • After 48h → Escalate to PM                                        │  │
│  │ • After 72h → Escalate to Admin                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Implementation Code (NestJS Use Case):**

```typescript
// application/use-cases/approval/submit-for-approval.use-case.ts

@Injectable()
export class SubmitForApprovalUseCase {
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepo: IApprovalRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(dto: SubmitApprovalDto): Promise<ApprovalResponseDto> {
    // 1. Validate project exists and user has permission
    const project = await this.projectRepo.findById(dto.projectId);
    if (!project) throw new NotFoundException('Project not found');

    // 2. Create approval request
    const approval = Approval.create({
      projectId: dto.projectId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      submittedById: dto.userId,
      deadline: dto.deadline,
    });

    // 3. Save to database
    const saved = await this.approvalRepo.save(approval);

    // 4. Update project stage
    await this.projectRepo.updateStage(dto.projectId, ProjectStage.UNDER_REVIEW);

    // 5. Find approvers (NVKD for this project)
    const approvers = await this.projectRepo.findTeamByRole(
      dto.projectId,
      UserRole.NVKD
    );

    // 6. Send notifications
    await this.notificationService.notifyApprovalPending({
      approval: saved,
      approvers,
    });

    return ApprovalMapper.toDto(saved);
  }
}
```

### 7.2 Client Portal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT PORTAL FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT LOGIN:                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │ Enter       │────►│ Validate    │────►│ Generate    │                   │
│  │ Access Code │     │ Code        │     │ Session     │                   │
│  │ (e.g. BC-   │     │ (+ 2FA)     │     │ Token       │                   │
│  │  JUSHUN-24) │     │             │     │             │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                 │                           │
│                                                 ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CLIENT DASHBOARD                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Project: Jushun Vietnam Performance Marketing              │    │   │
│  │  │  Status: 🟢 Ổn định                                         │    │   │
│  │  │  Stage: Ongoing (Phase 2)                                   │    │   │
│  │  │  Progress: ████████░░ 75%                                   │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Budget       │  │ Timeline     │  │ Key Metrics  │              │   │
│  │  │ Spent: 37%   │  │ Week 3/8     │  │ Leads: 328   │              │   │
│  │  │ On track ✓   │  │ On track ✓   │  │ CPL: 45k     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │  📄 Reports (View only, with watermark)                             │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ [📊] Weekly Report - Week 3     [View]                      │    │   │
│  │  │ [📊] Weekly Report - Week 2     [View]                      │    │   │
│  │  │ [📋] Media Plan - January       [View]                      │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ❌ Cannot: Download files, See tasks, Edit anything, See budget $  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  WATERMARK ON ALL VIEWS:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │        ╔═══════════════════════════════════════════╗                │   │
│  │        ║        [BC AGENCY LOGO]                   ║                │   │
│  │        ║     CONFIDENTIAL - CLIENT VIEW            ║                │   │
│  │        ║     Jushun Vietnam - 2025-01-22           ║                │   │
│  │        ╚═══════════════════════════════════════════╝                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Access Code Generation:**

```typescript
// infrastructure/services/access-code.service.ts

@Injectable()
export class AccessCodeService {
  generateAccessCode(clientName: string): string {
    const prefix = 'BC';
    const clientCode = clientName
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 6);
    const year = new Date().getFullYear().toString().slice(-2);
    const random = this.generateRandomString(4);
    
    return `${prefix}-${clientCode}-${year}-${random}`;
    // Example: BC-JUSHUN-25-A3F7
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
```

### 7.3 File Storage (MinIO)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE STORAGE STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MinIO Bucket: bc-agency-files                                              │
│  ├── projects/                                                              │
│  │   ├── QC09-jushun/                                                       │
│  │   │   ├── briefs/                                                        │
│  │   │   │   └── client-brief-v1.pdf                                        │
│  │   │   ├── plans/                                                         │
│  │   │   │   ├── media-plan-v1.xlsx                                         │
│  │   │   │   └── media-plan-v2.xlsx  (versioned)                           │
│  │   │   ├── reports/                                                       │
│  │   │   │   ├── week-01-report.pdf                                         │
│  │   │   │   └── week-02-report.pdf                                         │
│  │   │   ├── creatives/                                                     │
│  │   │   │   ├── ad-image-01.png                                            │
│  │   │   │   └── ad-video-01.mp4                                            │
│  │   │   └── raw-data/                                                      │
│  │   │       └── meta-ads-export.csv                                        │
│  │   │                                                                      │
│  │   └── QC04-eureka/                                                       │
│  │       └── ...                                                            │
│  │                                                                          │
│  └── thumbnails/                                                            │
│      └── [auto-generated thumbnails]                                        │
│                                                                             │
│  VERSIONING:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ File: media-plan.xlsx                                               │   │
│  │                                                                      │   │
│  │ v1 (2025-01-15) ──► v2 (2025-01-18) ──► v3 (2025-01-22) [current]  │   │
│  │                                                                      │   │
│  │ All versions stored, linked via previousId                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**MinIO Service Implementation:**

```typescript
// infrastructure/external-services/minio/minio-file-storage.service.ts

@Injectable()
export class MinioFileStorageService implements IFileStorageService {
  private minioClient: Client;
  private readonly bucketName = 'bc-agency-files';

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Client({
      endPoint: configService.get('MINIO_ENDPOINT'),
      port: parseInt(configService.get('MINIO_PORT')),
      useSSL: false,
      accessKey: configService.get('MINIO_ACCESS_KEY'),
      secretKey: configService.get('MINIO_SECRET_KEY'),
    });
  }

  async upload(file: Express.Multer.File, path: string): Promise<FileUploadResult> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const fullPath = `${path}/${fileName}`;

    await this.minioClient.putObject(
      this.bucketName,
      fullPath,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // Generate thumbnail if image
    if (file.mimetype.startsWith('image/')) {
      await this.generateThumbnail(file.buffer, fullPath);
    }

    return {
      path: fullPath,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async getSignedUrl(path: string, expirySeconds = 3600): Promise<string> {
    return await this.minioClient.presignedGetObject(
      this.bucketName,
      path,
      expirySeconds
    );
  }

  private async generateThumbnail(buffer: Buffer, path: string): Promise<void> {
    const thumbnail = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .toBuffer();

    const thumbnailPath = `thumbnails/${path}`;
    await this.minioClient.putObject(
      this.bucketName,
      thumbnailPath,
      thumbnail
    );
  }
}
```

### 7.4 Built-in Calendar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CALENDAR SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TWO CALENDAR TYPES:                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. MEETING CALENDAR (Lịch họp)                                      │   │
│  │    - Client meetings                                                │   │
│  │    - Internal sync meetings                                         │   │
│  │    - Pitching sessions                                              │   │
│  │    - Review meetings                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. TASK CALENDAR (Lịch công việc)                                   │   │
│  │    - Task deadlines                                                 │   │
│  │    - Milestones                                                     │   │
│  │    - Content publish dates                                          │   │
│  │    - Report due dates                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CALENDAR VIEW:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  January 2025                                    [Month ▼] [Filter] │   │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                       │   │
│  │  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                       │   │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │   │
│  │  │     │     │  1  │  2  │  3  │  4  │  5  │                       │   │
│  │  │     │     │     │     │     │     │     │                       │   │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │   │
│  │  │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │                       │   │
│  │  │     │🔴MTG│     │🔵DL │     │     │     │                       │   │
│  │  │     │Jushun│    │Report│    │     │     │                       │   │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │   │
│  │  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │ 19  │                       │   │
│  │  │⭐MS │🔴MTG│     │🔵DL │     │     │     │                       │   │
│  │  │Phase2│Eureka│   │Content│    │     │     │                       │   │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                       │   │
│  │                                                                      │   │
│  │  Legend: 🔴 Meeting  🔵 Deadline  ⭐ Milestone  🟢 Reminder         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  REMINDER SYSTEM:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1 day before → Telegram notification to all attendees              │   │
│  │ Event time → In-app notification                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Telegram Notifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TELEGRAM NOTIFICATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SETUP FLOW:                                                                │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐                       │
│  │  User   │────►│ Open Bot    │────►│ Link Account│                       │
│  │ Profile │     │ @BCAgencyBot│     │ /start      │                       │
│  └─────────┘     └─────────────┘     └─────────────┘                       │
│                                                                             │
│  NOTIFICATION TYPES:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  📋 TASK NOTIFICATIONS                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🆕 Task Assigned                                            │    │   │
│  │  │ Project: Jushun Vietnam                                     │    │   │
│  │  │ Task: Thiết kế banner quảng cáo                            │    │   │
│  │  │ Deadline: 25/01/2025                                        │    │   │
│  │  │ Priority: 🔴 HIGH                                           │    │   │
│  │  │ [View Task ↗]                                               │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ✅ APPROVAL NOTIFICATIONS                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ 📝 Approval Pending                                         │    │   │
│  │  │ Project: Jushun Vietnam                                     │    │   │
│  │  │ Type: Media Plan Approval                                   │    │   │
│  │  │ Submitted by: Sơn (Planner)                                 │    │   │
│  │  │ Deadline: 23/01/2025                                        │    │   │
│  │  │ [Review ↗] [Approve ✓] [Reject ✗]                          │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  📅 CALENDAR NOTIFICATIONS                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ ⏰ Reminder: Meeting Tomorrow                               │    │   │
│  │  │ Project: Jushun Vietnam                                     │    │   │
│  │  │ Time: 10:00 AM - 11:00 AM                                   │    │   │
│  │  │ Attendees: BC Team + Client                                 │    │   │
│  │  │ [View Details ↗]                                            │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  USER PREFERENCES:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Task assigned to me                                             │   │
│  │ ☑️ Task due soon (1 day before)                                    │   │
│  │ ☑️ Approval pending (for approvers)                                │   │
│  │ ☑️ Approval result                                                 │   │
│  │ ☑️ Meeting reminder                                                │   │
│  │ ☐ Comment mentions                                                 │   │
│  │ ☐ File uploaded                                                    │   │
│  │                                                                      │   │
│  │ 🔕 Do Not Disturb: 22:00 - 08:00                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. IMPLEMENTATION ROADMAP

### 8.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IMPLEMENTATION ROADMAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Timeline: 12 weeks (3 months)                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 1: FOUNDATION (Week 1-3)                                      │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │   │
│  │ • Infrastructure setup (Docker, Database, MinIO)                    │   │
│  │ • Clean Architecture scaffolding                                    │   │
│  │ • Authentication system                                             │   │
│  │ • Basic UI components                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 2: CORE FEATURES (Week 4-6)                                   │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │   │
│  │ • Project management (CRUD, stages, team)                           │   │
│  │ • Task management (hierarchy, assignment)                           │   │
│  │ • File management (upload, versioning)                              │   │
│  │ • Dashboard (role-based)                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 3: WORKFLOW & CALENDAR (Week 7-9)                             │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │   │
│  │ • Approval workflow                                                 │   │
│  │ • Calendar system (meetings + deadlines)                            │   │
│  │ • Telegram notifications                                            │   │
│  │ • Comments & discussions                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 4: CLIENT PORTAL & POLISH (Week 10-12)                        │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │   │
│  │ • Client portal (access code, view-only)                            │   │
│  │ • Reports (PDF/Excel export)                                        │   │
│  │ • Admin panel                                                       │   │
│  │ • Data migration                                                    │   │
│  │ • Testing & bug fixes                                               │   │
│  │ • Production deployment                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Detailed Task Breakdown

#### PHASE 1: FOUNDATION (Week 1-3)

| Week | Task | Deliverable |
|------|------|-------------|
| **W1** | Infrastructure Setup | |
| | - Setup Docker Compose | docker-compose.yml |
| | - Configure PostgreSQL + Redis | Database running |
| | - Configure MinIO | File storage running |
| | - Setup Nginx + SSL | HTTPS working |
| **W1** | Project Scaffolding | |
| | - Initialize NestJS backend | Backend structure |
| | - Initialize Next.js frontend | Frontend structure |
| | - Setup Prisma + migrations | Database schema |
| **W2** | Authentication Backend | |
| | - JWT authentication | Login/logout API |
| | - Role-based guards | Permission system |
| | - Session management | Redis sessions |
| | - Audit logging | Login history |
| **W2** | Authentication Frontend | |
| | - Login page (internal) | UI + integration |
| | - Client login page | Access code UI |
| | - Auth state management | Zustand store |
| **W3** | UI Foundation | |
| | - Setup Shadcn/ui | Component library |
| | - Layout components | Sidebar, Navbar |
| | - Theme system | Light/Dark mode |
| | - Responsive design | Mobile-ready |

#### PHASE 2: CORE FEATURES (Week 4-6)

| Week | Task | Deliverable |
|------|------|-------------|
| **W4** | Project Module | |
| | - Project entity + repository | Domain layer |
| | - Create/Update/Delete use cases | Application layer |
| | - Project controller + routes | API endpoints |
| | - Project list + detail pages | Frontend UI |
| | - Project form (create/edit) | Form with validation |
| **W4** | Team Assignment | |
| | - Team member management | Add/remove members |
| | - Role assignment per project | Role selector |
| **W5** | Task Module | |
| | - Task entity (3-level hierarchy) | Domain layer |
| | - Task CRUD use cases | Application layer |
| | - Task assignment | Multi-assignee |
| | - Task views: List, Kanban | Frontend UI |
| | - Task detail + subtasks | Nested display |
| **W6** | File Module | |
| | - File upload to MinIO | Upload service |
| | - File versioning | Version tracking |
| | - Thumbnail generation | Image previews |
| | - File browser UI | Project files page |
| **W6** | Dashboard | |
| | - Role-based dashboard | Different views |
| | - Statistics widgets | Charts, metrics |
| | - Recent activities | Activity feed |

#### PHASE 3: WORKFLOW & CALENDAR (Week 7-9)

| Week | Task | Deliverable |
|------|------|-------------|
| **W7** | Approval Workflow | |
| | - Approval entity + logic | Domain layer |
| | - Submit/Approve/Reject flows | Use cases |
| | - Approval history | Audit trail |
| | - Escalation rules | Auto-escalate |
| | - Approval UI | Pending list, actions |
| **W8** | Calendar Module | |
| | - Event entity | Domain layer |
| | - Meeting calendar | CRUD + recurring |
| | - Task deadline calendar | Auto from tasks |
| | - Calendar UI | Month/week view |
| | - Event detail modal | Create/edit events |
| **W9** | Notifications | |
| | - Telegram bot setup | Bot registration |
| | - Notification service | Queue + send |
| | - User preferences | Settings UI |
| | - In-app notifications | Bell icon + list |
| **W9** | Comments | |
| | - Comment entity | Domain layer |
| | - Project/Task comments | Threaded replies |
| | - @mentions | User tagging |

#### PHASE 4: CLIENT PORTAL & POLISH (Week 10-12)

| Week | Task | Deliverable |
|------|------|-------------|
| **W10** | Client Portal | |
| | - Client entity + access codes | Domain layer |
| | - Client authentication | Access code login |
| | - 2FA for clients | OTP verification |
| | - Client dashboard | Limited view |
| | - Watermark system | Logo overlay |
| **W10** | Reports | |
| | - Report templates | Weekly, monthly |
| | - PDF export | Using Puppeteer |
| | - Excel export | Using ExcelJS |
| | - Report UI | Generation page |
| **W11** | Admin Panel | |
| | - User management | CRUD users |
| | - System settings | Config UI |
| | - Audit logs viewer | Search + filter |
| | - Bug report system | Feedback form |
| **W11** | Data Migration | |
| | - Migration scripts | Excel → PostgreSQL |
| | - Data validation | Integrity checks |
| | - Test migration | Staging environment |
| **W12** | Testing & Deployment | |
| | - Integration testing | API tests |
| | - E2E testing | Playwright |
| | - Performance testing | Load testing |
| | - Security audit | Vulnerability scan |
| | - Production deployment | Go live |
| | - Documentation | User guide |

### 8.3 Gantt Chart

```
Week:     1    2    3    4    5    6    7    8    9   10   11   12
          │    │    │    │    │    │    │    │    │    │    │    │
PHASE 1   ████████████████
 Infra    ████
 Auth          ████████
 UI                 ████████

PHASE 2                 ████████████████████
 Project                ████████
 Task                        ████████
 File                             ████████
 Dashboard                             ████

PHASE 3                                     ████████████████████
 Approval                                   ████████
 Calendar                                        ████████
 Notify                                               ████████
 Comments                                                  ████

PHASE 4                                                    ████████████████
 Client                                                    ████████
 Reports                                                   ████
 Admin                                                          ████████
 Migration                                                      ████
 Deploy                                                              ████████
```

---

## 9. RISK ASSESSMENT

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|:------:|:-----------:|------------|
| Server resources insufficient | High | Medium | Start with 4GB, monitor, scale up |
| Complex 135-column migration | High | High | Normalize early, validate thoroughly |
| MinIO learning curve | Medium | Low | Use S3-compatible SDK, good docs |
| Real-time features slow | Medium | Medium | Use Redis pub/sub, optimize queries |
| Mobile responsiveness issues | Low | Medium | Mobile-first CSS, test early |

### 9.2 Project Risks

| Risk | Impact | Probability | Mitigation |
|------|:------:|:-----------:|------------|
| Single developer bottleneck | High | High | Clear priorities, MVP focus, Claude Code |
| Scope creep | High | Medium | Strict phase gates, defer to v2 |
| Data migration failures | High | Medium | Multiple test runs, rollback plan |
| User adoption resistance | Medium | Medium | Training, gradual rollout |
| Timeline slippage | Medium | Medium | Buffer in Phase 4, cut non-essentials |

### 9.3 Contingency Plans

1. **If behind schedule:**
   - Cut Gantt chart view (keep List + Kanban)
   - Defer PDF watermarking to v2
   - Simplify admin panel

2. **If server too slow:**
   - Upgrade to 4 vCPU / 8 GB RAM
   - Add Redis caching aggressively
   - Implement pagination everywhere

3. **If migration fails:**
   - Keep Excel as backup for 1 month
   - Migrate project-by-project
   - Manual data entry for critical projects

---

## 10. APPENDIX

### 10.1 API Endpoints Summary

```
Authentication:
POST   /api/auth/login              # Internal login
POST   /api/auth/client-login       # Client access code
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout

Projects:
GET    /api/projects                # List projects
POST   /api/projects                # Create project
GET    /api/projects/:id            # Get project
PATCH  /api/projects/:id            # Update project
DELETE /api/projects/:id            # Delete project
GET    /api/projects/:id/team       # Get team
POST   /api/projects/:id/team       # Add member
DELETE /api/projects/:id/team/:userId  # Remove member

Tasks:
GET    /api/tasks                   # List tasks (with filters)
POST   /api/tasks                   # Create task
GET    /api/tasks/:id               # Get task
PATCH  /api/tasks/:id               # Update task
DELETE /api/tasks/:id               # Delete task
POST   /api/tasks/:id/assign        # Assign users
PATCH  /api/tasks/:id/status        # Update status

Approvals:
GET    /api/approvals               # List pending
POST   /api/approvals               # Submit for approval
PATCH  /api/approvals/:id/approve   # Approve
PATCH  /api/approvals/:id/reject    # Reject
PATCH  /api/approvals/:id/request-changes  # Request changes

Files:
GET    /api/files                   # List files
POST   /api/files/upload            # Upload file
GET    /api/files/:id               # Get file info
GET    /api/files/:id/download      # Download file
DELETE /api/files/:id               # Delete file

Calendar:
GET    /api/events                  # List events
POST   /api/events                  # Create event
PATCH  /api/events/:id              # Update event
DELETE /api/events/:id              # Delete event

Notifications:
GET    /api/notifications           # List notifications
PATCH  /api/notifications/:id/read  # Mark as read
PATCH  /api/notifications/read-all  # Mark all as read

Admin:
GET    /api/admin/users             # List users
POST   /api/admin/users             # Create user
PATCH  /api/admin/users/:id         # Update user
GET    /api/admin/audit-logs        # View audit logs
GET    /api/admin/settings          # Get settings
PATCH  /api/admin/settings          # Update settings

Client Portal:
GET    /api/client/project          # Get client's project
GET    /api/client/reports          # Get reports
```

### 10.2 Environment Variables

```env
# .env.example

# Application
NODE_ENV=production
APP_PORT=3001
FRONTEND_URL=https://pms.bcagency.com

# Database
DATABASE_URL=postgresql://bc_user:bc_password@postgres:5432/bc_pms

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=bc-agency-files

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Security
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 10.3 Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ]
}
```

### 10.4 Testing Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TESTING PYRAMID                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                             /   E2E    \        5% - Critical flows         │
│                            /  (Playwright)\     - Login, Create Project     │
│                           /───────────────\    - Approval workflow          │
│                          /                  \                               │
│                         /    Integration     \   20% - API endpoints        │
│                        /     (Supertest)      \  - Database queries         │
│                       /─────────────────────────\ - Service interactions    │
│                      /                            \                         │
│                     /          Unit Tests          \  75% - Use cases       │
│                    /           (Jest/Vitest)        \ - Domain logic        │
│                   /──────────────────────────────────\ - Utilities          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Backend Testing (NestJS + Jest):**

```typescript
// test/unit/use-cases/create-project.use-case.spec.ts

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockProjectRepo: jest.Mocked<IProjectRepository>;
  let mockNotificationService: jest.Mocked<INotificationService>;

  beforeEach(() => {
    mockProjectRepo = {
      save: jest.fn(),
      findByCode: jest.fn(),
    };
    mockNotificationService = {
      notifyProjectCreated: jest.fn(),
    };
    useCase = new CreateProjectUseCase(mockProjectRepo, mockNotificationService);
  });

  it('should create project successfully', async () => {
    // Arrange
    const dto: CreateProjectDto = {
      code: 'QC10',
      name: 'Test Project',
      clientId: 'client-123',
    };
    mockProjectRepo.findByCode.mockResolvedValue(null);
    mockProjectRepo.save.mockResolvedValue({ id: 'proj-123', ...dto });

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.id).toBe('proj-123');
    expect(mockProjectRepo.save).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.notifyProjectCreated).toHaveBeenCalled();
  });

  it('should throw error if project code exists', async () => {
    // Arrange
    mockProjectRepo.findByCode.mockResolvedValue({ id: 'existing' });

    // Act & Assert
    await expect(useCase.execute({ code: 'QC10' }))
      .rejects.toThrow('Project code already exists');
  });
});

// test/integration/project.controller.spec.ts

describe('ProjectController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  describe('POST /api/projects', () => {
    it('should create project with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          code: 'QC10',
          name: 'Integration Test Project',
        })
        .expect(201);

      expect(response.body.code).toBe('QC10');

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { code: 'QC10' },
      });
      expect(project).toBeTruthy();
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ code: 'QC10' })
        .expect(401);
    });
  });
});
```

**Frontend Testing (Vitest + Testing Library):**

```typescript
// __tests__/components/ProjectCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '@/components/project/ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    code: 'QC09',
    name: 'Jushun Vietnam',
    status: 'STABLE',
    stage: 'ONGOING',
    stageProgress: 75,
  };

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('QC09')).toBeInTheDocument();
    expect(screen.getByText('Jushun Vietnam')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows correct status badge color', () => {
    render(<ProjectCard project={mockProject} />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-green-500'); // STABLE = green
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ProjectCard project={mockProject} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledWith('1');
  });
});

// __tests__/hooks/useProjects.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from '@/hooks/useProjects';

describe('useProjects', () => {
  it('fetches projects successfully', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(3);
  });
});
```

**E2E Testing (Playwright):**

```typescript
// e2e/approval-workflow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Planner
    await page.goto('/login');
    await page.fill('[name="email"]', 'planner@bcagency.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('complete approval flow', async ({ page }) => {
    // 1. Planner submits for approval
    await page.goto('/projects/QC09');
    await page.click('[data-testid="submit-approval-btn"]');
    await page.fill('[name="title"]', 'Media Plan Week 4');
    await page.click('[data-testid="confirm-submit"]');

    await expect(page.locator('.toast-success')).toContainText('Submitted');

    // 2. Login as NVKD (Approver)
    await page.click('[data-testid="logout"]');
    await page.fill('[name="email"]', 'nvkd@bcagency.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. NVKD approves
    await page.goto('/approvals');
    await page.click('[data-testid="approval-QC09"]');
    await page.click('[data-testid="approve-btn"]');
    await page.fill('[name="comment"]', 'Approved. Good work!');
    await page.click('[data-testid="confirm-approve"]');

    await expect(page.locator('.toast-success')).toContainText('Approved');

    // 4. Verify project stage changed
    await page.goto('/projects/QC09');
    await expect(page.locator('[data-testid="project-stage"]'))
      .toContainText('ONGOING');
  });
});
```

**Test Coverage Requirements:**

| Layer | Target Coverage | Critical Paths |
|-------|:---------------:|----------------|
| Domain (Entities, Value Objects) | 90% | All business logic |
| Application (Use Cases) | 85% | All use cases |
| Infrastructure | 70% | Repository implementations |
| Presentation (Controllers) | 80% | All endpoints |
| Frontend Components | 75% | Interactive components |
| E2E | N/A | 10 critical user flows |

**CI/CD Test Pipeline:**

```yaml
# .github/workflows/test.yml

name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

### 10.5 Security Deep-Dive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SECURITY LAYERS                               │   │
│  │                                                                      │   │
│  │   Layer 1: NETWORK                                                   │   │
│  │   ├── Nginx WAF (ModSecurity)                                        │   │
│  │   ├── SSL/TLS 1.3 only                                               │   │
│  │   ├── Rate limiting (per IP, per endpoint)                           │   │
│  │   └── DDoS protection (Cloudflare optional)                          │   │
│  │                                                                      │   │
│  │   Layer 2: APPLICATION                                               │   │
│  │   ├── JWT + Refresh Token rotation                                   │   │
│  │   ├── RBAC (Role-Based Access Control)                               │   │
│  │   ├── Input validation (class-validator)                             │   │
│  │   ├── Output sanitization                                            │   │
│  │   └── CORS whitelist                                                 │   │
│  │                                                                      │   │
│  │   Layer 3: DATA                                                      │   │
│  │   ├── Password hashing (Argon2id)                                    │   │
│  │   ├── Sensitive data encryption (AES-256-GCM)                        │   │
│  │   ├── Database connection encryption                                 │   │
│  │   └── File encryption at rest (MinIO SSE)                            │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Authentication & Authorization:**

```typescript
// infrastructure/auth/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS512'], // Use stronger algorithm
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt &&
        payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      throw new UnauthorizedException('Token invalidated by password change');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

// infrastructure/auth/token.service.ts

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokenPair(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
      algorithm: 'HS512',
    });

    const refreshToken = this.generateRefreshToken();

    // Store refresh token in Redis with user binding
    await this.redisService.set(
      `refresh:${refreshToken}`,
      JSON.stringify({ userId: user.id, createdAt: Date.now() }),
      60 * 60 * 24 * 30, // 30 days
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const stored = await this.redisService.get(`refresh:${refreshToken}`);

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { userId } = JSON.parse(stored);
    const user = await this.userService.findById(userId);

    // Rotate refresh token (one-time use)
    await this.redisService.del(`refresh:${refreshToken}`);

    return this.generateTokenPair(user);
  }

  async revokeAllTokens(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    const keys = await this.redisService.keys(`refresh:*`);
    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (JSON.parse(data).userId === userId) {
        await this.redisService.del(key);
      }
    }
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
```

**Password Security (Argon2id):**

```typescript
// infrastructure/auth/password.service.ts

import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  // Argon2id - recommended by OWASP
  private readonly hashOptions: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,        // 3 iterations
    parallelism: 4,     // 4 threads
    hashLength: 32,
  };

  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.hashOptions);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  validateStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Must contain number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Must contain special character');
    }

    return { valid: errors.length === 0, errors };
  }
}
```

**Data Encryption:**

```typescript
// infrastructure/crypto/encryption.service.ts

import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Key should be 32 bytes for AES-256
    this.key = crypto.scryptSync(
      configService.get('ENCRYPTION_SECRET'),
      configService.get('ENCRYPTION_SALT'),
      32,
    );
  }

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage: Encrypt sensitive fields
@Entity()
export class Client {
  @Column({
    transformer: {
      to: (value) => encryptionService.encrypt(value),
      from: (value) => encryptionService.decrypt(value),
    },
  })
  accessCode: string; // Stored encrypted in DB
}
```

**Rate Limiting Configuration:**

```typescript
// presentation/guards/throttle.guard.ts

// Different rate limits for different endpoints
export const RateLimitConfig = {
  // General API
  default: {
    ttl: 60000,      // 1 minute window
    limit: 100,      // 100 requests
  },

  // Auth endpoints (stricter)
  login: {
    ttl: 900000,     // 15 minutes
    limit: 5,        // 5 attempts
  },

  // Password reset
  passwordReset: {
    ttl: 3600000,    // 1 hour
    limit: 3,        // 3 attempts
  },

  // File upload
  upload: {
    ttl: 60000,      // 1 minute
    limit: 10,       // 10 uploads
  },

  // Client portal (per access code)
  clientPortal: {
    ttl: 60000,
    limit: 30,
  },
};

// Apply in controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(RateLimitConfig.login)
  @UseGuards(ThrottlerGuard)
  async login(@Body() dto: LoginDto) {
    // Login logic
  }
}
```

**CORS Configuration:**

```typescript
// main.ts

app.enableCors({
  origin: [
    'https://pms.bcagency.com',
    'https://admin.bcagency.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
```

**Security Headers (Helmet):**

```typescript
// main.ts

import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://minio.bcagency.com'],
      connectSrc: ["'self'", 'https://api.bcagency.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

**Security Checklist:**

| Category | Item | Status |
|----------|------|:------:|
| **Authentication** | JWT with short expiry (15m) | ✅ |
| | Refresh token rotation | ✅ |
| | Password hashing (Argon2id) | ✅ |
| | Account lockout after 5 failed attempts | ✅ |
| **Authorization** | RBAC implementation | ✅ |
| | Project-level permissions | ✅ |
| | API endpoint guards | ✅ |
| **Data Protection** | Sensitive data encryption | ✅ |
| | Database SSL connection | ✅ |
| | MinIO encryption at rest | ✅ |
| **Input Validation** | DTO validation (class-validator) | ✅ |
| | SQL injection prevention (Prisma) | ✅ |
| | XSS prevention (sanitize-html) | ✅ |
| **Network** | HTTPS only | ✅ |
| | Rate limiting | ✅ |
| | CORS whitelist | ✅ |
| | Security headers (Helmet) | ✅ |
| **Audit** | Login attempts logged | ✅ |
| | Sensitive actions logged | ✅ |
| | IP tracking | ✅ |

---

### 10.6 Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ERROR HANDLING ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ERROR FLOW                                        │   │
│  │                                                                      │   │
│  │   Request ──► Controller ──► Use Case ──► Repository                │   │
│  │      │            │             │              │                     │   │
│  │      │            │             │              │                     │   │
│  │      │            ▼             ▼              ▼                     │   │
│  │      │      ┌─────────────────────────────────────────┐             │   │
│  │      │      │         Domain Exceptions               │             │   │
│  │      │      │  • EntityNotFoundException              │             │   │
│  │      │      │  • ValidationException                  │             │   │
│  │      │      │  • BusinessRuleException                │             │   │
│  │      │      │  • UnauthorizedException                │             │   │
│  │      │      └─────────────────────────────────────────┘             │   │
│  │      │                         │                                     │   │
│  │      │                         ▼                                     │   │
│  │      │      ┌─────────────────────────────────────────┐             │   │
│  │      └─────►│       Global Exception Filter           │             │   │
│  │             │  • Map domain → HTTP exceptions         │             │   │
│  │             │  • Log errors                           │             │   │
│  │             │  • Format response                      │             │   │
│  │             │  • Notify if critical                   │             │   │
│  │             └─────────────────────────────────────────┘             │   │
│  │                                │                                     │   │
│  │                                ▼                                     │   │
│  │             ┌─────────────────────────────────────────┐             │   │
│  │             │        Standardized Error Response      │             │   │
│  │             │  {                                      │             │   │
│  │             │    "success": false,                    │             │   │
│  │             │    "error": {                           │             │   │
│  │             │      "code": "PROJECT_NOT_FOUND",       │             │   │
│  │             │      "message": "Project not found",    │             │   │
│  │             │      "details": [...],                  │             │   │
│  │             │      "timestamp": "2025-01-22T..."      │             │   │
│  │             │    }                                    │             │   │
│  │             │  }                                      │             │   │
│  │             └─────────────────────────────────────────┘             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Domain Exceptions:**

```typescript
// domain/exceptions/domain.exception.ts

export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

// domain/exceptions/entity-not-found.exception.ts

export class EntityNotFoundException extends DomainException {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(entity: string, identifier: string) {
    super(`${entity} with identifier '${identifier}' not found`);
  }
}

// domain/exceptions/business-rule.exception.ts

export class BusinessRuleException extends DomainException {
  readonly code: string;
  readonly httpStatus = 422;

  constructor(code: string, message: string, details?: any) {
    super(message, details);
    this.code = code;
  }
}

// Usage in Use Case
export class ApproveUseCase {
  async execute(dto: ApproveDto) {
    const approval = await this.approvalRepo.findById(dto.approvalId);

    if (!approval) {
      throw new EntityNotFoundException('Approval', dto.approvalId);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BusinessRuleException(
        'APPROVAL_ALREADY_PROCESSED',
        'This approval has already been processed',
        { currentStatus: approval.status }
      );
    }

    if (approval.submittedById === dto.approverId) {
      throw new BusinessRuleException(
        'CANNOT_APPROVE_OWN_SUBMISSION',
        'You cannot approve your own submission'
      );
    }

    // ... proceed with approval
  }
}
```

**Global Exception Filter:**

```typescript
// presentation/filters/global-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly telegramService: TelegramNotificationService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error
    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
      request: {
        method: request.method,
        url: request.url,
        body: this.sanitizeBody(request.body),
        userId: request.user?.id,
        ip: request.ip,
      },
    });

    // Notify critical errors to Telegram
    if (errorResponse.statusCode >= 500) {
      this.telegramService.notifyError(errorResponse);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const requestId = request.headers['x-request-id'] || crypto.randomUUID();

    // Domain Exception
    if (exception instanceof DomainException) {
      return {
        success: false,
        statusCode: exception.httpStatus,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
        timestamp,
        requestId,
      };
    }

    // Validation Exception (class-validator)
    if (exception instanceof ValidationException) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: exception.errors,
        },
        timestamp,
        requestId,
      };
    }

    // HTTP Exception (NestJS)
    if (exception instanceof HttpException) {
      return {
        success: false,
        statusCode: exception.getStatus(),
        error: {
          code: this.getCodeFromStatus(exception.getStatus()),
          message: exception.message,
        },
        timestamp,
        requestId,
      };
    }

    // Unknown error - don't expose details
    return {
      success: false,
      statusCode: 500,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp,
      requestId,
    };
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'accessCode', 'token', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }
}
```

**Frontend Error Handling:**

```typescript
// lib/api-client.ts

import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const errorResponse = error.response?.data;

    // Handle specific error codes
    switch (errorResponse?.error?.code) {
      case 'TOKEN_EXPIRED':
        // Try to refresh token
        try {
          await refreshToken();
          return apiClient.request(error.config!);
        } catch {
          // Redirect to login
          window.location.href = '/login?expired=true';
        }
        break;

      case 'UNAUTHORIZED':
        window.location.href = '/login';
        break;

      case 'FORBIDDEN':
        toast.error('Bạn không có quyền thực hiện hành động này');
        break;

      case 'VALIDATION_ERROR':
        // Handled by form
        break;

      case 'ENTITY_NOT_FOUND':
        toast.error(errorResponse.error.message);
        break;

      default:
        if (error.response?.status >= 500) {
          toast.error('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
        } else {
          toast.error(errorResponse?.error?.message || 'Đã xảy ra lỗi');
        }
    }

    return Promise.reject(error);
  }
);

// React Error Boundary
export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    logger.error('React Error Boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl font-semibold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-4">
            Vui lòng tải lại trang hoặc liên hệ hỗ trợ.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Retry Logic for Transient Failures:**

```typescript
// infrastructure/resilience/retry.service.ts

@Injectable()
export class RetryService {
  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryableErrors = [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
      ],
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = retryableErrors.some(code =>
          error.code === code || error.message?.includes(code)
        );

        if (!isRetryable || attempt === maxAttempts) {
          throw error;
        }

        // Wait before retry with exponential backoff
        await this.sleep(Math.min(delay, maxDelay));
        delay *= backoffMultiplier;

        this.logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
          error: error.message,
          nextDelay: delay,
        });
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in repository
@Injectable()
export class TelegramNotificationRepository {
  constructor(private readonly retryService: RetryService) {}

  async sendNotification(message: TelegramMessage): Promise<void> {
    await this.retryService.withRetry(
      () => this.telegramApi.sendMessage(message),
      { maxAttempts: 3, initialDelay: 2000 }
    );
  }
}
```

---

### 10.7 Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MONITORING ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     OBSERVABILITY STACK                              │   │
│  │                                                                      │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │   │
│  │   │   METRICS   │    │    LOGS     │    │   TRACES    │            │   │
│  │   │ (Prometheus)│    │   (Loki)    │    │  (Jaeger)   │            │   │
│  │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │   │
│  │          │                  │                  │                    │   │
│  │          └──────────────────┼──────────────────┘                    │   │
│  │                             │                                        │   │
│  │                             ▼                                        │   │
│  │                    ┌─────────────────┐                              │   │
│  │                    │     GRAFANA     │                              │   │
│  │                    │   Dashboards    │                              │   │
│  │                    └────────┬────────┘                              │   │
│  │                             │                                        │   │
│  │                             ▼                                        │   │
│  │                    ┌─────────────────┐                              │   │
│  │                    │  ALERTMANAGER   │──► Telegram / Email          │   │
│  │                    └─────────────────┘                              │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  APPLICATION                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Frontend │  │ Backend  │  │ Postgres │  │  Redis   │            │   │
│  │  │  Next.js │  │  NestJS  │  │          │  │          │            │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │   │
│  │       │             │             │             │                   │   │
│  │       └─────────────┴─────────────┴─────────────┘                   │   │
│  │                            │                                         │   │
│  │                            ▼                                         │   │
│  │                    /metrics endpoint                                 │   │
│  │                    JSON logs → Loki                                  │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Docker Compose - Monitoring Stack:**

```yaml
# docker-compose.monitoring.yml

version: '3.8'

services:
  # ============================================
  # PROMETHEUS - Metrics Collection
  # ============================================
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: bc-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    networks:
      - bc-agency-net

  # ============================================
  # GRAFANA - Visualization
  # ============================================
  grafana:
    image: grafana/grafana:10.1.0
    container_name: bc-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
      - loki
    networks:
      - bc-agency-net

  # ============================================
  # LOKI - Log Aggregation
  # ============================================
  loki:
    image: grafana/loki:2.9.0
    container_name: bc-loki
    restart: unless-stopped
    volumes:
      - ./monitoring/loki/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - bc-agency-net

  # ============================================
  # PROMTAIL - Log Shipper
  # ============================================
  promtail:
    image: grafana/promtail:2.9.0
    container_name: bc-promtail
    restart: unless-stopped
    volumes:
      - ./monitoring/promtail/promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - bc-agency-net

  # ============================================
  # ALERTMANAGER - Alert Routing
  # ============================================
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: bc-alertmanager
    restart: unless-stopped
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    networks:
      - bc-agency-net

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

**Prometheus Configuration:**

```yaml
# monitoring/prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  # Backend metrics
  - job_name: 'bc-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'

  # PostgreSQL metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis metrics
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx metrics
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # Node metrics (server health)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

**Alert Rules:**

```yaml
# monitoring/prometheus/alerts.yml

groups:
  - name: bc-agency-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate (> 5%)"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Slow response time
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
          > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time > 3s"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
          / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Server memory usage > 90%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_size_bytes - node_filesystem_free_bytes)
          / node_filesystem_size_bytes > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk usage > 85%"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} is down"
```

**NestJS Metrics Implementation:**

```typescript
// infrastructure/metrics/metrics.module.ts

import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultLabels: {
        app: 'bc-agency-pms',
      },
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}

// infrastructure/metrics/metrics.interceptor.ts

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;
    const path = route?.path || request.url;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const status = context.switchToHttp().getResponse().statusCode;

          this.requestCounter.inc({
            method,
            path,
            status: status.toString(),
          });

          this.requestDuration.observe(
            { method, path },
            duration,
          );
        },
        error: (error) => {
          const status = error.status || 500;
          this.requestCounter.inc({
            method,
            path,
            status: status.toString(),
          });
        },
      }),
    );
  }
}

// Custom business metrics
@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectMetric('projects_total')
    private readonly projectsGauge: Gauge<string>,
    @InjectMetric('tasks_by_status')
    private readonly tasksGauge: Gauge<string>,
    @InjectMetric('approvals_pending')
    private readonly approvalsGauge: Gauge<string>,
  ) {}

  async updateMetrics() {
    // Update project count by status
    const projectCounts = await this.prisma.project.groupBy({
      by: ['status'],
      _count: true,
    });
    projectCounts.forEach(({ status, _count }) => {
      this.projectsGauge.set({ status }, _count);
    });

    // Update task count by status
    const taskCounts = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
    });
    taskCounts.forEach(({ status, _count }) => {
      this.tasksGauge.set({ status }, _count);
    });

    // Update pending approvals
    const pendingApprovals = await this.prisma.approval.count({
      where: { status: 'PENDING' },
    });
    this.approvalsGauge.set(pendingApprovals);
  }
}
```

**Structured Logging:**

```typescript
// infrastructure/logging/logger.service.ts

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'bc-agency-pms',
        environment: process.env.NODE_ENV,
      },
      transports: [
        // Console output (for Docker logs → Promtail → Loki)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        // File output for backup
        new winston.transports.File({
          filename: '/var/log/app/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: '/var/log/app/combined.log',
          maxsize: 10485760,
          maxFiles: 10,
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: object) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: object) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: object) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: object) {
    this.logger.debug(message, { context, ...meta });
  }

  // Structured logging for specific events
  logRequest(request: any, response: any, duration: number) {
    this.logger.info('HTTP Request', {
      type: 'http_request',
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      userId: request.user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  logBusinessEvent(event: string, data: object) {
    this.logger.info(event, {
      type: 'business_event',
      event,
      ...data,
    });
  }

  logSecurityEvent(event: string, data: object) {
    this.logger.warn(event, {
      type: 'security_event',
      event,
      ...data,
    });
  }
}

// Usage
this.logger.logBusinessEvent('project_created', {
  projectId: project.id,
  projectCode: project.code,
  createdBy: userId,
});

this.logger.logSecurityEvent('failed_login_attempt', {
  email: dto.email,
  ip: request.ip,
  reason: 'Invalid password',
  attemptCount: 3,
});
```

**Grafana Dashboard (JSON):**

```json
{
  "dashboard": {
    "title": "BC Agency PMS - Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (status)",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "gauge",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Active Projects",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(projects_total{status!='CLOSED'})"
          }
        ]
      },
      {
        "title": "Pending Approvals",
        "type": "stat",
        "targets": [
          {
            "expr": "approvals_pending"
          }
        ]
      },
      {
        "title": "Error Logs",
        "type": "logs",
        "datasource": "Loki",
        "targets": [
          {
            "expr": "{job=\"bc-backend\"} |= \"error\""
          }
        ]
      }
    ]
  }
}
```

---

### 10.8 Backup & Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKUP & DISASTER RECOVERY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     BACKUP STRATEGY                                  │   │
│  │                                                                      │   │
│  │   ┌─────────────┐                                                    │   │
│  │   │  DATABASE   │                                                    │   │
│  │   │ (PostgreSQL)│                                                    │   │
│  │   └──────┬──────┘                                                    │   │
│  │          │                                                           │   │
│  │          ├─── Full Backup ──────► Daily 2:00 AM ──► Keep 7 days     │   │
│  │          │                                                           │   │
│  │          ├─── WAL Archive ──────► Continuous ────► Keep 7 days      │   │
│  │          │    (Point-in-time)                                        │   │
│  │          │                                                           │   │
│  │          └─── Weekly Backup ────► Sunday 3:00 AM ► Keep 4 weeks     │   │
│  │                                                                      │   │
│  │   ┌─────────────┐                                                    │   │
│  │   │    FILES    │                                                    │   │
│  │   │   (MinIO)   │                                                    │   │
│  │   └──────┬──────┘                                                    │   │
│  │          │                                                           │   │
│  │          ├─── Sync Backup ──────► Daily 3:00 AM ──► Keep 7 days     │   │
│  │          │    (rsync/rclone)                                         │   │
│  │          │                                                           │   │
│  │          └─── Weekly Full ──────► Sunday 4:00 AM ► Keep 4 weeks     │   │
│  │                                                                      │   │
│  │   ┌─────────────┐                                                    │   │
│  │   │    REDIS    │                                                    │   │
│  │   │  (Sessions) │                                                    │   │
│  │   └──────┬──────┘                                                    │   │
│  │          │                                                           │   │
│  │          └─── RDB Snapshot ─────► Every 6 hours ──► Keep 2 days     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STORAGE LOCATIONS:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   Primary:  /backups (Local server - 50GB allocated)                │   │
│  │   Secondary: External S3 bucket (Optional - for critical data)      │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Backup Scripts:**

```bash
#!/bin/bash
# scripts/backup/database-backup.sh

set -e

# Configuration
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bc_pms_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Perform backup
echo "Starting PostgreSQL backup..."
docker exec bc-postgres pg_dump -U bc_user -d bc_pms | gzip > ${BACKUP_FILE}

# Verify backup
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    echo "Backup successful: ${BACKUP_FILE}"
    echo "Size: $(du -h ${BACKUP_FILE} | cut -f1)"
else
    echo "ERROR: Backup failed!"
    # Send alert
    curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${ALERT_CHAT_ID}" \
        -d "text=🚨 BC PMS: Database backup FAILED at ${TIMESTAMP}"
    exit 1
fi

# Cleanup old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Log backup info
echo "${TIMESTAMP} - ${BACKUP_FILE} - $(du -h ${BACKUP_FILE} | cut -f1)" >> ${BACKUP_DIR}/backup.log

echo "Backup completed successfully!"
```

```bash
#!/bin/bash
# scripts/backup/minio-backup.sh

set -e

# Configuration
BACKUP_DIR="/backups/minio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MINIO_BUCKET="bc-agency-files"
RETENTION_DAYS=7

# Create backup directory
mkdir -p ${BACKUP_DIR}/${TIMESTAMP}

# Sync MinIO data using mc (MinIO Client)
echo "Starting MinIO backup..."
docker run --rm \
    -v ${BACKUP_DIR}/${TIMESTAMP}:/backup \
    --network bc-agency-net \
    minio/mc:latest \
    mirror minio/${MINIO_BUCKET} /backup/

# Create tarball
echo "Compressing backup..."
tar -czf ${BACKUP_DIR}/minio_${TIMESTAMP}.tar.gz -C ${BACKUP_DIR} ${TIMESTAMP}

# Cleanup temp directory
rm -rf ${BACKUP_DIR}/${TIMESTAMP}

# Verify backup
if [ -f "${BACKUP_DIR}/minio_${TIMESTAMP}.tar.gz" ]; then
    echo "MinIO backup successful: minio_${TIMESTAMP}.tar.gz"
    echo "Size: $(du -h ${BACKUP_DIR}/minio_${TIMESTAMP}.tar.gz | cut -f1)"
else
    echo "ERROR: MinIO backup failed!"
    exit 1
fi

# Cleanup old backups
find ${BACKUP_DIR} -name "minio_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "MinIO backup completed!"
```

**Cron Schedule:**

```bash
# /etc/cron.d/bc-agency-backup

# PostgreSQL daily backup at 2:00 AM
0 2 * * * root /opt/bc-agency/scripts/backup/database-backup.sh >> /var/log/backup/postgres.log 2>&1

# PostgreSQL weekly backup at 3:00 AM Sunday
0 3 * * 0 root /opt/bc-agency/scripts/backup/database-weekly.sh >> /var/log/backup/postgres-weekly.log 2>&1

# MinIO daily backup at 3:00 AM
0 3 * * * root /opt/bc-agency/scripts/backup/minio-backup.sh >> /var/log/backup/minio.log 2>&1

# MinIO weekly backup at 4:00 AM Sunday
0 4 * * 0 root /opt/bc-agency/scripts/backup/minio-weekly.sh >> /var/log/backup/minio-weekly.log 2>&1

# Backup verification at 6:00 AM
0 6 * * * root /opt/bc-agency/scripts/backup/verify-backup.sh >> /var/log/backup/verify.log 2>&1

# Cleanup old logs monthly
0 0 1 * * root find /var/log/backup -name "*.log" -mtime +30 -delete
```

**Restore Procedures:**

```bash
#!/bin/bash
# scripts/restore/database-restore.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./database-restore.sh <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la /backups/postgres/*.sql.gz
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop backend to prevent writes
echo "Stopping backend service..."
docker stop bc-backend

# Restore database
echo "Restoring database from ${BACKUP_FILE}..."
gunzip -c ${BACKUP_FILE} | docker exec -i bc-postgres psql -U bc_user -d bc_pms

# Restart backend
echo "Restarting backend service..."
docker start bc-backend

# Verify restore
echo "Verifying restore..."
docker exec bc-postgres psql -U bc_user -d bc_pms -c "SELECT COUNT(*) FROM projects;"

echo "✅ Database restore completed!"
```

**Disaster Recovery Plan:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DISASTER RECOVERY PLAN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SCENARIO 1: Database Corruption                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Stop backend service                                                    │
│  2. Identify last good backup (check backup.log)                            │
│  3. Restore from backup: ./database-restore.sh <backup_file>                │
│  4. Apply WAL logs if needed for point-in-time recovery                     │
│  5. Restart services and verify                                             │
│  RTO: 30 minutes | RPO: 24 hours (daily backup)                            │
│                                                                             │
│  SCENARIO 2: Server Failure                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Provision new server (same specs)                                       │
│  2. Install Docker + Docker Compose                                         │
│  3. Clone repository: git clone <repo>                                      │
│  4. Copy .env file from secure storage                                      │
│  5. Restore database from backup                                            │
│  6. Restore MinIO files from backup                                         │
│  7. Update DNS to point to new server                                       │
│  8. Renew SSL certificate                                                   │
│  9. Verify all services                                                     │
│  RTO: 2 hours | RPO: 24 hours                                              │
│                                                                             │
│  SCENARIO 3: Accidental Data Deletion                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Check audit_logs for deletion time                                      │
│  2. Use WAL archive for point-in-time recovery                              │
│  3. Restore specific tables/rows if possible                                │
│  4. Or restore full backup from before deletion                             │
│  RTO: 1 hour | RPO: Variable (depends on WAL)                              │
│                                                                             │
│  SCENARIO 4: Ransomware Attack                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Isolate server (disconnect from network)                                │
│  2. Provision clean new server                                              │
│  3. Restore from OFFLINE backup (weekly backup on external storage)         │
│  4. Audit and patch security vulnerabilities                                │
│  5. Reset all credentials                                                   │
│  6. Resume operations                                                       │
│  RTO: 4 hours | RPO: 7 days (weekly backup)                                │
│                                                                             │
│  CONTACT LIST:                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Primary:   Admin - admin@bcagency.com - +84 xxx xxx xxx                   │
│  Secondary: Tech Lead - tech@bcagency.com - +84 xxx xxx xxx                │
│  Hosting:   Provider Support - support@hosting.com                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Backup Monitoring Dashboard (Grafana):**

```yaml
# Prometheus metrics for backup monitoring
- alert: BackupMissing
  expr: |
    time() - backup_last_success_timestamp{job="database"} > 86400 * 1.5
  for: 30m
  labels:
    severity: critical
  annotations:
    summary: "Database backup missing for > 36 hours"

- alert: BackupSizeTooSmall
  expr: |
    backup_size_bytes{job="database"} < backup_size_bytes{job="database"} offset 1d * 0.5
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Backup size decreased by > 50%"
```

---

## 📝 SUMMARY

Đây là bản Brainstorm Report hoàn chỉnh cho **BC Agency PMS** với:

1. **Tech Stack**: Next.js + NestJS + PostgreSQL + Redis + MinIO
2. **Architecture**: Clean Architecture with clear layer separation
3. **Database**: Normalized schema handling 135 columns elegantly
4. **Features**: All core features with detailed implementation guidance
5. **Timeline**: 12 weeks với clear milestones
6. **Testing**: Comprehensive testing strategy (Unit, Integration, E2E)
7. **Security**: Multi-layer security (Argon2id, JWT rotation, encryption)
8. **Error Handling**: Standardized error responses + retry logic
9. **Monitoring**: Prometheus + Grafana + Loki + Alertmanager
10. **Backup**: Automated daily/weekly backups + disaster recovery plan

**Completeness Checklist:**

| Category | Status |
|----------|:------:|
| Problem Analysis | ✅ |
| Tech Stack Decision | ✅ |
| Clean Architecture | ✅ |
| Database Design | ✅ |
| API Design | ✅ |
| Feature Deep-Dive | ✅ |
| Implementation Roadmap | ✅ |
| Risk Assessment | ✅ |
| Testing Strategy | ✅ |
| Security Deep-Dive | ✅ |
| Error Handling | ✅ |
| Monitoring & Logging | ✅ |
| Backup & DR | ✅ |

**Next Steps:**
1. Review và confirm report này
2. Bắt đầu Phase 1: Foundation
3. Setup development environment
4. Setup monitoring stack
5. Begin coding with Claude Code

---

*Report generated by Solution Brainstormer*
*BC Agency Vietnam - January 2025*
*Version 1.1 - Enhanced with Testing, Security, Monitoring & Backup sections*
