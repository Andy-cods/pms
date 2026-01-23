import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProjectStatus, ProjectStage } from '@prisma/client';
import { createTestApp, closeTestApp } from '../setup/test-app';
import {
  cleanDatabase,
  seedTestData,
  getPrismaClient,
  disconnectDatabase,
} from '../setup/test-db';
import {
  login,
  authenticatedRequest,
  createTestProject,
  createTestClient,
} from '../setup/fixtures.js';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let pmToken: string;
  let designerToken: string;
  let testClientId: string;
  let testProjectId: string;
  let testUsers: any;

  const prisma = getPrismaClient();

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase();
    testUsers = await seedTestData();

    // Login users
    adminToken = await login(app, 'admin@test.com');
    pmToken = await login(app, 'pm@test.com');
    designerToken = await login(app, 'designer@test.com');

    testClientId = testUsers.testClient.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
    await disconnectDatabase();
  });

  describe('POST /projects', () => {
    it('should create project as PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/projects')
        .send({
          name: 'New Test Project',
          description: 'Project description',
          productType: 'Website',
          status: ProjectStatus.STABLE,
          stage: ProjectStage.PLANNING,
          clientId: testClientId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('code');
      expect(response.body.name).toBe('New Test Project');
      expect(response.body.team).toBeDefined();
      expect(response.body.team.length).toBeGreaterThan(0);

      testProjectId = response.body.id;
    });

    it('should create project as Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .post('/projects')
        .send({
          name: 'Admin Project',
          description: 'Admin created project',
          productType: 'Mobile App',
          status: ProjectStatus.STABLE,
          stage: ProjectStage.INTAKE,
          clientId: testClientId,
        })
        .expect(201);

      expect(response.body.name).toBe('Admin Project');
    });

    it('should reject duplicate project code', async () => {
      // Create first project with specific code
      await authenticatedRequest(app, pmToken)
        .post('/projects')
        .send({
          name: 'Project 1',
          code: 'TESTCODE001',
          clientId: testClientId,
          status: ProjectStatus.STABLE,
          stage: ProjectStage.PLANNING,
        })
        .expect(201);

      // Try to create second project with same code
      await authenticatedRequest(app, pmToken)
        .post('/projects')
        .send({
          name: 'Project 2',
          code: 'TESTCODE001',
          clientId: testClientId,
          status: ProjectStatus.STABLE,
          stage: ProjectStage.PLANNING,
        })
        .expect(400);
    });

    it('should reject project creation by Designer (unauthorized role)', async () => {
      await authenticatedRequest(app, designerToken)
        .post('/projects')
        .send({
          name: 'Designer Project',
          clientId: testClientId,
          status: ProjectStatus.STABLE,
          stage: ProjectStage.PLANNING,
        })
        .expect(403);
    });

    it('should reject project without required fields', async () => {
      await authenticatedRequest(app, pmToken)
        .post('/projects')
        .send({
          description: 'Missing name',
        })
        .expect(400);
    });

    it('should auto-generate project code if not provided', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/projects')
        .send({
          name: 'Auto Code Project',
          clientId: testClientId,
          status: ProjectStatus.STABLE,
          stage: ProjectStage.PLANNING,
        })
        .expect(201);

      expect(response.body.code).toBeDefined();
      expect(response.body.code).toMatch(/^PRJ\d{4}$/);
    });
  });

  describe('GET /projects', () => {
    beforeAll(async () => {
      // Create multiple test projects
      await createTestProject(prisma, {
        clientId: testClientId,
        pmUserId: testUsers.pm.id,
        name: 'Active Project',
        status: ProjectStatus.STABLE,
        stage: ProjectStage.ONGOING,
      });

      await createTestProject(prisma, {
        clientId: testClientId,
        pmUserId: testUsers.pm.id,
        name: 'Warning Project',
        status: ProjectStatus.WARNING,
        stage: ProjectStage.PLANNING,
      });
    });

    it('should list all projects for admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects')
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should list only team member projects for PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get('/projects')
        .expect(200);

      expect(response.body.projects).toBeInstanceOf(Array);
      // PM should only see projects they are part of
      response.body.projects.forEach((project: any) => {
        const isMember = project.team.some(
          (member: any) => member.userId === testUsers.pm.id,
        );
        expect(isMember).toBe(true);
      });
    });

    it('should filter projects by status', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects?status=STABLE')
        .expect(200);

      response.body.projects.forEach((project: any) => {
        expect(project.status).toBe('STABLE');
      });
    });

    it('should filter projects by stage', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects?stage=ONGOING')
        .expect(200);

      response.body.projects.forEach((project: any) => {
        expect(project.stage).toBe('ONGOING');
      });
    });

    it('should search projects by name', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects?search=Active')
        .expect(200);

      expect(response.body.projects.length).toBeGreaterThan(0);
      expect(response.body.projects[0].name).toContain('Active');
    });

    it('should paginate projects', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects?page=1&limit=2')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.projects.length).toBeLessThanOrEqual(2);
      expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should sort projects by createdAt desc', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/projects?sortBy=createdAt&sortOrder=desc')
        .expect(200);

      if (response.body.projects.length > 1) {
        const first = new Date(response.body.projects[0].createdAt);
        const second = new Date(response.body.projects[1].createdAt);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });
  });

  describe('GET /projects/:id', () => {
    it('should get project by id for team member', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/projects/${testProjectId}`)
        .expect(200);

      expect(response.body.id).toBe(testProjectId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('team');
      expect(response.body).toHaveProperty('taskStats');
    });

    it('should get project by id for admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get(`/projects/${testProjectId}`)
        .expect(200);

      expect(response.body.id).toBe(testProjectId);
    });

    it('should reject access to project for non-member', async () => {
      // Designer is not a member of testProject
      await authenticatedRequest(app, designerToken)
        .get(`/projects/${testProjectId}`)
        .expect(403);
    });

    it('should return 404 for non-existent project', async () => {
      await authenticatedRequest(app, adminToken)
        .get('/projects/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update project as PM (team member)', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .patch(`/projects/${testProjectId}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated description',
          status: ProjectStatus.WARNING,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Project Name');
      expect(response.body.status).toBe('WARNING');
    });

    it('should update project as Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .patch(`/projects/${testProjectId}`)
        .send({
          stageProgress: 75,
        })
        .expect(200);

      expect(response.body.stageProgress).toBe(75);
    });

    it('should reject update by non-PM team member', async () => {
      // Add designer to team first
      await authenticatedRequest(app, pmToken)
        .post(`/projects/${testProjectId}/team`)
        .send({
          userId: testUsers.designer.id,
          role: 'DESIGN',
        })
        .expect(201);

      // Designer tries to update
      await authenticatedRequest(app, designerToken)
        .patch(`/projects/${testProjectId}`)
        .send({
          name: 'Should Fail',
        })
        .expect(403);
    });

    it('should return 404 for non-existent project', async () => {
      await authenticatedRequest(app, pmToken)
        .patch('/projects/non-existent-id')
        .send({
          name: 'Should Fail',
        })
        .expect(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should archive project as PM', async () => {
      // Create a project to delete
      const project = await createTestProject(prisma, {
        clientId: testClientId,
        pmUserId: testUsers.pm.id,
        name: 'To Be Deleted',
      });

      await authenticatedRequest(app, pmToken)
        .delete(`/projects/${project.id}`)
        .expect(200);

      // Verify it's archived (not deleted)
      const archived = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(archived?.archivedAt).not.toBeNull();
    });

    it('should reject archive by non-PM', async () => {
      const project = await createTestProject(prisma, {
        clientId: testClientId,
        pmUserId: testUsers.pm.id,
        name: 'Cannot Delete',
      });

      await authenticatedRequest(app, designerToken)
        .delete(`/projects/${project.id}`)
        .expect(403);
    });
  });

  describe('Team Management', () => {
    let teamProject: any;

    beforeAll(async () => {
      teamProject = await createTestProject(prisma, {
        clientId: testClientId,
        pmUserId: testUsers.pm.id,
        name: 'Team Test Project',
      });
    });

    describe('GET /projects/:id/team', () => {
      it('should get project team members', async () => {
        const response = await authenticatedRequest(app, pmToken)
          .get(`/projects/${teamProject.id}/team`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('userId');
        expect(response.body[0]).toHaveProperty('role');
        expect(response.body[0]).toHaveProperty('user');
      });

      it('should reject non-member access', async () => {
        await authenticatedRequest(app, designerToken)
          .get(`/projects/${teamProject.id}/team`)
          .expect(403);
      });
    });

    describe('POST /projects/:id/team', () => {
      it('should add team member as PM', async () => {
        const response = await authenticatedRequest(app, pmToken)
          .post(`/projects/${teamProject.id}/team`)
          .send({
            userId: testUsers.designer.id,
            role: 'DESIGN',
            isPrimary: false,
          })
          .expect(201);

        expect(response.body.userId).toBe(testUsers.designer.id);
        expect(response.body.role).toBe('DESIGN');
      });

      it('should reject duplicate team member with same role', async () => {
        await authenticatedRequest(app, pmToken)
          .post(`/projects/${teamProject.id}/team`)
          .send({
            userId: testUsers.designer.id,
            role: 'DESIGN',
          })
          .expect(400);
      });

      it('should reject non-existent user', async () => {
        await authenticatedRequest(app, pmToken)
          .post(`/projects/${teamProject.id}/team`)
          .send({
            userId: 'non-existent-user-id',
            role: 'DESIGN',
          })
          .expect(404);
      });

      it('should reject unauthorized role', async () => {
        await authenticatedRequest(app, designerToken)
          .post(`/projects/${teamProject.id}/team`)
          .send({
            userId: testUsers.nvkd.id,
            role: 'NVKD',
          })
          .expect(403);
      });
    });

    describe('DELETE /projects/:id/team/:memberId', () => {
      it('should remove team member as PM', async () => {
        // Get team members
        const teamResponse = await authenticatedRequest(app, pmToken)
          .get(`/projects/${teamProject.id}/team`)
          .expect(200);

        const designerMember = teamResponse.body.find(
          (m: any) => m.userId === testUsers.designer.id,
        );

        await authenticatedRequest(app, pmToken)
          .delete(`/projects/${teamProject.id}/team/${designerMember.id}`)
          .expect(200);
      });

      it('should reject removing last PM', async () => {
        // Try to remove the primary PM
        const teamResponse = await authenticatedRequest(app, pmToken)
          .get(`/projects/${teamProject.id}/team`)
          .expect(200);

        const pmMember = teamResponse.body.find(
          (m: any) => m.role === 'PM' && m.isPrimary,
        );

        await authenticatedRequest(app, pmToken)
          .delete(`/projects/${teamProject.id}/team/${pmMember.id}`)
          .expect(400);
      });
    });
  });
});
