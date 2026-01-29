import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { HealthStatus, ProjectLifecycle, ProjectLifecycleLabels, ProjectPhaseGroup, TaskStatus, TaskPriority } from '@/types';
import { PhaseGroupLabels } from '@/lib/api/projects';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        // Project Status
        stable: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

        // Task Status
        todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',

        // Task Priority
        low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',

        // Phase Groups
        intake: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        evaluation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        operations: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        completed: 'bg-gray-200 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
        lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',

        // Generic
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function StatusBadge({ className, variant, children }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)}>{children}</span>;
}

// Health Status Badge
const healthStatusMap: Record<HealthStatus, { variant: VariantProps<typeof statusBadgeVariants>['variant']; label: string }> = {
  [HealthStatus.STABLE]: { variant: 'stable', label: 'Ổn định' },
  [HealthStatus.WARNING]: { variant: 'warning', label: 'Cảnh báo' },
  [HealthStatus.CRITICAL]: { variant: 'critical', label: 'Nghiêm trọng' },
};

export function ProjectStatusBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const config = healthStatusMap[status];
  return (
    <StatusBadge variant={config.variant} className={className}>
      {config.label}
    </StatusBadge>
  );
}

// Task Status Badge
const taskStatusMap: Record<TaskStatus, { variant: VariantProps<typeof statusBadgeVariants>['variant']; label: string }> = {
  [TaskStatus.TODO]: { variant: 'todo', label: 'Chưa làm' },
  [TaskStatus.IN_PROGRESS]: { variant: 'in_progress', label: 'Đang làm' },
  [TaskStatus.REVIEW]: { variant: 'review', label: 'Đang review' },
  [TaskStatus.DONE]: { variant: 'done', label: 'Hoàn thành' },
  [TaskStatus.BLOCKED]: { variant: 'blocked', label: 'Bị chặn' },
  [TaskStatus.CANCELLED]: { variant: 'cancelled', label: 'Đã hủy' },
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const config = taskStatusMap[status];
  return (
    <StatusBadge variant={config.variant} className={className}>
      {config.label}
    </StatusBadge>
  );
}

// Task Priority Badge
const taskPriorityMap: Record<TaskPriority, { variant: VariantProps<typeof statusBadgeVariants>['variant']; label: string }> = {
  [TaskPriority.LOW]: { variant: 'low', label: 'Thấp' },
  [TaskPriority.MEDIUM]: { variant: 'medium', label: 'Trung bình' },
  [TaskPriority.HIGH]: { variant: 'high', label: 'Cao' },
  [TaskPriority.URGENT]: { variant: 'urgent', label: 'Khẩn cấp' },
};

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const config = taskPriorityMap[priority];
  return (
    <StatusBadge variant={config.variant} className={className}>
      {config.label}
    </StatusBadge>
  );
}

// Project Lifecycle Badge
const projectLifecycleVariantMap: Record<ProjectLifecycle, VariantProps<typeof statusBadgeVariants>['variant']> = {
  [ProjectLifecycle.LEAD]: 'todo',
  [ProjectLifecycle.QUALIFIED]: 'in_progress',
  [ProjectLifecycle.EVALUATION]: 'review',
  [ProjectLifecycle.NEGOTIATION]: 'high',
  [ProjectLifecycle.WON]: 'done',
  [ProjectLifecycle.LOST]: 'destructive',
  [ProjectLifecycle.PLANNING]: 'in_progress',
  [ProjectLifecycle.ONGOING]: 'primary',
  [ProjectLifecycle.OPTIMIZING]: 'high',
  [ProjectLifecycle.CLOSED]: 'cancelled',
};

export function ProjectStageBadge({ stage, className }: { stage: ProjectLifecycle; className?: string }) {
  const variant = projectLifecycleVariantMap[stage];
  const label = ProjectLifecycleLabels[stage];
  return (
    <StatusBadge variant={variant} className={className}>
      {label}
    </StatusBadge>
  );
}

// Phase Group Badge (4 giai đoạn lớn)
const phaseGroupVariantMap: Record<ProjectPhaseGroup, VariantProps<typeof statusBadgeVariants>['variant']> = {
  [ProjectPhaseGroup.INTAKE]: 'intake',
  [ProjectPhaseGroup.EVALUATION]: 'evaluation',
  [ProjectPhaseGroup.OPERATIONS]: 'operations',
  [ProjectPhaseGroup.COMPLETED]: 'completed',
  [ProjectPhaseGroup.LOST]: 'lost',
};

export function PhaseGroupBadge({ phase, className }: { phase: ProjectPhaseGroup; className?: string }) {
  const variant = phaseGroupVariantMap[phase];
  const label = PhaseGroupLabels[phase];
  return (
    <StatusBadge variant={variant} className={className}>
      {label}
    </StatusBadge>
  );
}
