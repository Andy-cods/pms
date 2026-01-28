# Phase 2: Teams Enhancement

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** None (independent module)
- **Blocked by:** Nothing

## Overview

- **Date:** 2026-01-28
- **Description:** Redesign Teams page with 3 tab views, inline role editing, workload stats, permission matrix, and quick actions (deactivate, reset password).
- **Priority:** MEDIUM
- **Implementation Status:** COMPLETED
- **Review Status:** COMPLETED

## Key Insights

1. Current teams page at `frontend/src/app/dashboard/teams/page.tsx` is read-only grid of user cards using `useAdminUsers` hook. No tab views, no workload data, no inline editing.
2. `useAdminUsers` fetches from admin API. Workload stats require a new backend endpoint that joins `TaskAssignee` data.
3. Project detail page already has inline role editing for project team members (line 847-874). Reuse same `Select` pattern.
4. `RolesGuard` + `@Roles()` decorator already exist. Use `SUPER_ADMIN, ADMIN` for global role edit; `PM` can only edit project-level roles.
5. Sidebar already has "Doi ngu" (Teams) link at `/dashboard/teams` accessible to all roles. No nav change needed.
6. `ProjectTeam` model has `role` field per project. Global role lives on `User.role`. Both are editable.
7. Permission matrix is display-only; shows which roles can access which features.

## Requirements

1. Three tab views: "Tat ca thanh vien" (All Members), "Theo du an" (By Project), "Theo phong ban" (By Department/Role)
2. Inline global role editing via dropdown (ADMIN+ only)
3. Workload stats per member: total tasks, completion %, overdue count
4. Permission matrix table: roles x features (Projects, Tasks, Budget, Reports, Teams, Approvals) with R/W/- markers
5. Quick actions: edit role (inline dropdown), deactivate toggle, reset password button
6. Backend: New endpoint `GET /admin/users/workload` returning users with task stats
7. Backend: `PATCH /admin/users/:id/role` endpoint for global role update
8. Backend: `POST /admin/users/:id/reset-password` for admin-triggered password reset
9. "By Project" tab shows projects with nested member lists
10. "By Department" tab groups members by their global `User.role`

## Architecture

