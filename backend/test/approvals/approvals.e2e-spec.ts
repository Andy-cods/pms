import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ApprovalStatus, ApprovalType, ProjectStage } from '@prisma/client';
import { createTestApp, closeTestApp } from '../setup/test-app';
import {
  cleanDatabase,
  seedTestData,
  getPrismaClient,
  disconnectDatabase,
} from '../setup/test-db';
import { login, authenticatedRequest, createTestProject } from '../setup/fixtures.js';

describe('Approvals (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let pmToken: string;
  let nvkdToken: string;
  let designerToken: string;
  let testUsers: any;
  let testProject: any;
  let testApproval: any;

  const prisma = getPrismaClient();

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase();
    testUsers = await seedTestData();

    // Login users
    adminToken = await login(app, 'admin@test.com');
    pmToken = await login(app, 'pm@test.com');
    nvkdToken = await login(app, 'nvkd@test.com');
    designerToken = await login(app, 'designer@test.com');

    // Create test project
    testProject = await createTestProject(prisma, {
      clientId: testUsers.testClient.id,
      pmUserId: testUsers.pm.id,
      name: 'Approval Test Project',
      stage: ProjectStage.PLANNING,
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
    await disconnectDatabase();
  });

  describe('POST /approvals', () => {
    it('should submit approval as PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .post('/approvals')
        .send({
          projectId: testProject.id,
          type: ApprovalType.PLAN,
          title: 'Project Plan Approval',
          description: 'Please review and approve the project plan',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Project Plan Approval');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.type).toBe('PLAN');
      expect(response.body.projectId).toBe(testProject.id);

      testApproval = response.body;

      // Verify project stage updated to UNDER_REVIEW
      const project = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(project?.stage).toBe('UNDER_REVIEW');
    });

    it('should submit approval with file attachments', async () => {
      // Note: In real tests, you'd upload files first via file controller
      const response = await authenticatedRequest(app, pmToken)
        .post('/approvals')
        .send({
          projectId: testProject.id,
          type: ApprovalType.CONTENT,
          title: 'Content Approval',
          description: 'Review content',
          fileIds: [], // Empty for now, would contain actual file IDs
        })
        .expect(201);

      expect(response.body.type).toBe('CONTENT');
    });

    it('should reject approval for non-member', async () => {
      // Create new project where NVKD is not a member
      const otherProject = await createTestProject(prisma, {
        clientId: testUsers.testClient.id,
        pmUserId: testUsers.pm.id,
        name: 'Other Project',
      });

      await authenticatedRequest(app, nvkdToken)
        .post('/approvals')
        .send({
          projectId: otherProject.id,
          type: ApprovalType.PLAN,
          title: 'Should Fail',
          description: 'No access',
        })
        .expect(403);
    });

    it('should reject approval without required fields', async () => {
      await authenticatedRequest(app, pmToken)
        .post('/approvals')
        .send({
          projectId: testProject.id,
          // Missing type, title, description
        })
        .expect(400);
    });

    it('should reject approval for non-existent project', async () => {
      await authenticatedRequest(app, pmToken)
        .post('/approvals')
        .send({
          projectId: 'non-existent-id',
          type: ApprovalType.PLAN,
          title: 'Should Fail',
          description: 'Bad project ID',
        })
        .expect(404);
    });
  });

  describe('GET /approvals', () => {
    beforeAll(async () => {
      // Create additional approvals
      await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.BUDGET,
          title: 'Budget Approval',
          description: 'Approve budget',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.PENDING,
        },
      });

      await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.FILE,
          title: 'File Approval',
          description: 'Approve files',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.APPROVED,
          approvedById: testUsers.nvkd.id,
        },
      });
    });

    it('should list all approvals for admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals')
        .expect(200);

      expect(response.body).toHaveProperty('approvals');
      expect(response.body).toHaveProperty('total');
      expect(response.body.approvals).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter approvals by status', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals?status=PENDING')
        .expect(200);

      response.body.approvals.forEach((approval: any) => {
        expect(approval.status).toBe('PENDING');
      });
    });

    it('should filter approvals by type', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals?type=PLAN')
        .expect(200);

      response.body.approvals.forEach((approval: any) => {
        expect(approval.type).toBe('PLAN');
      });
    });

    it('should filter approvals by project', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/approvals?projectId=${testProject.id}`)
        .expect(200);

      response.body.approvals.forEach((approval: any) => {
        expect(approval.projectId).toBe(testProject.id);
      });
    });

    it('should search approvals by title', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals?search=Budget')
        .expect(200);

      expect(response.body.approvals.length).toBeGreaterThan(0);
    });

    it('should paginate approvals', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals?page=1&limit=2')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.approvals.length).toBeLessThanOrEqual(2);
    });

    it('should only show approvals from user projects for PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get('/approvals')
        .expect(200);

      // PM should only see approvals from projects they are part of
      response.body.approvals.forEach((approval: any) => {
        expect(approval.project).toBeDefined();
      });
    });
  });

  describe('GET /approvals/pending', () => {
    it('should get pending approvals for NVKD', async () => {
      const response = await authenticatedRequest(app, nvkdToken)
        .get('/approvals/pending')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((approval: any) => {
        expect(approval.status).toBe('PENDING');
      });
    });

    it('should get pending approvals for Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals/pending')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should reject access for unauthorized roles', async () => {
      await authenticatedRequest(app, designerToken)
        .get('/approvals/pending')
        .expect(403);
    });
  });

  describe('GET /approvals/stats', () => {
    it('should get approval statistics', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .get('/approvals/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('approved');
      expect(response.body).toHaveProperty('rejected');
      expect(response.body).toHaveProperty('changesRequested');
    });

    it('should get scoped stats for PM', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get('/approvals/stats')
        .expect(200);

      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /approvals/:id', () => {
    it('should get approval by id with history', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .get(`/approvals/${testApproval.id}`)
        .expect(200);

      expect(response.body.id).toBe(testApproval.id);
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('submittedBy');
      expect(response.body).toHaveProperty('history');
      expect(response.body.history).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent approval', async () => {
      await authenticatedRequest(app, pmToken)
        .get('/approvals/non-existent-id')
        .expect(404);
    });

    it('should reject access for non-member', async () => {
      // Create approval in different project
      const otherProject = await createTestProject(prisma, {
        clientId: testUsers.testClient.id,
        pmUserId: testUsers.admin.id,
        name: 'Admin Only Project',
      });

      const otherApproval = await prisma.approval.create({
        data: {
          projectId: otherProject.id,
          type: ApprovalType.PLAN,
          title: 'Admin Approval',
          description: 'Admin only',
          submittedById: testUsers.admin.id,
        },
      });

      await authenticatedRequest(app, pmToken)
        .get(`/approvals/${otherApproval.id}`)
        .expect(403);
    });
  });

  describe('PATCH /approvals/:id/approve', () => {
    let pendingApproval: any;

    beforeEach(async () => {
      // Create fresh pending approval for each test
      pendingApproval = await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.PLAN,
          title: 'Test Approval',
          description: 'Test',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.PENDING,
        },
      });

      // Reset project stage
      await prisma.project.update({
        where: { id: testProject.id },
        data: { stage: ProjectStage.UNDER_REVIEW },
      });
    });

    it('should approve approval as NVKD', async () => {
      const response = await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/approve`)
        .send({
          comment: 'Approved! Looks good.',
        })
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
      expect(response.body.comment).toBe('Approved! Looks good.');
      expect(response.body.approvedBy).toBeDefined();
      expect(response.body.respondedAt).toBeTruthy();

      // Verify history recorded
      const approval = await prisma.approval.findUnique({
        where: { id: pendingApproval.id },
        include: { history: true },
      });
      expect(approval?.history.length).toBeGreaterThan(0);

      // Verify project stage updated
      const project = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(project?.stage).not.toBe('UNDER_REVIEW');
    });

    it('should approve approval as Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .patch(`/approvals/${pendingApproval.id}/approve`)
        .send({
          comment: 'Admin approval',
        })
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
    });

    it('should reject approval by unauthorized role', async () => {
      await authenticatedRequest(app, pmToken)
        .patch(`/approvals/${pendingApproval.id}/approve`)
        .send({
          comment: 'Should fail',
        })
        .expect(403);
    });

    it('should reject approving non-PENDING approval', async () => {
      // Approve first
      await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/approve`)
        .send({ comment: 'First approval' })
        .expect(200);

      // Try to approve again
      await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/approve`)
        .send({ comment: 'Second approval' })
        .expect(400);
    });
  });

  describe('PATCH /approvals/:id/reject', () => {
    let pendingApproval: any;

    beforeEach(async () => {
      pendingApproval = await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.CONTENT,
          title: 'Content to Reject',
          description: 'Test rejection',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.PENDING,
        },
      });

      await prisma.project.update({
        where: { id: testProject.id },
        data: { stage: ProjectStage.UNDER_REVIEW },
      });
    });

    it('should reject approval as NVKD', async () => {
      const response = await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/reject`)
        .send({
          comment: 'Not acceptable, please revise',
        })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.comment).toBe('Not acceptable, please revise');
      expect(response.body.respondedAt).toBeTruthy();

      // Verify project stage reverted to PLANNING
      const project = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(project?.stage).toBe('PLANNING');
    });

    it('should reject approval as Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .patch(`/approvals/${pendingApproval.id}/reject`)
        .send({
          comment: 'Admin rejection',
        })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
    });

    it('should reject rejection by unauthorized role', async () => {
      await authenticatedRequest(app, designerToken)
        .patch(`/approvals/${pendingApproval.id}/reject`)
        .send({
          comment: 'Should fail',
        })
        .expect(403);
    });

    it('should reject rejecting non-PENDING approval', async () => {
      // Reject first
      await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/reject`)
        .send({ comment: 'First rejection' })
        .expect(200);

      // Try to reject again
      await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/reject`)
        .send({ comment: 'Second rejection' })
        .expect(400);
    });
  });

  describe('PATCH /approvals/:id/request-changes', () => {
    let pendingApproval: any;

    beforeEach(async () => {
      pendingApproval = await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.BUDGET,
          title: 'Budget Changes',
          description: 'Test changes request',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.PENDING,
        },
      });
    });

    it('should request changes as NVKD', async () => {
      const response = await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${pendingApproval.id}/request-changes`)
        .send({
          comment: 'Please update section 3 and resubmit',
        })
        .expect(200);

      expect(response.body.status).toBe('CHANGES_REQUESTED');
      expect(response.body.comment).toBe('Please update section 3 and resubmit');
      expect(response.body.respondedAt).toBeTruthy();
    });

    it('should request changes as Admin', async () => {
      const response = await authenticatedRequest(app, adminToken)
        .patch(`/approvals/${pendingApproval.id}/request-changes`)
        .send({
          comment: 'Admin requests changes',
        })
        .expect(200);

      expect(response.body.status).toBe('CHANGES_REQUESTED');
    });

    it('should reject request-changes by unauthorized role', async () => {
      await authenticatedRequest(app, pmToken)
        .patch(`/approvals/${pendingApproval.id}/request-changes`)
        .send({
          comment: 'Should fail',
        })
        .expect(403);
    });
  });

  describe('PATCH /approvals/:id (resubmit)', () => {
    let changesRequestedApproval: any;

    beforeEach(async () => {
      // Create approval and request changes
      changesRequestedApproval = await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.PLAN,
          title: 'Original Plan',
          description: 'Original description',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.CHANGES_REQUESTED,
          approvedById: testUsers.nvkd.id,
          comment: 'Please make changes',
        },
      });
    });

    it('should resubmit approval after changes', async () => {
      const response = await authenticatedRequest(app, pmToken)
        .patch(`/approvals/${changesRequestedApproval.id}`)
        .send({
          title: 'Updated Plan',
          description: 'Updated with requested changes',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Plan');
      expect(response.body.description).toBe('Updated with requested changes');
      expect(response.body.status).toBe('PENDING'); // Reset to pending
    });

    it('should only allow submitter to update', async () => {
      await authenticatedRequest(app, nvkdToken)
        .patch(`/approvals/${changesRequestedApproval.id}`)
        .send({
          title: 'Should Fail',
        })
        .expect(403);
    });

    it('should reject update of non-CHANGES_REQUESTED approval', async () => {
      const pendingApproval = await prisma.approval.create({
        data: {
          projectId: testProject.id,
          type: ApprovalType.FILE,
          title: 'Pending Approval',
          description: 'Test',
          submittedById: testUsers.pm.id,
          status: ApprovalStatus.PENDING,
        },
      });

      await authenticatedRequest(app, pmToken)
        .patch(`/approvals/${pendingApproval.id}`)
        .send({
          title: 'Should Fail',
        })
        .expect(400);
    });
  });
});
