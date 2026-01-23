import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';

// Escalation thresholds in hours
const ESCALATION_THRESHOLDS = {
  LEVEL_1: 24, // 24 hours - send reminder to approvers
  LEVEL_2: 48, // 48 hours - escalate to PM
  LEVEL_3: 72, // 72 hours - escalate to Admin
};

@Injectable()
export class ApprovalEscalationService {
  private readonly logger = new Logger(ApprovalEscalationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check pending approvals and escalate if needed.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingApprovals(): Promise<void> {
    this.logger.log('Checking pending approvals for escalation...');

    try {
      const now = new Date();

      // Find all pending approvals
      const pendingApprovals = await this.prisma.approval.findMany({
        where: {
          status: ApprovalStatus.PENDING,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              team: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          submittedBy: { select: { id: true, name: true, email: true } },
        },
      });

      for (const approval of pendingApprovals) {
        const hoursElapsed = this.getHoursElapsed(approval.submittedAt, now);
        const currentLevel = approval.escalationLevel;

        // Determine new escalation level
        let newLevel = currentLevel;
        if (hoursElapsed >= ESCALATION_THRESHOLDS.LEVEL_3 && currentLevel < 3) {
          newLevel = 3;
        } else if (
          hoursElapsed >= ESCALATION_THRESHOLDS.LEVEL_2 &&
          currentLevel < 2
        ) {
          newLevel = 2;
        } else if (
          hoursElapsed >= ESCALATION_THRESHOLDS.LEVEL_1 &&
          currentLevel < 1
        ) {
          newLevel = 1;
        }

        // If escalation level changed, update and notify
        if (newLevel > currentLevel) {
          await this.escalateApproval(approval, newLevel);
        }
      }

      this.logger.log(
        `Checked ${pendingApprovals.length} pending approvals for escalation`,
      );
    } catch (error) {
      this.logger.error('Error checking pending approvals', error);
    }
  }

  /**
   * Escalate an approval to the next level.
   */
  private async escalateApproval(
    approval: any,
    newLevel: number,
  ): Promise<void> {
    const levelNames = [
      '',
      'Level 1 (Reminder)',
      'Level 2 (PM)',
      'Level 3 (Admin)',
    ];

    this.logger.log(
      `Escalating approval ${approval.id} (${approval.title}) to ${levelNames[newLevel]}`,
    );

    // Update escalation level
    await this.prisma.approval.update({
      where: { id: approval.id },
      data: {
        escalationLevel: newLevel,
        escalatedAt: new Date(),
      },
    });

    // Record in history
    await this.prisma.approvalHistory.create({
      data: {
        approvalId: approval.id,
        fromStatus: ApprovalStatus.PENDING,
        toStatus: ApprovalStatus.PENDING,
        comment: `Auto-escalated to ${levelNames[newLevel]} after ${this.getHoursElapsed(approval.submittedAt, new Date()).toFixed(0)} hours`,
        changedById: approval.submittedById, // System action attributed to submitter
      },
    });

    // Send notifications based on level
    await this.sendEscalationNotifications(approval, newLevel);
  }

  /**
   * Send notifications based on escalation level.
   * TODO: Integrate with NotificationService and TelegramService when available.
   */
  private async sendEscalationNotifications(
    approval: any,
    level: number,
  ): Promise<void> {
    // For now, just log. Will integrate with notification service in Week 9.
    const projectName = approval.project?.name ?? 'Unknown Project';
    const submitterName = approval.submittedBy?.name ?? 'Unknown';

    switch (level) {
      case 1:
        // Level 1: Remind approvers (NVKD roles)
        this.logger.warn(
          `[NOTIFICATION] Level 1 escalation: "${approval.title}" in ${projectName} ` +
            `has been pending for 24+ hours. Submitted by ${submitterName}.`,
        );
        break;

      case 2:
        // Level 2: Notify PM
        const pmMembers =
          approval.project?.team?.filter((t: any) => t.role === 'PM') ?? [];
        this.logger.warn(
          `[NOTIFICATION] Level 2 escalation to PM(s): "${approval.title}" in ${projectName} ` +
            `has been pending for 48+ hours. PMs: ${pmMembers.map((m: any) => m.user.name).join(', ') || 'None'}`,
        );
        break;

      case 3:
        // Level 3: Notify Admin
        this.logger.error(
          `[NOTIFICATION] Level 3 escalation to ADMIN: "${approval.title}" in ${projectName} ` +
            `has been pending for 72+ hours! Immediate attention required.`,
        );
        break;
    }
  }

  /**
   * Calculate hours elapsed between two dates.
   */
  private getHoursElapsed(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Manually trigger escalation check (for testing or admin use).
   */
  async triggerEscalationCheck(): Promise<{
    checked: number;
    escalated: number;
  }> {
    const pendingBefore = await this.prisma.approval.count({
      where: { status: ApprovalStatus.PENDING },
    });

    await this.checkPendingApprovals();

    // Count how many were escalated by checking escalatedAt in last minute
    const recentlyEscalated = await this.prisma.approval.count({
      where: {
        status: ApprovalStatus.PENDING,
        escalatedAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    });

    return { checked: pendingBefore, escalated: recentlyEscalated };
  }
}