```
backend/
  src/presentation/controllers/admin.controller.ts   # Add workload + role update + reset password endpoints
  src/application/dto/admin-user.dto.ts              # NEW: AdminUserWorkloadResponse DTO

frontend/
  src/app/dashboard/teams/page.tsx                   # Complete rewrite with 3 tabs
  src/components/teams/team-all-members.tsx           # NEW: All members tab content
  src/components/teams/team-by-project.tsx            # NEW: By project tab content
  src/components/teams/team-by-department.tsx         # NEW: By department tab content
  src/components/teams/permission-matrix.tsx          # NEW: Permission matrix display
  src/lib/api/admin-users.ts                         # Add workload + role update + reset password API calls
  src/hooks/use-admin-users.ts                       # Add workload hook + mutations
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `backend/src/presentation/controllers/admin.controller.ts` | MODIFY | Add `GET /admin/users/workload`, `PATCH /admin/users/:id/role`, `POST /admin/users/:id/reset-password` |
| `backend/src/application/dto/admin-user.dto.ts` | CREATE | `AdminUserWorkloadDto` response with task stats |
| `frontend/src/app/dashboard/teams/page.tsx` | REWRITE | 3-tab layout replacing current grid |
| `frontend/src/components/teams/team-all-members.tsx` | CREATE | Member list with inline role editing + quick actions |
| `frontend/src/components/teams/team-by-project.tsx` | CREATE | Project-grouped member view |
| `frontend/src/components/teams/team-by-department.tsx` | CREATE | Role-grouped member view |
| `frontend/src/components/teams/permission-matrix.tsx` | CREATE | Static permission table |
| `frontend/src/lib/api/admin-users.ts` | MODIFY | Add `getWorkload`, `updateRole`, `resetPassword` |
| `frontend/src/hooks/use-admin-users.ts` | MODIFY | Add `useUsersWorkload`, `useUpdateUserRole`, `useResetUserPassword` |

## Implementation Steps

### Step 1: Backend - Create Admin User Workload DTO

Create `backend/src/application/dto/admin-user.dto.ts`:

```typescript
export interface AdminUserWorkloadResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  workload: {
    totalTasks: number;
    doneTasks: number;
    overdueTasks: number;
    completionPercent: number;
    projectCount: number;
  };
}
```

### Step 2: Backend - Add Workload Endpoint

In the admin controller (or create a new one if admin.controller.ts doesn't expose users), add:

```typescript
@Get('users/workload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'PM')
async getUsersWorkload(): Promise<AdminUserWorkloadResponse[]> {
  const users = await this.prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true, email: true, name: true, avatar: true, role: true,
      isActive: true, lastLoginAt: true,
      tasksAssigned: {
        select: {
          task: { select: { status: true, deadline: true } },
        },
      },
      projectTeams: {
        select: { projectId: true },
        distinct: ['projectId'],
      },
    },
  });

  return users.map(u => {
    const tasks = u.tasksAssigned.map(a => a.task);
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const overdue = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE' && t.status !== 'CANCELLED'
    ).length;

    return {
      id: u.id, email: u.email, name: u.name, avatar: u.avatar,
      role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt,
      workload: {
        totalTasks: total,
        doneTasks: done,
        overdueTasks: overdue,
        completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        projectCount: u.projectTeams.length,
      },
    };
  });
}
```

### Step 3: Backend - Add Role Update Endpoint

```typescript
@Patch('users/:id/role')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
async updateUserRole(
  @Param('id') userId: string,
  @Body() body: { role: string },
): Promise<{ success: boolean }> {
  const validRoles = ['SUPER_ADMIN','ADMIN','TECHNICAL','NVKD','PM','PLANNER','ACCOUNT','CONTENT','DESIGN','MEDIA'];
  if (!validRoles.includes(body.role)) throw new BadRequestException('Invalid role');

  // Prevent non-SUPER_ADMIN from setting SUPER_ADMIN role
  // (handled by @Roles at minimum, but add extra check)
  await this.prisma.user.update({
    where: { id: userId },
    data: { role: body.role as any },
  });
  return { success: true };
}
```

### Step 4: Backend - Add Reset Password Endpoint

```typescript
@Post('users/:id/reset-password')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
async resetUserPassword(
  @Param('id') userId: string,
): Promise<{ temporaryPassword: string }> {
  const tempPassword = crypto.randomBytes(8).toString('hex'); // 16-char random
  const hashed = await bcrypt.hash(tempPassword, 10);

  await this.prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { temporaryPassword: tempPassword };
}
```

### Step 5: Frontend - Update API Client

In `frontend/src/lib/api/admin-users.ts`, add:

```typescript
getUsersWorkload: async (): Promise<AdminUserWorkloadResponse[]> => {
  const { data } = await api.get('/admin/users/workload');
  return data;
},

updateUserRole: async (userId: string, role: string): Promise<void> => {
  await api.patch(`/admin/users/${userId}/role`, { role });
},

toggleUserActive: async (userId: string, isActive: boolean): Promise<void> => {
  await api.patch(`/admin/users/${userId}`, { isActive });
},

