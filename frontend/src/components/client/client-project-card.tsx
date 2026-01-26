'use client';

import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  TODO: {
    label: 'Cho xu ly',
    icon: AlertCircle,
    className: 'client-badge-todo',
  },
  IN_PROGRESS: {
    label: 'Dang thuc hien',
    icon: Clock,
    className: 'client-badge-in-progress',
  },
  DONE: {
    label: 'Hoan thanh',
    icon: CheckCircle2,
    className: 'client-badge-done',
  },
  ON_HOLD: {
    label: 'Tam dung',
    icon: Pause,
    className: 'client-badge-on-hold',
  },
};

interface ClientProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  progress: number;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  endDate?: string | null;
  className?: string;
}

/**
 * Client Project Card Component
 *
 * A clickable project card with Apple-inspired design.
 * Shows project name, status, progress, and key metrics.
 */
export function ClientProjectCard({
  id,
  name,
  description,
  status,
  progress,
  taskStats,
  endDate,
  className,
}: ClientProjectCardProps) {
  const statusInfo = statusConfig[status] || statusConfig.TODO;
  const StatusIcon = statusInfo.icon;

  return (
    <Link href={`/client/projects/${id}`} className={cn('client-project-card', className)}>
      {/* Card Header */}
      <div className="client-project-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="client-project-title">{name}</h3>
            {description && (
              <p className="client-project-description">{description}</p>
            )}
          </div>
          <span className={cn('client-badge flex-shrink-0', statusInfo.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Card Body - Progress */}
      <div className="client-project-body">
        <div className="client-progress-container client-progress-lg">
          <div className="client-progress-header">
            <span className="client-progress-label">Tien do</span>
            <span className="client-progress-value">{progress}%</span>
          </div>
          <div className="client-progress-bar">
            <div
              className="client-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {taskStats.completed}/{taskStats.total} tasks
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="client-project-footer">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {endDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(endDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
