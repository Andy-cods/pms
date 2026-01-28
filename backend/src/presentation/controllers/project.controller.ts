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
import {
  UserRole,
  TaskStatus,
  ProjectLifecycle,
  PipelineDecision,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { ProjectPhaseService } from '../../modules/project-phase/project-phase.service.js';
import { BRIEF_SECTIONS } from '../../modules/strategic-brief/brief-sections.config.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectSaleDto,
  UpdateProjectEvaluationDto,
  UpdateLifecycleDto,
  AddWeeklyNoteDto,
  ProjectDecisionDto,
  ProjectListQueryDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  type ProjectResponseDto,
  type ProjectListResponseDto,
  type ProjectTeamMemberDto,
} from '../../application/dto/project/project.dto.js';

// ─── Lifecycle state machine ───
const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  LEAD: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['EVALUATION', 'LOST'],
  EVALUATION: ['NEGOTIATION', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: ['PLANNING'],
  PLANNING: ['ONGOING'],
  ONGOING: ['OPTIMIZING'],
  OPTIMIZING: ['CLOSED'],
  LOST: [],
  CLOSED: [],
};

function canTransition(from: string, to: string): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Calculate COGS, Gross Profit, Profit Margin */
function calculateFinancials(data: Record<string, any>) {
  const cogs =
    Number(data.costNSQC || 0) +
    Number(data.costDesign || 0) +
    Number(data.costMedia || 0) +
    Number(data.costKOL || 0) +
    Number(data.costOther || 0);
  const totalBudget = Number(data.totalBudget || 0);
  const grossProfit = totalBudget - cogs;
  const profitMargin =
    totalBudget > 0 ? (grossProfit / totalBudget) * 100 : 0;
  return { cogs, grossProfit, profitMargin };
}

/** Generate deal code: DEAL-0001 */
async function generateDealCode(prisma: PrismaService): Promise<string> {
  const last = await prisma.project.findFirst({
    where: { dealCode: { startsWith: 'DEAL-' } },
    orderBy: { dealCode: 'desc' },
    select: { dealCode: true },
  });
  const nextNum = last
    ? parseInt(last.dealCode.replace('DEAL-', ''), 10) + 1
    : 1;
  return `DEAL-${String(nextNum).padStart(4, '0')}`;
}

/** Generate project code: PRJ0001 */
async function generateProjectCode(prisma: PrismaService): Promise<string> {
  const last = await prisma.project.findFirst({
    where: { projectCode: { not: null, startsWith: 'PRJ' } },
    orderBy: { projectCode: 'desc' },
    select: { projectCode: true },
  });
  const nextNum = last?.projectCode
    ? parseInt(last.projectCode.replace('PRJ', ''), 10) + 1
    : 1;
  return `PRJ${String(nextNum).padStart(4, '0')}`;
}