resetPassword: async (userId: string): Promise<{ temporaryPassword: string }> => {
  const { data } = await api.post(`/admin/users/${userId}/reset-password`);
  return data;
},
```

### Step 6: Frontend - Update Hooks

In `frontend/src/hooks/use-admin-users.ts`, add:

```typescript
export function useUsersWorkload() {
  return useQuery({
    queryKey: ['admin-users-workload'],
    queryFn: () => adminUsersApi.getUsersWorkload(),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminUsersApi.updateUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-users-workload'] });
    },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminUsersApi.toggleUserActive(userId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => adminUsersApi.resetPassword(userId),
  });
}
```

### Step 7: Create Permission Matrix Component

Create `frontend/src/components/teams/permission-matrix.tsx`:

Static table with roles as columns, features as rows. Data structure:

```typescript
const PERMISSIONS: Record<string, Record<string, 'R' | 'W' | '-'>> = {
  'Du an':     { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: 'R', ACCOUNT: 'R', CONTENT: 'R', DESIGN: 'R', MEDIA: 'R', TECHNICAL: 'R' },
  'Tasks':     { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'R', PLANNER: 'W', ACCOUNT: 'W', CONTENT: 'W', DESIGN: 'W', MEDIA: 'W', TECHNICAL: 'W' },
  'Ngan sach': { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: 'R', ACCOUNT: 'R', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-' },
  'Bao cao':   { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'R', NVKD: 'R', PLANNER: '-', ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-' },
  'Teams':     { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'R', NVKD: '-', PLANNER: '-', ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-' },
  'Phe duyet': { SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: '-', ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-' },
};
```

Render as Table with colored cells: W=green badge, R=blue badge, -=gray.

### Step 8: Create Tab Components

**team-all-members.tsx:** List of members with:
- Avatar, name, email, role badge
- Workload bar (completion %) with overdue indicator
- Inline role `Select` dropdown (only visible for ADMIN+)
- Quick action dropdown: Deactivate toggle, Reset password (shows AlertDialog with temp password)

**team-by-project.tsx:** Uses existing projects API. Groups by project, shows nested member list with project role.

**team-by-department.tsx:** Groups `useUsersWorkload` results by `role`. Each role section is collapsible with member count badge.

### Step 9: Rewrite Teams Page

Replace `frontend/src/app/dashboard/teams/page.tsx` with:

```
Header: "Doi ngu" title + stats (total members, active, roles count)
SegmentControl tabs: "Tat ca" | "Theo du an" | "Theo phong ban"
Conditional render of tab components
Below tabs: Permission Matrix (collapsible section)
```

Reuse the `SegmentControl` component from project detail page. Extract it to `frontend/src/components/ui/segment-control.tsx` for reuse (it currently lives inline in project detail page).

### Step 10: Extract SegmentControl to Shared Component

Move the `SegmentControl` from `frontend/src/app/dashboard/projects/[id]/page.tsx` (lines 111-141) to `frontend/src/components/ui/segment-control.tsx` and import in both places.

## Todo List

- [x] Step 1: Create AdminUserWorkloadResponse DTO (inline in controller)
- [x] Step 2: Add GET /admin/users/workload endpoint
- [x] Step 3: PATCH /admin/users/:id/role - already existed in admin-user.controller
- [x] Step 4: POST /admin/users/:id/reset-password - already existed
- [x] Step 5: Update frontend API client with workload call
- [x] Step 6: Update frontend hooks (useUsersWorkload)
- [x] Step 7: Create permission-matrix.tsx component
- [x] Step 8: Create tab components (all-members, by-project, by-department)
- [x] Step 9: Rewrite teams/page.tsx with 3-tab layout
- [x] Step 10: Extract SegmentControl to shared component

## Success Criteria

1. Teams page loads with 3 tabs; default shows "All Members"
2. Each member shows workload stats (tasks, completion %, overdue badge)
3. ADMIN+ can inline-edit global role; change persists after refresh
4. "By Project" tab shows projects with nested member lists
5. "By Department" tab groups by role with collapsible sections
6. Permission matrix renders correctly for all 10 roles x 6 features
7. Deactivate toggle works and removes user from active list
8. Reset password shows temporary password in alert dialog
9. Non-admin users cannot see edit/action controls

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Workload query is slow for many users | Poor page load | Add pagination or limit to active users; use `select` to minimize data |
| Role change could lock out admins | Admin lockout | Prevent changing own role; prevent demoting last SUPER_ADMIN |
| Temp password displayed in UI | Security concern | Show only once in modal; copy-to-clipboard; never log to console |
| SegmentControl extraction breaks project detail | Regression | Import path change only; keep props identical |

## Security Considerations

- `GET /admin/users/workload` restricted to `SUPER_ADMIN, ADMIN, PM`
- `PATCH /admin/users/:id/role` restricted to `SUPER_ADMIN, ADMIN`
- `POST /admin/users/:id/reset-password` restricted to `SUPER_ADMIN, ADMIN`
- Frontend hides edit controls based on `useAuth()` role check
- SUPER_ADMIN role assignment should be restricted to SUPER_ADMIN only (extra server-side check)
- Temporary password should be cryptographically random (`crypto.randomBytes`)
- Consider rate-limiting reset password endpoint

## Next Steps

- Add search/filter within "By Project" and "By Department" tabs
- Consider adding CSV export for member list
- Integrate with Notification module to alert users of role changes
