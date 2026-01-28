import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { PipelineStage } from '@prisma/client';

@Injectable()
export class SalesPipelineService {
  constructor(private prisma: PrismaService) {}

  /** Valid stage transitions (enum-based state machine) */
  private readonly STAGE_TRANSITIONS: Record<string, string[]> = {
    LEAD: ['QUALIFIED', 'LOST'],
    QUALIFIED: ['EVALUATION', 'LOST'],
    EVALUATION: ['NEGOTIATION', 'LOST'],
    NEGOTIATION: ['WON', 'LOST'],
    WON: [],
    LOST: [],
  };

  /**
   * Calculate COGS, Gross Profit, Profit Margin from cost/budget fields.
   * COGS = sum of all cost fields.
   * Gross Profit = totalBudget - COGS.
   * Profit Margin = (Gross Profit / totalBudget) * 100.
   */
  calculateFinancials(data: Record<string, any>): {
    cogs: number;
    grossProfit: number;
    profitMargin: number;
  } {
    const cogs =
      Number(data.costNSQC || 0) +
      Number(data.costDesign || 0) +
      Number(data.costMedia || 0) +
      Number(data.costKOL || 0) +
      Number(data.costOther || 0);
    const totalBudget = Number(data.totalBudget || 0);
    const grossProfit = totalBudget - cogs;
    const profitMargin =
      totalBudget > 0 ? (grossProfit / totalBudget) * 100 : 0;
    return { cogs, grossProfit, profitMargin };
  }

  /** Check if stage transition is valid */
  canTransition(from: string, to: string): boolean {
    return this.STAGE_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /** Transition pipeline stage with validation */
  async updateStage(id: string, newStage: PipelineStage) {
    const pipeline = await this.prisma.salesPipeline.findUniqueOrThrow({
      where: { id },
    });
    if (!this.canTransition(pipeline.status, newStage)) {
      throw new BadRequestException(
        `Cannot transition from ${pipeline.status} to ${newStage}`,
      );
    }
    return this.prisma.salesPipeline.update({
      where: { id },
      data: { status: newStage },
    });
  }

  /** Append a weekly note to JSONB array */
  async addWeeklyNote(id: string, note: string, authorId: string) {
    const pipeline = await this.prisma.salesPipeline.findUniqueOrThrow({
      where: { id },
    });
    const existingNotes = (pipeline.weeklyNotes as any[]) || [];
    const newNote = {
      week: existingNotes.length + 1,
      date: new Date().toISOString(),
      note,
      authorId,
    };
    return this.prisma.salesPipeline.update({
      where: { id },
      data: { weeklyNotes: [...existingNotes, newNote] },
    });
  }
}
