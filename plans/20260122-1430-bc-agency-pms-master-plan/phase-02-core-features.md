# Phase 2: Core Features (Week 4-6)

**Duration:** 3 weeks | **Status:** [ ] Not Started | **Depends on:** Phase 1

---

## Context

With authentication and infrastructure complete, this phase builds the core business functionality: Projects, Tasks, and Files. These modules form the backbone of BC Agency's daily operations. Dashboard provides visibility into project health.

---

## Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 4 | Project Module | Project CRUD, Team assignment |
| Week 5 | Task Module | 3-level hierarchy, Kanban board |
| Week 6 | File Module + Dashboard | MinIO upload, Role-based dashboard |

---

## Requirements

### Functional
- Create, update, archive projects with 9 stages
- Assign team members with specific roles per project
- Tasks support 3-level hierarchy (Task > Subtask > Checklist item)
- Multiple assignees per task
- Kanban board with drag-and-drop
- File upload with versioning and thumbnails
- Dashboard shows different widgets based on user role

### Non-Functional
- Project list loads < 2s with 50 projects
- Kanban drag-and-drop < 200ms response
- File upload supports up to 20MB
- Dashboard renders < 3s

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (NestJS)                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ ProjectModule│  TaskModule  │  FileModule  │DashboardModule │
├──────────────┼──────────────┼──────────────┼────────────────┤
│   Prisma     │   Prisma     │  MinIO + DB  │  Aggregations  │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Implementation Steps

### Week 4: Project Module

#### Day 22-23: Project Domain & Application Layer
- [ ] **Task 4.1:** Create Project entity (Domain)
  - Properties: id, code, name, description, status, stage, dates
  - Value objects: ProjectStatus, ProjectStage
  - Business rules: stage transitions validation
  - **Subtasks:**
    - Create `project.entity.ts`
    - Create `project-status.vo.ts`, `project-stage.vo.ts`
    - Define stage transition rules
  - **Acceptance Criteria:** Entity validates business rules
  - **Dependencies:** Prisma schema from Phase 1
  - **Effort:** 3 hours

- [ ] **Task 4.2:** Create Project repository interface
  - `IProjectRepository` in domain/interfaces
  - Methods: findById, findAll, save, update, delete
  - Filter options: status, stage, client, dateRange
  - **Acceptance Criteria:** Interface covers all query needs
  - **Effort:** 1 hour

- [ ] **Task 4.3:** Create Project use cases
  - `CreateProjectUseCase` - validates, creates, assigns creator
  - `UpdateProjectUseCase` - validates stage transitions
  - `GetProjectUseCase` - with team and stats
  - `ListProjectsUseCase` - with filters and pagination
  - `ArchiveProjectUseCase` - soft delete with archivedAt
  - **Subtasks:**
    - Implement each use case
    - Create DTOs (CreateProjectDto, UpdateProjectDto, ProjectResponseDto)
    - Create ProjectMapper
  - **Acceptance Criteria:** All use cases handle edge cases
  - **Effort:** 4 hours

#### Day 24: Project Infrastructure Layer
- [ ] **Task 4.4:** Implement PrismaProjectRepository
  - Implement `IProjectRepository`
  - Include relations (team, budget, kpis)
  - Implement filters and pagination
  - **Acceptance Criteria:** All repository methods work
  - **Effort:** 3 hours

- [ ] **Task 4.5:** Create ProjectController
  - `POST /api/projects` - create
  - `GET /api/projects` - list with filters
  - `GET /api/projects/:id` - get with details
  - `PATCH /api/projects/:id` - update
  - `DELETE /api/projects/:id` - archive
  - Apply JwtAuthGuard, RolesGuard
  - **Acceptance Criteria:** All endpoints respond correctly
  - **Effort:** 2 hours

- [ ] **Task 4.6:** Create ProjectModule
  - Wire up all layers with NestJS DI
  - Register repository provider
  - Export for use by other modules
  - **Acceptance Criteria:** Module compiles without errors
  - **Effort:** 1 hour

