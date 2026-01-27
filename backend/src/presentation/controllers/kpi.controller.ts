import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { Prisma } from '@prisma/client';
import {
  CreateKpiDto,
  UpdateKpiDto,
  type KpiResponseDto,
} from '../../application/dto/kpi/kpi.dto.js';

@Controller('projects/:projectId/kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listKpis(
    @Param('projectId') projectId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<KpiResponseDto[]> {
    await this.checkProjectAccess(projectId, req.user);

    const kpis = await this.prisma.projectKPI.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return kpis.map((k) => this.mapToResponse(k));
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async createKpi(
    @Param('projectId') projectId: string,
    @Body() dto: CreateKpiDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<KpiResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    const kpi = await this.prisma.projectKPI.create({
      data: {
        projectId,
        kpiType: dto.kpiType,
        targetValue: dto.targetValue ?? null,
        actualValue: dto.actualValue ?? null,
        unit: dto.unit ?? null,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return this.mapToResponse(kpi);
  }

  @Patch(':kpiId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async updateKpi(
    @Param('projectId') projectId: string,
    @Param('kpiId') kpiId: string,
    @Body() dto: UpdateKpiDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<KpiResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectKPI.findFirst({
      where: { id: kpiId, projectId },
    });
    if (!existing) {
      throw new NotFoundException('KPI not found');
    }

    const kpi = await this.prisma.projectKPI.update({
      where: { id: kpiId },
      data: {
        kpiType: dto.kpiType,
        targetValue: dto.targetValue,
        actualValue: dto.actualValue,
        unit: dto.unit,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return this.mapToResponse(kpi);
  }

  @Delete(':kpiId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async deleteKpi(
    @Param('projectId') projectId: string,
    @Param('kpiId') kpiId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectKPI.findFirst({
      where: { id: kpiId, projectId },
    });
    if (!existing) {
      throw new NotFoundException('KPI not found');
    }

    await this.prisma.projectKPI.delete({ where: { id: kpiId } });
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
        throw new ForbiddenException('Only Project Managers can manage KPIs');
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponse(kpi: any): KpiResponseDto {
    return {
      id: kpi.id,
      projectId: kpi.projectId,
      kpiType: kpi.kpiType,
      targetValue: kpi.targetValue,
      actualValue: kpi.actualValue,
      unit: kpi.unit,
      metadata: kpi.metadata,
      createdAt: kpi.createdAt.toISOString(),
      updatedAt: kpi.updatedAt.toISOString(),
    };
  }
}
