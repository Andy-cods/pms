import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import {
  UserRole,
  ApprovalStatus as PrismaApprovalStatus,
  ApprovalType as PrismaApprovalType,
  ProjectLifecycle,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateApprovalDto,
  UpdateApprovalDto,
  ApproveApprovalDto,
  RejectApprovalDto,
  RequestChangesDto,
  ApprovalListQueryDto,
  ApprovalStatus,
  ApprovalType,
  type ApprovalResponseDto,
  type ApprovalListResponseDto,
  type ApprovalStatsDto,
} from '../../application/dto/approval/approval.dto.js';

interface AuthUser {
  sub: string;
  email: string;
  role: string;
}

/** Approval result shape from controller queries with all relations */
interface ApprovalQueryResult {
  id: string;
  projectId: string;
  type: PrismaApprovalType;
  status: PrismaApprovalStatus;
  title: string;
  description: string | null;
  comment: string | null;
  deadline: Date | null;
  escalationLevel: number;
  escalatedAt: Date | null;
  submittedAt: Date;
  respondedAt: Date | null;
  submittedById: string;
  approvedById: string | null;
  project: { id: string; dealCode: string; name: string };
  submittedBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  approvedBy: { id: string; name: string; avatar: string | null } | null;
  files?: { id: string; name: string; mimeType: string; size: number }[];
  history?: Array<{
    id: string;
    fromStatus: PrismaApprovalStatus;
    toStatus: PrismaApprovalStatus;
    comment: string | null;
    changedById: string;
    changedAt: Date;
    changedBy?: { id: string; name: string; avatar: string | null } | null;
  }>;
}

