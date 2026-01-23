# Phase 2: Core Features (Week 4-6)

**Duration:** 3 weeks | **Priority:** High | **Status:** [x] COMPLETED (2026-01-22)

---

## Context

- **Parent Plan:** [Master Plan](./plan.md)
- **Predecessor:** [Phase 1 - Foundation](./phase-01-foundation.md) (completed)
- **Successor:** [Phase 3 - Workflow & Calendar](./phase-03-workflow-calendar.md)

### Phase 1 Dependencies (Completed)
- Docker infrastructure running (PostgreSQL, Redis, MinIO, Nginx)
- NestJS backend with Clean Architecture structure
- Next.js frontend with App Router
- JWT authentication with RBAC guards
- Prisma schema migrated
- UI components ready: DataTable, StatusBadge, EmptyState, DashboardLayout, Sidebar, Navbar

---

## Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 4 | Project Management | Project CRUD, team assignment, project list/detail pages |
| Week 5 | Task Management | Task CRUD, Kanban board, task workflow, assignment |
| Week 6 | File Management + Dashboard | MinIO upload, file preview, dashboard analytics |

---

## Requirements

### Functional

#### Project Management (Week 4)
- FR-P01: Create project with code, name, client, timeline, links
- FR-P02: Update project status (STABLE/WARNING/CRITICAL) and stage
- FR-P03: List projects with filtering (status, stage, client) and sorting
- FR-P04: Project detail page showing overview, team, timeline
- FR-P05: Assign/remove team members with role selection
- FR-P06: Soft delete (archive) projects

#### Task Management (Week 5)
- FR-T01: Create tasks within projects (3-level hierarchy: task > subtask > sub-subtask)
- FR-T02: Task status workflow: TODO > IN_PROGRESS > REVIEW > DONE
- FR-T03: Kanban board view with drag-and-drop
- FR-T04: Task list view with filters (status, priority, assignee, deadline)
- FR-T05: Assign multiple users to tasks
- FR-T06: Set task priority (LOW/MEDIUM/HIGH/URGENT)
- FR-T07: Set deadline with date picker
- FR-T08: Task detail view with subtasks, comments placeholder

#### File Management (Week 6)
- FR-F01: Upload files to MinIO (max 20MB per file)
- FR-F02: Associate files with project or task
- FR-F03: File categorization (BRIEF/PLAN/REPORT/CREATIVE/etc.)
- FR-F04: File versioning (link new version to previous)
- FR-F05: Preview images and PDFs inline
- FR-F06: Download files via presigned URL
- FR-F07: Delete files (admin/super_admin only)

#### Dashboard (Week 6)
- FR-D01: Project count by status (pie chart)
- FR-D02: Task statistics (total, completed, overdue)
- FR-D03: Team workload (tasks per user)
- FR-D04: Recent activities feed
- FR-D05: My tasks widget (assigned to current user)
- FR-D06: Role-based dashboard variants

### Non-Functional

- NFR-01: API response time < 200ms for list endpoints (< 100 items)
- NFR-02: File upload supports up to 20MB without timeout
- NFR-03: Kanban drag-drop latency < 100ms
- NFR-04: Dashboard loads within 2 seconds
- NFR-05: All CRUD operations optimistic UI updates

---

## Architecture

### Data Flow

```
                           PHASE 2 DATA FLOW

  Frontend (Next.js)
  +-------------+    +-------------+    +-------------+
  | Project     |    | Task        |    | File        |
  | Components  |    | Components  |    | Components  |
  +------+------+    +------+------+    +------+------+
         |                  |                   |
         v                  v                   v
  +---------------------------------------------------------------------+
  |                     TanStack Query + Zustand                         |
  |                     (Cache, State Management)                        |
  +---------------------------------+-----------------------------------+
                                    | HTTP/REST
                                    v
  Backend (NestJS)
  +---------------------------------------------------------------------+
  | Presentation: Controllers + Guards + Validation Pipes               |
  +---------------------------------+-----------------------------------+
                                    |
  +---------------------------------+-----------------------------------+
  | Application: Use Cases + DTOs + Mappers                             |
  | - CreateProjectUseCase                                              |
  | - CreateTaskUseCase                                                 |
  | - UploadFileUseCase                                                 |
  | - GetDashboardStatsUseCase                                          |
  +---------------------------------+-----------------------------------+
                                    |
  +---------------------------------+-----------------------------------+
  | Domain: Entities + Interfaces + Value Objects                       |
  | - Project, Task, File entities                                      |
  | - IProjectRepository, ITaskRepository, IFileRepository              |
  | - ProjectStatus, TaskStatus value objects                           |
  +---------------------------------+-----------------------------------+
                                    |
  +---------------------------------+-----------------------------------+
  | Infrastructure: Prisma Repos + MinIO Service                        |
  | - PrismaProjectRepository                                           |
  | - PrismaTaskRepository                                              |
  | - MinioFileStorageService                                           |
  +---------------------------------+-----------------------------------+
                                    |
              +---------------------+---------------------+
              v                     v                     v
       +-----------+         +-----------+         +-----------+
       |PostgreSQL |         |   Redis   |         |   MinIO   |
       | (Data)    |         | (Cache)   |         | (Files)   |
       +-----------+         +-----------+         +-----------+
```

