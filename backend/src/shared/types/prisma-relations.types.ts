/**
 * Typed Prisma return shapes for common queries with relations.
 * Eliminates `any` types in mapToResponse methods by providing
 * explicit types matching Prisma include/select patterns.
 */
import { Prisma } from '@prisma/client';

/** User summary returned from { select: { id, name } } */
export interface UserSummary {
  id: string;
  name: string;
}

/** Budget event with createdBy relation */
export type BudgetEventWithCreator = Prisma.BudgetEventGetPayload<{
  include: { createdBy: { select: { id: true; name: true } } };
}>;

/** Ads report with createdBy relation */
export type AdsReportWithCreator = Prisma.AdsReportGetPayload<{
  include: { createdBy: { select: { id: true; name: true } } };
}>;

/** Approval with full relations for response mapping */
export type ApprovalWithRelations = Prisma.ApprovalGetPayload<{
  include: {
    submittedBy: { select: { id: true; name: true } };
    approvedBy: { select: { id: true; name: true } };
    files: true;
    history: true;
    project: { select: { id: true; name: true } };
  };
}>;

/** Approval for escalation check (includes project with team) */
export type ApprovalForEscalation = Prisma.ApprovalGetPayload<{
  include: {
    submittedBy: { select: { id: true; name: true } };
    project: {
      select: {
        name: true;
        team: {
          include: { user: { select: { id: true; name: true } } };
        };
      };
    };
  };
}>;

/** Audit log with user relation */
export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: { user: { select: { id: true; name: true; email: true } } };
}>;

/** Project KPI with project relation */
export type ProjectKpiWithProject = Prisma.ProjectKPIGetPayload<{
  include: { project: { select: { id: true; name: true } } };
}>;
