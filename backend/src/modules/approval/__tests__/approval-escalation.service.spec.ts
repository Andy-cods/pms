import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalEscalationService } from '../approval-escalation.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';

describe('ApprovalEscalationService', () => {
  let service: ApprovalEscalationService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const APPROVAL_STATUS_PENDING = 'PENDING';

  const createMockApproval = (overrides: Record<string, unknown> = {}) => ({
    id: 'approval-1',
    title: 'Test Approval',
    status: APPROVAL_STATUS_PENDING,
    escalationLevel: 0,
    submittedAt: new Date(),
    escalatedAt: null,
    submittedById: 'user-1',
    project: {
      id: 'project-1',
      name: 'Test Project',
      dealCode: 'PRJ-001',
      team: [],
    },
    submittedBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    ...overrides,
  });

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalEscalationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ApprovalEscalationService>(ApprovalEscalationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPendingApprovals', () => {
    it('should not escalate when no pending approvals exist', async () => {
      prisma.approval.findMany.mockResolvedValue([]);

      await service.checkPendingApprovals();

      expect(prisma.approval.findMany).toHaveBeenCalled();
      expect(prisma.approval.update).not.toHaveBeenCalled();
      expect(prisma.approvalHistory.create).not.toHaveBeenCalled();
    });

    it('should not escalate approval pending less than 24 hours', async () => {
      const now = new Date();
      const mockApproval = createMockApproval({
        submittedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000), // 20 hours ago
        escalationLevel: 0,
      });

      prisma.approval.findMany.mockResolvedValue([mockApproval]);

      await service.checkPendingApprovals();

      expect(prisma.approval.update).not.toHaveBeenCalled();
      expect(prisma.approvalHistory.create).not.toHaveBeenCalled();
    });

    it('should escalate to level 1 when pending for 25 hours', async () => {
      const now = new Date();
      const mockApproval = createMockApproval({
        id: 'approval-1',
        submittedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        escalationLevel: 0,
      });

      prisma.approval.findMany.mockResolvedValue([mockApproval]);
      prisma.approval.update.mockResolvedValue({
        ...mockApproval,
        escalationLevel: 1,
      });
      prisma.approvalHistory.create.mockResolvedValue({});

      await service.checkPendingApprovals();

      expect(prisma.approval.update).toHaveBeenCalledWith({
        where: { id: 'approval-1' },
        data: {
          escalationLevel: 1,
          escalatedAt: expect.any(Date),
        },
      });
      expect(prisma.approvalHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalId: 'approval-1',
          fromStatus: APPROVAL_STATUS_PENDING,
          toStatus: APPROVAL_STATUS_PENDING,
        }),
      });
    });

    it('should escalate to level 2 when pending for 49 hours', async () => {
      const now = new Date();
      const mockApproval = createMockApproval({
        id: 'approval-2',
        submittedAt: new Date(now.getTime() - 49 * 60 * 60 * 1000),
        escalationLevel: 1,
      });

      prisma.approval.findMany.mockResolvedValue([mockApproval]);
      prisma.approval.update.mockResolvedValue({
        ...mockApproval,
        escalationLevel: 2,
      });
      prisma.approvalHistory.create.mockResolvedValue({});

      await service.checkPendingApprovals();

      expect(prisma.approval.update).toHaveBeenCalledWith({
        where: { id: 'approval-2' },
        data: {
          escalationLevel: 2,
          escalatedAt: expect.any(Date),
        },
      });
    });

    it('should escalate to level 3 when pending for 73 hours', async () => {
      const now = new Date();
      const mockApproval = createMockApproval({
        id: 'approval-3',
        submittedAt: new Date(now.getTime() - 73 * 60 * 60 * 1000),
        escalationLevel: 2,
      });

      prisma.approval.findMany.mockResolvedValue([mockApproval]);
      prisma.approval.update.mockResolvedValue({
        ...mockApproval,
        escalationLevel: 3,
      });
      prisma.approvalHistory.create.mockResolvedValue({});

      await service.checkPendingApprovals();

      expect(prisma.approval.update).toHaveBeenCalledWith({
        where: { id: 'approval-3' },
        data: {
          escalationLevel: 3,
          escalatedAt: expect.any(Date),
        },
      });
    });

    it('should not escalate when already at same level', async () => {
      const now = new Date();
      const mockApproval = createMockApproval({
        submittedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        escalationLevel: 1, // Already at level 1
      });

      prisma.approval.findMany.mockResolvedValue([mockApproval]);

      await service.checkPendingApprovals();

      expect(prisma.approval.update).not.toHaveBeenCalled();
    });

    it('should handle multiple approvals with different escalation needs', async () => {
      const now = new Date();
      const mockApprovals = [
        createMockApproval({
          id: 'no-escalate',
          submittedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10h - no escalation
          escalationLevel: 0,
        }),
        createMockApproval({
          id: 'escalate-1',
          submittedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000), // 30h - level 1
          escalationLevel: 0,
        }),
        createMockApproval({
          id: 'escalate-2',
          submittedAt: new Date(now.getTime() - 50 * 60 * 60 * 1000), // 50h - level 2
          escalationLevel: 1,
        }),
      ];

      prisma.approval.findMany.mockResolvedValue(mockApprovals);
      prisma.approval.update.mockResolvedValue({});
      prisma.approvalHistory.create.mockResolvedValue({});

      await service.checkPendingApprovals();

      // 2 approvals should be escalated (30h and 50h ones)
      expect(prisma.approval.update).toHaveBeenCalledTimes(2);
      expect(prisma.approvalHistory.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('triggerEscalationCheck', () => {
    it('should return checked and escalated counts', async () => {
      prisma.approval.count.mockResolvedValueOnce(5); // pending before
      prisma.approval.findMany.mockResolvedValue([]); // no approvals to escalate
      prisma.approval.count.mockResolvedValueOnce(0); // recently escalated

      const result = await service.triggerEscalationCheck();

      expect(result).toEqual({
        checked: 5,
        escalated: 0,
      });
      expect(prisma.approval.count).toHaveBeenCalledTimes(2);
    });

    it('should return zero counts when no approvals exist', async () => {
      prisma.approval.count.mockResolvedValue(0);
      prisma.approval.findMany.mockResolvedValue([]);

      const result = await service.triggerEscalationCheck();

      expect(result).toEqual({
        checked: 0,
        escalated: 0,
      });
    });
  });
});
