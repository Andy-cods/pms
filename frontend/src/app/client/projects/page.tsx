'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FolderKanban,
  Calendar,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientProjects } from '@/hooks/use-client-projects';
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

export default function ClientProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useClientProjects({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-11 w-80" />
          <Skeleton className="h-11 w-44" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="client-animate-in">
        <h1 className="client-page-title">Du an cua toi</h1>
        <p className="client-page-subtitle">
          Theo doi tien do va chi tiet cac du an dang thuc hien
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 client-animate-in client-stagger-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem du an..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-surface border-border"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-surface">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca trang thai</SelectItem>
            <SelectItem value="TODO">Cho xu ly</SelectItem>
            <SelectItem value="IN_PROGRESS">Dang thuc hien</SelectItem>
            <SelectItem value="DONE">Hoan thanh</SelectItem>
            <SelectItem value="ON_HOLD">Tam dung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="client-card-static client-animate-in client-stagger-2">
          <div className="client-empty py-16">
            <FolderKanban className="client-empty-icon" />
            <p className="client-empty-title">
              {search || statusFilter !== 'all'
                ? 'Khong tim thay du an phu hop'
                : 'Chua co du an nao'}
            </p>
            <p className="client-empty-description">
              {search || statusFilter !== 'all'
                ? 'Thu thay doi bo loc de tim kiem lai.'
                : 'Cac du an cua ban se hien thi o day khi duoc tao.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const status = statusConfig[project.status] || statusConfig.TODO;
            const StatusIcon = status.icon;

            return (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className={cn(
                  'client-project-card client-animate-in',
                  `client-stagger-${Math.min(index + 1, 6)}`
                )}
              >
                {/* Card Header */}
                <div className="client-project-header">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="client-project-title">{project.name}</h3>
                      {project.description && (
                        <p className="client-project-description">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span className={cn('client-badge flex-shrink-0', status.className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Card Body - Progress */}
                <div className="client-project-body">
                  <div className="client-progress-container client-progress-lg">
                    <div className="client-progress-header">
                      <span className="client-progress-label">Tien do</span>
                      <span className="client-progress-value">{project.progress}%</span>
                    </div>
                    <div className="client-progress-bar">
                      <div
                        className="client-progress-fill"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {project.taskStats.completed}/{project.taskStats.total} tasks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="client-project-footer">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(project.endDate).toLocaleDateString('vi-VN', {
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
          })}
        </div>
      )}

      {/* Results Count */}
      {projects.length > 0 && (
        <p className="text-sm text-muted-foreground text-center client-animate-in">
          Hien thi {projects.length} du an
        </p>
      )}
    </div>
  );
}