/** Shared include for project queries */
const PROJECT_INCLUDE = {
  client: { select: { id: true, companyName: true } },
  nvkd: { select: { id: true, name: true, email: true, avatar: true } },
  pm: { select: { id: true, name: true, email: true, avatar: true } },
  planner: { select: { id: true, name: true, email: true, avatar: true } },
  team: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  },
  strategicBrief: { select: { id: true, status: true, completionPct: true } },
  _count: { select: { tasks: true } },
};

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(
    private prisma: PrismaService,
    private phaseService: ProjectPhaseService,
  ) {}

  // ═══════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════

  @Get()
  async listProjects(
    @Query() query: ProjectListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectListResponseDto> {
    const {
      healthStatus,
      lifecycle,
      clientId,
      nvkdId,
      decision,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { archivedAt: null };

    if (healthStatus) where.healthStatus = healthStatus;
    if (lifecycle?.length) where.lifecycle = { in: lifecycle };
    if (clientId) where.clientId = clientId;
    if (decision) where.decision = decision;

    // Role-based filter
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;

    if (nvkdId && isAdmin) where.nvkdId = nvkdId;

    if (!isAdmin) {
      if (req.user.role === UserRole.NVKD) {
        where.nvkdId = req.user.sub;
      } else {
        where.OR = [
          { pmId: req.user.sub },
          { plannerId: req.user.sub },
          { team: { some: { userId: req.user.sub } } },
        ];
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { dealCode: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await this.getTaskStats(project.id, project._count.tasks);
        return this.mapToResponse(project, taskStats);
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
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.checkProjectAccess(id, req.user);

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  @Post()
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProject(
    @Body() dto: CreateProjectDto,
    @Req() req: { user: { sub: string } },
  ): Promise<ProjectResponseDto> {
    const dealCode = await generateDealCode(this.prisma);

    const project = await this.prisma.project.create({
      data: {
        dealCode,
        name: dto.name,
        description: dto.description,
        lifecycle: ProjectLifecycle.LEAD,
        nvkdId: req.user.sub,
        clientType: dto.clientType,
        productType: dto.productType,
        licenseLink: dto.licenseLink,
        campaignObjective: dto.campaignObjective,
        initialGoal: dto.initialGoal,
        totalBudget: dto.totalBudget,
        monthlyBudget: dto.monthlyBudget,
        fixedAdFee: dto.fixedAdFee,
        adServiceFee: dto.adServiceFee,
        contentFee: dto.contentFee,
        designFee: dto.designFee,
        mediaFee: dto.mediaFee,
        otherFee: dto.otherFee,
        upsellOpportunity: dto.upsellOpportunity,
        clientId: dto.clientId,
      },
      include: PROJECT_INCLUDE,
    });

    return this.mapToResponse(project, { total: 0, todo: 0, inProgress: 0, done: 0 });
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectResponseDto> {
    await this.checkProjectAccess(id, req.user, true);

    const currentProject = await this.prisma.project.findUnique({
      where: { id },
      select: { lifecycle: true, stageProgress: true },
    });

    let newStageProgress = dto.stageProgress;
    if (dto.stageProgress === undefined && currentProject) {
      newStageProgress = currentProject.stageProgress;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        healthStatus: dto.healthStatus,
        stageProgress: newStageProgress,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        clientId: dto.clientId,
        driveLink: dto.driveLink,
        planLink: dto.planLink,
        trackingLink: dto.trackingLink,
      },
      include: PROJECT_INCLUDE,
    });

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
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

  // ═══════════════════════════════════════════════════
  // Sales Pipeline Endpoints (merged from SalesPipelineController)
  // ═══════════════════════════════════════════════════

  /** PATCH /projects/:id/sale - NVKD updates sale fields */
  @Patch(':id/sale')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSaleFields(
    @Param('id') id: string,
    @Body() dto: UpdateProjectSaleDto,
  ): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Project not found');
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Project is read-only after decision');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
      include: PROJECT_INCLUDE,
    });

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  /** PATCH /projects/:id/evaluate - PM/Planner evaluation with auto-calc */
  @Patch(':id/evaluate')
  @Roles(UserRole.PM, UserRole.PLANNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async evaluate(
    @Param('id') id: string,
    @Body() dto: UpdateProjectEvaluationDto,
  ): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Project not found');
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Project is read-only after decision');
    }

    const merged = { ...existing, ...dto };
    const financials = calculateFinancials(merged);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        cogs: financials.cogs,
        grossProfit: financials.grossProfit,
        profitMargin: financials.profitMargin,
      },
      include: PROJECT_INCLUDE,
    });

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  /** PATCH /projects/:id/lifecycle - Transition lifecycle stage */
  @Patch(':id/lifecycle')
  async updateLifecycle(
    @Param('id') id: string,
    @Body() dto: UpdateLifecycleDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUniqueOrThrow({ where: { id } });

    if (!canTransition(existing.lifecycle, dto.lifecycle)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.lifecycle} to ${dto.lifecycle}`,
      );
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        lifecycle: dto.lifecycle as ProjectLifecycle,
        stageProgress: 0,
      },
      include: PROJECT_INCLUDE,
    });

    // Record stage history
    await this.prisma.stageHistory.create({
      data: {
        projectId: id,
        fromStage: existing.lifecycle,
        toStage: dto.lifecycle,
        fromProgress: existing.stageProgress,
        toProgress: 0,
        changedById: req.user.sub,
      },
    });

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  /** POST /projects/:id/weekly-note - Append weekly note */
  @Post(':id/weekly-note')
  async addWeeklyNote(
    @Param('id') id: string,
    @Body() dto: AddWeeklyNoteDto,
    @Req() req: { user: { sub: string } },
  ): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    const existingNotes = (existing.weeklyNotes as any[]) || [];
    const newNote = {
      week: existingNotes.length + 1,
      date: new Date().toISOString(),
      note: dto.note,
      authorId: req.user.sub,
    };

    const project = await this.prisma.project.update({
      where: { id },
      data: { weeklyNotes: [...existingNotes, newNote] },
      include: PROJECT_INCLUDE,
    });

    const taskStats = await this.getTaskStats(id, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  /** POST /projects/:id/decide - Accept (WON) or Decline (LOST) */
  @Post(':id/decide')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async decide(
    @Param('id') id: string,
    @Body() dto: ProjectDecisionDto,
    @Req() req: { user: { sub: string } },
  ): Promise<ProjectResponseDto> {
    if (dto.decision === PipelineDecision.ACCEPTED) {
      return this.acceptProject(id, req.user.sub, dto.decisionNote);
    } else {
      return this.declineProject(id, req.user.sub, dto.decisionNote);
    }
  }

  // ═══════════════════════════════════════════════════
  // Stage History
  // ═══════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════
  // Team Management
  // ═══════════════════════════════════════════════════

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

    const memberStats = await Promise.all(
      team.map(async (m) => {
        const [projectTasks, totalTasks] = await Promise.all([
          this.prisma.taskAssignee.count({
            where: { userId: m.userId, task: { projectId: id } },
          }),
          this.prisma.taskAssignee.count({
            where: { userId: m.userId },
          }),
        ]);

        const projectTasksDone = await this.prisma.taskAssignee.count({
          where: {
            userId: m.userId,
            task: { projectId: id, status: 'DONE' },
          },
        });

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

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

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
      throw new BadRequestException('User is already a team member with this role');
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

    const member = await this.prisma.projectTeam.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException('Team member not found');

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

  // ═══════════════════════════════════════════════════
  // Accept / Decline (merged from PipelineAcceptService)
  // ═══════════════════════════════════════════════════

  private async acceptProject(
    projectId: string,
    userId: string,
    decisionNote?: string,
  ): Promise<ProjectResponseDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
      });

      if (project.lifecycle !== ProjectLifecycle.NEGOTIATION) {
        throw new BadRequestException('Project must be in NEGOTIATION to accept');
      }
      if (project.decision !== PipelineDecision.PENDING) {
        throw new BadRequestException(`Project already decided: ${project.decision}`);
      }

      // Generate project code
      const projectCode = await generateProjectCode(this.prisma);

      // Update project → WON
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          projectCode,
          lifecycle: ProjectLifecycle.WON,
          decision: PipelineDecision.ACCEPTED,
          decisionDate: new Date(),
          decisionNote: decisionNote || null,
          stageProgress: 0,
        },
        include: PROJECT_INCLUDE,
      });

      // Create default phases
      await this.phaseService.createDefaultPhases(projectId, tx);

      // Create strategic brief with 16 sections
      await tx.strategicBrief.create({
        data: {
          projectId,
          sections: {
            createMany: {
              data: BRIEF_SECTIONS.map((s) => ({
                sectionNum: s.num,
                sectionKey: s.key,
                title: s.title,
                isComplete: false,
              })),
            },
          },
        },
      });

      // Create team from nvkd/pm/planner
      const teamMap = new Map<string, { role: string; isPrimary: boolean }>();
      teamMap.set(project.nvkdId, { role: 'NVKD', isPrimary: false });
      if (project.pmId && !teamMap.has(project.pmId)) {
        teamMap.set(project.pmId, { role: 'PM', isPrimary: true });
      }
      if (project.plannerId && !teamMap.has(project.plannerId)) {
        teamMap.set(project.plannerId, { role: 'PLANNER', isPrimary: false });
      }

      await tx.projectTeam.createMany({
        data: Array.from(teamMap.entries()).map(([uid, m]) => ({
          projectId,
          userId: uid,
          role: m.role as any,
          isPrimary: m.isPrimary,
        })),
      });

      // Record stage history
      await tx.stageHistory.create({
        data: {
          projectId,
          fromStage: ProjectLifecycle.NEGOTIATION,
          toStage: ProjectLifecycle.WON,
          fromProgress: project.stageProgress,
          toProgress: 0,
          changedById: userId,
          reason: 'Pipeline accepted',
        },
      });

      return updated;
    });

    const taskStats = await this.getTaskStats(projectId, result._count.tasks);
    return this.mapToResponse(result, taskStats);
  }

  private async declineProject(
    projectId: string,
    userId: string,
    decisionNote?: string,
  ): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException(`Project already decided: ${existing.decision}`);
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        lifecycle: ProjectLifecycle.LOST,
        decision: PipelineDecision.DECLINED,
        decisionDate: new Date(),
        decisionNote: decisionNote || null,
      },
      include: PROJECT_INCLUDE,
    });

    // Record stage history
    await this.prisma.stageHistory.create({
      data: {
        projectId,
        fromStage: existing.lifecycle,
        toStage: ProjectLifecycle.LOST,
        fromProgress: existing.stageProgress,
        toProgress: 0,
        changedById: userId,
        reason: 'Pipeline declined',
      },
    });

    const taskStats = await this.getTaskStats(projectId, project._count.tasks);
    return this.mapToResponse(project, taskStats);
  }

  // ═══════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════

  private async checkProjectAccess(
    projectId: string,
    user: { sub: string; role: string },
    requireEdit = false,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const isMember = project.team.some((m) => m.userId === user.sub);
    const isNvkd = project.nvkdId === user.sub;
    const isPm = project.pmId === user.sub;

    if (!isAdmin && !isMember && !isNvkd && !isPm) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (requireEdit && !isAdmin) {
      const isPMRole = project.team.some(
        (m) => m.userId === user.sub && m.role === UserRole.PM,
      );
      if (!isPMRole && !isNvkd) {
        throw new ForbiddenException('Only PM or NVKD can edit this project');
      }
    }
  }

  private async getTaskStats(
    projectId: string,
    totalTasks: number,
  ): Promise<{ total: number; todo: number; inProgress: number; done: number }> {
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    const stats = { total: totalTasks, todo: 0, inProgress: 0, done: 0 };
    taskStats.forEach((stat) => {
      if (stat.status === TaskStatus.TODO) stats.todo = stat._count;
      if (stat.status === TaskStatus.IN_PROGRESS) stats.inProgress = stat._count;
      if (stat.status === TaskStatus.DONE) stats.done = stat._count;
    });
    return stats;
  }

  private mapToResponse(project: any, taskStats: any): ProjectResponseDto {
    return {
      id: project.id,
      dealCode: project.dealCode,
      projectCode: project.projectCode,
      name: project.name,
      description: project.description,
      productType: project.productType,
      lifecycle: project.lifecycle,
      healthStatus: project.healthStatus,
      stageProgress: project.stageProgress,
      startDate: project.startDate?.toISOString() ?? null,
      endDate: project.endDate?.toISOString() ?? null,
      timelineProgress: project.timelineProgress,
      driveLink: project.driveLink,
      planLink: project.planLink,
      trackingLink: project.trackingLink,
      clientId: project.clientId,
      client: project.client,
      // Team refs
      nvkdId: project.nvkdId,
      nvkd: project.nvkd ? { id: project.nvkd.id, name: project.nvkd.name } : null,
      pmId: project.pmId,
      pm: project.pm ? { id: project.pm.id, name: project.pm.name } : null,
      plannerId: project.plannerId,
      planner: project.planner
        ? { id: project.planner.id, name: project.planner.name }
        : null,
      // Sales data
      clientType: project.clientType,
      campaignObjective: project.campaignObjective,
      initialGoal: project.initialGoal,
      upsellOpportunity: project.upsellOpportunity,
      licenseLink: project.licenseLink,
      // Budget/Fees
      totalBudget: project.totalBudget ? Number(project.totalBudget) : null,
      monthlyBudget: project.monthlyBudget ? Number(project.monthlyBudget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : null,
      fixedAdFee: project.fixedAdFee ? Number(project.fixedAdFee) : null,
      adServiceFee: project.adServiceFee ? Number(project.adServiceFee) : null,
      contentFee: project.contentFee ? Number(project.contentFee) : null,
      designFee: project.designFee ? Number(project.designFee) : null,
      mediaFee: project.mediaFee ? Number(project.mediaFee) : null,
      otherFee: project.otherFee ? Number(project.otherFee) : null,
      // PM Evaluation
      costNSQC: project.costNSQC ? Number(project.costNSQC) : null,
      costDesign: project.costDesign ? Number(project.costDesign) : null,
      costMedia: project.costMedia ? Number(project.costMedia) : null,
      costKOL: project.costKOL ? Number(project.costKOL) : null,
      costOther: project.costOther ? Number(project.costOther) : null,
      cogs: project.cogs ? Number(project.cogs) : null,
      grossProfit: project.grossProfit ? Number(project.grossProfit) : null,
      profitMargin: project.profitMargin ? Number(project.profitMargin) : null,
      // Client eval
      clientTier: project.clientTier,
      averageScore: project.averageScore ? Number(project.averageScore) : null,
      // Decision
      decision: project.decision,
      decisionDate: project.decisionDate?.toISOString() ?? null,
      decisionNote: project.decisionNote,
      // Notes
      weeklyNotes: project.weeklyNotes as unknown[] | null,
      // Team
      team: (project.team || []).map((m: any) => ({
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
