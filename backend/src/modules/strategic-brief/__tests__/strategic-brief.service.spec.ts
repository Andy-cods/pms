import { Test, TestingModule } from '@nestjs/testing';
import { StrategicBriefService } from '../strategic-brief.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';
import { BadRequestException } from '@nestjs/common';

describe('StrategicBriefService', () => {
  let service: StrategicBriefService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockBrief = (overrides = {}) => ({
    id: 'brief-1',
    projectId: 'project-1',
    status: 'DRAFT',
    completionPct: 0,
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockSection = (sectionNum: number, overrides = {}) => ({
    id: `section-${sectionNum}`,
    briefId: 'brief-1',
    sectionNum,
    data: {},
    isComplete: false,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategicBriefService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<StrategicBriefService>(StrategicBriefService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create brief with 16 sections successfully', async () => {
      const sections = Array.from({ length: 16 }, (_, i) => mockSection(i + 1));
      const brief = mockBrief({ sections });
      prisma.strategicBrief.create.mockResolvedValue(brief);

      const result = await service.create('project-1');

      expect(prisma.strategicBrief.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          sections: {
            createMany: {
              data: expect.arrayContaining([
                expect.objectContaining({
                  sectionNum: 1,
                  sectionKey: 'objectives',
                }),
                expect.objectContaining({
                  sectionNum: 16,
                  sectionKey: 'quotation',
                }),
              ]),
            },
          },
        },
        include: {
          sections: {
            orderBy: { sectionNum: 'asc' },
          },
        },
      });
      expect(result.sections).toHaveLength(16);
    });

    it('should throw BadRequestException when projectId is empty', async () => {
      await expect(service.create('')).rejects.toThrow(BadRequestException);
      expect(prisma.strategicBrief.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when projectId is null', async () => {
      await expect(service.create(null as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when projectId is undefined', async () => {
      await expect(service.create(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.create).not.toHaveBeenCalled();
    });
  });

  describe('updateSection', () => {
    it('should update section data field', async () => {
      const updateDto = { data: { field1: 'value1' } };
      const updatedSection = mockSection(1, { data: { field1: 'value1' } });
      prisma.briefSection.update.mockResolvedValue(updatedSection);
      prisma.briefSection.findMany.mockResolvedValue([]);
      prisma.strategicBrief.update.mockResolvedValue(mockBrief());

      const result = await service.updateSection('brief-1', 1, updateDto);

      expect(prisma.briefSection.update).toHaveBeenCalledWith({
        where: { briefId_sectionNum: { briefId: 'brief-1', sectionNum: 1 } },
        data: updateDto,
      });
      expect(result.data).toEqual({ field1: 'value1' });
    });

    it('should update isComplete field', async () => {
      const updateDto = { isComplete: true };
      const updatedSection = mockSection(1, { isComplete: true });
      prisma.briefSection.update.mockResolvedValue(updatedSection);
      prisma.briefSection.findMany.mockResolvedValue([]);
      prisma.strategicBrief.update.mockResolvedValue(mockBrief());

      const result = await service.updateSection('brief-1', 1, updateDto);

      expect(prisma.briefSection.update).toHaveBeenCalledWith({
        where: { briefId_sectionNum: { briefId: 'brief-1', sectionNum: 1 } },
        data: updateDto,
      });
      expect(result.isComplete).toBe(true);
    });

    it('should call recalculateCompletion after update', async () => {
      const updateDto = { isComplete: true };
      const updatedSection = mockSection(1, { isComplete: true });
      prisma.briefSection.update.mockResolvedValue(updatedSection);
      prisma.briefSection.findMany.mockResolvedValue([updatedSection]);
      prisma.strategicBrief.update.mockResolvedValue(
        mockBrief({ completionPct: 6 }),
      );

      await service.updateSection('brief-1', 1, updateDto);

      expect(prisma.briefSection.findMany).toHaveBeenCalledWith({
        where: { briefId: 'brief-1' },
        select: { isComplete: true },
      });
      expect(prisma.strategicBrief.update).toHaveBeenCalled();
    });
  });

  describe('recalculateCompletion', () => {
    it('should calculate 0% when no sections are complete', async () => {
      const sections = Array.from({ length: 16 }, (_, i) =>
        mockSection(i + 1, { isComplete: false }),
      );
      prisma.briefSection.findMany.mockResolvedValue(sections);
      prisma.strategicBrief.update.mockResolvedValue(
        mockBrief({ completionPct: 0 }),
      );

      const result = await service.recalculateCompletion('brief-1');

      expect(result).toBe(0);
      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: { completionPct: 0 },
      });
    });

    it('should calculate 50% when 8 sections are complete', async () => {
      const sections = Array.from({ length: 16 }, (_, i) =>
        mockSection(i + 1, { isComplete: i < 8 }),
      );
      prisma.briefSection.findMany.mockResolvedValue(sections);
      prisma.strategicBrief.update.mockResolvedValue(
        mockBrief({ completionPct: 50 }),
      );

      const result = await service.recalculateCompletion('brief-1');

      expect(result).toBe(50);
      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: { completionPct: 50 },
      });
    });

    it('should calculate 100% when all 16 sections are complete', async () => {
      const sections = Array.from({ length: 16 }, (_, i) =>
        mockSection(i + 1, { isComplete: true }),
      );
      prisma.briefSection.findMany.mockResolvedValue(sections);
      prisma.strategicBrief.update.mockResolvedValue(
        mockBrief({ completionPct: 100 }),
      );

      const result = await service.recalculateCompletion('brief-1');

      expect(result).toBe(100);
      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: { completionPct: 100 },
      });
    });

    it('should update the brief with calculated percentage', async () => {
      const sections = Array.from({ length: 16 }, (_, i) =>
        mockSection(i + 1, { isComplete: i < 12 }),
      );
      prisma.briefSection.findMany.mockResolvedValue(sections);
      prisma.strategicBrief.update.mockResolvedValue(
        mockBrief({ completionPct: 75 }),
      );

      await service.recalculateCompletion('brief-1');

      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: { completionPct: 75 },
      });
    });
  });

  describe('canTransition', () => {
    it('should allow DRAFT to SUBMITTED transition', () => {
      expect(service.canTransition('DRAFT', 'SUBMITTED')).toBe(true);
    });

    it('should allow SUBMITTED to APPROVED transition', () => {
      expect(service.canTransition('SUBMITTED', 'APPROVED')).toBe(true);
    });

    it('should allow SUBMITTED to REVISION_REQUESTED transition', () => {
      expect(service.canTransition('SUBMITTED', 'REVISION_REQUESTED')).toBe(
        true,
      );
    });

    it('should allow REVISION_REQUESTED to SUBMITTED transition', () => {
      expect(service.canTransition('REVISION_REQUESTED', 'SUBMITTED')).toBe(
        true,
      );
    });

    it('should not allow DRAFT to APPROVED transition', () => {
      expect(service.canTransition('DRAFT', 'APPROVED')).toBe(false);
    });

    it('should not allow DRAFT to REVISION_REQUESTED transition', () => {
      expect(service.canTransition('DRAFT', 'REVISION_REQUESTED')).toBe(false);
    });

    it('should not allow APPROVED to any transition', () => {
      expect(service.canTransition('APPROVED', 'SUBMITTED')).toBe(false);
      expect(service.canTransition('APPROVED', 'DRAFT')).toBe(false);
      expect(service.canTransition('APPROVED', 'REVISION_REQUESTED')).toBe(
        false,
      );
    });
  });

  describe('submit', () => {
    it('should submit brief successfully when 100% complete and status is DRAFT', async () => {
      const brief = mockBrief({ status: 'DRAFT', completionPct: 100 });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);
      prisma.strategicBrief.update.mockResolvedValue({
        ...brief,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submit('brief-1');

      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw BadRequestException when completionPct < 100', async () => {
      const brief = mockBrief({ status: 'DRAFT', completionPct: 75 });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);

      await expect(service.submit('brief-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when transition is invalid', async () => {
      const brief = mockBrief({ status: 'APPROVED', completionPct: 100 });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);

      await expect(service.submit('brief-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.update).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve brief successfully when status is SUBMITTED', async () => {
      const brief = mockBrief({ status: 'SUBMITTED' });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);
      prisma.strategicBrief.update.mockResolvedValue({
        ...brief,
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: 'user-1',
      });

      const result = await service.approve('brief-1', 'user-1');

      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: {
          status: 'APPROVED',
          approvedAt: expect.any(Date),
          approvedById: 'user-1',
        },
      });
      expect(result.status).toBe('APPROVED');
      expect(result.approvedById).toBe('user-1');
    });

    it('should throw BadRequestException when status is DRAFT', async () => {
      const brief = mockBrief({ status: 'DRAFT' });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);

      await expect(service.approve('brief-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.update).not.toHaveBeenCalled();
    });
  });

  describe('requestRevision', () => {
    it('should request revision successfully when status is SUBMITTED', async () => {
      const brief = mockBrief({ status: 'SUBMITTED' });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);
      prisma.strategicBrief.update.mockResolvedValue({
        ...brief,
        status: 'REVISION_REQUESTED',
      });

      const result = await service.requestRevision('brief-1');

      expect(prisma.strategicBrief.update).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
        data: { status: 'REVISION_REQUESTED' },
      });
      expect(result.status).toBe('REVISION_REQUESTED');
    });

    it('should throw BadRequestException when status is DRAFT', async () => {
      const brief = mockBrief({ status: 'DRAFT' });
      prisma.strategicBrief.findUniqueOrThrow.mockResolvedValue(brief);

      await expect(service.requestRevision('brief-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.strategicBrief.update).not.toHaveBeenCalled();
    });
  });
});
