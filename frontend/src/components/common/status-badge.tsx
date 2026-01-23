import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ProjectStatus, ProjectStage, ProjectStageLabels, TaskStatus, TaskPriority } from '@/types';

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

// Project Status Badge
const projectStatusMap: Record<ProjectStatus, { variant: VariantProps<typeof statusBadgeVariants>['variant']; label: string }> = {
  [ProjectStatus.STABLE]: { variant: 'stable', label: 'Ổn định' },
  [ProjectStatus.WARNING]: { variant: 'warning', label: 'Cảnh báo' },
  [ProjectStatus.CRITICAL]: { variant: 'critical', label: 'Nghiêm trọng' },
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const config = projectStatusMap[status];
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

// Project Stage Badge
const projectStageVariantMap: Record<ProjectStage, VariantProps<typeof statusBadgeVariants>['variant']> = {
  [ProjectStage.INTAKE]: 'todo',
  [ProjectStage.DISCOVERY]: 'in_progress',
  [ProjectStage.PLANNING]: 'in_progress',
  [ProjectStage.UNDER_REVIEW]: 'review',
  [ProjectStage.PROPOSAL_PITCH]: 'review',
  [ProjectStage.ONGOING]: 'primary',
  [ProjectStage.OPTIMIZATION]: 'high',
  [ProjectStage.COMPLETED]: 'done',
  [ProjectStage.CLOSED]: 'cancelled',
};

export function ProjectStageBadge({ stage, className }: { stage: ProjectStage; className?: string }) {
  const variant = projectStageVariantMap[stage];
  const label = ProjectStageLabels[stage];
  return (
    <StatusBadge variant={variant} className={className}>
      {label}
    </StatusBadge>
  );
}
