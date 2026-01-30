import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportService } from '../report.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';
import {
  ReportType,
  ReportFormat,
  GenerateReportDto,
} from '../../../application/dto/report/report.dto';
import { TaskStatus, HealthStatus, UserRole } from '@prisma/client';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate PDF report successfully', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.WEEKLY,
        format: ReportFormat.PDF,
      };

      // Mock Prisma responses - use minimal data to avoid PDF pagination issues
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.generateReport(
        dto,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(prisma.project.findMany).toHaveBeenCalled();
      expect(prisma.task.findMany).toHaveBeenCalled();
    });

    it('should generate Excel report successfully', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.MONTHLY,
        format: ReportFormat.EXCEL,
      };

      // Mock Prisma responses
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.generateReport(
        dto,
        'user-1',
        UserRole.SUPER_ADMIN,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(prisma.project.findMany).toHaveBeenCalled();
      expect(prisma.task.findMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException for CUSTOM type without dates', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.CUSTOM,
        format: ReportFormat.PDF,
      };

      await expect(
        service.generateReport(dto, 'user-1', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generateReport(dto, 'user-1', UserRole.ADMIN),
      ).rejects.toThrow('Custom report requires startDate and endDate');
    });

    it('should handle CUSTOM type with valid dates', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.CUSTOM,
        format: ReportFormat.PDF,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.generateReport(
        dto,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('calculateDateRange', () => {
    it('should calculate WEEKLY date range starting from Monday', () => {
      const dto: GenerateReportDto = {
        type: ReportType.WEEKLY,
        format: ReportFormat.PDF,
      };

      const result = (service as any).calculateDateRange(dto);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      // Start date should be Monday
      expect(result.startDate.getDay()).toBe(1);
      expect(result.startDate.getHours()).toBe(0);
      expect(result.startDate.getMinutes()).toBe(0);
    });

    it('should calculate WEEKLY_PER_PROJECT date range starting from Monday', () => {
      const dto: GenerateReportDto = {
        type: ReportType.WEEKLY_PER_PROJECT,
        format: ReportFormat.PDF,
      };

      const result = (service as any).calculateDateRange(dto);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate.getDay()).toBe(1);
    });

    it('should calculate MONTHLY date range starting from first day of month', () => {
      const dto: GenerateReportDto = {
        type: ReportType.MONTHLY,
        format: ReportFormat.PDF,
      };

      const result = (service as any).calculateDateRange(dto);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate.getDate()).toBe(1);
    });

    it('should calculate CUSTOM date range from dto dates', () => {
      const dto: GenerateReportDto = {
        type: ReportType.CUSTOM,
        format: ReportFormat.PDF,
        startDate: '2026-01-15',
        endDate: '2026-01-20',
      };

      const result = (service as any).calculateDateRange(dto);

      expect(result.startDate).toEqual(new Date('2026-01-15'));
      expect(result.endDate).toEqual(new Date('2026-01-20'));
    });

    it('should throw BadRequestException for CUSTOM without startDate', () => {
      const dto: GenerateReportDto = {
        type: ReportType.CUSTOM,
        format: ReportFormat.PDF,
        endDate: '2026-01-20',
      };

      expect(() => (service as any).calculateDateRange(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should default to 7 days ago for unknown type', () => {
      const dto: GenerateReportDto = {
        type: 'UNKNOWN' as ReportType,
        format: ReportFormat.PDF,
      };

      const result = (service as any).calculateDateRange(dto);
      const now = new Date();
      const expectedStart = new Date(now);
      expectedStart.setDate(now.getDate() - 7);

      expect(result.startDate.getDate()).toBe(expectedStart.getDate());
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });

  describe('aggregateReportData', () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    it('should filter projects by user team for non-admin users', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.MEMBER,
      );

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            team: { some: { userId: 'user-1' } },
          }),
        }),
      );
    });

    it('should show all projects for ADMIN users', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where.team).toBeUndefined();
    });

    it('should show all projects for SUPER_ADMIN users', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.SUPER_ADMIN,
      );

      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where.team).toBeUndefined();
    });

    it('should filter by specific projectId when provided', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        'proj-123',
        'user-1',
        UserRole.ADMIN,
      );

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'proj-123',
          }),
        }),
      );
    });

    it('should calculate task status breakdown correctly', async () => {
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          dealCode: 'DEAL-001',
          name: 'Test Project',
          healthStatus: HealthStatus.STABLE,
          lifecycle: 'ONGOING',
          stageProgress: 50,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          client: { companyName: 'Test Client' },
          tasks: [
            { status: TaskStatus.TODO },
            { status: TaskStatus.TODO },
            { status: TaskStatus.IN_PROGRESS },
            { status: TaskStatus.REVIEW },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.BLOCKED },
            { status: TaskStatus.CANCELLED },
          ],
          _count: { tasks: 8 },
        } as any,
      ]);

      prisma.task.findMany.mockResolvedValue([
        {
          status: TaskStatus.TODO,
          priority: 'LOW',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.TODO,
          priority: 'MEDIUM',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.IN_PROGRESS,
          priority: 'HIGH',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.REVIEW,
          priority: 'MEDIUM',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.DONE,
          priority: 'LOW',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.DONE,
          priority: 'HIGH',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.BLOCKED,
          priority: 'URGENT',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.CANCELLED,
          priority: 'LOW',
          project: { name: 'Test Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
      ] as any);

      const result = await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result.projects[0].taskStats).toEqual({
        total: 8,
        todo: 2,
        inProgress: 1,
        review: 1,
        done: 2,
        blocked: 1,
        cancelled: 1,
      });

      expect(result.summary.taskStatusBreakdown).toEqual({
        todo: 2,
        inProgress: 1,
        review: 1,
        done: 2,
        blocked: 1,
        cancelled: 1,
      });
    });

    it('should return 0% completion when no tasks exist', async () => {
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          dealCode: 'DEAL-001',
          name: 'Empty Project',
          healthStatus: HealthStatus.STABLE,
          lifecycle: 'PLANNING',
          stageProgress: 10,
          startDate: new Date('2026-01-01'),
          endDate: null,
          client: null,
          tasks: [],
          _count: { tasks: 0 },
        } as any,
      ]);

      prisma.task.findMany.mockResolvedValue([]);

      const result = await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result.projects[0].completionPercentage).toBe(0);
      expect(result.summary.overallCompletionRate).toBe(0);
    });

    it('should calculate correct completion percentage', async () => {
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          dealCode: 'DEAL-001',
          name: 'Test Project',
          healthStatus: HealthStatus.STABLE,
          lifecycle: 'ONGOING',
          stageProgress: 75,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          client: { companyName: 'Test Client' },
          tasks: [
            { status: TaskStatus.TODO },
            { status: TaskStatus.IN_PROGRESS },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
          ],
          _count: { tasks: 10 },
        } as any,
      ]);

      const createTaskMock = (status: TaskStatus) => ({
        status,
        priority: 'MEDIUM',
        project: { name: 'Test Project', dealCode: 'DEAL-001' },
        assignees: [],
      });

      prisma.task.findMany.mockResolvedValue([
        createTaskMock(TaskStatus.TODO),
        createTaskMock(TaskStatus.IN_PROGRESS),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
        createTaskMock(TaskStatus.DONE),
      ] as any);

      const result = await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      // 8 done out of 10 total = 80%
      expect(result.projects[0].completionPercentage).toBe(80);
      expect(result.summary.overallCompletionRate).toBe(80);
    });

    it('should include project health status breakdown in summary', async () => {
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          healthStatus: HealthStatus.STABLE,
          tasks: [],
          _count: { tasks: 0 },
        } as any,
        {
          id: 'proj-2',
          healthStatus: HealthStatus.STABLE,
          tasks: [],
          _count: { tasks: 0 },
        } as any,
        {
          id: 'proj-3',
          healthStatus: HealthStatus.WARNING,
          tasks: [],
          _count: { tasks: 0 },
        } as any,
        {
          id: 'proj-4',
          healthStatus: HealthStatus.CRITICAL,
          tasks: [],
          _count: { tasks: 0 },
        } as any,
      ]);

      prisma.task.findMany.mockResolvedValue([]);

      const result = await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result.summary.projectStatusBreakdown).toEqual({
        stable: 2,
        warning: 1,
        critical: 1,
      });
    });

    it('should return complete report data structure', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      const result = await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tasks');

      expect(result.summary).toHaveProperty('generatedAt');
      expect(result.summary).toHaveProperty('reportType');
      expect(result.summary).toHaveProperty('dateRange');
      expect(result.summary).toHaveProperty('totalProjects');
      expect(result.summary).toHaveProperty('totalTasks');
      expect(result.summary).toHaveProperty('projectStatusBreakdown');
      expect(result.summary).toHaveProperty('taskStatusBreakdown');
      expect(result.summary).toHaveProperty('overallCompletionRate');

      expect(result.summary.dateRange.startDate).toEqual(startDate);
      expect(result.summary.dateRange.endDate).toEqual(endDate);
    });

    it('should handle archived projects correctly', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivedAt: null,
          }),
        }),
      );
    });

    it('should query tasks within date range', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      await (service as any).aggregateReportData(
        startDate,
        endDate,
        undefined,
        'user-1',
        UserRole.ADMIN,
      );

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { createdAt: { gte: startDate, lte: endDate } },
              { updatedAt: { gte: startDate, lte: endDate } },
            ],
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle projects with all tasks in DONE status', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.WEEKLY,
        format: ReportFormat.EXCEL, // Use Excel to avoid PDF pagination issues
      };

      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          dealCode: 'DEAL-001',
          name: 'Complete Project',
          healthStatus: HealthStatus.STABLE,
          lifecycle: 'COMPLETED',
          stageProgress: 100,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
          client: { companyName: 'Client' },
          tasks: [
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
            { status: TaskStatus.DONE },
          ],
          _count: { tasks: 3 },
        } as any,
      ]);

      prisma.task.findMany.mockResolvedValue([
        {
          status: TaskStatus.DONE,
          priority: 'MEDIUM',
          project: { name: 'Complete Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.DONE,
          priority: 'HIGH',
          project: { name: 'Complete Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
        {
          status: TaskStatus.DONE,
          priority: 'LOW',
          project: { name: 'Complete Project', dealCode: 'DEAL-001' },
          assignees: [],
        },
      ] as any);

      const result = await service.generateReport(
        dto,
        'user-1',
        UserRole.ADMIN,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple projects with different user roles', async () => {
      const dto: GenerateReportDto = {
        type: ReportType.MONTHLY,
        format: ReportFormat.EXCEL,
        projectId: 'proj-specific',
      };

      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-specific',
          dealCode: 'DEAL-999',
          name: 'Specific Project',
          healthStatus: HealthStatus.WARNING,
          lifecycle: 'ONGOING',
          stageProgress: 60,
          startDate: new Date('2026-01-01'),
          endDate: null,
          client: null,
          tasks: [{ status: TaskStatus.IN_PROGRESS }],
          _count: { tasks: 1 },
        } as any,
      ]);

      prisma.task.findMany.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Specific Task',
          status: TaskStatus.IN_PROGRESS,
          priority: 'MEDIUM',
          project: { name: 'Specific Project', dealCode: 'DEAL-999' },
          assignees: [],
          deadline: null,
          estimatedHours: null,
          actualHours: null,
          createdAt: new Date(),
          completedAt: null,
        } as any,
      ]);

      const result = await service.generateReport(
        dto,
        'user-123',
        UserRole.MEMBER,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'proj-specific',
            team: { some: { userId: 'user-123' } },
          }),
        }),
      );
    });
  });
});
