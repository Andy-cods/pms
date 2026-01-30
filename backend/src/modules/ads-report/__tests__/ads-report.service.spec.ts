import { Test, TestingModule } from '@nestjs/testing';
import { AdsReportService } from '../ads-report.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';
import { NotFoundException } from '@nestjs/common';
import {
  AdsReportQueryDto,
  CreateAdsReportDto,
} from '../../../application/dto/ads-report.dto';

describe('AdsReportService', () => {
  let service: AdsReportService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsReportService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AdsReportService>(AdsReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    const projectId = 'project-123';
    const mockReport = {
      id: 'report-1',
      projectId,
      period: 'DAILY',
      reportDate: new Date('2026-01-15'),
      impressions: 1000,
      clicks: 50,
      ctr: 5.0,
      cpc: 2.5,
      cpm: 25.0,
      cpa: 10.0,
      conversions: 5,
      roas: 3.2,
      adSpend: 125.0,
      platform: 'GOOGLE',
      campaignName: 'Test Campaign',
      source: 'MANUAL',
      createdBy: { id: 'user-1', name: 'Test User' },
      createdAt: new Date(),
      createdById: 'user-1',
    };

    it('should return reports with no filters', async () => {
      const query: AdsReportQueryDto = {};
      prisma.adsReport.findMany.mockResolvedValue([mockReport]);

      const result = await service.list(projectId, query);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('report-1');
      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should filter by platform', async () => {
      const query: AdsReportQueryDto = { platform: 'FACEBOOK' };
      prisma.adsReport.findMany.mockResolvedValue([]);

      await service.list(projectId, query);

      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: { projectId, platform: 'FACEBOOK' },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should filter by period', async () => {
      const query: AdsReportQueryDto = { period: 'WEEKLY' };
      prisma.adsReport.findMany.mockResolvedValue([]);

      await service.list(projectId, query);

      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: { projectId, period: 'WEEKLY' },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should filter by date range with startDate only', async () => {
      const query: AdsReportQueryDto = { startDate: '2026-01-01' };
      prisma.adsReport.findMany.mockResolvedValue([]);

      await service.list(projectId, query);

      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
          reportDate: { gte: new Date('2026-01-01') },
        },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should filter by date range with endDate only', async () => {
      const query: AdsReportQueryDto = { endDate: '2026-01-31' };
      prisma.adsReport.findMany.mockResolvedValue([]);

      await service.list(projectId, query);

      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
          reportDate: { lte: new Date('2026-01-31') },
        },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should filter by date range with both startDate and endDate', async () => {
      const query: AdsReportQueryDto = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      prisma.adsReport.findMany.mockResolvedValue([]);

      await service.list(projectId, query);

      expect(prisma.adsReport.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
          reportDate: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-01-31'),
          },
        },
        orderBy: { reportDate: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should return empty array when no reports found', async () => {
      const query: AdsReportQueryDto = {};
      prisma.adsReport.findMany.mockResolvedValue([]);

      const result = await service.list(projectId, query);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should convert Decimal fields to Number via map()', async () => {
      const reportWithDecimals = {
        ...mockReport,
        cpc: { toNumber: () => 2.5 }, // Mock Prisma Decimal
        cpm: { toNumber: () => 25.0 },
        cpa: { toNumber: () => 10.0 },
        adSpend: { toNumber: () => 125.0 },
      };
      prisma.adsReport.findMany.mockResolvedValue([reportWithDecimals]);

      const result = await service.list(projectId, {});

      expect(typeof result[0].cpc).toBe('number');
      expect(typeof result[0].cpm).toBe('number');
      expect(typeof result[0].cpa).toBe('number');
      expect(typeof result[0].adSpend).toBe('number');
    });
  });

  describe('summary', () => {
    const projectId = 'project-123';

    it('should return zeros when no reports exist', async () => {
      prisma.adsReport.findMany.mockResolvedValue([]);

      const result = await service.summary(projectId, {});

      expect(result).toEqual({
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgCpc: 0,
        totalConversions: 0,
        avgRoas: 0,
        totalAdSpend: 0,
      });
    });

    it('should correctly aggregate totals from multiple reports', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          adSpend: 100,
          roas: 3.0,
          cpc: 2.0,
          cpm: 20.0,
          cpa: 20.0,
        },
        {
          impressions: 2000,
          clicks: 100,
          conversions: 10,
          adSpend: 200,
          roas: 4.0,
          cpc: 2.0,
          cpm: 20.0,
          cpa: 20.0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 5.0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      expect(result.totalImpressions).toBe(3000);
      expect(result.totalClicks).toBe(150);
      expect(result.totalConversions).toBe(15);
      expect(result.totalAdSpend).toBe(300);
    });

    it('should calculate avgCtr correctly', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          adSpend: 100,
          roas: 3.0,
          cpc: 2.0,
          cpm: 20.0,
          cpa: 20.0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 5.0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      // avgCtr = (50 / 1000) * 100 = 5.00
      expect(result.avgCtr).toBe(5.0);
    });

    it('should calculate avgCpc correctly', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          adSpend: 125,
          roas: 3.0,
          cpc: 2.5,
          cpm: 20.0,
          cpa: 20.0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 5.0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      // avgCpc = 125 / 50 = 2.50
      expect(result.avgCpc).toBe(2.5);
    });

    it('should calculate avgRoas correctly', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          adSpend: 100,
          roas: 3.5,
          cpc: 2.0,
          cpm: 20.0,
          cpa: 20.0,
        },
        {
          impressions: 2000,
          clicks: 100,
          conversions: 10,
          adSpend: 200,
          roas: 4.5,
          cpc: 2.0,
          cpm: 20.0,
          cpa: 20.0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 5.0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      // avgRoas = (3.5 + 4.5) / 2 = 4.00
      expect(result.avgRoas).toBe(4.0);
    });

    it('should apply toFixed(2) to calculated averages', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 33,
          conversions: 5,
          adSpend: 100,
          roas: 3.333,
          cpc: 3.03,
          cpm: 20.0,
          cpa: 20.0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 5.0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      // avgCtr = (33 / 1000) * 100 = 3.30
      expect(result.avgCtr).toBe(3.3);
      // avgCpc = 100 / 33 = 3.030303... -> 3.03
      expect(result.avgCpc).toBe(3.03);
      // avgRoas = 3.333 -> 3.33
      expect(result.avgRoas).toBe(3.33);
    });

    it('should handle avgCtr when totalImpressions is 0', async () => {
      const reports = [
        {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          adSpend: 0,
          roas: 0,
          cpc: 0,
          cpm: 0,
          cpa: 0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      expect(result.avgCtr).toBe(0);
    });

    it('should handle avgCpc when totalClicks is 0', async () => {
      const reports = [
        {
          impressions: 1000,
          clicks: 0,
          conversions: 0,
          adSpend: 100,
          roas: 0,
          cpc: 0,
          cpm: 20,
          cpa: 0,
        },
      ];
      prisma.adsReport.findMany.mockResolvedValue(
        reports.map((r: any) => ({
          ...r,
          id: 'report-1',
          projectId,
          period: 'DAILY',
          reportDate: new Date(),
          ctr: 0,
          platform: 'GOOGLE',
          campaignName: 'Test',
          source: 'MANUAL',
          createdBy: { id: 'user-1', name: 'Test' },
          createdAt: new Date(),
        })),
      );

      const result = await service.summary(projectId, {});

      expect(result.avgCpc).toBe(0);
    });
  });

  describe('create', () => {
    const projectId = 'project-123';
    const userId = 'user-456';
    const dto: CreateAdsReportDto = {
      period: 'DAILY',
      reportDate: '2026-01-15',
      impressions: 1000,
      clicks: 50,
      ctr: 5.0,
      cpc: 2.5,
      cpm: 25.0,
      cpa: 10.0,
      conversions: 5,
      roas: 3.2,
      adSpend: 125.0,
      platform: 'GOOGLE',
      campaignName: 'Test Campaign',
    };

    it('should create report successfully', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      const createdReport = {
        id: 'report-1',
        projectId,
        ...dto,
        reportDate: new Date(dto.reportDate),
        source: 'MANUAL',
        createdById: userId,
        createdBy: { id: userId, name: 'Test User' },
        createdAt: new Date(),
      };
      prisma.adsReport.create.mockResolvedValue(createdReport);

      const result = await service.create(projectId, userId, dto);

      expect(result.id).toBe('report-1');
      expect(result.source).toBe('MANUAL');
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { id: true },
      });
      expect(prisma.adsReport.create).toHaveBeenCalledWith({
        data: {
          projectId,
          period: dto.period,
          reportDate: new Date(dto.reportDate),
          impressions: dto.impressions,
          clicks: dto.clicks,
          ctr: dto.ctr,
          cpc: dto.cpc,
          cpm: dto.cpm,
          cpa: dto.cpa,
          conversions: dto.conversions,
          roas: dto.roas,
          adSpend: dto.adSpend,
          platform: dto.platform,
          campaignName: dto.campaignName,
          source: 'MANUAL',
          createdById: userId,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.create(projectId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(projectId, userId, dto)).rejects.toThrow(
        'Project not found',
      );
      expect(prisma.adsReport.create).not.toHaveBeenCalled();
    });

    it('should use custom source when provided', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      const createdReport = {
        id: 'report-1',
        projectId,
        ...dto,
        reportDate: new Date(dto.reportDate),
        source: 'API_INTEGRATION',
        createdById: userId,
        createdBy: { id: userId, name: 'Test User' },
        createdAt: new Date(),
      };
      prisma.adsReport.create.mockResolvedValue(createdReport);

      const result = await service.create(
        projectId,
        userId,
        dto,
        'API_INTEGRATION',
      );

      expect(result.source).toBe('API_INTEGRATION');
      expect(prisma.adsReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'API_INTEGRATION',
          }),
        }),
      );
    });

    it('should default source to MANUAL when not provided', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      const createdReport = {
        id: 'report-1',
        projectId,
        ...dto,
        reportDate: new Date(dto.reportDate),
        source: 'MANUAL',
        createdById: userId,
        createdBy: { id: userId, name: 'Test User' },
        createdAt: new Date(),
      };
      prisma.adsReport.create.mockResolvedValue(createdReport);

      await service.create(projectId, userId, dto);

      expect(prisma.adsReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'MANUAL',
          }),
        }),
      );
    });
  });

  describe('map (private method)', () => {
    it('should convert Prisma Decimal fields to Number', () => {
      const rawReport = {
        id: 'report-1',
        projectId: 'project-123',
        period: 'DAILY',
        reportDate: new Date('2026-01-15'),
        impressions: 1000,
        clicks: 50,
        ctr: 5.0,
        cpc: 2.5, // Prisma would return Decimal
        cpm: 25.0, // Prisma would return Decimal
        cpa: 10.0, // Prisma would return Decimal
        conversions: 5,
        roas: 3.2,
        adSpend: 125.0, // Prisma would return Decimal
        platform: 'GOOGLE',
        campaignName: 'Test Campaign',
        source: 'MANUAL',
        createdBy: { id: 'user-1', name: 'Test User' },
        createdAt: new Date(),
      };

      // Access private method via type assertion
      const mapped = (service as any).map(rawReport);

      expect(typeof mapped.cpc).toBe('number');
      expect(typeof mapped.cpm).toBe('number');
      expect(typeof mapped.cpa).toBe('number');
      expect(typeof mapped.adSpend).toBe('number');
      expect(mapped.cpc).toBe(2.5);
      expect(mapped.cpm).toBe(25.0);
      expect(mapped.cpa).toBe(10.0);
      expect(mapped.adSpend).toBe(125.0);
    });
  });
});