#### Day 25-26: Project UI
- [ ] **Task 4.7:** Create Project list page
  - DataTable with columns: Code, Name, Status, Stage, Client, Deadline
  - Filters: status, stage, search
  - Sort by name, deadline, created
  - **Subtasks:**
    - Create `useProjects` hook with React Query
    - Create filter state with Zustand
    - Implement table columns
  - **Acceptance Criteria:** List shows all user's projects
  - **Effort:** 4 hours

- [ ] **Task 4.8:** Create Project detail page
  - Header: name, status badge, stage progress
  - Tabs: Overview, Tasks, Files, Team, Settings
  - Overview: timeline, budget summary, KPIs
  - **Acceptance Criteria:** All project info displayed
  - **Effort:** 4 hours

- [ ] **Task 4.9:** Create Project form (create/edit)
  - Basic info: code, name, description
  - Dates: start, end
  - Client selection (dropdown)
  - Links: drive, plan, tracking
  - **Subtasks:**
    - Create form with react-hook-form
    - Zod schema validation
    - Handle create vs edit mode
  - **Acceptance Criteria:** Form validates and submits correctly
  - **Effort:** 3 hours

#### Day 27-28: Team Assignment
- [ ] **Task 4.10:** Create team management endpoints
  - `GET /api/projects/:id/team` - list members
  - `POST /api/projects/:id/team` - add member
  - `PATCH /api/projects/:id/team/:userId` - update role
  - `DELETE /api/projects/:id/team/:userId` - remove member
  - **Acceptance Criteria:** Team CRUD works
  - **Effort:** 3 hours

- [ ] **Task 4.11:** Create Team management UI
  - Team tab in project detail
  - List current members with roles
  - Add member modal (user search + role select)
  - Remove member with confirmation
  - **Subtasks:**
    - User search autocomplete
    - Role dropdown (only roles allowed for projects)
    - isPrimary toggle
  - **Acceptance Criteria:** Team can be managed from UI
  - **Effort:** 4 hours

---

### Week 5: Task Module

#### Day 29-30: Task Domain & Application Layer
- [ ] **Task 5.1:** Create Task entity (Domain)
  - Properties: id, projectId, parentId, title, status, priority, dates
  - 3-level hierarchy: Task > Subtask > Checklist
  - Multi-assignee support
  - **Subtasks:**
    - Create `task.entity.ts`
    - Create `task-status.vo.ts`, `task-priority.vo.ts`
    - Implement hierarchy validation (max 3 levels)
  - **Acceptance Criteria:** Entity supports hierarchy
  - **Effort:** 3 hours

- [ ] **Task 5.2:** Create Task use cases
  - `CreateTaskUseCase` - with parent validation
  - `UpdateTaskUseCase` - status transitions
  - `AssignTaskUseCase` - multi-assignee
  - `ReorderTasksUseCase` - for Kanban drag-drop
  - `GetTaskWithSubtasksUseCase` - recursive fetch
  - **Subtasks:**
    - Implement each use case
    - Create DTOs
    - Create TaskMapper
  - **Acceptance Criteria:** All task operations work
  - **Effort:** 4 hours

- [ ] **Task 5.3:** Create Task endpoints
  - `POST /api/tasks` - create (with projectId, optional parentId)
  - `GET /api/tasks` - list with filters (project, status, assignee)
  - `GET /api/tasks/:id` - with subtasks
  - `PATCH /api/tasks/:id` - update
  - `PATCH /api/tasks/:id/status` - quick status update
  - `POST /api/tasks/:id/assign` - assign users
  - `PATCH /api/tasks/reorder` - batch reorder
  - `DELETE /api/tasks/:id` - delete (cascade subtasks)
  - **Acceptance Criteria:** All endpoints work
  - **Effort:** 4 hours

