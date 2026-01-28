import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { DEFAULT_PHASES } from './phase-defaults.config.js';

@Injectable()
export class ProjectPhaseService {
  constructor(private prisma: PrismaService) {}

  /** Create all 4 phases with default items for a project */
  async createDefaultPhases(projectId: string) {
    return this.prisma.$transaction(async (tx) => {
      for (const phaseDef of DEFAULT_PHASES) {
        await tx.projectPhase.create({
          data: {
            projectId,
            phaseType: phaseDef.phaseType,
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
    });
  }

  /** Recalculate a single phase's progress from its items (weighted) */
  async recalculatePhaseProgress(phaseId: string): Promise<number> {
    const items = await this.prisma.projectPhaseItem.findMany({
      where: { phaseId },
      select: { weight: true, isComplete: true },
    });

    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    if (totalWeight === 0) return 0;

    const completedWeight = items
      .filter((i) => i.isComplete)
      .reduce((sum, i) => sum + i.weight, 0);

    const progress = Math.round((completedWeight / totalWeight) * 100);

    const phase = await this.prisma.projectPhase.update({
      where: { id: phaseId },
      data: { progress },
    });

    // Cascade: recalculate project-level progress
    await this.recalculateProjectProgress(phase.projectId);
    return progress;
  }

  /** Recalculate project stageProgress from all phases (weighted) */
  async recalculateProjectProgress(projectId: string): Promise<number> {
    const phases = await this.prisma.projectPhase.findMany({
      where: { projectId },
      select: { weight: true, progress: true },
    });

    const totalWeight = phases.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = phases.reduce(
      (sum, p) => sum + p.weight * p.progress,
      0,
    );
    const projectProgress = Math.round(weightedSum / totalWeight);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { stageProgress: projectProgress },
    });

    return projectProgress;
  }
}