### API Endpoints

#### Project Endpoints
```
GET    /api/projects                    # List projects (paginated, filtered)
POST   /api/projects                    # Create project
GET    /api/projects/:id                # Get project detail
PATCH  /api/projects/:id                # Update project
DELETE /api/projects/:id                # Archive project

GET    /api/projects/:id/team           # Get project team
POST   /api/projects/:id/team           # Add team member
DELETE /api/projects/:id/team/:userId   # Remove team member
PATCH  /api/projects/:id/team/:userId   # Update member role
```

#### Task Endpoints
```
GET    /api/tasks                       # List tasks (with project filter)
POST   /api/tasks                       # Create task
GET    /api/tasks/:id                   # Get task detail
PATCH  /api/tasks/:id                   # Update task
DELETE /api/tasks/:id                   # Delete task

POST   /api/tasks/:id/assign            # Assign users to task
DELETE /api/tasks/:id/assign/:userId    # Unassign user
PATCH  /api/tasks/:id/status            # Update task status
PATCH  /api/tasks/:id/reorder           # Update Kanban order

GET    /api/projects/:id/tasks          # List tasks by project
GET    /api/projects/:id/tasks/kanban   # Get Kanban board data
```

#### File Endpoints
```
GET    /api/files                       # List files (with filters)
POST   /api/files/upload                # Upload file (multipart)
GET    /api/files/:id                   # Get file metadata
GET    /api/files/:id/download          # Get presigned download URL
DELETE /api/files/:id                   # Delete file

GET    /api/projects/:id/files          # List project files
GET    /api/tasks/:id/files             # List task files
```

#### Dashboard Endpoints
```
GET    /api/dashboard/stats             # Get dashboard statistics
GET    /api/dashboard/activities        # Get recent activities
GET    /api/dashboard/my-tasks          # Get current user's tasks
```

---

## Implementation Steps

### Week 4: Project Management

#### Day 22-23: Project Domain & Repository

- [ ] **Task P4.1:** Create Project Domain Layer
  - **Subtasks:**
    - Create `domain/entities/project.entity.ts` with validation
    - Create `domain/entities/project-team.entity.ts`
    - Create `domain/value-objects/project-status.vo.ts`
    - Create `domain/value-objects/project-stage.vo.ts`
    - Create `domain/interfaces/repositories/project.repository.interface.ts`
  - **Acceptance Criteria:**
    - Project entity has all fields from Prisma schema
    - Status and Stage enums match Prisma schema
    - Repository interface defines CRUD + team operations
  - **Effort:** 3 hours
  - **Dependencies:** Prisma schema (Phase 1)

- [ ] **Task P4.2:** Implement Project Repository
  - **Subtasks:**
    - Create `infrastructure/persistence/repositories/prisma-project.repository.ts`
    - Implement `findAll` with pagination, filtering, sorting
    - Implement `findById` with relations (team, client)
    - Implement `create`, `update`, `archive`
    - Implement team management methods
  - **Acceptance Criteria:**
    - All repository methods work with Prisma
    - Filtering supports status, stage, clientId, archived
    - Pagination returns total count
  - **Effort:** 4 hours
  - **Dependencies:** P4.1

#### Day 24: Project Use Cases

- [ ] **Task P4.3:** Create Project Application Layer
  - **Subtasks:**
    - Create `application/dto/project/create-project.dto.ts`
    - Create `application/dto/project/update-project.dto.ts`
    - Create `application/dto/project/project-response.dto.ts`
    - Create `application/dto/project/project-list-query.dto.ts`
    - Create `application/mappers/project.mapper.ts`
  - **Acceptance Criteria:**
    - DTOs have class-validator decorators
    - Mapper converts entity <> DTO correctly
  - **Effort:** 2 hours
  - **Dependencies:** P4.1