#### Day 31-33: Task UI - List & Kanban
- [ ] **Task 5.4:** Create Task list view
  - Table: Title, Status, Priority, Assignees, Deadline
  - Expand row to show subtasks
  - Inline status change
  - **Subtasks:**
    - Create `useTasks` hook
    - Expandable rows in DataTable
    - Status dropdown in row
  - **Acceptance Criteria:** List shows tasks with hierarchy
  - **Effort:** 4 hours

- [ ] **Task 5.5:** Create Kanban board
  - Columns: TODO, IN_PROGRESS, REVIEW, DONE
  - Drag-and-drop cards between columns
  - Task cards show: title, priority badge, assignee avatars, deadline
  - **Subtasks:**
    - Use `@dnd-kit/core` for drag-drop
    - Create KanbanColumn component
    - Create TaskCard component
    - Optimistic updates on drag
  - **Acceptance Criteria:** Drag-drop updates task status
  - **Effort:** 6 hours

- [ ] **Task 5.6:** Create Task detail modal/page
  - Title, description (markdown)
  - Status, priority selectors
  - Assignees list with add/remove
  - Subtasks list with add inline
  - Deadline picker
  - **Subtasks:**
    - Create task detail drawer/modal
    - Inline edit for title, description
    - Assignee picker with user search
  - **Acceptance Criteria:** Full task editing works
  - **Effort:** 4 hours

#### Day 34-35: Task Form & Assignment
- [ ] **Task 5.7:** Create Task form
  - Title, description
  - Project selector (if creating from global view)
  - Parent task selector (for subtasks)
  - Priority, deadline
  - Initial assignees
  - **Acceptance Criteria:** Tasks can be created at any level
  - **Effort:** 3 hours

- [ ] **Task 5.8:** Create multi-assignee UI
  - Assignee picker component
  - Show assigned users as avatars
  - Add/remove assignees
  - Notification on assignment change
  - **Acceptance Criteria:** Multiple users can be assigned
  - **Effort:** 2 hours

---

### Week 6: File Module & Dashboard

#### Day 36-38: File Module
- [ ] **Task 6.1:** Create File entity and MinIO service
  - File entity: name, path, size, mimeType, version, category
  - MinioFileStorageService: upload, download, delete, presignedUrl
  - **Subtasks:**
    - Implement MinIO client wrapper
    - Create bucket initialization
    - Implement presigned URL generation
  - **Acceptance Criteria:** Files upload to MinIO
  - **Effort:** 4 hours

- [ ] **Task 6.2:** Create file versioning logic
  - New version creates new file record with previousId
  - Get version history for a file
  - Download specific version
  - **Acceptance Criteria:** Version history maintained
  - **Effort:** 3 hours

- [ ] **Task 6.3:** Create thumbnail generation
  - Generate thumbnails for images (200x200)
  - Use Sharp library
  - Store in `thumbnails/` prefix
  - **Acceptance Criteria:** Image uploads have thumbnails
  - **Effort:** 2 hours

- [ ] **Task 6.4:** Create File endpoints
  - `POST /api/files/upload` - multipart upload
  - `GET /api/files` - list files (project, task, category)
  - `GET /api/files/:id/download` - get presigned URL
  - `DELETE /api/files/:id` - soft delete
  - `GET /api/files/:id/versions` - version history
  - **Acceptance Criteria:** All file operations work
  - **Effort:** 3 hours

- [ ] **Task 6.5:** Create File browser UI
  - Grid/List view toggle
  - Category filter (Brief, Plan, Report, Creative, etc.)
  - Upload dropzone with progress
  - File preview (images inline, others as icons)
  - Download, delete actions
  - Version history modal
  - **Subtasks:**
    - Create FileUploader component with drag-drop
    - Create FileThumbnail component
    - Create FileVersionHistory component
  - **Acceptance Criteria:** Files can be browsed and managed
  - **Effort:** 5 hours

