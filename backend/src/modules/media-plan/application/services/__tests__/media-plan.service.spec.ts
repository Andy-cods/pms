import { Test, TestingModule } from '@nestjs/testing';
import { MediaPlanService } from '../media-plan.service';
import { PrismaService } from '../../../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../../../test-utils/prisma.mock';
import { MEDIA_PLAN_REPOSITORY } from '../../../domain/interfaces/media-plan.repository.interface';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('MediaPlanService', () => {
  let service: MediaPlanService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: Record<string, jest.Mock>;

  const mockUser = { sub: 'user-1', role: UserRole.PM };
  const adminUser = { sub: 'admin-1', role: UserRole.SUPER_ADMIN };
  const contentUser = { sub: 'user-3', role: UserRole.CONTENT };

  const mockItem = (overrides = {}) => ({
    id: 'item-1',
    mediaPlanId: 'plan-1',
    channel: 'Facebook',
    campaignType: 'Awareness',
    objective: 'Reach',
    budget: 5000,
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-01-20'),
    targetReach: 10000,
    targetClicks: 500,
    targetLeads: 50,
    targetCPL: 100,
    targetCPC: 10,
    targetROAS: 3,
    status: 'ACTIVE',
    orderIndex: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });

  const mockPlan = (overrides: Record<string, unknown> = {}) => ({
    id: 'plan-1',
    projectId: 'project-1',
    name: 'Test Plan',
    type: 'MONTHLY',
    month: 1,
    year: 2026,
    version: 1,
    status: 'DRAFT',
    totalBudget: 10000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    notes: null,
    createdBy: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
    items: [] as ReturnType<typeof mockItem>[],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: 'user-1',
    ...overrides,
  });

  const mockProject = (overrides = {}) => ({
    id: 'project-1',
    team: [{ userId: 'user-1', role: UserRole.PM }],
    ...overrides,
  });

  beforeEach(async () => {
    prisma = createPrismaMock();
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      reorderItems: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaPlanService,
        { provide: PrismaService, useValue: prisma },
        { provide: MEDIA_PLAN_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get<MediaPlanService>(MediaPlanService);
    prisma.project.findUnique.mockResolvedValue(mockProject());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated data with default pagination', async () => {
      const plans = [mockPlan(), mockPlan({ id: 'plan-2' })];
      repository.findAll.mockResolvedValue({ data: plans, total: 2 });

      const result = await service.findAll('project-1', {}, mockUser);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      );
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should use provided pagination parameters', async () => {
      repository.findAll.mockResolvedValue({ data: [mockPlan()], total: 10 });

      const result = await service.findAll(
        'project-1',
        { page: 2, limit: 5, sortBy: 'name', sortOrder: 'asc' } as any,
        mockUser,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 5,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      );
      expect(result.totalPages).toBe(2);
    });

    it('should handle empty results', async () => {
      repository.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll('project-1', {}, mockUser);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return media plan by id', async () => {
      repository.findById.mockResolvedValue(mockPlan());

      const result = await service.findById('project-1', 'plan-1', mockUser);

      expect(repository.findById).toHaveBeenCalledWith('plan-1', 'project-1');
      expect(result).toHaveProperty('id', 'plan-1');
    });

    it('should throw NotFoundException when plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findById('project-1', 'plan-1', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create media plan and log ALLOC budget event', async () => {
      const dto = {
        name: 'New Plan',
        type: 'MONTHLY',
        month: 2,
        year: 2026,
        totalBudget: 15000,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      };
      const createdPlan = mockPlan({ name: 'New Plan', totalBudget: 15000 });
      repository.create.mockResolvedValue(createdPlan);
      prisma.budgetEvent.create.mockResolvedValue({ id: 'event-1' });

      const result = await service.create('project-1', dto as any, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          name: 'New Plan',
          totalBudget: 15000,
          createdById: 'user-1',
        }),
      );
      expect(prisma.budgetEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          mediaPlanId: createdPlan.id,
          amount: 15000,
          type: 'ALLOC',
          createdById: 'user-1',
        }),
      });
      expect(result).toHaveProperty('id');
    });

    it('should throw BadRequestException when end date before start date', async () => {
      const dto = {
        name: 'Invalid Plan',
        type: 'MONTHLY',
        month: 2,
        year: 2026,
        totalBudget: 15000,
        startDate: '2026-02-28',
        endDate: '2026-02-01',
      };

      await expect(
        service.create('project-1', dto as any, mockUser),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should require edit permission', async () => {
      prisma.project.findUnique.mockResolvedValue(
        mockProject({ team: [{ userId: 'user-3', role: UserRole.CONTENT }] }),
      );
      const dto = {
        name: 'New Plan',
        type: 'MONTHLY',
        month: 2,
        year: 2026,
        totalBudget: 15000,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      };

      await expect(
        service.create('project-1', dto as any, contentUser),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update media plan successfully', async () => {
      const existingPlan = mockPlan();
      const updatedPlan = mockPlan({ name: 'Updated Plan' });
      repository.findById.mockResolvedValue(existingPlan);
      repository.update.mockResolvedValue(updatedPlan);

      const result = await service.update(
        'project-1',
        'plan-1',
        { name: 'Updated Plan' } as any,
        mockUser,
      );

      expect(repository.findById).toHaveBeenCalledWith('plan-1', 'project-1');
      expect(repository.update).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({ name: 'Updated Plan' }),
      );
      expect(result).toHaveProperty('name', 'Updated Plan');
      expect(prisma.budgetEvent.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(
          'project-1',
          'plan-1',
          { name: 'Updated' } as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should validate dates when changed', async () => {
      const existingPlan = mockPlan();
      repository.findById.mockResolvedValue(existingPlan);

      await expect(
        service.update(
          'project-1',
          'plan-1',
          { startDate: '2026-02-28', endDate: '2026-02-01' } as any,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should log ADJUST budget event when totalBudget changes', async () => {
      const existingPlan = mockPlan({ totalBudget: 10000 });
      const updatedPlan = mockPlan({ totalBudget: 20000 });
      repository.findById.mockResolvedValue(existingPlan);
      repository.update.mockResolvedValue(updatedPlan);
      prisma.budgetEvent.create.mockResolvedValue({ id: 'event-2' });

      await service.update(
        'project-1',
        'plan-1',
        { totalBudget: 20000 } as any,
        mockUser,
      );

      expect(prisma.budgetEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          mediaPlanId: 'plan-1',
          amount: 20000,
          type: 'ADJUST',
          createdById: 'user-1',
        }),
      });
    });
  });

  describe('delete', () => {
    it('should delete media plan successfully', async () => {
      repository.findById.mockResolvedValue(mockPlan());
      repository.delete.mockResolvedValue(undefined);

      await service.delete('project-1', 'plan-1', mockUser);

      expect(repository.findById).toHaveBeenCalledWith('plan-1', 'project-1');
      expect(repository.delete).toHaveBeenCalledWith('plan-1');
    });

    it('should throw NotFoundException when plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete('project-1', 'plan-1', mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add item to media plan successfully', async () => {
      const dto = {
        channel: 'Facebook',
        campaignType: 'Awareness',
        objective: 'Reach',
        budget: 5000,
        startDate: '2026-01-10',
        endDate: '2026-01-20',
      };
      const existingPlan = mockPlan();
      const updatedPlan = mockPlan({ items: [mockItem()] });
      repository.findById
        .mockResolvedValueOnce(existingPlan)
        .mockResolvedValueOnce(updatedPlan);
      repository.createItem.mockResolvedValue({ id: 'item-1' });

      const result = await service.addItem(
        'project-1',
        'plan-1',
        dto as any,
        mockUser,
      );

      expect(repository.findById).toHaveBeenCalledWith('plan-1', 'project-1');
      expect(repository.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ mediaPlanId: 'plan-1', channel: 'Facebook' }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.addItem(
          'project-1',
          'plan-1',
          {
            channel: 'FB',
            campaignType: 'a',
            objective: 'b',
            budget: 1000,
            startDate: '2026-01-01',
            endDate: '2026-01-31',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.createItem).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update item in media plan successfully', async () => {
      const existingPlan = mockPlan({ items: [mockItem()] });
      const updatedPlan = mockPlan({ items: [mockItem({ budget: 6000 })] });
      repository.findById
        .mockResolvedValueOnce(existingPlan)
        .mockResolvedValueOnce(updatedPlan);
      repository.updateItem.mockResolvedValue({ id: 'item-1' });

      const result = await service.updateItem(
        'project-1',
        'plan-1',
        'item-1',
        { budget: 6000 } as any,
        mockUser,
      );

      expect(repository.updateItem).toHaveBeenCalledWith(
        'item-1',
        expect.objectContaining({ budget: 6000 }),
      );
      expect(result.items[0].budget).toBe(6000);
    });

    it('should throw NotFoundException when item not in plan', async () => {
      repository.findById.mockResolvedValue(mockPlan({ items: [] }));

      await expect(
        service.updateItem(
          'project-1',
          'plan-1',
          'item-1',
          {} as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should delete item from media plan successfully', async () => {
      repository.findById.mockResolvedValue(mockPlan({ items: [mockItem()] }));
      repository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem('project-1', 'plan-1', 'item-1', mockUser);

      expect(repository.deleteItem).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundException when item not in plan', async () => {
      repository.findById.mockResolvedValue(mockPlan({ items: [] }));

      await expect(
        service.deleteItem('project-1', 'plan-1', 'item-1', mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(repository.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('reorderItems', () => {
    it('should reorder items in media plan successfully', async () => {
      const item1 = mockItem({ id: 'item-1', orderIndex: 0 });
      const item2 = mockItem({
        id: 'item-2',
        channel: 'Google',
        orderIndex: 1,
      });
      const existingPlan = mockPlan({ items: [item1, item2] });
      const reorderedPlan = mockPlan({ items: [item2, item1] });
      repository.findById
        .mockResolvedValueOnce(existingPlan)
        .mockResolvedValueOnce(reorderedPlan);
      repository.reorderItems.mockResolvedValue(undefined);

      const result = await service.reorderItems(
        'project-1',
        'plan-1',
        { itemIds: ['item-2', 'item-1'] } as any,
        mockUser,
      );

      expect(repository.reorderItems).toHaveBeenCalledWith('plan-1', [
        'item-2',
        'item-1',
      ]);
      expect(result.items[0].id).toBe('item-2');
    });

    it('should throw NotFoundException when plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.reorderItems(
          'project-1',
          'plan-1',
          { itemIds: [] } as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.reorderItems).not.toHaveBeenCalled();
    });
  });

  describe('checkProjectAccess', () => {
    it('should throw NotFoundException when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findAll('project-1', {}, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user not member of project', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject({ team: [] }));

      await expect(service.findAll('project-1', {}, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when requireEdit and user lacks edit role', async () => {
      prisma.project.findUnique.mockResolvedValue(
        mockProject({ team: [{ userId: 'user-3', role: UserRole.CONTENT }] }),
      );

      await expect(
        service.create(
          'project-1',
          {
            name: 'Test',
            type: 'MONTHLY',
            month: 1,
            year: 2026,
            totalBudget: 10000,
            startDate: '2026-01-01',
            endDate: '2026-01-31',
          } as any,
          contentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateDates', () => {
    it('should throw BadRequestException when end date before start date', async () => {
      await expect(
        service.create(
          'project-1',
          {
            name: 'Test Plan',
            type: 'MONTHLY',
            month: 1,
            year: 2026,
            totalBudget: 10000,
            startDate: '2026-01-31',
            endDate: '2026-01-01',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