- [ ] **Task P4.4:** Implement Project Use Cases
  - **Subtasks:**
    - Create `application/use-cases/project/create-project.use-case.ts`
    - Create `application/use-cases/project/update-project.use-case.ts`
    - Create `application/use-cases/project/get-project.use-case.ts`
    - Create `application/use-cases/project/list-projects.use-case.ts`
    - Create `application/use-cases/project/archive-project.use-case.ts`
  - **Acceptance Criteria:**
    - CreateProject generates unique code if not provided
    - UpdateProject validates user has permission
    - ListProjects returns paginated results
  - **Effort:** 4 hours
  - **Dependencies:** P4.2, P4.3

#### Day 25: Project Controller & Team Management

- [ ] **Task P4.5:** Create Project Controller
  - **Subtasks:**
    - Create `presentation/controllers/project.controller.ts`
    - Implement all project endpoints
    - Add Swagger decorators
    - Add role-based guards
  - **Acceptance Criteria:**
    - All endpoints return correct HTTP status
    - Validation errors return 400
    - Unauthorized returns 401, Forbidden returns 403
  - **Effort:** 3 hours
  - **Dependencies:** P4.4

- [ ] **Task P4.6:** Implement Team Management Use Cases
  - **Subtasks:**
    - Create `application/use-cases/project/add-team-member.use-case.ts`
    - Create `application/use-cases/project/remove-team-member.use-case.ts`
    - Create `application/use-cases/project/get-project-team.use-case.ts`
    - Update project controller with team endpoints
  - **Acceptance Criteria:**
    - Add member checks user exists
    - Remove member prevents removing last PM
    - Team list includes user details
  - **Effort:** 3 hours
  - **Dependencies:** P4.5

#### Day 26-27: Project Frontend Pages

- [ ] **Task P4.7:** Create Project List Page
  - **Subtasks:**
    - Create `app/dashboard/projects/page.tsx`
    - Create `components/project/project-list-filters.tsx`
    - Create `hooks/use-projects.ts` with TanStack Query
    - Create `lib/api/projects.ts` API client
    - Integrate DataTable component
  - **Acceptance Criteria:**
    - Page displays projects in DataTable
    - Filters for status, stage work
    - Pagination works
    - Click row navigates to detail
  - **Effort:** 5 hours
  - **Dependencies:** P4.5, DataTable (Phase 1)

- [ ] **Task P4.8:** Create Project Detail Page
  - **Subtasks:**
    - Create `app/dashboard/projects/[id]/page.tsx`
    - Create `components/project/project-overview.tsx`
    - Create `components/project/project-team-list.tsx`
    - Create `components/project/project-timeline.tsx`
  - **Acceptance Criteria:**
    - Page shows project details
    - Team members displayed with roles
    - Status badge shows correct color
    - Edit button for PM/Admin
  - **Effort:** 4 hours
  - **Dependencies:** P4.7

- [ ] **Task P4.9:** Create Project Form (Create/Edit)
  - **Subtasks:**
    - Create `components/project/project-form.tsx`
    - Create `app/dashboard/projects/new/page.tsx`
    - Add edit mode to project detail
    - Implement form validation with Zod
    - Add client selector dropdown
  - **Acceptance Criteria:**
    - Form creates new project
    - Form updates existing project
    - Validation shows error messages
    - Success redirects to project detail
  - **Effort:** 4 hours
  - **Dependencies:** P4.8

#### Day 28: Team Assignment UI

- [ ] **Task P4.10:** Create Team Management UI
  - **Subtasks:**
    - Create `components/project/team-member-dialog.tsx`
    - Create `components/project/team-member-card.tsx`
    - Implement add member modal with user search
    - Implement remove member confirmation
    - Implement role change dropdown
  - **Acceptance Criteria:**
    - Can search and select users to add
    - Can remove members with confirmation
    - Can change member role
    - Updates reflect immediately (optimistic)
  - **Effort:** 4 hours
  - **Dependencies:** P4.6, P4.8

---

### Week 5: Task Management

#### Day 29-30: Task Domain & Repository

