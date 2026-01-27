import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import { UserRole, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectListQueryDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  type ProjectResponseDto,
  type ProjectListResponseDto,
  type ProjectTeamMemberDto,
} from '../../application/dto/project/project.dto.js';

function generateProjectCode(): string {
  const prefix = 'PRJ';
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${randomNum}`;
}

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listProjects(
    @Query() query: ProjectListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectListResponseDto> {
    const {
      status,
      stage,
      clientId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = {
      archivedAt: null,
    };

    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (clientId) where.clientId = clientId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Non-admin users only see projects they are part of
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      where.team = {
        some: { userId: req.user.sub },
      };
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          team: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    // Get task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await this.prisma.task.groupBy({
          by: ['status'],
          where: { projectId: project.id },
          _count: true,
        });

        const stats = {
          total: project._count.tasks,
          todo: 0,
          inProgress: 0,
          done: 0,
        };

        taskStats.forEach((stat) => {
          if (stat.status === TaskStatus.TODO) stats.todo = stat._count;
          if (stat.status === TaskStatus.IN_PROGRESS)
            stats.inProgress = stat._count;
          if (stat.status === TaskStatus.DONE) stats.done = stat._count;
        });

        return this.mapToResponse(project, stats);
      }),
    );

    return {
      projects: projectsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        team: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access
    await this.checkProjectAccess(id, req.user);

    // Get task stats
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: true,
    });

    const stats = {
      total: project._count.tasks,
      todo: 0,
      inProgress: 0,
      done: 0,
    };

    taskStats.forEach((stat) => {
      if (stat.status === TaskStatus.TODO) stats.todo = stat._count;
      if (stat.status === TaskStatus.IN_PROGRESS)
        stats.inProgress = stat._count;
      if (stat.status === TaskStatus.DONE) stats.done = stat._count;
    });

    return this.mapToResponse(project, stats);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async createProject(
    @Body() dto: CreateProjectDto,
    @Req() req: { user: { sub: string } },
  ): Promise<ProjectResponseDto> {
    // Generate unique code if not provided
    let code = dto.code;
    if (!code) {
      code = generateProjectCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await this.prisma.project.findUnique({
          where: { code },
        });
        if (!existing) break;
        code = generateProjectCode();
        attempts++;
      }
    } else {
      const existing = await this.prisma.project.findUnique({
        where: { code },
      });
      if (existing) {
        throw new BadRequestException('Project code already exists');
      }
    }

    const project = await this.prisma.project.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        status: dto.status,
        stage: dto.stage,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        clientId: dto.clientId,
        driveLink: dto.driveLink,
        planLink: dto.planLink,
        trackingLink: dto.trackingLink,
        team: {
          create: {
            userId: req.user.sub,
            role: UserRole.PM,
            isPrimary: true,
          },
        },
      },
      include: {
        client: { select: { id: true, companyName: true } },
        team: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    return this.mapToResponse(project, {
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
    });
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectResponseDto> {
    await this.checkProjectAccess(id, req.user, true);

    // Get current project state for stage history tracking
    const currentProject = await this.prisma.project.findUnique({
      where: { id },
      select: { stage: true, stageProgress: true },
    });

    // Track stage change in history
    const stageChanged = dto.stage && currentProject && dto.stage !== currentProject.stage;
    const progressChanged = dto.stageProgress !== undefined &&
      currentProject &&
      dto.stageProgress !== currentProject.stageProgress;

    // If stage changes, reset stageProgress to 0 unless explicitly provided
    let newStageProgress = dto.stageProgress;
    if (stageChanged && dto.stageProgress === undefined) {
      newStageProgress = 0;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        status: dto.status,
        stage: dto.stage,
        stageProgress: newStageProgress,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        clientId: dto.clientId,
        driveLink: dto.driveLink,
        planLink: dto.planLink,
        trackingLink: dto.trackingLink,
      },
      include: {
        client: { select: { id: true, companyName: true } },
        team: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    // Create stage history record if stage or progress changed
    if ((stageChanged || progressChanged) && currentProject) {
      await this.prisma.stageHistory.create({
        data: {
          projectId: id,
          fromStage: currentProject.stage,
          toStage: dto.stage || currentProject.stage,
          fromProgress: currentProject.stageProgress,
          toProgress: newStageProgress ?? currentProject.stageProgress,
          changedById: req.user.sub,
          reason: dto.stageChangeReason || null,
        },
      });
    }

    // Get task stats
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: true,
    });

    const stats = {
      total: project._count.tasks,
      todo: 0,
      inProgress: 0,
      done: 0,
    };

    taskStats.forEach((stat) => {
      if (stat.status === TaskStatus.TODO) stats.todo = stat._count;
      if (stat.status === TaskStatus.IN_PROGRESS)
        stats.inProgress = stat._count;
      if (stat.status === TaskStatus.DONE) stats.done = stat._count;
    });

    return this.mapToResponse(project, stats);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async archiveProject(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(id, req.user, true);

    await this.prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  // Stage History
  @Get(':id/stage-history')
  async getStageHistory(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    await this.checkProjectAccess(id, req.user);

    const history = await this.prisma.stageHistory.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get user names for changedById
    const userIds = [...new Set(history.map((h) => h.changedById))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return history.map((h) => ({
      id: h.id,
      fromStage: h.fromStage,
      toStage: h.toStage,
      fromProgress: h.fromProgress,
      toProgress: h.toProgress,
      changedBy: {
        id: h.changedById,
        name: userMap.get(h.changedById) || 'Unknown',
      },
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  // Team Management
  @Get(':id/team')
  async getProjectTeam(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    await this.checkProjectAccess(id, req.user);

    const team = await this.prisma.projectTeam.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Get workload stats for each member
    const memberStats = await Promise.all(
      team.map(async (m) => {
        const [projectTasks, totalTasks] = await Promise.all([
          // Tasks in this project assigned to this user
          this.prisma.taskAssignee.count({
            where: {
              userId: m.userId,
              task: { projectId: id },
            },
          }),
          // Total tasks across all projects assigned to this user
          this.prisma.taskAssignee.count({
            where: { userId: m.userId },
          }),
        ]);

        // Tasks done in this project
        const projectTasksDone = await this.prisma.taskAssignee.count({
          where: {
            userId: m.userId,
            task: {
              projectId: id,
              status: 'DONE',
            },
          },
        });

        // Overdue tasks in this project
        const projectTasksOverdue = await this.prisma.taskAssignee.count({
          where: {
            userId: m.userId,
            task: {
              projectId: id,
              deadline: { lt: new Date() },
              status: { notIn: ['DONE', 'CANCELLED'] },
            },
          },
        });

        return {
          id: m.id,
          userId: m.userId,
          role: m.role,
          isPrimary: m.isPrimary,
          user: m.user,
          workload: {
            projectTasks,
            projectTasksDone,
            projectTasksOverdue,
            totalTasks,
          },
        };
      }),
    );

    return memberStats;
  }

  @Post(':id/team')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async addTeamMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectTeamMemberDto> {
    await this.checkProjectAccess(id, req.user, true);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member with same role
    const existing = await this.prisma.projectTeam.findUnique({
      where: {
        projectId_userId_role: {
          projectId: id,
          userId: dto.userId,
          role: dto.role as UserRole,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'User is already a team member with this role',
      );
    }

    const member = await this.prisma.projectTeam.create({
      data: {
        projectId: id,
        userId: dto.userId,
        role: dto.role as UserRole,
        isPrimary: dto.isPrimary ?? false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isPrimary: member.isPrimary,
      user: member.user,
    };
  }

  @Patch(':id/team/:memberId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async updateTeamMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectTeamMemberDto> {
    await this.checkProjectAccess(id, req.user, true);

    const member = await this.prisma.projectTeam.update({
      where: { id: memberId },
      data: {
        role: dto.role as UserRole | undefined,
        isPrimary: dto.isPrimary,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isPrimary: member.isPrimary,
      user: member.user,
    };
  }

  @Delete(':id/team/:memberId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async removeTeamMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(id, req.user, true);

    // Check if this is the last PM
    const member = await this.prisma.projectTeam.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === UserRole.PM && member.isPrimary) {
      const pmCount = await this.prisma.projectTeam.count({
        where: { projectId: id, role: UserRole.PM },
      });
      if (pmCount <= 1) {
        throw new BadRequestException('Cannot remove the last Project Manager');
      }
    }

    await this.prisma.projectTeam.delete({ where: { id: memberId } });
  }

  // Helper methods
  private async checkProjectAccess(
    projectId: string,
    user: { sub: string; role: string },
    requireEdit = false,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const isMember = project.team.some((m) => m.userId === user.sub);

    if (!isAdmin && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (requireEdit && !isAdmin) {
      const isPM = project.team.some(
        (m) => m.userId === user.sub && m.role === UserRole.PM,
      );
      if (!isPM) {
        throw new ForbiddenException(
          'Only Project Managers can edit this project',
        );
      }
    }
  }

  private mapToResponse(
    project: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      productType: string | null;
      status: string;
      stage: string;
      stageProgress: number;
      startDate: Date | null;
      endDate: Date | null;
      timelineProgress: number;
      driveLink: string | null;
      planLink: string | null;
      trackingLink: string | null;
      clientId: string | null;
      client: { id: string; companyName: string } | null;
      team: Array<{
        id: string;
        userId: string;
        role: string;
        isPrimary: boolean;
        user: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
        };
      }>;
      createdAt: Date;
      updatedAt: Date;
      archivedAt: Date | null;
    },
    taskStats: {
      total: number;
      todo: number;
      inProgress: number;
      done: number;
    },
  ): ProjectResponseDto {
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      description: project.description,
      productType: project.productType,
      status: project.status as ProjectResponseDto['status'],
      stage: project.stage as ProjectResponseDto['stage'],
      stageProgress: project.stageProgress,
      startDate: project.startDate?.toISOString() ?? null,
      endDate: project.endDate?.toISOString() ?? null,
      timelineProgress: project.timelineProgress,
      driveLink: project.driveLink,
      planLink: project.planLink,
      trackingLink: project.trackingLink,
      clientId: project.clientId,
      client: project.client,
      team: project.team.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        isPrimary: m.isPrimary,
        user: m.user,
      })),
      taskStats,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      archivedAt: project.archivedAt?.toISOString() ?? null,
    };
  }
}
