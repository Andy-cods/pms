import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  BRIEF_SECTIONS,
  TOTAL_SECTIONS,
} from './brief-sections.config.js';

@Injectable()
export class StrategicBriefService {
  constructor(private prisma: PrismaService) {}

  /** Create brief with 16 empty sections */
  async create(projectId: string) {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    return this.prisma.strategicBrief.create({
      data: {
        projectId,
        sections: {
          createMany: {
            data: BRIEF_SECTIONS.map((s) => ({
              sectionNum: s.num as number,
              sectionKey: s.key as string,
              title: s.title as string,
              isComplete: false,
            })),
          },
        },
      },
      include: { sections: { orderBy: { sectionNum: 'asc' } } },
    });
  }

  /** Update single section data + isComplete flag */
  async updateSection(
    briefId: string,
    sectionNum: number,
    dto: { data?: Record<string, unknown>; isComplete?: boolean },
  ) {
    const updateData: Prisma.BriefSectionUpdateInput = {};
    if (dto.data !== undefined) {
      updateData.data = dto.data as Prisma.InputJsonValue;
    }
    if (dto.isComplete !== undefined) {
      updateData.isComplete = dto.isComplete;
    }

    const section = await this.prisma.briefSection.update({
      where: { briefId_sectionNum: { briefId, sectionNum } },
      data: updateData,
    });

    await this.recalculateCompletion(briefId);
    return section;
  }

  /** Recalculate completionPct on brief header */
  async recalculateCompletion(briefId: string): Promise<number> {
    const sections = await this.prisma.briefSection.findMany({
      where: { briefId },
      select: { isComplete: true },
    });
    const completed = sections.filter((s) => s.isComplete).length;
    const pct = Math.round((completed / TOTAL_SECTIONS) * 100);
    await this.prisma.strategicBrief.update({
      where: { id: briefId },
      data: { completionPct: pct },
    });
    return pct;
  }

  /** Status transition rules */
  private readonly STATUS_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'REVISION_REQUESTED'],
    REVISION_REQUESTED: ['SUBMITTED'],
    APPROVED: [],
  };

  canTransition(from: string, to: string): boolean {
    return this.STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /** Submit brief for approval (requires 100% complete) */
  async submit(briefId: string) {
    const brief = await this.prisma.strategicBrief.findUniqueOrThrow({
      where: { id: briefId },
    });
    if (brief.completionPct < 100) {
      throw new BadRequestException(
        'All 16 sections must be completed before submitting',
      );
    }
    if (!this.canTransition(brief.status, 'SUBMITTED')) {
      throw new BadRequestException(
        `Cannot submit from status ${brief.status}`,
      );
    }
    return this.prisma.strategicBrief.update({
      where: { id: briefId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  /** Approve brief */
  async approve(briefId: string, userId: string) {
    const brief = await this.prisma.strategicBrief.findUniqueOrThrow({
      where: { id: briefId },
    });
    if (!this.canTransition(brief.status, 'APPROVED')) {
      throw new BadRequestException(
        `Cannot approve from status ${brief.status}`,
      );
    }
    return this.prisma.strategicBrief.update({
      where: { id: briefId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  }

  /** Request revision (returns brief to editable state) */
  async requestRevision(briefId: string) {
    const brief = await this.prisma.strategicBrief.findUniqueOrThrow({
      where: { id: briefId },
    });
    if (!this.canTransition(brief.status, 'REVISION_REQUESTED')) {
      throw new BadRequestException(
        `Cannot request revision from status ${brief.status}`,
      );
    }
    return this.prisma.strategicBrief.update({
      where: { id: briefId },
      data: { status: 'REVISION_REQUESTED' },
    });
  }
}