- [ ] **Task T5.1:** Create Task Domain Layer
  - **Subtasks:**
    - Create `domain/entities/task.entity.ts`
    - Create `domain/entities/task-assignee.entity.ts`
    - Create `domain/value-objects/task-status.vo.ts`
    - Create `domain/value-objects/task-priority.vo.ts`
    - Create `domain/interfaces/repositories/task.repository.interface.ts`
  - **Acceptance Criteria:**
    - Task entity supports 3-level hierarchy
    - Status workflow validation in entity
    - Priority levels match Prisma enum
  - **Effort:** 3 hours
  - **Dependencies:** Prisma schema (Phase 1)

- [ ] **Task T5.2:** Implement Task Repository
  - **Subtasks:**
    - Create `infrastructure/persistence/repositories/prisma-task.repository.ts`
    - Implement `findAll` with filters (project, status, priority, assignee)
    - Implement `findById` with subtasks and assignees
    - Implement `findByProjectForKanban` (grouped by status)
    - Implement `updateOrder` for Kanban drag
    - Implement `create`, `update`, `delete`
  - **Acceptance Criteria:**
    - Filtering supports all required fields
    - Kanban query returns tasks grouped by status
    - Order update handles batch reordering
  - **Effort:** 4 hours
  - **Dependencies:** T5.1

#### Day 31: Task Use Cases

- [ ] **Task T5.3:** Create Task Application Layer
  - **Subtasks:**
    - Create `application/dto/task/create-task.dto.ts`
    - Create `application/dto/task/update-task.dto.ts`
    - Create `application/dto/task/task-response.dto.ts`
    - Create `application/dto/task/task-list-query.dto.ts`
    - Create `application/dto/task/update-task-status.dto.ts`
    - Create `application/mappers/task.mapper.ts`
  - **Acceptance Criteria:**
    - DTOs validate required fields
    - Status update DTO enforces workflow
    - Mapper handles nested subtasks
  - **Effort:** 2 hours
  - **Dependencies:** T5.1

- [ ] **Task T5.4:** Implement Task Use Cases
  - **Subtasks:**
    - Create `application/use-cases/task/create-task.use-case.ts`
    - Create `application/use-cases/task/update-task.use-case.ts`
    - Create `application/use-cases/task/delete-task.use-case.ts`
    - Create `application/use-cases/task/list-tasks.use-case.ts`
    - Create `application/use-cases/task/update-task-status.use-case.ts`
    - Create `application/use-cases/task/assign-task.use-case.ts`
    - Create `application/use-cases/task/reorder-tasks.use-case.ts`
  - **Acceptance Criteria:**
    - CreateTask validates parent depth (max 3 levels)
    - UpdateStatus validates workflow transitions
    - AssignTask supports multiple assignees
    - ReorderTasks updates orderIndex batch
  - **Effort:** 5 hours
  - **Dependencies:** T5.2, T5.3

#### Day 32: Task Controller

- [ ] **Task T5.5:** Create Task Controller
  - **Subtasks:**
    - Create `presentation/controllers/task.controller.ts`
    - Implement all task endpoints
    - Add Swagger decorators
    - Add project access guard
  - **Acceptance Criteria:**
    - All endpoints work correctly
    - Only project members can access tasks
    - Kanban endpoint returns grouped data
  - **Effort:** 3 hours
  - **Dependencies:** T5.4

#### Day 33-34: Task List & Detail Pages

- [ ] **Task T5.6:** Create Task List Page
  - **Subtasks:**
    - Create `app/dashboard/projects/[id]/tasks/page.tsx`
    - Create `components/task/task-list-filters.tsx`
    - Create `components/task/task-row.tsx`
    - Create `hooks/use-tasks.ts` with TanStack Query
    - Create `lib/api/tasks.ts` API client
  - **Acceptance Criteria:**
    - Tasks displayed in table format
    - Filters for status, priority, assignee work
    - Subtasks expandable in rows
    - Click navigates to task detail
  - **Effort:** 4 hours
  - **Dependencies:** T5.5

- [ ] **Task T5.7:** Create Kanban Board View
  - **Subtasks:**
    - Create `app/dashboard/projects/[id]/tasks/kanban/page.tsx`
    - Create `components/task/kanban-board.tsx`
    - Create `components/task/kanban-column.tsx`
    - Create `components/task/task-card.tsx`
    - Integrate @dnd-kit for drag-and-drop
    - Implement optimistic status updates
  - **Acceptance Criteria:**
    - 4 columns: TODO, IN_PROGRESS, REVIEW, DONE
    - Drag task between columns updates status
    - Drag within column reorders
    - Blocked/Cancelled tasks shown differently
  - **Effort:** 6 hours
  - **Dependencies:** T5.6

