import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { createTestApp, closeTestApp } from '../setup/test-app.js';
import {
  cleanDatabase,
  seedTestData,
  getPrismaClient,
  disconnectDatabase,
} from '../setup/test-db.js';
import {
  login,
  authenticatedRequest,
  createTestProject,
  createTestTask,
} from '../setup/fixtures.js';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let pmToken: string;
  let designerToken: string;
  let testUsers: any;
  let testProject: any;
  let testTask: any;

  const prisma = getPrismaClient();

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase();
    testUsers = await seedTestData();

    // Login users
    adminToken = await login(app, 'admin@test.com');
    pmToken = await login(app, 'pm@test.com');
    designerToken = await login(app, 'designer@test.com');

    // Create test project
    testProject = await createTestProject(prisma, {
      clientId: testUsers.testClient.id,
      pmUserId: testUsers.pm.id,
      name: 'Task Test Project',
    });

    // Add designer to project team
    await prisma.projectTeam.create({
      data: {
        projectId: testProject.id,
        userId: testUsers.designer.id,
        role: 'DESIGN',
      },
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
    await disconnectDatabase();
  });

  describe('POST /tasks', () => {
    it('should create task as PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/tasks')
        .send({
          projectId: testProject.id,
          title: 'New Task',
          description: 'Task description',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          estimatedHours: 8,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Task');
      expect(response.body.status).toBe('TODO');
      expect(response.body.priority).toBe('HIGH');
      expect(response.body.projectId).toBe(testProject.id);

      testTask = response.body;
    });

    it('should create task with assignees', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/tasks')
        .send({
          projectId: testProject.id,
          title: 'Task with Assignees',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assigneeIds: [testUsers.designer.id],
        })
        .expect(201);

      expect(response.body.assignees).toBeDefined();
      expect(response.body.assignees.length).toBe(1);
      expect(response.body.assignees[0].userId).toBe(testUsers.designer.id);
    });

    it('should create subtask', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/tasks')
        .send({
          projectId: testProject.id,
          parentId: testTask.id,
          title: 'Subtask',
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
        })
        .expect(201);

      expect(response.body.parentId).toBe(testTask.id);
    });

    it('should reject task creation for non-member', async () => {
      // Login as NVKD (not member of project)
      const nvkdToken = await login(app, 'nvkd@test.com');

      await authenticatedRequest(app, nvkdToken)
        .post('/tasks')
        .send({
          projectId: testProject.id,
          title: 'Should Fail',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
        .expect(403);
    });

    it('should reject task without required fields', async () => {
      await authenticatedRequest(app, pmToken)
        .post('/tasks')
        .send({
          projectId: testProject.id,
          // Missing title
          status: TaskStatus.TODO,
        })
        .expect(400);
    });
  });

  describe('GET /tasks', () => {
    beforeAll(async () => {
      // Create multiple test tasks
      await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Task 1',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      });

      await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Task 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        assigneeIds: [testUsers.designer.id],
      });

      await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Task 3',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
      });
    });

    it('should list all tasks for project', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('total');
      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}&status=TODO`)
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('TODO');
      });
    });

    it('should filter tasks by priority', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}&priority=HIGH`)
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        expect(task.priority).toBe('HIGH');
      });
    });

    it('should filter tasks by assignee', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}&assigneeId=${testUsers.designer.id}`)
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        const hasAssignee = task.assignees.some(
          (a: any) => a.userId === testUsers.designer.id,
        );
        expect(hasAssignee).toBe(true);
      });
    });

    it('should search tasks by title', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}&search=Task 1`)
        .expect(200);

      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should paginate tasks', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks?projectId=${testProject.id}&page=1&limit=2`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.tasks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /tasks/project/:projectId/kanban', () => {
    it('should get kanban view for project', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks/project/${testProject.id}/kanban`)
        .expect(200);

      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('projectId');
      expect(response.body.columns).toBeInstanceOf(Array);

      // Check all status columns exist
      const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
      response.body.columns.forEach((col: any) => {
        expect(statuses).toContain(col.status);
        expect(col).toHaveProperty('label');
        expect(col).toHaveProperty('tasks');
        expect(col.tasks).toBeInstanceOf(Array);
      });
    });

    it('should reject non-member access', async () => {
      const nvkdToken = await login(app, 'nvkd@test.com');

      await authenticatedRequest(app, nvkdToken)
        .get(`/tasks/project/${testProject.id}/kanban`)
        .expect(403);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get task by id', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/tasks/${testTask.id}`)
        .expect(200);

      expect(response.body.id).toBe(testTask.id);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('createdBy');
    });

    it('should return 404 for non-existent task', async () => {
      await authenticatedRequest(app, pmToken)
        .get('/tasks/non-existent-id')
        .expect(404);
    });

    it('should reject non-member access', async () => {
      const nvkdToken = await login(app, 'nvkd@test.com');

      await authenticatedRequest(app, nvkdToken)
        .get(`/tasks/${testTask.id}`)
        .expect(403);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .patch(`/tasks/${testTask.id}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated description',
          priority: TaskPriority.URGENT,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Task Title');
      expect(response.body.priority).toBe('URGENT');
    });

    it('should update task status and set timestamps', async () => {
      // Update to IN_PROGRESS
      const inProgressResponse = await authenticatedRequest(app, pmToken)
        .patch(`/tasks/${testTask.id}`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(inProgressResponse.body.status).toBe('IN_PROGRESS');
      expect(inProgressResponse.body.startedAt).toBeTruthy();

      // Update to DONE
      const doneResponse = await authenticatedRequest(app, pmToken)
        .patch(`/tasks/${testTask.id}`)
        .send({
          status: TaskStatus.DONE,
        })
        .expect(200);

      expect(doneResponse.body.status).toBe('DONE');
      expect(doneResponse.body.completedAt).toBeTruthy();
    });

    it('should reject update by non-member', async () => {
      const nvkdToken = await login(app, 'nvkd@test.com');

      await authenticatedRequest(app, nvkdToken)
        .patch(`/tasks/${testTask.id}`)
        .send({
          title: 'Should Fail',
        })
        .expect(403);
    });
  });

  describe('PATCH /tasks/:id/status', () => {
    let statusTestTask: any;

    beforeAll(async () => {
      statusTestTask = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Status Test Task',
        status: TaskStatus.TODO,
      });
    });

    it('should update task status only', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .patch(`/tasks/${statusTestTask.id}/status`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.startedAt).toBeTruthy();
    });

    it('should set completedAt when marking as DONE', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .patch(`/tasks/${statusTestTask.id}/status`)
        .send({
          status: TaskStatus.DONE,
        })
        .expect(200);

      expect(response.body.status).toBe('DONE');
      expect(response.body.completedAt).toBeTruthy();
    });
  });

  describe('POST /tasks/:id/assign', () => {
    let assignTask: any;

    beforeAll(async () => {
      assignTask = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Assign Test Task',
      });
    });

    it('should assign users to task', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post(`/tasks/${assignTask.id}/assign`)
        .send({
          userIds: [testUsers.designer.id, testUsers.pm.id],
        })
        .expect(200);

      expect(response.body.assignees.length).toBe(2);
      const userIds = response.body.assignees.map((a: any) => a.userId);
      expect(userIds).toContain(testUsers.designer.id);
      expect(userIds).toContain(testUsers.pm.id);
    });

    it('should replace existing assignees', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post(`/tasks/${assignTask.id}/assign`)
        .send({
          userIds: [testUsers.pm.id],
        })
        .expect(200);

      expect(response.body.assignees.length).toBe(1);
      expect(response.body.assignees[0].userId).toBe(testUsers.pm.id);
    });

    it('should clear assignees with empty array', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post(`/tasks/${assignTask.id}/assign`)
        .send({
          userIds: [],
        })
        .expect(200);

      expect(response.body.assignees.length).toBe(0);
    });
  });

  describe('PATCH /tasks/project/:projectId/reorder', () => {
    let reorderTask1: any;
    let reorderTask2: any;

    beforeAll(async () => {
      reorderTask1 = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Reorder Task 1',
        status: TaskStatus.TODO,
      });

      reorderTask2 = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Reorder Task 2',
        status: TaskStatus.TODO,
      });
    });

    it('should reorder tasks in project', async () => {
      await authenticatedRequest(app, pmToken)
        .patch(`/tasks/project/${testProject.id}/reorder`)
        .send({
          tasks: [
            { id: reorderTask1.id, orderIndex: 1, status: 'TODO' },
            { id: reorderTask2.id, orderIndex: 0, status: 'TODO' },
          ],
        })
        .expect(200);

      // Verify order
      const task1 = await prisma.task.findUnique({
        where: { id: reorderTask1.id },
      });
      const task2 = await prisma.task.findUnique({
        where: { id: reorderTask2.id },
      });

      expect(task1?.orderIndex).toBe(1);
      expect(task2?.orderIndex).toBe(0);
    });

    it('should update status during reorder (drag to different column)', async () => {
      await authenticatedRequest(app, pmToken)
        .patch(`/tasks/project/${testProject.id}/reorder`)
        .send({
          tasks: [
            { id: reorderTask1.id, orderIndex: 0, status: 'IN_PROGRESS' },
          ],
        })
        .expect(200);

      const task = await prisma.task.findUnique({
        where: { id: reorderTask1.id },
      });

      expect(task?.status).toBe('IN_PROGRESS');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task', async () => {
      const taskToDelete = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'To Be Deleted',
      });

      await authenticatedRequest(app, pmToken)
        .delete(`/tasks/${taskToDelete.id}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.task.findUnique({
        where: { id: taskToDelete.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      await authenticatedRequest(app, pmToken)
        .delete('/tasks/non-existent-id')
        .expect(404);
    });

    it('should reject deletion by non-member', async () => {
      const nvkdToken = await login(app, 'nvkd@test.com');
      const task = await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Cannot Delete',
      });

      await authenticatedRequest(app, nvkdToken)
        .delete(`/tasks/${task.id}`)
        .expect(403);
    });
  });

  describe('GET /tasks/user/my-tasks', () => {
    beforeAll(async () => {
      // Create tasks assigned to designer
      await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Designer Task 1',
        assigneeIds: [testUsers.designer.id],
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      });

      await createTestTask(prisma, {
        projectId: testProject.id,
        createdById: testUsers.pm.id,
        title: 'Designer Task 2',
        assigneeIds: [testUsers.designer.id],
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('should get tasks assigned to current user', async () => {
      const response = await authenticatedRequest(app, designerToken)
        .get('/tasks/user/my-tasks')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body.tasks).toBeInstanceOf(Array);

      // All tasks should be assigned to designer
      response.body.tasks.forEach((task: any) => {
        const isAssigned = task.assignees.some(
          (a: any) => a.userId === testUsers.designer.id,
        );
        expect(isAssigned).toBe(true);
      });
    });

    it('should filter my tasks by status', async () => {
      const response = await authenticatedRequest(app, designerToken)
        .get('/tasks/user/my-tasks?status=TODO')
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('TODO');
      });
    });

    it('should filter my tasks by priority', async () => {
      const response = await authenticatedRequest(app, designerToken)
        .get('/tasks/user/my-tasks?priority=HIGH')
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        expect(task.priority).toBe('HIGH');
      });
    });
  });
});
