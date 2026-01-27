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
import { UpsertBudgetDto, type BudgetResponseDto } from '../../application/dto/budget/budget.dto.js';

@Controller('projects/:projectId/budget')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getBudget(
    @Param('projectId') projectId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<BudgetResponseDto | null> {
    await this.checkProjectAccess(projectId, req.user);

    const budget = await this.prisma.projectBudget.findUnique({
      where: { projectId },
    });

    if (!budget) {
      return null;
    }

    return this.mapToResponse(budget);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async createBudget(
    @Param('projectId') projectId: string,
    @Body() dto: UpsertBudgetDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<BudgetResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    // Upsert: create or update
    const budget = await this.prisma.projectBudget.upsert({
      where: { projectId },
      create: {
        projectId,
        totalBudget: dto.totalBudget,
        monthlyBudget: dto.monthlyBudget ?? null,
        spentAmount: dto.spentAmount ?? 0,
        fixedAdFee: dto.fixedAdFee ?? null,
        adServiceFee: dto.adServiceFee ?? null,
        contentFee: dto.contentFee ?? null,
        designFee: dto.designFee ?? null,
        mediaFee: dto.mediaFee ?? null,
        otherFee: dto.otherFee ?? null,
        budgetPacing: dto.budgetPacing ?? null,
      },
      update: {
        totalBudget: dto.totalBudget,
        monthlyBudget: dto.monthlyBudget ?? undefined,
        spentAmount: dto.spentAmount ?? undefined,
        fixedAdFee: dto.fixedAdFee ?? undefined,
        adServiceFee: dto.adServiceFee ?? undefined,
        contentFee: dto.contentFee ?? undefined,
        designFee: dto.designFee ?? undefined,
        mediaFee: dto.mediaFee ?? undefined,
        otherFee: dto.otherFee ?? undefined,
        budgetPacing: dto.budgetPacing ?? undefined,
      },
    });

    return this.mapToResponse(budget);
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async updateBudget(
    @Param('projectId') projectId: string,
    @Body() dto: Partial<UpsertBudgetDto>,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<BudgetResponseDto> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectBudget.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found for this project');
    }

    const budget = await this.prisma.projectBudget.update({
      where: { projectId },
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
    });

    return this.mapToResponse(budget);
  }

  @Delete()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteBudget(
    @Param('projectId') projectId: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, req.user, true);

    const existing = await this.prisma.projectBudget.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found for this project');
    }

    await this.prisma.projectBudget.delete({
      where: { projectId },
    });
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
          'Only Project Managers can edit the budget',
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponse(budget: any): BudgetResponseDto {
    return {
      id: budget.id,
      projectId: budget.projectId,
      totalBudget: Number(budget.totalBudget),
      monthlyBudget: budget.monthlyBudget ? Number(budget.monthlyBudget) : null,
      spentAmount: Number(budget.spentAmount),
      fixedAdFee: budget.fixedAdFee ? Number(budget.fixedAdFee) : null,
      adServiceFee: budget.adServiceFee ? Number(budget.adServiceFee) : null,
      contentFee: budget.contentFee ? Number(budget.contentFee) : null,
      designFee: budget.designFee ? Number(budget.designFee) : null,
      mediaFee: budget.mediaFee ? Number(budget.mediaFee) : null,
      otherFee: budget.otherFee ? Number(budget.otherFee) : null,
      budgetPacing: budget.budgetPacing,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }
}