- [ ] **Task T5.8:** Create Task Detail View
  - **Subtasks:**
    - Create `app/dashboard/projects/[id]/tasks/[taskId]/page.tsx`
    - Create `components/task/task-detail.tsx`
    - Create `components/task/subtask-list.tsx`
    - Create `components/task/assignee-list.tsx`
    - Add status change dropdown
    - Add priority change dropdown
  - **Acceptance Criteria:**
    - Shows all task information
    - Subtasks displayed as nested list
    - Can add/remove assignees inline
    - Can change status/priority
  - **Effort:** 4 hours
  - **Dependencies:** T5.6

#### Day 35: Task Form & Assignment

- [ ] **Task T5.9:** Create Task Form
  - **Subtasks:**
    - Create `components/task/task-form.tsx`
    - Create task create modal (inline in Kanban)
    - Add date picker for deadline
    - Add user multi-select for assignees
    - Implement form validation
  - **Acceptance Criteria:**
    - Form creates task with all fields
    - Can select parent task (for subtask)
    - Deadline picker shows calendar
    - Can select multiple assignees
  - **Effort:** 4 hours
  - **Dependencies:** T5.8

- [ ] **Task T5.10:** Implement My Tasks View
  - **Subtasks:**
    - Create `app/dashboard/tasks/page.tsx`
    - Show tasks assigned to current user
    - Group by project
    - Filter by status
  - **Acceptance Criteria:**
    - Shows only user's assigned tasks
    - Grouped by project
    - Can filter by status
    - Quick status update buttons
  - **Effort:** 3 hours
  - **Dependencies:** T5.6

---

### Week 6: File Management & Dashboard

#### Day 36-37: File Domain & MinIO Service

- [ ] **Task F6.1:** Create File Domain Layer
  - **Subtasks:**
    - Create `domain/entities/file.entity.ts`
    - Create `domain/value-objects/file-category.vo.ts`
    - Create `domain/interfaces/repositories/file.repository.interface.ts`
    - Create `domain/interfaces/services/file-storage.service.interface.ts`
  - **Acceptance Criteria:**
    - File entity matches Prisma schema
    - Category enum has all types
    - Storage interface defines upload/download/delete
  - **Effort:** 2 hours
  - **Dependencies:** Prisma schema

- [ ] **Task F6.2:** Implement MinIO File Storage Service
  - **Subtasks:**
    - Create `infrastructure/external-services/minio/minio-file-storage.service.ts`
    - Implement `upload` with path structure
    - Implement `getPresignedUrl` for download
    - Implement `delete`
    - Implement `generateThumbnail` for images
    - Add bucket creation on startup
  - **Acceptance Criteria:**
    - Files uploaded to correct path (projects/{code}/category/)
    - Presigned URLs expire in 1 hour
    - Thumbnails generated for images
    - Bucket created if not exists
  - **Effort:** 4 hours
  - **Dependencies:** F6.1, MinIO (Phase 1)

- [ ] **Task F6.3:** Implement File Repository
  - **Subtasks:**
    - Create `infrastructure/persistence/repositories/prisma-file.repository.ts`
    - Implement `findAll` with filters
    - Implement `findById`
    - Implement `findByProject`
    - Implement `findByTask`
    - Implement `create`, `delete`
    - Implement version linking
  - **Acceptance Criteria:**
    - Filtering by project, task, category works
    - Version chain retrieved correctly
    - Delete removes from DB (MinIO handled separately)
  - **Effort:** 3 hours
  - **Dependencies:** F6.1

#### Day 38: File Use Cases & Controller

- [ ] **Task F6.4:** Implement File Use Cases
  - **Subtasks:**
    - Create `application/use-cases/file/upload-file.use-case.ts`
    - Create `application/use-cases/file/get-file.use-case.ts`
    - Create `application/use-cases/file/list-files.use-case.ts`
    - Create `application/use-cases/file/delete-file.use-case.ts`
    - Create `application/use-cases/file/get-download-url.use-case.ts`
    - Create file DTOs and mapper
  - **Acceptance Criteria:**
    - Upload validates file size (max 20MB)
    - Upload validates allowed mime types
    - Delete checks user permission (admin only)
    - Download URL generated with expiry
  - **Effort:** 4 hours
  - **Dependencies:** F6.2, F6.3

