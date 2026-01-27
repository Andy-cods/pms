import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma.service';
import type { MediaPlanItem } from '@prisma/client';
import type {
  IMediaPlanRepository,
  MediaPlanWithItems,
  MediaPlanListResult,
  MediaPlanQueryParams,
  CreateMediaPlanData,
  UpdateMediaPlanData,
  CreateMediaPlanItemData,
  UpdateMediaPlanItemData,
} from '../../domain/interfaces/media-plan.repository.interface';

const INCLUDE_ITEMS_AND_CREATOR = {
  items: { orderBy: { orderIndex: 'asc' as const } },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class PrismaMediaPlanRepository implements IMediaPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: MediaPlanQueryParams): Promise<MediaPlanListResult> {
    const { projectId, status, month, year, search, page, limit, sortBy, sortOrder } = params;

    const where: Record<string, unknown> = { projectId };
    if (status) where.status = status;
    if (month) where.month = month;
    if (year) where.year = year;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.mediaPlan.findMany({
        where,
        include: INCLUDE_ITEMS_AND_CREATOR,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mediaPlan.count({ where }),
    ]);

    return { data: data as MediaPlanWithItems[], total };
  }

  async findById(id: string, projectId: string): Promise<MediaPlanWithItems | null> {
    const plan = await this.prisma.mediaPlan.findFirst({
      where: { id, projectId },
      include: INCLUDE_ITEMS_AND_CREATOR,
    });
    return plan as MediaPlanWithItems | null;
  }

  async create(data: CreateMediaPlanData): Promise<MediaPlanWithItems> {
    const plan = await this.prisma.mediaPlan.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        month: data.month,
        year: data.year,
        totalBudget: data.totalBudget,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
        createdById: data.createdById,
      },
      include: INCLUDE_ITEMS_AND_CREATOR,
    });
    return plan as MediaPlanWithItems;
  }

  async update(id: string, data: UpdateMediaPlanData): Promise<MediaPlanWithItems> {
    const plan = await this.prisma.mediaPlan.update({
      where: { id },
      data,
      include: INCLUDE_ITEMS_AND_CREATOR,
    });
    return plan as MediaPlanWithItems;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mediaPlan.delete({ where: { id } });
  }

  async createItem(data: CreateMediaPlanItemData): Promise<MediaPlanItem> {
    // If no orderIndex provided, put at end
    if (data.orderIndex === undefined) {
      const maxOrder = await this.prisma.mediaPlanItem.aggregate({
        where: { mediaPlanId: data.mediaPlanId },
        _max: { orderIndex: true },
      });
      data.orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    return this.prisma.mediaPlanItem.create({ data });
  }

  async updateItem(id: string, data: UpdateMediaPlanItemData): Promise<MediaPlanItem> {
    return this.prisma.mediaPlanItem.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.mediaPlanItem.delete({ where: { id } });
  }

  async reorderItems(_mediaPlanId: string, itemIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.mediaPlanItem.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );
  }
}
