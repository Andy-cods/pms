import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/persistence/prisma.service';
import {
  MEDIA_PLAN_REPOSITORY,
  type IMediaPlanRepository,
  type MediaPlanWithItems,
} from '../../domain/interfaces/media-plan.repository.interface';
import type { CreateMediaPlanDto } from '../dto/create-media-plan.dto';
import type { UpdateMediaPlanDto } from '../dto/update-media-plan.dto';
import type { MediaPlanListQueryDto } from '../dto/media-plan-query.dto';
import type { CreateMediaPlanItemDto, UpdateMediaPlanItemDto, ReorderMediaPlanItemsDto } from '../dto/media-plan-item.dto';
import type {
  MediaPlanResponseDto,
  MediaPlanListResponseDto,
  MediaPlanItemResponseDto,
} from '../dto/media-plan-response.dto';

@Injectable()
export class MediaPlanService {
  constructor(
    @Inject(MEDIA_PLAN_REPOSITORY)
    private readonly repository: IMediaPlanRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    projectId: string,
    query: MediaPlanListQueryDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanListResponseDto> {
    await this.checkProjectAccess(projectId, user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.repository.findAll({
      projectId,
      status: query.status,
      month: query.month,
      year: query.year,
      search: query.search,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: data.map((plan) => this.mapToResponse(plan)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    projectId: string,
    id: string,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user);

    const plan = await this.repository.findById(id, projectId);
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    return this.mapToResponse(plan);
  }

  async create(
    projectId: string,
    dto: CreateMediaPlanDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user, true);
    this.validateDates(dto.startDate, dto.endDate);

    const plan = await this.repository.create({
      projectId,
      name: dto.name,
      month: dto.month,
      year: dto.year,
      totalBudget: dto.totalBudget,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      notes: dto.notes,
      createdById: user.sub,
    });

    return this.mapToResponse(plan);
  }

  async update(
    projectId: string,
    id: string,
    dto: UpdateMediaPlanDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user, true);

    const existing = await this.repository.findById(id, projectId);
    if (!existing) {
      throw new NotFoundException('Media plan not found');
    }

    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate ?? existing.startDate.toISOString();
      const endDate = dto.endDate ?? existing.endDate.toISOString();
      this.validateDates(startDate, endDate);
    }

    const plan = await this.repository.update(id, {
      name: dto.name,
      month: dto.month,
      year: dto.year,
      totalBudget: dto.totalBudget,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      notes: dto.notes,
      status: dto.status,
    });

    return this.mapToResponse(plan);
  }

  async delete(
    projectId: string,
    id: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, user, true);

    const existing = await this.repository.findById(id, projectId);
    if (!existing) {
      throw new NotFoundException('Media plan not found');
    }

    await this.repository.delete(id);
  }

  async addItem(
    projectId: string,
    mediaPlanId: string,
    dto: CreateMediaPlanItemDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user, true);

    const plan = await this.repository.findById(mediaPlanId, projectId);
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    this.validateDates(dto.startDate, dto.endDate);

    await this.repository.createItem({
      mediaPlanId,
      channel: dto.channel,
      campaignType: dto.campaignType,
      objective: dto.objective,
      budget: dto.budget,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      targetReach: dto.targetReach,
      targetClicks: dto.targetClicks,
      targetLeads: dto.targetLeads,
      targetCPL: dto.targetCPL,
      targetCPC: dto.targetCPC,
      targetROAS: dto.targetROAS,
    });

    // Return full plan with updated items
    const updated = await this.repository.findById(mediaPlanId, projectId);
    return this.mapToResponse(updated!);
  }

  async updateItem(
    projectId: string,
    mediaPlanId: string,
    itemId: string,
    dto: UpdateMediaPlanItemDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user, true);

    const plan = await this.repository.findById(mediaPlanId, projectId);
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    const itemExists = plan.items.some((item) => item.id === itemId);
    if (!itemExists) {
      throw new NotFoundException('Media plan item not found');
    }

    if (dto.startDate || dto.endDate) {
      const existingItem = plan.items.find((item) => item.id === itemId)!;
      const startDate = dto.startDate ?? existingItem.startDate.toISOString();
      const endDate = dto.endDate ?? existingItem.endDate.toISOString();
      this.validateDates(startDate, endDate);
    }

    await this.repository.updateItem(itemId, {
      channel: dto.channel,
      campaignType: dto.campaignType,
      objective: dto.objective,
      budget: dto.budget,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      targetReach: dto.targetReach,
      targetClicks: dto.targetClicks,
      targetLeads: dto.targetLeads,
      targetCPL: dto.targetCPL,
      targetCPC: dto.targetCPC,
      targetROAS: dto.targetROAS,
      status: dto.status,
    });

    const updated = await this.repository.findById(mediaPlanId, projectId);
    return this.mapToResponse(updated!);
  }

  async deleteItem(
    projectId: string,
    mediaPlanId: string,
    itemId: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    await this.checkProjectAccess(projectId, user, true);

    const plan = await this.repository.findById(mediaPlanId, projectId);
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    const itemExists = plan.items.some((item) => item.id === itemId);
    if (!itemExists) {
      throw new NotFoundException('Media plan item not found');
    }

    await this.repository.deleteItem(itemId);
  }

  async reorderItems(
    projectId: string,
    mediaPlanId: string,
    dto: ReorderMediaPlanItemsDto,
    user: { sub: string; role: string },
  ): Promise<MediaPlanResponseDto> {
    await this.checkProjectAccess(projectId, user, true);

    const plan = await this.repository.findById(mediaPlanId, projectId);
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    await this.repository.reorderItems(mediaPlanId, dto.itemIds);

    const updated = await this.repository.findById(mediaPlanId, projectId);
    return this.mapToResponse(updated!);
  }

  // --- Helpers ---

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
      const member = project.team.find((m) => m.userId === user.sub);
      const canEdit =
        member &&
        (member.role === UserRole.PM ||
          member.role === UserRole.MEDIA ||
          member.role === UserRole.PLANNER);
      if (!canEdit) {
        throw new ForbiddenException(
          'You do not have permission to edit media plans',
        );
      }
    }
  }

  private validateDates(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private mapToResponse(plan: MediaPlanWithItems): MediaPlanResponseDto {
    const items: MediaPlanItemResponseDto[] = plan.items.map((item) => ({
      id: item.id,
      mediaPlanId: item.mediaPlanId,
      channel: item.channel,
      campaignType: item.campaignType,
      objective: item.objective,
      budget: Number(item.budget),
      startDate: item.startDate.toISOString(),
      endDate: item.endDate.toISOString(),
      targetReach: item.targetReach,
      targetClicks: item.targetClicks,
      targetLeads: item.targetLeads,
      targetCPL: item.targetCPL ? Number(item.targetCPL) : null,
      targetCPC: item.targetCPC ? Number(item.targetCPC) : null,
      targetROAS: item.targetROAS ? Number(item.targetROAS) : null,
      status: item.status,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const allocatedBudget = items.reduce((sum, item) => sum + item.budget, 0);

    return {
      id: plan.id,
      projectId: plan.projectId,
      name: plan.name,
      month: plan.month,
      year: plan.year,
      version: plan.version,
      status: plan.status,
      totalBudget: Number(plan.totalBudget),
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate.toISOString(),
      notes: plan.notes,
      createdBy: plan.createdBy,
      items,
      itemCount: items.length,
      allocatedBudget,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}
