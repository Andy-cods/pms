import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ClientAuthGuard,
  ClientUser,
} from '../../modules/auth/guards/client-auth.guard';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  type ClientProjectResponseDto,
  type ClientProjectDetailDto,
  type ClientProjectListResponseDto,
  type ClientFileDto,
  type ClientProgressDto,
} from '../../application/dto/client/client-project.dto';

interface RequestWithClient extends Request {
  clientUser: ClientUser;
}

@ApiTags('Client Portal')
@ApiBearerAuth('JWT-auth')
@Controller('client/projects')
@UseGuards(ClientAuthGuard)
export class ClientProjectController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: 'List client projects' })
  @ApiResponse({ status: 200, description: 'Returns client project list' })
  @Get()
  async listProjects(
    @Req() req: RequestWithClient,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<ClientProjectListResponseDto> {
    const clientId = req.clientUser.clientId;

    const where: Record<string, unknown> = { clientId };

    if (status) {
      where.healthStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const total = await this.prisma.project.count({ where });

    return {
      projects: projects.map((p) => this.mapToResponse(p)),
      total,
    };
  }

  @ApiOperation({ summary: 'Get client project details with tasks and files' })
  @ApiResponse({ status: 200, description: 'Returns project detail' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get(':id')
  async getProject(
    @Req() req: RequestWithClient,
    @Param('id') id: string,
  ): Promise<ClientProjectDetailDto> {
    const clientId = req.clientUser.clientId;

    const project = await this.prisma.project.findFirst({
      where: { id, clientId },
      include: {
        tasks: {
          include: {
            assignees: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        files: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.mapToDetailResponse(project);
  }

  @ApiOperation({ summary: 'Get files for a client project' })
  @ApiResponse({ status: 200, description: 'Returns project files' })
  @Get(':id/files')
  async getProjectFiles(
    @Req() req: RequestWithClient,
    @Param('id') id: string,
  ): Promise<ClientFileDto[]> {
    const clientId = req.clientUser.clientId;

    const project = await this.prisma.project.findFirst({
      where: { id, clientId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const files = await this.prisma.file.findMany({
      where: { projectId: id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return files.map((f) => ({
      id: f.id,
      filename: f.name,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      uploadedAt: f.uploadedAt.toISOString(),
      uploadedBy: {
        id: f.uploadedBy.id,
        name: f.uploadedBy.name,
      },
    }));
  }

  @ApiOperation({ summary: 'Get project progress summary' })
  @ApiResponse({ status: 200, description: 'Returns progress data' })
  @Get(':id/progress')
  async getProjectProgress(
    @Req() req: RequestWithClient,
    @Param('id') id: string,
  ): Promise<ClientProgressDto> {
    const clientId = req.clientUser.clientId;

    const project = await this.prisma.project.findFirst({
      where: { id, clientId },
      include: {
        tasks: { select: { status: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === 'DONE',
    ).length;
    const progress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : project.stageProgress;

    return {
      projectId: id,
      totalTasks,
      completedTasks,
      progress,
      recentActivity: [],
    };
  }

  private mapToResponse(project: {
    id: string;
    name: string;
    description: string | null;
    healthStatus: string;
    stageProgress: number;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tasks: { status: string }[];
  }): ClientProjectResponseDto {
    const tasks = project.tasks;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const progress =
      tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : project.stageProgress;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.healthStatus,
      priority: 'MEDIUM',
      progress,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      taskStats: {
        total: tasks.length,
        completed: completedTasks,
        inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        pending: tasks.filter((t) => t.status === 'TODO').length,
      },
    };
  }

  private mapToDetailResponse(project: {
    id: string;
    name: string;
    description: string | null;
    healthStatus: string;
    stageProgress: number;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tasks: {
      id: string;
      title: string;
      status: string;
      priority: string;
      deadline: Date | null;
      assignees: {
        user: { id: string; name: string };
      }[];
    }[];
    files: {
      id: string;
      name: string;
      originalName: string;
      mimeType: string;
      size: number;
      uploadedAt: Date;
      uploadedBy: { id: string; name: string };
    }[];
  }): ClientProjectDetailDto {
    const taskStatuses = project.tasks.map((t) => ({ status: t.status }));

    return {
      ...this.mapToResponse({ ...project, tasks: taskStatuses }),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.deadline?.toISOString() || null,
        assignee: t.assignees[0]
          ? {
              id: t.assignees[0].user.id,
              name: t.assignees[0].user.name,
            }
          : null,
      })),
      files: project.files.map((f) => ({
        id: f.id,
        filename: f.name,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        uploadedAt: f.uploadedAt.toISOString(),
        uploadedBy: f.uploadedBy,
      })),
    };
  }
}
