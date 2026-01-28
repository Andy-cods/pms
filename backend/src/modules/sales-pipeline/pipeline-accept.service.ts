import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { DEFAULT_PHASES } from '../project-phase/phase-defaults.config.js';
import { BRIEF_SECTIONS } from '../strategic-brief/brief-sections.config.js';

function generateProjectCode(): string {
  const prefix = 'PRJ';
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${randomNum}`;
}

@Injectable()
export class PipelineAcceptService {
  constructor(private prisma: PrismaService) {}

  /**
   * Accept pipeline: create Project + Budget + Team + Phases + Brief atomically.
   */
  async acceptPipeline(
    pipelineId: string,
    userId: string,
    decisionNote?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate pipeline is PENDING
      const pipeline = await tx.salesPipeline.findUniqueOrThrow({
        where: { id: pipelineId },
      });

      if (pipeline.decision !== 'PENDING') {
        throw new BadRequestException(
          `Pipeline already decided: ${pipeline.decision}`,
        );
      }

      // 2. Create Project
      const project = await tx.project.create({
        data: {
          code: generateProjectCode(),
          name: pipeline.projectName,
          productType: pipeline.productType,
          stage: pipeline.currentStage,
          status: 'STABLE',
        },
      });

      // 3. Create ProjectBudget (copy financials)
      await tx.projectBudget.create({
        data: {
          projectId: project.id,
          totalBudget: pipeline.totalBudget || 0,
          monthlyBudget: pipeline.monthlyBudget,
          spentAmount: pipeline.spentAmount || 0,
          fixedAdFee: pipeline.fixedAdFee,
          adServiceFee: pipeline.adServiceFee,
          contentFee: pipeline.contentFee,
          designFee: pipeline.designFee,
          mediaFee: pipeline.mediaFee,
          otherFee: pipeline.otherFee,
        },
      });

      // 4. Create ProjectTeam (NVKD + PM + Planner) - deduplicated
      const teamMap = new Map<string, { role: string; isPrimary: boolean }>();
      teamMap.set(pipeline.nvkdId, { role: 'NVKD', isPrimary: false });
      if (pipeline.pmId && !teamMap.has(pipeline.pmId)) {
        teamMap.set(pipeline.pmId, { role: 'PM', isPrimary: true });
      }
      if (pipeline.plannerId && !teamMap.has(pipeline.plannerId)) {
        teamMap.set(pipeline.plannerId, { role: 'PLANNER', isPrimary: false });
      }

      await tx.projectTeam.createMany({
        data: Array.from(teamMap.entries()).map(([uid, m]) => ({
          projectId: project.id,
          userId: uid,
          role: m.role as any,
          isPrimary: m.isPrimary,
        })),
      });

      // 5. Create 4 ProjectPhases + default items
      for (const phaseDef of DEFAULT_PHASES) {
        await tx.projectPhase.create({
          data: {
            projectId: project.id,
            phaseType: phaseDef.phaseType as any,
            name: phaseDef.name,
            weight: phaseDef.weight,
            orderIndex: phaseDef.orderIndex,
            items: {
              createMany: {
                data: phaseDef.defaultItems.map((item) => ({
                  name: item.name,
                  weight: item.weight,
                  orderIndex: item.orderIndex,
                })),
              },
            },
          },
        });
      }

      // 6. Create StrategicBrief + 16 sections
      await tx.strategicBrief.create({
        data: {
          pipelineId: pipeline.id,
          projectId: project.id,
          sections: {
            createMany: {
              data: BRIEF_SECTIONS.map((s) => ({
                sectionNum: s.num,
                sectionKey: s.key,
                title: s.title,
                isComplete: false,
              })),
            },
          },
        },
      });

      // 7. Update Pipeline (link to project, mark accepted, set WON)
      const updatedPipeline = await tx.salesPipeline.update({
        where: { id: pipelineId },
        data: {
          projectId: project.id,
          decision: 'ACCEPTED',
          decisionDate: new Date(),
          decisionNote: decisionNote || null,
          status: 'WON',
        },
        include: {
          project: { select: { id: true, code: true, name: true } },
          nvkd: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true } },
        },
      });

      return updatedPipeline;
    });
  }

  /**
   * Decline pipeline: mark as DECLINED, no project created.
   */
  async declinePipeline(
    pipelineId: string,
    userId: string,
    decisionNote?: string,
  ) {
    const pipeline = await this.prisma.salesPipeline.findUniqueOrThrow({
      where: { id: pipelineId },
    });

    if (pipeline.decision !== 'PENDING') {
      throw new BadRequestException(
        `Pipeline already decided: ${pipeline.decision}`,
      );
    }

    return this.prisma.salesPipeline.update({
      where: { id: pipelineId },
      data: {
        decision: 'DECLINED',
        decisionDate: new Date(),
        decisionNote: decisionNote || null,
        status: 'LOST',
      },
    });
  }
}
