import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPhaseService } from '../project-phase.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';

describe('ProjectPhaseService', () => {
  let service: ProjectPhaseService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectPhaseService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProjectPhaseService>(ProjectPhaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDefaultPhases', () => {
    it('should call $transaction to create phases', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const txPrisma = {
          projectPhase: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(txPrisma);
      });

      await service.createDefaultPhases('project-123');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('recalculatePhaseProgress', () => {
    it('should calculate progress correctly with completed items', async () => {
      const phaseId = 'phase-123';

      // Service calls projectPhaseItem.findMany (not projectPhase.findUnique)
      prisma.projectPhaseItem.findMany.mockResolvedValue([
        { weight: 30, isComplete: true },
        { weight: 40, isComplete: true },
        { weight: 30, isComplete: false },
      ]);

      prisma.projectPhase.update.mockResolvedValue({
        id: phaseId,
        projectId: 'project-123',
        progress: 70,
      });

      // Spy on cascading method to prevent deeper calls
      jest.spyOn(service, 'recalculateProjectProgress').mockResolvedValue(70);

      const result = await service.recalculatePhaseProgress(phaseId);

      expect(result).toBe(70); // (30 + 40) / 100 * 100 = 70%
      expect(prisma.projectPhaseItem.findMany).toHaveBeenCalledWith({
        where: { phaseId },
        select: { weight: true, isComplete: true },
      });
      expect(prisma.projectPhase.update).toHaveBeenCalledWith({
        where: { id: phaseId },
        data: { progress: 70 },
      });
    });

    it('should return 0 when no items exist (totalWeight is 0)', async () => {
      prisma.projectPhaseItem.findMany.mockResolvedValue([]);

      const result = await service.recalculatePhaseProgress('phase-empty');

      expect(result).toBe(0);
      // Should NOT call update when totalWeight is 0
      expect(prisma.projectPhase.update).not.toHaveBeenCalled();
    });

    it('should return 100 when all items are completed', async () => {
      prisma.projectPhaseItem.findMany.mockResolvedValue([
        { weight: 50, isComplete: true },
        { weight: 50, isComplete: true },
      ]);
      prisma.projectPhase.update.mockResolvedValue({
        id: 'phase-1',
        projectId: 'project-1',
        progress: 100,
      });
      jest.spyOn(service, 'recalculateProjectProgress').mockResolvedValue(100);

      const result = await service.recalculatePhaseProgress('phase-1');

      expect(result).toBe(100);
    });

    it('should round progress to nearest integer', async () => {
      prisma.projectPhaseItem.findMany.mockResolvedValue([
        { weight: 33, isComplete: true },
        { weight: 33, isComplete: false },
        { weight: 34, isComplete: false },
      ]);
      prisma.projectPhase.update.mockResolvedValue({
        id: 'phase-1',
        projectId: 'project-1',
        progress: 33,
      });
      jest.spyOn(service, 'recalculateProjectProgress').mockResolvedValue(33);

      const result = await service.recalculatePhaseProgress('phase-1');

      expect(result).toBe(33); // 33/100 = 33%
    });

    it('should cascade to recalculateProjectProgress', async () => {
      prisma.projectPhaseItem.findMany.mockResolvedValue([
        { weight: 100, isComplete: true },
      ]);
      prisma.projectPhase.update.mockResolvedValue({
        id: 'phase-1',
        projectId: 'project-xyz',
        progress: 100,
      });

      const spy = jest
        .spyOn(service, 'recalculateProjectProgress')
        .mockResolvedValue(50);

      await service.recalculatePhaseProgress('phase-1');

      expect(spy).toHaveBeenCalledWith('project-xyz');
    });
  });

  describe('recalculateProjectProgress', () => {
    it('should calculate weighted progress from phases', async () => {
      const projectId = 'project-123';

      prisma.projectPhase.findMany.mockResolvedValue([
        { weight: 20, progress: 100 }, // 20 * 100 = 2000
        { weight: 30, progress: 50 }, // 30 * 50 = 1500
        { weight: 50, progress: 0 }, // 50 * 0 = 0
      ]);
      // Total weight: 100, weighted sum: 3500
      // Progress: 3500 / 100 = 35

      prisma.project.update.mockResolvedValue({});

      const result = await service.recalculateProjectProgress(projectId);

      expect(result).toBe(35);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { stageProgress: 35 },
      });
    });

    it('should return 0 when no phases exist (totalWeight is 0)', async () => {
      prisma.projectPhase.findMany.mockResolvedValue([]);

      const result = await service.recalculateProjectProgress('project-empty');

      expect(result).toBe(0);
      // Should NOT call project.update when totalWeight is 0
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 100 when all phases fully complete', async () => {
      prisma.projectPhase.findMany.mockResolvedValue([
        { weight: 25, progress: 100 },
        { weight: 25, progress: 100 },
        { weight: 25, progress: 100 },
        { weight: 25, progress: 100 },
      ]);
      prisma.project.update.mockResolvedValue({});

      const result = await service.recalculateProjectProgress('project-1');

      expect(result).toBe(100);
    });

    it('should handle phases with different weights', async () => {
      prisma.projectPhase.findMany.mockResolvedValue([
        { weight: 10, progress: 100 }, // 1000
        { weight: 90, progress: 0 }, // 0
      ]);
      // Total: 100, sum: 1000, progress: 10
      prisma.project.update.mockResolvedValue({});

      const result = await service.recalculateProjectProgress('project-1');

      expect(result).toBe(10);
    });

    it('should round weighted progress', async () => {
      prisma.projectPhase.findMany.mockResolvedValue([
        { weight: 33, progress: 50 }, // 1650
        { weight: 33, progress: 75 }, // 2475
        { weight: 34, progress: 25 }, // 850
      ]);
      // Total: 100, sum: 4975, progress: 49.75 -> 50
      prisma.project.update.mockResolvedValue({});

      const result = await service.recalculateProjectProgress('project-1');

      expect(result).toBe(50);
    });
  });
});