@ApiTags('Approvals')
@ApiBearerAuth('JWT-auth')
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private prisma: PrismaService) {}

  // Helper: Check if user has access to project
  private async checkProjectAccess(
    projectId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    const isAdmin =
      userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN;
    if (isAdmin) return true;

    const membership = await this.prisma.projectTeam.findFirst({
      where: { projectId, userId },
    });
    return !!membership;
  }

  // Helper: Map Prisma result to response DTO
  private mapToResponse(approval: ApprovalQueryResult): ApprovalResponseDto {
    return {
      id: approval.id,
      projectId: approval.projectId,
      project: {
        id: approval.project.id,
        dealCode: approval.project.dealCode,
        name: approval.project.name,
      },
      type: approval.type as string as ApprovalType,
      status: approval.status as string as ApprovalStatus,
      title: approval.title,
      description: approval.description,
      comment: approval.comment,
      deadline: approval.deadline?.toISOString() ?? null,
      escalationLevel: approval.escalationLevel,
      escalatedAt: approval.escalatedAt?.toISOString() ?? null,
      submittedBy: {
        id: approval.submittedBy.id,
        name: approval.submittedBy.name,
        email: approval.submittedBy.email,
        avatar: approval.submittedBy.avatar,
      },
      approvedBy: approval.approvedBy
        ? {
            id: approval.approvedBy.id,
            name: approval.approvedBy.name,
            avatar: approval.approvedBy.avatar,
          }
        : null,
      files:
        approval.files?.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
        })) ?? [],
      history:
        approval.history?.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus as string as ApprovalStatus,
          toStatus: h.toStatus as string as ApprovalStatus,
          comment: h.comment,
          changedBy: {
            id: h.changedById,
            name: h.changedBy?.name ?? 'Unknown',
            avatar: h.changedBy?.avatar ?? null,
          },
          changedAt: h.changedAt.toISOString(),
        })) ?? [],
      submittedAt: approval.submittedAt.toISOString(),
      respondedAt: approval.respondedAt?.toISOString() ?? null,
    };
  }

  // Helper: Record approval history
  private async recordHistory(
    approvalId: string,
    fromStatus: PrismaApprovalStatus,
    toStatus: PrismaApprovalStatus,
    changedById: string,
    comment?: string,
  ): Promise<void> {
    await this.prisma.approvalHistory.create({
      data: {
        approvalId,
        fromStatus,
        toStatus,
        comment,
        changedById,
      },
    });
  }

  // GET /api/approvals - List approvals
  @ApiOperation({ summary: 'List approvals with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated approval list' })
  @Get()
  async listApprovals(
    @Query() query: ApprovalListQueryDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalListResponseDto> {
    const {
      projectId,
      status,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Non-admin users only see approvals for projects they are part of
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      where.project = {
        team: {
          some: { userId: req.user.sub },
        },
      };
    }

    const skip = (page - 1) * limit;

    const [approvals, total] = await Promise.all([
      this.prisma.approval.findMany({
        where,
        include: {
          project: { select: { id: true, dealCode: true, name: true } },
          submittedBy: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          approvedBy: { select: { id: true, name: true, avatar: true } },
          files: {
            select: { id: true, name: true, mimeType: true, size: true },
          },
          history: {
            orderBy: { changedAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.approval.count({ where }),
    ]);

    return {
      approvals: approvals.map((a) => this.mapToResponse(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET /api/approvals/pending - Pending approvals for current user (approvers)
  @ApiOperation({ summary: 'Get pending approvals for approvers' })
  @ApiResponse({ status: 200, description: 'Returns pending approvals' })
  @Get('pending')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPendingApprovals(): Promise<ApprovalResponseDto[]> {
    const approvals = await this.prisma.approval.findMany({
      where: {
        status: PrismaApprovalStatus.PENDING,
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { submittedAt: 'asc' }, // Oldest first
    });

    return approvals.map((a) => this.mapToResponse(a));
  }

  // GET /api/approvals/stats - Stats for dashboard
  @ApiOperation({ summary: 'Get approval statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Returns approval stats' })
  @Get('stats')
  async getApprovalStats(
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalStatsDto> {
    const where: Record<string, unknown> = {};

    // Non-admin users only see stats for their projects
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      where.project = {
        team: {
          some: { userId: req.user.sub },
        },
      };
    }

    const [total, pending, approved, rejected, changesRequested] =
      await Promise.all([
        this.prisma.approval.count({ where }),
        this.prisma.approval.count({
          where: { ...where, status: PrismaApprovalStatus.PENDING },
        }),
        this.prisma.approval.count({
          where: { ...where, status: PrismaApprovalStatus.APPROVED },
        }),
        this.prisma.approval.count({
          where: { ...where, status: PrismaApprovalStatus.REJECTED },
        }),
        this.prisma.approval.count({
          where: { ...where, status: PrismaApprovalStatus.CHANGES_REQUESTED },
        }),
      ]);

    return { total, pending, approved, rejected, changesRequested };
  }

  // GET /api/approvals/:id - Get single approval with history
  @ApiOperation({ summary: 'Get approval by ID with full history' })
  @ApiResponse({ status: 200, description: 'Returns approval details' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  @Get(':id')
  async getApproval(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          include: {
            approval: false,
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Check access
    const hasAccess = await this.checkProjectAccess(
      approval.projectId,
      req.user.sub,
      req.user.role,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this approval');
    }

    // Fetch changedBy user details for history
    const historyWithUsers = await Promise.all(
      approval.history.map(async (h) => {
        const changedBy = await this.prisma.user.findUnique({
          where: { id: h.changedById },
          select: { id: true, name: true, avatar: true },
        });
        return { ...h, changedBy };
      }),
    );

    return this.mapToResponse({ ...approval, history: historyWithUsers });
  }

  // POST /api/approvals - Submit for approval
  @ApiOperation({ summary: 'Submit item for approval' })
  @ApiResponse({ status: 201, description: 'Approval created' })
  @Post()
  async createApproval(
    @Body() dto: CreateApprovalDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    // Check project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const hasAccess = await this.checkProjectAccess(
      dto.projectId,
      req.user.sub,
      req.user.role,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    // Create approval
    const approval = await this.prisma.approval.create({
      data: {
        projectId: dto.projectId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        submittedById: req.user.sub,
        files: dto.fileIds?.length
          ? { connect: dto.fileIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: true,
      },
    });

    // Update project stage to UNDER_REVIEW if not already
    if (project.lifecycle !== ProjectLifecycle.EVALUATION) {
      await this.prisma.project.update({
        where: { id: dto.projectId },
        data: { lifecycle: ProjectLifecycle.EVALUATION },
      });
    }

    // Record initial history
    await this.recordHistory(
      approval.id,
      PrismaApprovalStatus.PENDING,
      PrismaApprovalStatus.PENDING,
      req.user.sub,
      'Submitted for approval',
    );

    return this.mapToResponse(approval);
  }

  // PATCH /api/approvals/:id - Update approval (resubmit)
  @ApiOperation({ summary: 'Resubmit approval after changes requested' })
  @ApiResponse({ status: 200, description: 'Approval resubmitted' })
  @ApiResponse({
    status: 400,
    description: 'Can only update CHANGES_REQUESTED approvals',
  })
  @Patch(':id')
  async updateApproval(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Only submitter can update
    if (approval.submittedById !== req.user.sub) {
      throw new ForbiddenException('Only the submitter can update this');
    }

    // Only CHANGES_REQUESTED status can be updated
    if (approval.status !== PrismaApprovalStatus.CHANGES_REQUESTED) {
      throw new BadRequestException(
        'Only approvals with CHANGES_REQUESTED status can be updated',
      );
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        title: dto.title ?? approval.title,
        description: dto.description ?? approval.description,
        deadline: dto.deadline ? new Date(dto.deadline) : approval.deadline,
        status: PrismaApprovalStatus.PENDING, // Reset to pending
        files: dto.fileIds?.length
          ? { set: dto.fileIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Record history
    await this.recordHistory(
      id,
      PrismaApprovalStatus.CHANGES_REQUESTED,
      PrismaApprovalStatus.PENDING,
      req.user.sub,
      'Resubmitted after changes',
    );

    return this.mapToResponse(updated);
  }

  // PATCH /api/approvals/:id/approve - Approve
  @ApiOperation({ summary: 'Approve an approval request' })
  @ApiResponse({ status: 200, description: 'Approval approved' })
  @ApiResponse({
    status: 400,
    description: 'Only PENDING approvals can be approved',
  })
  @Patch(':id/approve')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approveApproval(
    @Param('id') id: string,
    @Body() dto: ApproveApprovalDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Only PENDING can be approved
    if (approval.status !== PrismaApprovalStatus.PENDING) {
      throw new BadRequestException('Only PENDING approvals can be approved');
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: PrismaApprovalStatus.APPROVED,
        comment: dto.comment,
        approvedById: req.user.sub,
        respondedAt: new Date(),
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Record history
    await this.recordHistory(
      id,
      PrismaApprovalStatus.PENDING,
      PrismaApprovalStatus.APPROVED,
      req.user.sub,
      dto.comment,
    );

    // Update project stage based on current stage
    const newLifecycle =
      approval.project.lifecycle === ProjectLifecycle.EVALUATION
        ? ProjectLifecycle.NEGOTIATION
        : ProjectLifecycle.ONGOING;

    await this.prisma.project.update({
      where: { id: approval.projectId },
      data: { lifecycle: newLifecycle },
    });

    return this.mapToResponse(updated);
  }

  // PATCH /api/approvals/:id/reject - Reject
  @ApiOperation({ summary: 'Reject an approval request' })
  @ApiResponse({ status: 200, description: 'Approval rejected' })
  @ApiResponse({
    status: 400,
    description: 'Only PENDING approvals can be rejected',
  })
  @Patch(':id/reject')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async rejectApproval(
    @Param('id') id: string,
    @Body() dto: RejectApprovalDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Only PENDING can be rejected
    if (approval.status !== PrismaApprovalStatus.PENDING) {
      throw new BadRequestException('Only PENDING approvals can be rejected');
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: PrismaApprovalStatus.REJECTED,
        comment: dto.comment,
        approvedById: req.user.sub,
        respondedAt: new Date(),
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Record history
    await this.recordHistory(
      id,
      PrismaApprovalStatus.PENDING,
      PrismaApprovalStatus.REJECTED,
      req.user.sub,
      dto.comment,
    );

    // Revert project stage
    await this.prisma.project.update({
      where: { id: approval.projectId },
      data: { lifecycle: ProjectLifecycle.PLANNING },
    });

    return this.mapToResponse(updated);
  }

  // PATCH /api/approvals/:id/request-changes - Request changes
  @ApiOperation({ summary: 'Request changes on an approval' })
  @ApiResponse({ status: 200, description: 'Changes requested' })
  @ApiResponse({
    status: 400,
    description: 'Only PENDING approvals can have changes requested',
  })
  @Patch(':id/request-changes')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async requestChanges(
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
    @Req() req: { user: AuthUser },
  ): Promise<ApprovalResponseDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Only PENDING can have changes requested
    if (approval.status !== PrismaApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING approvals can have changes requested',
      );
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: PrismaApprovalStatus.CHANGES_REQUESTED,
        comment: dto.comment,
        approvedById: req.user.sub,
        respondedAt: new Date(),
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approvedBy: { select: { id: true, name: true, avatar: true } },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Record history
    await this.recordHistory(
      id,
      PrismaApprovalStatus.PENDING,
      PrismaApprovalStatus.CHANGES_REQUESTED,
      req.user.sub,
      dto.comment,
    );

    return this.mapToResponse(updated);
  }
}
