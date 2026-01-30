import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  BudgetEventQueryDto,
  CreateBudgetEventDto,
  UpdateBudgetEventStatusDto,
  BudgetEventResponse,
  BudgetThresholdResponse,
} from '../../application/dto/budget-event.dto.js';
import { BudgetEventWithCreator } from '../../shared/types/prisma-relations.types.js';
import { BUDGET_THRESHOLDS } from '../../shared/constants/business-rules.js';

@Injectable()
export class BudgetEventService {
  constructor(private prisma: PrismaService) {}

  /** Retrieve budget events for a project, optionally filtered by stage/category/status. */
  async list(
    projectId: string,
    query: BudgetEventQueryDto,
  ): Promise<BudgetEventResponse[]> {
    const where: Record<string, unknown> = { projectId };
    if (query.stage) where.stage = query.stage;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;

    const events = await this.prisma.budgetEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return events.map((e) => this.map(e));
  }

  /** Create a budget event and auto-recalculate spent amount if the event type is SPEND. */
  async create(
    projectId: string,
    userId: string,
    dto: CreateBudgetEventDto,
  ): Promise<BudgetEventResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    if (dto.mediaPlanId) {
      const plan = await this.prisma.mediaPlan.findUnique({
        where: { id: dto.mediaPlanId },
        select: { id: true, projectId: true },
      });
      if (!plan || plan.projectId !== projectId) {
        throw new NotFoundException('Media plan not found for project');
      }
    }

    const created = await this.prisma.budgetEvent.create({
      data: {
        projectId,
        mediaPlanId: dto.mediaPlanId,
        stage: dto.stage,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        note: dto.note,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Auto-recalc spent if this is an approved spend event
    if (dto.type === 'SPEND') {
      await this.recalcSpent(projectId);
    }

    return this.map(created);
  }

  /** Update the approval status of a budget event and recalculate spent if it is a SPEND event. */
  async updateStatus(
    eventId: string,
    projectId: string,
    dto: UpdateBudgetEventStatusDto,
  ): Promise<BudgetEventResponse> {
    const event = await this.prisma.budgetEvent.findFirst({
      where: { id: eventId, projectId },
    });
    if (!event) throw new NotFoundException('Budget event not found');

    const updated = await this.prisma.budgetEvent.update({
      where: { id: eventId },
      data: { status: dto.status },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    // Recalculate spentAmount when a SPEND event status changes
    if (event.type === 'SPEND') {
      await this.recalcSpent(projectId);
    }

    return this.map(updated);
  }

  /** Recalculate and persist the total spent amount from all approved SPEND events. */
  async recalcSpent(projectId: string): Promise<void> {
    const result = await this.prisma.budgetEvent.aggregate({
      where: { projectId, type: 'SPEND', status: 'APPROVED' },
      _sum: { amount: true },
    });
    const spent = result._sum.amount ?? 0;

    await this.prisma.project.update({
      where: { id: projectId },
      data: { spentAmount: spent },
    });
  }

  /** Return the budget threshold level (ok/warning/critical) and spend percentage for a project. */
  async getThreshold(projectId: string): Promise<BudgetThresholdResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { totalBudget: true, spentAmount: true },
    });
    if (!project || Number(project.totalBudget) === 0) {
      return { level: 'ok', percent: 0 };
    }

    const percent = Math.round(
      (Number(project.spentAmount) / Number(project.totalBudget)) * 100,
    );
    const level =
      percent >= BUDGET_THRESHOLDS.CRITICAL_PERCENT
        ? 'critical'
        : percent >= BUDGET_THRESHOLDS.WARNING_PERCENT
          ? 'warning'
          : 'ok';
    return { level, percent };
  }

  private map(event: BudgetEventWithCreator): BudgetEventResponse {
    return {
      id: event.id,
      projectId: event.projectId,
      mediaPlanId: event.mediaPlanId,
      stage: event.stage,
      amount: Number(event.amount),
      type: event.type,
      category: event.category,
      status: event.status,
      note: event.note,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
    };
  }
}
