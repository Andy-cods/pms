# BC Agency PMS - API Reference

## Table of Contents

1. [Authentication](#authentication)
2. [Project Endpoints](#project-endpoints)
3. [Task Endpoints](#task-endpoints)
4. [Approval Endpoints](#approval-endpoints)
5. [Calendar Endpoints](#calendar-endpoints)
6. [File Endpoints](#file-endpoints)
7. [Admin Endpoints](#admin-endpoints)
8. [Error Handling](#error-handling)

---

## Base URL

```
Production: https://pms.bcagency.com/api
Development: http://localhost:3001/api
```

## Authentication

All API requests (except login/register) require authentication via JWT tokens.

### Login (Internal Staff)

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@bcagency.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@bcagency.com",
    "name": "John Doe",
    "role": "PM",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `access_token` (HttpOnly, expires in 1 hour)
- `refresh_token` (HttpOnly, expires in 7 days, path: `/api/auth/refresh`)

**Rate Limit:** 5 requests per minute

### Login (Client Portal)

**Endpoint:** `POST /auth/client-login`

**Request Body:**
```json
{
  "email": "client@company.com",
  "password": "clientpass123"
}
```

**Response:**
```json
{
  "client": {
    "id": "client-uuid",
    "email": "client@company.com",
    "companyName": "ABC Corporation",
    "contactName": "Jane Smith",
    "isActive": true
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** If cookie is set, `refreshToken` in body is optional.

**Response:**
```json
{
  "accessToken": "new-access-token...",
  "refreshToken": "new-refresh-token..."
}
```

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `access_token`
- `refresh_token`

### Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@bcagency.com",
    "name": "John Doe",
    "role": "PM",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

## Project Endpoints

### List Projects

**Endpoint:** `GET /projects`

**Query Parameters:**
- `status` - Filter by status (ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
- `stage` - Filter by stage (PLANNING, UNDER_REVIEW, PROPOSAL_PITCH, ONGOING, FINAL_REVIEW, COMPLETED)
- `clientId` - Filter by client ID
- `search` - Search in name, code, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction: asc/desc (default: desc)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "code": "PRJ0001",
      "name": "Website ABC Company",
      "description": "Corporate website redesign",
      "productType": "Website",
      "status": "ACTIVE",
      "stage": "ONGOING",
      "stageProgress": 65,
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-03-31T00:00:00Z",
      "timelineProgress": 45,
      "driveLink": "https://drive.google.com/...",
      "planLink": "https://docs.google.com/...",
      "trackingLink": "https://trello.com/...",
      "clientId": "client-uuid",
      "client": {
        "id": "client-uuid",
        "companyName": "ABC Corporation"
      },
      "team": [
        {
          "id": "team-member-uuid",
          "userId": "user-uuid",
          "role": "PM",
          "isPrimary": true,
          "user": {
            "id": "user-uuid",
            "name": "John Doe",
            "email": "john@bcagency.com",
            "avatar": "https://..."
          }
        }
      ],
      "taskStats": {
        "total": 50,
        "todo": 10,
        "inProgress": 25,
        "done": 15
      },
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-23T10:00:00Z",
      "archivedAt": null
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**Access Control:**
- Admins see all projects
- Staff see only projects they are team members of

### Get Project by ID

**Endpoint:** `GET /projects/:id`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:** Same as single project object in list response.

### Create Project

**Endpoint:** `POST /projects`

**Permissions:** PM, ADMIN, SUPER_ADMIN

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "PRJ0001",
  "name": "Website ABC Company",
  "description": "Corporate website redesign project",
  "productType": "Website",
  "status": "ACTIVE",
  "stage": "PLANNING",
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "clientId": "client-uuid",
  "driveLink": "https://drive.google.com/...",
  "planLink": "https://docs.google.com/...",
  "trackingLink": "https://trello.com/..."
}
```

**Required Fields:**
- `name`

**Optional Fields:**
- `code` (auto-generated if not provided)
- All others

**Response:** Created project object (same structure as GET).

### Update Project

**Endpoint:** `PATCH /projects/:id`

**Permissions:** PM (of the project), ADMIN, SUPER_ADMIN

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Project Name",
  "status": "ON_HOLD",
  "stage": "UNDER_REVIEW",
  "stageProgress": 75,
  "endDate": "2026-04-30"
}
```

**Response:** Updated project object.

### Archive Project

**Endpoint:** `DELETE /projects/:id`

**Permissions:** PM (of the project), ADMIN, SUPER_ADMIN

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```
204 No Content
```

**Note:** Project is soft-deleted (archivedAt timestamp set).

### Get Project Team

**Endpoint:** `GET /projects/:id/team`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
[
  {
    "id": "team-member-uuid",
    "userId": "user-uuid",
    "role": "PM",
    "isPrimary": true,
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@bcagency.com",
      "avatar": "https://..."
    }
  }
]
```

### Add Team Member

**Endpoint:** `POST /projects/:id/team`

**Permissions:** PM, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "userId": "user-uuid",
  "role": "DESIGNER",
  "isPrimary": false
}
```

**Response:** Created team member object.

### Update Team Member

**Endpoint:** `PATCH /projects/:id/team/:memberId`

**Permissions:** PM, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "role": "DEVELOPER",
  "isPrimary": false
}
```

**Response:** Updated team member object.

### Remove Team Member

**Endpoint:** `DELETE /projects/:id/team/:memberId`

**Permissions:** PM, ADMIN, SUPER_ADMIN

**Response:**
```
204 No Content
```

**Note:** Cannot remove the last PM from a project.

---

## Task Endpoints

### List Tasks

**Endpoint:** `GET /tasks`

**Query Parameters:**
- `projectId` - Filter by project
- `status` - Filter by status (TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED, CANCELLED)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assigneeId` - Filter by assignee
- `search` - Search in title, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `sortBy` - Sort field (default: orderIndex)
- `sortOrder` - Sort direction (default: asc)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "projectId": "project-uuid",
      "parentId": null,
      "title": "Design homepage mockup",
      "description": "Create high-fidelity mockup for homepage",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "estimatedHours": 8,
      "actualHours": 5,
      "deadline": "2026-01-25T17:00:00Z",
      "startedAt": "2026-01-22T09:00:00Z",
      "completedAt": null,
      "orderIndex": 0,
      "reviewerId": "reviewer-uuid",
      "reviewer": {
        "id": "reviewer-uuid",
        "name": "Jane Reviewer",
        "avatar": "https://..."
      },
      "createdById": "creator-uuid",
      "createdBy": {
        "id": "creator-uuid",
        "name": "John Creator",
        "avatar": "https://..."
      },
      "assignees": [
        {
          "id": "assignee-uuid",
          "userId": "user-uuid",
          "user": {
            "id": "user-uuid",
            "name": "Designer Name",
            "email": "designer@bcagency.com",
            "avatar": "https://..."
          }
        }
      ],
      "subtaskCount": 3,
      "completedSubtaskCount": 1,
      "project": {
        "id": "project-uuid",
        "code": "PRJ0001",
        "name": "Website ABC"
      },
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-23T14:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

### Get Kanban View

**Endpoint:** `GET /tasks/project/:projectId/kanban`

**Response:**
```json
{
  "columns": [
    {
      "status": "TODO",
      "label": "To Do",
      "tasks": [ /* task objects */ ]
    },
    {
      "status": "IN_PROGRESS",
      "label": "In Progress",
      "tasks": [ /* task objects */ ]
    },
    {
      "status": "REVIEW",
      "label": "Review",
      "tasks": [ /* task objects */ ]
    },
    {
      "status": "DONE",
      "label": "Done",
      "tasks": [ /* task objects */ ]
    },
    {
      "status": "BLOCKED",
      "label": "Blocked",
      "tasks": [ /* task objects */ ]
    }
  ],
  "projectId": "project-uuid"
}
```

### Get Task by ID

**Endpoint:** `GET /tasks/:id`

**Response:** Single task object (same structure as in list).

### Create Task

**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "parentId": null,
  "title": "Design homepage mockup",
  "description": "Create high-fidelity mockup",
  "status": "TODO",
  "priority": "HIGH",
  "estimatedHours": 8,
  "deadline": "2026-01-25T17:00:00Z",
  "reviewerId": "reviewer-uuid",
  "assigneeIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Required Fields:**
- `projectId`
- `title`

**Response:** Created task object.

### Update Task

**Endpoint:** `PATCH /tasks/:id`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "estimatedHours": 10,
  "actualHours": 6,
  "deadline": "2026-01-26T17:00:00Z",
  "reviewerId": "new-reviewer-uuid"
}
```

**Response:** Updated task object.

**Note:** Changing status to IN_PROGRESS sets `startedAt`, changing to DONE sets `completedAt`.

### Update Task Status Only

**Endpoint:** `PATCH /tasks/:id/status`

**Request Body:**
```json
{
  "status": "DONE"
}
```

**Response:** Updated task object.

### Assign Users to Task

**Endpoint:** `POST /tasks/:id/assign`

**Request Body:**
```json
{
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Response:** Updated task object.

**Note:** Replaces all existing assignees.

### Reorder Tasks (Drag & Drop)

**Endpoint:** `PATCH /tasks/project/:projectId/reorder`

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task-uuid-1",
      "orderIndex": 0,
      "status": "TODO"
    },
    {
      "id": "task-uuid-2",
      "orderIndex": 1,
      "status": "IN_PROGRESS"
    }
  ]
}
```

**Response:**
```
204 No Content
```

### Delete Task

**Endpoint:** `DELETE /tasks/:id`

**Response:**
```
204 No Content
```

### Get My Tasks

**Endpoint:** `GET /tasks/user/my-tasks`

**Query Parameters:** Same as List Tasks

**Response:** Tasks assigned to current user.

---

## Approval Endpoints

### List Approvals

**Endpoint:** `GET /approvals`

**Query Parameters:**
- `projectId` - Filter by project
- `status` - Filter by status (PENDING, APPROVED, REJECTED, CHANGES_REQUESTED)
- `type` - Filter by type (PLAN, DESIGN, PROPOSAL, OTHER)
- `search` - Search in title, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: submittedAt)
- `sortOrder` - Sort direction (default: desc)

**Response:**
```json
{
  "approvals": [
    {
      "id": "approval-uuid",
      "projectId": "project-uuid",
      "project": {
        "id": "project-uuid",
        "code": "PRJ0001",
        "name": "Website ABC"
      },
      "type": "PLAN",
      "status": "PENDING",
      "title": "Q1 Planning Approval",
      "description": "Please review and approve Q1 project plan",
      "comment": null,
      "deadline": "2026-01-25T17:00:00Z",
      "escalationLevel": 0,
      "escalatedAt": null,
      "submittedBy": {
        "id": "user-uuid",
        "name": "John PM",
        "email": "pm@bcagency.com",
        "avatar": "https://..."
      },
      "approvedBy": null,
      "files": [
        {
          "id": "file-uuid",
          "name": "Q1_Plan.pdf",
          "mimeType": "application/pdf",
          "size": 1024000
        }
      ],
      "history": [
        {
          "id": "history-uuid",
          "fromStatus": "PENDING",
          "toStatus": "PENDING",
          "comment": "Submitted for approval",
          "changedBy": {
            "id": "user-uuid",
            "name": "John PM",
            "avatar": "https://..."
          },
          "changedAt": "2026-01-20T10:00:00Z"
        }
      ],
      "submittedAt": "2026-01-20T10:00:00Z",
      "respondedAt": null
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

### Get Pending Approvals

**Endpoint:** `GET /approvals/pending`

**Permissions:** NVKD, ADMIN, SUPER_ADMIN

**Response:** Array of pending approval objects (oldest first).

### Get Approval Statistics

**Endpoint:** `GET /approvals/stats`

**Response:**
```json
{
  "total": 100,
  "pending": 15,
  "approved": 70,
  "rejected": 10,
  "changesRequested": 5
}
```

### Get Approval by ID

**Endpoint:** `GET /approvals/:id`

**Response:** Single approval object with full history.

### Submit for Approval

**Endpoint:** `POST /approvals`

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "type": "PLAN",
  "title": "Q1 Planning Approval",
  "description": "Please review and approve Q1 project plan",
  "deadline": "2026-01-25T17:00:00Z",
  "fileIds": ["file-uuid-1", "file-uuid-2"]
}
```

**Required Fields:**
- `projectId`
- `type`
- `title`

**Response:** Created approval object.

**Side Effect:** Project stage changes to UNDER_REVIEW.

### Update Approval (Resubmit)

**Endpoint:** `PATCH /approvals/:id`

**Permissions:** Submitter only

**Allowed Status:** CHANGES_REQUESTED only

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description with requested changes",
  "deadline": "2026-01-26T17:00:00Z",
  "fileIds": ["new-file-uuid"]
}
```

**Response:** Updated approval object.

**Side Effect:** Status changes back to PENDING.

### Approve

**Endpoint:** `PATCH /approvals/:id/approve`

**Permissions:** NVKD, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "comment": "Approved. Looks good!"
}
```

**Response:** Updated approval object.

**Side Effects:**
- Status changes to APPROVED
- Project stage advances (UNDER_REVIEW → PROPOSAL_PITCH or ONGOING)
- Approval history recorded

### Reject

**Endpoint:** `PATCH /approvals/:id/reject`

**Permissions:** NVKD, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "comment": "Rejected. Budget concerns."
}
```

**Required Fields:**
- `comment`

**Response:** Updated approval object.

**Side Effects:**
- Status changes to REJECTED
- Project stage reverts to PLANNING
- Approval history recorded

### Request Changes

**Endpoint:** `PATCH /approvals/:id/request-changes`

**Permissions:** NVKD, ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "comment": "Please update timeline and add more details on budget."
}
```

**Required Fields:**
- `comment`

**Response:** Updated approval object.

**Side Effects:**
- Status changes to CHANGES_REQUESTED
- Approval history recorded
- Submitter notified

---

## Calendar Endpoints

### List Events

**Endpoint:** `GET /events`

**Query Parameters:**
- `start` - Start date (ISO 8601, required)
- `end` - End date (ISO 8601, required)
- `type` - Filter by type (MEETING, DEADLINE, MILESTONE, OTHER)
- `projectId` - Filter by project
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "events": [
    {
      "id": "event-uuid",
      "title": "Project Kickoff Meeting",
      "description": "Initial meeting with client",
      "type": "MEETING",
      "startTime": "2026-01-25T10:00:00Z",
      "endTime": "2026-01-25T11:00:00Z",
      "isAllDay": false,
      "recurrence": null,
      "location": "Meeting Room A",
      "meetingLink": "https://meet.google.com/...",
      "projectId": "project-uuid",
      "taskId": null,
      "reminderBefore": 15,
      "project": {
        "id": "project-uuid",
        "code": "PRJ0001",
        "name": "Website ABC"
      },
      "createdBy": {
        "id": "user-uuid",
        "name": "John Organizer",
        "email": "john@bcagency.com",
        "avatar": "https://..."
      },
      "attendees": [
        {
          "id": "attendee-uuid",
          "userId": "user-uuid",
          "email": "user@bcagency.com",
          "name": "John Doe",
          "status": "accepted",
          "user": {
            "id": "user-uuid",
            "name": "John Doe",
            "email": "user@bcagency.com",
            "avatar": "https://..."
          }
        }
      ],
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

**Note:** Recurring events are expanded into individual occurrences within the date range.

### Get Deadlines

**Endpoint:** `GET /events/deadlines`

**Query Parameters:**
- `start` - Start date (required)
- `end` - End date (required)
- `projectId` - Filter by project

**Response:** Array of task deadlines formatted as events.

### Get Event by ID

**Endpoint:** `GET /events/:id`

**Response:** Single event object.

### Create Event

**Endpoint:** `POST /events`

**Request Body:**
```json
{
  "title": "Project Kickoff Meeting",
  "description": "Initial meeting with client",
  "type": "MEETING",
  "startTime": "2026-01-25T10:00:00Z",
  "endTime": "2026-01-25T11:00:00Z",
  "isAllDay": false,
  "recurrence": null,
  "location": "Meeting Room A",
  "meetingLink": "https://meet.google.com/...",
  "projectId": "project-uuid",
  "taskId": null,
  "reminderBefore": 15,
  "attendeeIds": ["user-uuid-1", "user-uuid-2"],
  "attendeeEmails": [
    {
      "email": "external@client.com",
      "name": "External Guest"
    }
  ]
}
```

**Required Fields:**
- `title`
- `startTime`
- `type`

**Recurrence Format (RRule):**
- Daily: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR`
- Weekly: `FREQ=WEEKLY;BYDAY=MO`
- Monthly: `FREQ=MONTHLY;BYMONTHDAY=1`

**Response:** Created event object.

### Update Event

**Endpoint:** `PATCH /events/:id`

**Permissions:** Event creator only

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Meeting Title",
  "startTime": "2026-01-25T11:00:00Z",
  "endTime": "2026-01-25T12:00:00Z",
  "attendeeIds": ["user-uuid-3"]
}
```

**Response:** Updated event object.

### Delete Event

**Endpoint:** `DELETE /events/:id`

**Permissions:** Event creator or admin

**Response:**
```
204 No Content
```

### Respond to Event

**Endpoint:** `POST /events/:id/respond`

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Status Values:** `pending`, `accepted`, `declined`

**Response:** Updated event object.

---

## File Endpoints

### Upload File

**Endpoint:** `POST /files/upload`

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - File to upload (max 50MB)
- `projectId` - Project ID (required)
- `taskId` - Task ID (optional)
- `category` - File category (DOCUMENT, IMAGE, VIDEO, DESIGN, CODE, OTHER)
- `tags` - JSON array of tags (optional)

**Response:**
```json
{
  "id": "file-uuid",
  "name": "document.pdf",
  "originalName": "My Document.pdf",
  "path": "projects/project-uuid/document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf",
  "category": "DOCUMENT",
  "version": 1,
  "tags": ["important", "contract"],
  "uploadedAt": "2026-01-23T10:00:00Z",
  "uploadedBy": {
    "id": "user-uuid",
    "name": "John Uploader",
    "email": "john@bcagency.com"
  },
  "project": {
    "id": "project-uuid",
    "code": "PRJ0001",
    "name": "Website ABC"
  },
  "task": null
}
```

### List Files

**Endpoint:** `GET /files`

**Query Parameters:**
- `projectId` - Filter by project
- `taskId` - Filter by task
- `category` - Filter by category
- `search` - Search in name, originalName, tags
- `limit` - Items per page (default: 50)
- `offset` - Skip items (default: 0)

**Response:**
```json
{
  "files": [ /* array of file objects */ ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Get File by ID

**Endpoint:** `GET /files/:id`

**Response:** Single file object.

### Get Download URL (Presigned)

**Endpoint:** `GET /files/:id/download`

**Response:**
```json
{
  "url": "https://storage.bcagency.com/...",
  "expiresIn": 3600
}
```

**Note:** URL expires in 1 hour (3600 seconds).

### Stream File (Preview)

**Endpoint:** `GET /files/:id/stream`

**Response:** File stream with headers:
```
Content-Type: <mime-type>
Content-Disposition: inline; filename="<filename>"
```

**Use Case:** Inline preview in browser (PDF, images, etc.).

### Update File Metadata

**Endpoint:** `PATCH /files/:id`

**Permissions:** Uploader or admin

**Request Body:**
```json
{
  "name": "Updated filename.pdf",
  "category": "DESIGN",
  "tags": ["updated", "reviewed"]
}
```

**Response:** Updated file object.

### Delete File

**Endpoint:** `DELETE /files/:id`

**Permissions:** Uploader or admin

**Response:**
```json
{
  "success": true
}
```

**Note:** File is permanently deleted from storage.

---

## Admin Endpoints

### User Management

#### List Users

**Endpoint:** `GET /admin/users`

**Permissions:** ADMIN, SUPER_ADMIN

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role
- `isActive` - Filter by status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@bcagency.com",
      "name": "John Doe",
      "role": "PM",
      "avatar": "https://...",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "lastLoginAt": "2026-01-23T09:00:00Z"
    }
  ],
  "total": 50
}
```

#### Get User by ID

**Endpoint:** `GET /admin/users/:id`

**Permissions:** ADMIN, SUPER_ADMIN

**Response:** Single user object.

#### Create User

**Endpoint:** `POST /admin/users`

**Permissions:** ADMIN (cannot create ADMIN), SUPER_ADMIN

**Request Body:**
```json
{
  "email": "newuser@bcagency.com",
  "name": "New User",
  "password": "SecurePass123!",
  "role": "DESIGNER"
}
```

**Response:** Created user object.

#### Update User

**Endpoint:** `PATCH /admin/users/:id`

**Permissions:** ADMIN (cannot modify ADMIN), SUPER_ADMIN

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "DEVELOPER",
  "isActive": true
}
```

**Response:** Updated user object.

#### Deactivate User

**Endpoint:** `PATCH /admin/users/:id/deactivate`

**Permissions:** ADMIN (cannot deactivate ADMIN), SUPER_ADMIN

**Response:** Updated user object with `isActive: false`.

#### Reset Password

**Endpoint:** `POST /admin/users/:id/reset-password`

**Permissions:** ADMIN (cannot reset ADMIN), SUPER_ADMIN

**Response:**
```json
{
  "tempPassword": "AbC123xyz!@",
  "message": "Mật khẩu đã được đặt lại. Vui lòng gửi mật khẩu tạm thời cho người dùng."
}
```

**Security:** Temporary password must be changed on first login.

### Client Management

#### List Clients

**Endpoint:** `GET /admin/clients`

**Permissions:** ADMIN, SUPER_ADMIN, ACCOUNT

**Query Parameters:** Same as users

**Response:**
```json
{
  "clients": [
    {
      "id": "client-uuid",
      "email": "client@company.com",
      "companyName": "ABC Corporation",
      "contactName": "Jane Smith",
      "phone": "+84-123-456-789",
      "address": "123 Main St",
      "taxCode": "0123456789",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 20
}
```

#### Create Client

**Endpoint:** `POST /admin/clients`

**Permissions:** ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "email": "client@company.com",
  "password": "ClientPass123!",
  "companyName": "ABC Corporation",
  "contactName": "Jane Smith",
  "phone": "+84-123-456-789",
  "address": "123 Main St",
  "taxCode": "0123456789"
}
```

**Response:** Created client object.

### Audit Logs

**Endpoint:** `GET /admin/audit-logs`

**Permissions:** ADMIN, SUPER_ADMIN

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action
- `entityType` - Filter by entity
- `startDate` - Start date
- `endDate` - End date
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "logs": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "action": "CREATE_USER",
      "entityType": "User",
      "entityId": "entity-uuid",
      "metadata": {},
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 50,
  "totalPages": 10
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Messages

**Authentication Errors:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Permission Errors:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this project",
  "error": "Forbidden"
}
```

**Validation Errors:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

**Rate Limit Errors:**
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```

### Rate Limiting

**Default Limits:**
- Authentication: 5 requests/minute
- General API: 100 requests/minute
- File Upload: 10 requests/minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706011200
```

---

## Webhooks (Future)

Webhook endpoints for external integrations (planned for Phase 3).

---

**Version:** 1.0.0
**Last Updated:** 2026-01-23
