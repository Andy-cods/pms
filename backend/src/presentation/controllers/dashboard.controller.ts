import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

interface RequestWithUser extends Request {
  user: { sub: string; email: string; role: string };
}

interface DashboardStatsDto {
  projects: {
    total: number;
    warning: number;
    critical: number;
  };
  tasks: {
    total: number;
    inProgress: number;
    done: number;
  };
  users: {
    total: number;
    active: number;
  };
  files: {
    total: number;
    totalSize: number;
  };
}

interface RecentActivityDto {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName: string;
}

interface MyTaskDto {
  id: string;
  title: string;
  projectCode: string;
  projectName: string;
  status: string;
  priority: string;
  deadline: string | null;
}

interface MyTasksResponseDto {
  overdue: number;
  dueToday: number;
  tasks: MyTaskDto[];
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async getStats(): Promise<DashboardStatsDto> {
    const [
      totalProjects,
      warningProjects,
      criticalProjects,
      totalTasks,
      inProgressTasks,
      doneTasks,
      totalUsers,
      activeUsers,
      files,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { healthStatus: 'WARNING' } }),
      this.prisma.project.count({ where: { healthStatus: 'CRITICAL' } }),
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { status: 'DONE' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.file.aggregate({ _count: true, _sum: { size: true } }),
    ]);

    return {
      projects: {
        total: totalProjects,
        warning: warningProjects,
        critical: criticalProjects,
      },
      tasks: {
        total: totalTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      files: {
        total: files._count,
        totalSize: files._sum.size || 0,
      },
    };
  }

  @Get('activity')
  async getRecentActivity(
    @Query('limit') limit?: string,
  ): Promise<RecentActivityDto[]> {
    const take = limit ? parseInt(limit, 10) : 10;

    const auditLogs = await this.prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      type: log.action,
      description: `${log.action} ${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ''}`,
      createdAt: log.createdAt.toISOString(),
      userName: log.user?.name || 'System',
    }));
  }

  @Get('my-tasks')
  async getMyTasks(@Req() req: RequestWithUser): Promise<MyTasksResponseDto> {
    const userId = req.user.sub;
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        assignees: { some: { userId } },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
      include: {
        project: { select: { dealCode: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
      take: 20,
    });

    const overdue = tasks.filter(
      (t) => t.deadline && t.deadline < startOfToday,
    ).length;
    const dueToday = tasks.filter(
      (t) =>
        t.deadline && t.deadline >= startOfToday && t.deadline < endOfToday,
    ).length;

    return {
      overdue,
      dueToday,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        projectCode: t.project.dealCode,
        projectName: t.project.name,
        status: t.status,
        priority: t.priority,
        deadline: t.deadline?.toISOString() || null,
      })),
    };
  }
}
