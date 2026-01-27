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
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateLogDto,
  UpdateLogDto,
  type LogResponseDto,
} from '../../application/dto/log/log.dto.js';

@Controller('projects/:projectId/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listLogs(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Req() req?: { user: { sub: string; role: string } },
  ): Promise<LogResponseDto[]> {
    if (req?.user) {
      await this.checkProjectAccess(projectId, req.user);
    }

    const take = limit ? parseInt(limit, 10) : 50;

    const logs = await this.prisma.projectLog.findMany({
      where: { projectId },
      orderBy: { logDate: 'desc' },
      take,
    });

    return logs.map((l) => this.mapToResponse(l));
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async createLog(
    @Param('projectId') projectId: string,
    @Body() dto: CreateLogDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<LogResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    const log = await this.prisma.projectLog.create({
      data: {
        projectId,
        logDate: new Date(dto.logDate),
        rootCause: dto.rootCause ?? null,
        action: dto.action ?? null,
        nextAction: dto.nextAction ?? null,
        notes: dto.notes ?? null,
      },
    });

    return this.mapToResponse(log);
  }

  @Patch(':logId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async updateLog(
    @Param('projectId') projectId: string,
    @Param('logId') logId: string,
    @Body() dto: UpdateLogDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<LogResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectLog.findFirst({
      where: { id: logId, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Log not found');
    }

    const log = await this.prisma.projectLog.update({
      where: { id: logId },
      data: {
        logDate: dto.logDate ? new Date(dto.logDate) : undefined,
        rootCause: dto.rootCause,
        action: dto.action,
        nextAction: dto.nextAction,
        notes: dto.notes,
      },
    });

    return this.mapToResponse(log);
  }

  @Delete(':logId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async deleteLog(
    @Param('projectId') projectId: string,
    @Param('logId') logId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectLog.findFirst({
      where: { id: logId, projectId },
    });
    if (!existing) {
      throw new NotFoundException('Log not found');
    }

    await this.prisma.projectLog.delete({ where: { id: logId } });
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
        throw new ForbiddenException('Only Project Managers can manage logs');
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponse(log: any): LogResponseDto {
    return {
      id: log.id,
      projectId: log.projectId,
      logDate: log.logDate.toISOString(),
      rootCause: log.rootCause,
      action: log.action,
      nextAction: log.nextAction,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
