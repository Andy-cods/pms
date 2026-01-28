import {
  Controller,
  Get,
  Patch,
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
import { UpdateBudgetDto } from '../../application/dto/project/project.dto.js';

/** Budget fields are now on the Project model directly.
 *  This controller provides convenience endpoints for reading/updating budget data. */
@Controller('projects/:projectId/budget')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getBudget(
    @Param('projectId') projectId: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    await this.checkProjectAccess(projectId, req.user);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        totalBudget: true,
        monthlyBudget: true,
        spentAmount: true,
        fixedAdFee: true,
        adServiceFee: true,
        contentFee: true,
        designFee: true,
        mediaFee: true,
        otherFee: true,
        budgetPacing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    return {
      id: project.id,
      projectId,
      totalBudget: project.totalBudget ? Number(project.totalBudget) : null,
      monthlyBudget: project.monthlyBudget ? Number(project.monthlyBudget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : null,
      fixedAdFee: project.fixedAdFee ? Number(project.fixedAdFee) : null,
      adServiceFee: project.adServiceFee ? Number(project.adServiceFee) : null,
      contentFee: project.contentFee ? Number(project.contentFee) : null,
      designFee: project.designFee ? Number(project.designFee) : null,
      mediaFee: project.mediaFee ? Number(project.mediaFee) : null,
      otherFee: project.otherFee ? Number(project.otherFee) : null,
      budgetPacing: project.budgetPacing,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async updateBudget(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateBudgetDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    await this.checkProjectAccess(projectId, req.user, true);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        totalBudget: dto.totalBudget,
        monthlyBudget: dto.monthlyBudget,
        spentAmount: dto.spentAmount,
        fixedAdFee: dto.fixedAdFee,
        adServiceFee: dto.adServiceFee,
        contentFee: dto.contentFee,
        designFee: dto.designFee,
        mediaFee: dto.mediaFee,
        otherFee: dto.otherFee,
        budgetPacing: dto.budgetPacing,
      },
      select: {
        id: true,
        totalBudget: true,
        monthlyBudget: true,
        spentAmount: true,
        fixedAdFee: true,
        adServiceFee: true,
        contentFee: true,
        designFee: true,
        mediaFee: true,
        otherFee: true,
        budgetPacing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: project.id,
      projectId,
      totalBudget: project.totalBudget ? Number(project.totalBudget) : null,
      monthlyBudget: project.monthlyBudget ? Number(project.monthlyBudget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : null,
      fixedAdFee: project.fixedAdFee ? Number(project.fixedAdFee) : null,
      adServiceFee: project.adServiceFee ? Number(project.adServiceFee) : null,
      contentFee: project.contentFee ? Number(project.contentFee) : null,
      designFee: project.designFee ? Number(project.designFee) : null,
      mediaFee: project.mediaFee ? Number(project.mediaFee) : null,
      otherFee: project.otherFee ? Number(project.otherFee) : null,
      budgetPacing: project.budgetPacing,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

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

    if (!isAdmin && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (requireEdit && !isAdmin) {
      const isPM = project.team.some(
        (m) => m.userId === user.sub && m.role === UserRole.PM,
      );
      if (!isPM) {
        throw new ForbiddenException('Only Project Managers can edit the budget');
      }
    }
  }
}
