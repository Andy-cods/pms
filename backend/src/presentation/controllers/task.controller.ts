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
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { UserRole, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  AssignUsersDto,
  ReorderTasksDto,
  TaskListQueryDto,
  TaskStatus as TaskStatusEnum,
  type TaskResponseDto,
  type TaskListResponseDto,
  type KanbanResponseDto,
  type KanbanColumnDto,
} from '../../application/dto/task/task.dto.js';

const TaskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(private prisma: PrismaService) {}

  // List all tasks (global or filtered by project)
  @Get()
  async listTasks(
    @Query() query: TaskListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskListResponseDto> {
    const {
      projectId,
      status,
      priority,
      assigneeId,
      search,
      page = 1,
      limit = 50,
      sortBy = 'orderIndex',
      sortOrder = 'asc',
    } = query;

    const where: Record<string, unknown> = {};

    if (projectId) {
      // Check project access
      await this.checkProjectAccess(projectId, req.user);
      where.projectId = projectId;
    } else {
      // Global task list - only tasks from user's projects
      const isAdmin = req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.ADMIN;
      if (!isAdmin) {
        const userProjects = await this.prisma.projectTeam.findMany({
          where: { userId: req.user.sub },
          select: { projectId: true },
        });
        where.projectId = { in: userProjects.map((p) => p.projectId) };
      }
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) {
      where.assignees = { some: { userId: assigneeId } };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          reviewer: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          _count: { select: { subtasks: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    // Get completed subtask counts
    const tasksWithSubtaskStats = await Promise.all(
      tasks.map(async (task) => {
        const completedSubtasks = await this.prisma.task.count({
          where: {
            parentId: task.id,
            status: TaskStatus.DONE,
          },
        });
        return this.mapToResponse(task, completedSubtasks);
      }),
    );

    return {
      tasks: tasksWithSubtaskStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tasks by project (kanban view)
  @Get('project/:projectId/kanban')
  async getKanbanView(
    @Param('projectId') projectId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<KanbanResponseDto> {
    await this.checkProjectAccess(projectId, req.user);

    const tasks = await this.prisma.task.findMany({
      where: { projectId, parentId: null },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Get completed subtask counts
    const taskResponses = await Promise.all(
      tasks.map(async (task) => {
        const completedSubtasks = await this.prisma.task.count({
          where: { parentId: task.id, status: TaskStatus.DONE },
        });
        return this.mapToResponse(task, completedSubtasks);
      }),
    );

    // Group by status
    const columns: KanbanColumnDto[] = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.REVIEW,
      TaskStatus.DONE,
      TaskStatus.BLOCKED,
    ].map((status) => ({
      status: status as TaskStatusEnum,
      label: TaskStatusLabels[status],
      tasks: taskResponses.filter((t) => t.status === status),
    }));

    return {
      columns,
      projectId,
    };
  }

  // Get single task
  @Get(':id')
  async getTask(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(task.projectId, req.user);

    const completedSubtasks = await this.prisma.task.count({
      where: { parentId: task.id, status: TaskStatus.DONE },
    });

    return this.mapToResponse(task, completedSubtasks);
  }

  // Create task
  @Post()
  async createTask(
    @Body() dto: CreateTaskDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskResponseDto> {
    await this.checkProjectAccess(dto.projectId, req.user);

    // Get max orderIndex for the project
    const maxOrder = await this.prisma.task.aggregate({
      where: { projectId: dto.projectId, parentId: dto.parentId ?? null },
      _max: { orderIndex: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        parentId: dto.parentId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority,
        estimatedHours: dto.estimatedHours,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        reviewerId: dto.reviewerId,
        createdById: req.user.sub,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        assignees: dto.assigneeIds?.length
          ? {
              create: dto.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
    });

    return this.mapToResponse(task, 0);
  }

  // Update task
  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(existing.projectId, req.user);

    // Track status changes for timestamps
    const updateData: Record<string, unknown> = {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      reviewerId: dto.reviewerId,
      orderIndex: dto.orderIndex,
    };

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === TaskStatusEnum.IN_PROGRESS && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === TaskStatusEnum.DONE && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
    });

    const completedSubtasks = await this.prisma.task.count({
      where: { parentId: task.id, status: TaskStatus.DONE },
    });

    return this.mapToResponse(task, completedSubtasks);
  }

  // Update task status only
  @Patch(':id/status')
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(existing.projectId, req.user);

    const updateData: Record<string, unknown> = { status: dto.status };

    if (dto.status === TaskStatusEnum.IN_PROGRESS && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (dto.status === TaskStatusEnum.DONE && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
    });

    const completedSubtasks = await this.prisma.task.count({
      where: { parentId: task.id, status: TaskStatus.DONE },
    });

    return this.mapToResponse(task, completedSubtasks);
  }

  // Assign users to task
  @Post(':id/assign')
  async assignUsers(
    @Param('id') id: string,
    @Body() dto: AssignUsersDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(existing.projectId, req.user);

    // Remove existing assignees and add new ones
    await this.prisma.taskAssignee.deleteMany({ where: { taskId: id } });

    if (dto.userIds.length > 0) {
      await this.prisma.taskAssignee.createMany({
        data: dto.userIds.map((userId) => ({ taskId: id, userId })),
      });
    }

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reviewer: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true } },
      },
    });

    const completedSubtasks = await this.prisma.task.count({
      where: { parentId: id, status: TaskStatus.DONE },
    });

    return this.mapToResponse(task!, completedSubtasks);
  }

  // Reorder tasks (for drag and drop)
  @Patch('project/:projectId/reorder')
  async reorderTasks(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderTasksDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, req.user);

    // Update all tasks in transaction
    await this.prisma.$transaction(
      dto.tasks.map((t) =>
        this.prisma.task.update({
          where: { id: t.id },
          data: {
            orderIndex: t.orderIndex,
            status: t.status,
            startedAt:
              t.status === TaskStatusEnum.IN_PROGRESS
                ? { set: new Date() }
                : undefined,
            completedAt:
              t.status === TaskStatusEnum.DONE ? { set: new Date() } : undefined,
          },
        }),
      ),
    );
  }

  // Delete task
  @Delete(':id')
  async deleteTask(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(task.projectId, req.user);

    await this.prisma.task.delete({ where: { id } });
  }

  // My tasks - tasks assigned to current user
  @Get('user/my-tasks')
  async getMyTasks(
    @Query() query: TaskListQueryDto,
    @Req() req: { user: { sub: string } },
  ): Promise<TaskListResponseDto> {
    const {
      status,
      priority,
      search,
      page = 1,
      limit = 50,
      sortBy = 'deadline',
      sortOrder = 'asc',
    } = query;

    const where: Record<string, unknown> = {
      assignees: { some: { userId: req.user.sub } },
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          reviewer: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          _count: { select: { subtasks: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    const tasksWithSubtaskStats = await Promise.all(
      tasks.map(async (task) => {
        const completedSubtasks = await this.prisma.task.count({
          where: { parentId: task.id, status: TaskStatus.DONE },
        });
        return this.mapToResponse(task, completedSubtasks);
      }),
    );

    return {
      tasks: tasksWithSubtaskStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper: Check project access
  private async checkProjectAccess(
    projectId: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const isMember = project.team.some((m) => m.userId === user.sub);

    if (!isAdmin && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  // Helper: Map to response DTO
  private mapToResponse(
    task: {
      id: string;
      projectId: string;
      parentId: string | null;
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: string;
      estimatedHours: number | null;
      actualHours: number | null;
      deadline: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      orderIndex: number;
      reviewerId: string | null;
      reviewer: { id: string; name: string; avatar: string | null } | null;
      createdById: string;
      createdBy: { id: string; name: string; avatar: string | null };
      assignees: Array<{
        id: string;
        userId: string;
        user: { id: string; name: string; email: string; avatar: string | null };
      }>;
      project: { id: string; code: string; name: string };
      createdAt: Date;
      updatedAt: Date;
      _count: { subtasks: number };
    },
    completedSubtaskCount: number,
  ): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      parentId: task.parentId,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatusEnum,
      priority: task.priority as TaskResponseDto['priority'],
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      deadline: task.deadline?.toISOString() ?? null,
      startedAt: task.startedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      orderIndex: task.orderIndex,
      reviewerId: task.reviewerId,
      reviewer: task.reviewer,
      createdById: task.createdById,
      createdBy: task.createdBy,
      assignees: task.assignees.map((a) => ({
        id: a.id,
        userId: a.userId,
        user: a.user,
      })),
      subtaskCount: task._count.subtasks,
      completedSubtaskCount,
      project: task.project,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