#### Day 39-42: Dashboard
- [ ] **Task 6.6:** Create Dashboard aggregation service
  - Project counts by status
  - Tasks due this week
  - Tasks overdue
  - Recent activities
  - **Acceptance Criteria:** Aggregations are accurate
  - **Effort:** 3 hours

- [ ] **Task 6.7:** Create Dashboard endpoint
  - `GET /api/dashboard` - role-aware response
  - Different data for PM vs Designer vs Admin
  - **Acceptance Criteria:** Returns role-appropriate data
  - **Effort:** 2 hours

- [ ] **Task 6.8:** Create StatsCard component
  - Icon, label, value, trend indicator
  - Color variants (default, warning, critical)
  - **Acceptance Criteria:** Stats display clearly
  - **Effort:** 1 hour

- [ ] **Task 6.9:** Create Dashboard widgets
  - **ProjectsWidget:** List of active projects with status
  - **TasksWidget:** My tasks due soon
  - **ActivityWidget:** Recent activity feed
  - **BudgetWidget:** (PM/Admin only) Budget summary
  - **Subtasks:**
    - Create each widget component
    - Implement role-based visibility
    - Add loading skeletons
  - **Acceptance Criteria:** Dashboard shows relevant info per role
  - **Effort:** 5 hours

- [ ] **Task 6.10:** Create Dashboard page
  - Grid layout for widgets
  - Responsive (1 col mobile, 2-3 col desktop)
  - Refresh data every 5 minutes
  - **Acceptance Criteria:** Dashboard is useful and fast
  - **Effort:** 2 hours

---

## Todo Checklist

### Week 4
- [ ] Project CRUD endpoints working
- [ ] Project list page with filters
- [ ] Project detail page with tabs
- [ ] Project create/edit form
- [ ] Team assignment feature complete

### Week 5
- [ ] Task CRUD with hierarchy support
- [ ] Task list view with expandable subtasks
- [ ] Kanban board with drag-and-drop
- [ ] Task detail modal/page
- [ ] Multi-assignee feature working

### Week 6
- [ ] File upload to MinIO working
- [ ] File versioning implemented
- [ ] Thumbnail generation for images
- [ ] File browser UI complete
- [ ] Role-based dashboard functional

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Project list load time | With 50 projects | < 2s |
| Kanban drag response | Status update | < 200ms |
| File upload | 20MB file | < 30s |
| Dashboard load | All widgets | < 3s |
| Task hierarchy | 3 levels deep | Works correctly |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Kanban performance with many tasks | Medium | High | Virtualize task cards, limit visible |
| MinIO connection issues | Low | High | Health checks, retry logic |
| Complex task hierarchy queries | Medium | Medium | Optimize Prisma includes, add indexes |
| Dashboard slow with many projects | Medium | Medium | Cache aggregations in Redis |

---

## Security Considerations

- Project access checked via ProjectAccessGuard
- Files only accessible by project team members
- File uploads validated: size limit, mime type whitelist
- Presigned URLs expire after 1 hour
- Soft delete for files (admins can restore)

---

## Definition of Done

- [ ] All tasks have acceptance criteria met
- [ ] API endpoints documented in Swagger
- [ ] Unit tests for use cases (>80% coverage)
- [ ] Integration tests for CRUD operations
- [ ] No N+1 query issues (checked with Prisma logging)
- [ ] UI responsive on mobile
- [ ] Loading states and error handling in UI

---

## Dependencies

- **Phase 1:** Auth system, DataTable component, Layout
- **External:** MinIO (already in Docker Compose)

---

## Notes

- Project stages follow BC Agency workflow (9 stages from INTAKE to CLOSED)
- Task status BLOCKED is important for dependency tracking
- File categories map to BC Agency's folder structure (Brief, Plan, Report, etc.)
- Dashboard widgets should be configurable in v2 (deferred)
- Consider adding task templates in v2 for repetitive workflows
