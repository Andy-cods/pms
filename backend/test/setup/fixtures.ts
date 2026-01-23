import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient, UserRole, ProjectStatus, ProjectStage, TaskStatus, TaskPriority } from '@prisma/client';

/**
 * Login helper - authenticates a user and returns access token
 */
export async function login(
  app: INestApplication,
  email: string,
  password: string = 'Test@123',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken;
}

/**
 * Creates an authenticated request with Bearer token
 */
export function authenticatedRequest(app: INestApplication, token: string) {
  return request(app.getHttpServer()).set('Authorization', `Bearer ${token}`);
}

/**
 * Test data factories
 */

export async function createTestProject(
  prisma: PrismaClient,
  data: {
    clientId: string;
    pmUserId: string;
    name?: string;
    code?: string;
    status?: ProjectStatus;
    stage?: ProjectStage;
  },
) {
  const project = await prisma.project.create({
    data: {
      code: data.code || `PRJ${Math.floor(Math.random() * 10000)}`,
      name: data.name || 'Test Project',
      description: 'Test project description',
      productType: 'Website',
      status: data.status || ProjectStatus.STABLE,
      stage: data.stage || ProjectStage.PLANNING,
      clientId: data.clientId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      team: {
        create: {
          userId: data.pmUserId,
          role: UserRole.PM,
          isPrimary: true,
        },
      },
    },
    include: {
      client: true,
      team: {
        include: {
          user: true,
        },
      },
    },
  });

  return project;
}

export async function createTestTask(
  prisma: PrismaClient,
  data: {
    projectId: string;
    createdById: string;
    title?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeIds?: string[];
  },
) {
  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      title: data.title || 'Test Task',
      description: 'Test task description',
      status: data.status || TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      createdById: data.createdById,
      estimatedHours: 8,
      orderIndex: 0,
      assignees: data.assigneeIds
        ? {
            create: data.assigneeIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
    include: {
      assignees: {
        include: {
          user: true,
        },
      },
      project: true,
      createdBy: true,
    },
  });

  return task;
}

export async function createTestClient(
  prisma: PrismaClient,
  data?: {
    companyName?: string;
    email?: string;
  },
) {
  const client = await prisma.client.create({
    data: {
      companyName: data?.companyName || `Test Company ${Math.random()}`,
      contactName: 'Test Contact',
      email: data?.email || `client${Math.random()}@test.com`,
      phone: '0123456789',
      isActive: true,
    },
  });

  return client;
}

/**
 * Helper to extract error message from response
 */
export function getErrorMessage(response: any): string {
  return response.body?.message || response.body?.error || 'Unknown error';
}

/**
 * Helper to wait for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