- [ ] **Task F6.5:** Create File Controller
  - **Subtasks:**
    - Create `presentation/controllers/file.controller.ts`
    - Implement multipart upload endpoint
    - Implement download URL endpoint
    - Implement list and delete endpoints
    - Add file size validation pipe
  - **Acceptance Criteria:**
    - Upload accepts multipart/form-data
    - Large files handled without memory issues
    - Delete restricted to admin roles
  - **Effort:** 3 hours
  - **Dependencies:** F6.4

#### Day 39: File Frontend Components

- [ ] **Task F6.6:** Create File Upload Component
  - **Subtasks:**
    - Create `components/common/file-uploader.tsx`
    - Implement drag-and-drop zone
    - Implement progress indicator
    - Implement file type validation
    - Create `hooks/use-file-upload.ts`
  - **Acceptance Criteria:**
    - Drag-drop works
    - Progress shown during upload
    - Invalid files rejected with message
    - Multiple file upload supported
  - **Effort:** 4 hours
  - **Dependencies:** F6.5

- [ ] **Task F6.7:** Create File Browser Component
  - **Subtasks:**
    - Create `app/dashboard/projects/[id]/files/page.tsx`
    - Create `components/file/file-list.tsx`
    - Create `components/file/file-card.tsx`
    - Create `components/file/file-preview-modal.tsx`
    - Implement grid and list views
    - Implement category filter
  - **Acceptance Criteria:**
    - Files displayed with thumbnails
    - Category filter works
    - Click opens preview modal
    - Download button works
  - **Effort:** 5 hours
  - **Dependencies:** F6.6

- [ ] **Task F6.8:** Create File Preview Modal
  - **Subtasks:**
    - Implement image preview (full size)
    - Implement PDF preview (iframe or pdf.js)
    - Show file metadata
    - Show version history
    - Download button
  - **Acceptance Criteria:**
    - Images display correctly
    - PDFs render in modal
    - Other files show download prompt
    - Version history clickable
  - **Effort:** 3 hours
  - **Dependencies:** F6.7

#### Day 40-41: Dashboard Analytics

- [ ] **Task D6.9:** Create Dashboard Service
  - **Subtasks:**
    - Create `application/services/dashboard.service.ts`
    - Implement `getProjectStats` (count by status)
    - Implement `getTaskStats` (total, completed, overdue)
    - Implement `getTeamWorkload` (tasks per user)
    - Implement `getRecentActivities` (from audit log)
    - Cache results in Redis (5 min TTL)
  - **Acceptance Criteria:**
    - Stats calculated from database
    - Results cached to prevent repeated queries
    - Activities show last 20 items
  - **Effort:** 4 hours
  - **Dependencies:** AuditLog (Phase 1)

- [ ] **Task D6.10:** Create Dashboard Controller
  - **Subtasks:**
    - Create `presentation/controllers/dashboard.controller.ts`
    - Implement stats endpoint
    - Implement activities endpoint
    - Implement my-tasks endpoint
    - Add role-based data filtering
  - **Acceptance Criteria:**
    - Stats endpoint returns all metrics
    - Activities filtered by user projects
    - My-tasks returns current user's tasks
  - **Effort:** 2 hours
  - **Dependencies:** D6.9

- [ ] **Task D6.11:** Create Dashboard Page
  - **Subtasks:**
    - Update `app/dashboard/page.tsx`
    - Create `components/dashboard/stats-cards.tsx`
    - Create `components/dashboard/project-status-chart.tsx`
    - Create `components/dashboard/task-stats-chart.tsx`
    - Create `components/dashboard/team-workload-chart.tsx`
    - Create `components/dashboard/recent-activities.tsx`
    - Create `components/dashboard/my-tasks-widget.tsx`
    - Create `hooks/use-dashboard.ts`
  - **Acceptance Criteria:**
    - Stats cards show counts
    - Charts render with data
    - Activities show timeline
    - My tasks shows assigned tasks
  - **Effort:** 6 hours
  - **Dependencies:** D6.10

