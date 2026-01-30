import { Test, TestingModule } from '@nestjs/testing';
import { BudgetEventService } from '../budget-event.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';
import { NotFoundException } from '@nestjs/common';

describe('BudgetEventService', () => {
  let service: BudgetEventService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockBudgetEvent = (overrides = {}) => ({
    id: 'event-1',
    projectId: 'project-1',
    mediaPlanId: null,
    stage: 'PLANNING',
    amount: 1000,
    type: 'SPEND',
    category: 'ADS',
    status: 'PENDING',
    note: 'Test event',
    createdById: 'user-1',
    createdBy: { id: 'user-1', name: 'Test User' },
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetEventService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<BudgetEventService>(BudgetEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all budget events without filters', async () => {
      const events = [mockBudgetEvent(), mockBudgetEvent({ id: 'event-2' })];
      prisma.budgetEvent.findMany.mockResolvedValue(events);

      const result = await service.list('project-1', {});

      expect(prisma.budgetEvent.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1000);
    });

    it('should filter by stage', async () => {
      const events = [mockBudgetEvent({ stage: 'PLANNING' })];
      prisma.budgetEvent.findMany.mockResolvedValue(events);

      await service.list('project-1', { stage: 'PLANNING' });

      expect(prisma.budgetEvent.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1', stage: 'PLANNING' },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by category', async () => {
      const events = [mockBudgetEvent({ category: 'ADS' })];
      prisma.budgetEvent.findMany.mockResolvedValue(events);

      await service.list('project-1', { category: 'ADS' });

      expect(prisma.budgetEvent.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1', category: 'ADS' },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no events found', async () => {
      prisma.budgetEvent.findMany.mockResolvedValue([]);

      const result = await service.list('project-1', {});

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createDto = {
      stage: 'PLANNING',
      amount: 1000,
      type: 'SPEND',
      category: 'ADS',
      note: 'Test event',
    };

    it('should create budget event successfully', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.budgetEvent.create.mockResolvedValue(mockBudgetEvent());
      // createDto has type: 'SPEND', so recalcSpent is triggered
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      prisma.project.update.mockResolvedValue(mockProject);

      const result = await service.create('project-1', 'user-1', createDto);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        select: { id: true },
      });
      expect(prisma.budgetEvent.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          createdById: 'user-1',
          ...createDto,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      expect(result.amount).toBe(1000);
    });

    it('should throw NotFoundException when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create('invalid-project', 'user-1', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate mediaPlanId when provided', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      const mockMediaPlan = { id: 'media-1', projectId: 'project-1' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.mediaPlan.findUnique.mockResolvedValue(mockMediaPlan);
      prisma.budgetEvent.create.mockResolvedValue(
        mockBudgetEvent({ mediaPlanId: 'media-1' }),
      );
      // createDto has type: 'SPEND', so recalcSpent is triggered
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      prisma.project.update.mockResolvedValue(mockProject);

      const dtoWithMedia = { ...createDto, mediaPlanId: 'media-1' };
      await service.create('project-1', 'user-1', dtoWithMedia);

      expect(prisma.mediaPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        select: { id: true, projectId: true },
      });
    });

    it('should throw NotFoundException when mediaPlan not found', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.mediaPlan.findUnique.mockResolvedValue(null);

      const dtoWithMedia = { ...createDto, mediaPlanId: 'invalid-media' };
      await expect(
        service.create('project-1', 'user-1', dtoWithMedia),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when mediaPlan belongs to wrong project', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      const mockMediaPlan = { id: 'media-1', projectId: 'project-2' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.mediaPlan.findUnique.mockResolvedValue(mockMediaPlan);

      const dtoWithMedia = { ...createDto, mediaPlanId: 'media-1' };
      await expect(
        service.create('project-1', 'user-1', dtoWithMedia),
      ).rejects.toThrow(NotFoundException);
    });

    it('should trigger recalcSpent when type is SPEND', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.budgetEvent.create.mockResolvedValue(
        mockBudgetEvent({ type: 'SPEND' }),
      );
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      prisma.project.update.mockResolvedValue(mockProject);

      const spendDto = { ...createDto, type: 'SPEND' };
      await service.create('project-1', 'user-1', spendDto);

      expect(prisma.budgetEvent.aggregate).toHaveBeenCalled();
      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('should not trigger recalcSpent when type is not SPEND', async () => {
      const mockProject = { id: 'project-1', totalBudget: 10000 };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.budgetEvent.create.mockResolvedValue(
        mockBudgetEvent({ type: 'ALLOCATION' }),
      );

      const nonSpendDto = { ...createDto, type: 'ALLOCATION' };
      await service.create('project-1', 'user-1', nonSpendDto);

      expect(prisma.budgetEvent.aggregate).not.toHaveBeenCalled();
      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const updateDto = { status: 'APPROVED' };

    it('should update status successfully', async () => {
      const event = mockBudgetEvent();
      prisma.budgetEvent.findFirst.mockResolvedValue(event);
      prisma.budgetEvent.update.mockResolvedValue({
        ...event,
        status: 'APPROVED',
      });
      // Default mockBudgetEvent has type: 'SPEND', so recalcSpent is triggered
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      prisma.project.update.mockResolvedValue({ id: 'project-1' });

      const result = await service.updateStatus(
        'event-1',
        'project-1',
        updateDto,
      );

      expect(prisma.budgetEvent.findFirst).toHaveBeenCalledWith({
        where: { id: 'event-1', projectId: 'project-1' },
      });
      expect(prisma.budgetEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { status: 'APPROVED' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('should throw NotFoundException when event not found', async () => {
      prisma.budgetEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-event', 'project-1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should trigger recalcSpent when event type is SPEND', async () => {
      const event = mockBudgetEvent({ type: 'SPEND' });
      prisma.budgetEvent.findFirst.mockResolvedValue(event);
      prisma.budgetEvent.update.mockResolvedValue({
        ...event,
        status: 'APPROVED',
      });
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });
      prisma.project.update.mockResolvedValue({ id: 'project-1' });

      await service.updateStatus('event-1', 'project-1', updateDto);

      expect(prisma.budgetEvent.aggregate).toHaveBeenCalled();
      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('should not trigger recalcSpent when event type is not SPEND', async () => {
      const event = mockBudgetEvent({ type: 'ALLOCATION' });
      prisma.budgetEvent.findFirst.mockResolvedValue(event);
      prisma.budgetEvent.update.mockResolvedValue({
        ...event,
        status: 'APPROVED',
      });

      await service.updateStatus('event-1', 'project-1', updateDto);

      expect(prisma.budgetEvent.aggregate).not.toHaveBeenCalled();
      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('recalcSpent', () => {
    it('should calculate and update spent amount correctly', async () => {
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      });
      prisma.project.update.mockResolvedValue({
        id: 'project-1',
        spentAmount: 5000,
      });

      await service.recalcSpent('project-1');

      expect(prisma.budgetEvent.aggregate).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          type: 'SPEND',
          status: 'APPROVED',
        },
        _sum: { amount: true },
      });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { spentAmount: 5000 },
      });
    });

    it('should default to 0 when sum is null', async () => {
      prisma.budgetEvent.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });
      prisma.project.update.mockResolvedValue({
        id: 'project-1',
        spentAmount: 0,
      });

      await service.recalcSpent('project-1');

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { spentAmount: 0 },
      });
    });
  });

  describe('getThreshold', () => {
    it('should return ok level with 0 percent when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const result = await service.getThreshold('invalid-project');

      expect(result).toEqual({ level: 'ok', percent: 0 });
    });

    it('should return ok level with 0 percent when totalBudget is 0', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        totalBudget: 0,
        spentAmount: 0,
      });

      const result = await service.getThreshold('project-1');

      expect(result).toEqual({ level: 'ok', percent: 0 });
    });

    it('should calculate percentage correctly', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        totalBudget: 10000,
        spentAmount: 5000,
      });

      const result = await service.getThreshold('project-1');

      expect(result.percent).toBe(50);
    });

    it('should return critical level when percent >= 100', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        totalBudget: 10000,
        spentAmount: 11000,
      });

      const result = await service.getThreshold('project-1');

      expect(result.level).toBe('critical');
      expect(result.percent).toBe(110);
    });

    it('should return warning level when percent >= 80 and < 100', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        totalBudget: 10000,
        spentAmount: 8500,
      });

      const result = await service.getThreshold('project-1');

      expect(result.level).toBe('warning');
      expect(result.percent).toBe(85);
    });

    it('should return ok level when percent < 80', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        totalBudget: 10000,
        spentAmount: 5000,
      });

      const result = await service.getThreshold('project-1');

      expect(result.level).toBe('ok');
      expect(result.percent).toBe(50);
    });
  });
});