- [ ] **Task D6.12:** Add Charts Library
  - **Subtasks:**
    - Install recharts or chart.js
    - Create project status pie chart
    - Create task completion bar chart
    - Create workload horizontal bar chart
    - Responsive chart sizing
  - **Acceptance Criteria:**
    - Charts render on all screen sizes
    - Colors match status (green/yellow/red)
    - Hover shows values
  - **Effort:** 3 hours
  - **Dependencies:** D6.11

#### Day 42: Integration & Polish

- [ ] **Task I6.13:** Integration Testing
  - **Subtasks:**
    - Test project CRUD flow end-to-end
    - Test task workflow (create > assign > complete)
    - Test file upload and preview
    - Test dashboard data accuracy
    - Fix any integration bugs
  - **Acceptance Criteria:**
    - All flows work without errors
    - Data consistent across views
    - No console errors
  - **Effort:** 4 hours
  - **Dependencies:** All previous tasks

- [ ] **Task I6.14:** Performance Optimization
  - **Subtasks:**
    - Add database indexes if missing
    - Optimize heavy queries
    - Add loading skeletons
    - Implement optimistic updates
    - Verify API response times
  - **Acceptance Criteria:**
    - List endpoints < 200ms
    - No visible lag on interactions
    - Loading states shown
  - **Effort:** 3 hours
  - **Dependencies:** I6.13

---

## Todo Checklist

### Week 4 - Project Management
- [x] Project domain entities and repository
- [x] Project CRUD use cases
- [x] Project controller with all endpoints
- [x] Team management backend
- [x] Project list page with filters
- [x] Project detail page
- [x] Project create/edit form
- [x] Team management UI

### Week 5 - Task Management
- [x] Task domain entities and repository
- [x] Task CRUD and workflow use cases
- [x] Task controller with all endpoints
- [x] Task list page with filters
- [x] Kanban board with drag-drop
- [x] Task detail view
- [x] Task create/edit form
- [x] My tasks view

### Week 6 - Files & Dashboard
- [x] File domain and MinIO service
- [x] File repository
- [x] File upload/download use cases
- [x] File controller
- [x] File upload component
- [x] File browser page
- [x] File preview modal
- [x] Dashboard service with caching
- [x] Dashboard controller
- [x] Dashboard page with charts
- [x] Integration testing
- [x] Performance optimization

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Project CRUD | API tests | 100% pass |
| Task workflow | State transitions | All valid transitions work |
| Kanban drag-drop | User test | < 100ms latency |
| File upload | 20MB file | Completes without timeout |
| Dashboard load | Lighthouse | < 2 seconds |
| API response time | p95 latency | < 200ms for lists |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Kanban performance with many tasks | Medium | High | Virtualize list, paginate columns |
| MinIO connection issues | Low | High | Retry logic, fallback to local temp |
| File upload timeout for large files | Medium | Medium | Chunked upload, progress tracking |
| Dashboard queries slow | Medium | Medium | Redis caching, optimize queries |
| Drag-drop library conflicts | Low | Medium | Test thoroughly, have fallback |

---

## Security Considerations

- **Project Access:** Users can only access projects they are team members of
- **Task Access:** Inherited from project membership
- **File Access:** Presigned URLs expire in 1 hour, project membership required
- **File Upload:** Validate MIME types, scan for malicious content
- **File Delete:** Restricted to ADMIN and SUPER_ADMIN roles
- **Dashboard:** Filter data by user's accessible projects
- **Input Validation:** All DTOs validated with class-validator
- **SQL Injection:** Prevented by Prisma parameterized queries

---

## Definition of Done

- [x] All tasks have acceptance criteria met
- [x] Code reviewed (self-review checklist)
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Unit tests for use cases (>70% coverage)
- [x] API endpoints documented in Swagger
- [x] Works on development environment
- [x] Manual testing completed for all flows

---

## Dependencies

- **External:** MinIO S3 API (already running from Phase 1)
- **Internal:** Phase 1 auth guards, DataTable component, Prisma schema
- **Libraries to add:**
  - `@dnd-kit/core` - Kanban drag-drop
  - `recharts` - Dashboard charts
  - `sharp` - Image thumbnail generation
  - `@minio/minio-js` - MinIO client
  - `react-dropzone` - File upload

---

## Notes

- Start with backend (domain > repository > use case > controller) before frontend
- Test API endpoints with Postman before building UI
- Kanban can initially work without drag-drop, add later
- Dashboard charts can start with simple tables, upgrade later
- File preview can start with images only, add PDF later
- Focus on happy path first, edge cases in integration testing
