'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  FolderKanban,
  Calendar,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';

import { useProjects } from '@/hooks/use-projects';
import {
  type ProjectStatus,
  type ProjectStage,
  ProjectStatusLabels,
  ProjectStageLabels,
  ProjectStatusDotColors,
} from '@/lib/api/projects';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Apple-style status badge component
function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', ProjectStatusDotColors[status])} />
      <span className="text-footnote font-medium text-foreground">
        {ProjectStatusLabels[status]}
      </span>
    </div>
  );
}

// Apple-style pill badge for stage
function StagePill({ stage }: { stage: ProjectStage }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface text-footnote text-muted-foreground font-medium">
      {ProjectStageLabels[stage]}
    </span>
  );
}

// Apple-style thin progress bar
function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1 w-full rounded-full bg-surface overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// Apple-style filter pill button
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-footnote font-medium transition-all duration-200',
        active
          ? 'bg-foreground text-background'
          : 'bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// Loading skeleton with Apple styling
function ProjectSkeleton({ viewMode }: { viewMode: 'table' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-card border border-border/50 p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <div className="flex -space-x-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-7 w-7 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl bg-card border border-border/50 p-4"
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-1 w-24 rounded-full" />
          <div className="flex -space-x-2">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-7 w-7 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  // Stage filter - reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_stageFilter, _setStageFilter] = useState<ProjectStage | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const { data, isLoading } = useProjects({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    stage: _stageFilter !== 'all' ? _stageFilter : undefined,
    limit: 50,
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header - Apple style with generous spacing */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-title font-semibold tracking-tight">Dự án</h1>
          <p className="text-callout text-muted-foreground">
            Quản lý và theo dõi tất cả dự án của bạn
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/projects/new')}
          className="rounded-full px-5 h-10 shadow-apple-sm hover:shadow-apple transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo dự án
        </Button>
      </div>

      {/* Filters - Apple style with pill buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input - Apple style */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dự án..."
            className="pl-11 h-11 rounded-xl bg-surface border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 text-callout"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2">
          <FilterPill
            label="Tất cả"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <FilterPill
            label="On Track"
            active={statusFilter === 'STABLE'}
            onClick={() => setStatusFilter('STABLE')}
          />
          <FilterPill
            label="At Risk"
            active={statusFilter === 'WARNING'}
            onClick={() => setStatusFilter('WARNING')}
          />
          <FilterPill
            label="Critical"
            active={statusFilter === 'CRITICAL'}
            onClick={() => setStatusFilter('CRITICAL')}
          />
        </div>

        {/* View Mode Toggle - Apple segment control style */}
        <div className="ml-auto flex items-center p-1 rounded-lg bg-surface">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'table'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ProjectSkeleton viewMode={viewMode} />
      ) : data?.projects && data.projects.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View - Apple card style
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <Card
                key={project.id}
                className="group cursor-pointer rounded-2xl border-border/50 shadow-apple-sm hover:shadow-apple hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-callout truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-footnote text-muted-foreground truncate">
                          {project.code}
                          {project.client && ` · ${project.client.companyName}`}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/projects/${project.id}`);
                          }}
                          className="rounded-lg"
                        >
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/projects/${project.id}/tasks`);
                          }}
                          className="rounded-lg"
                        >
                          Xem tasks
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {project.driveLink && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(project.driveLink!, '_blank');
                            }}
                            className="rounded-lg"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Mở Drive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status & Stage */}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={project.status} />
                    <StagePill stage={project.stage} />
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-footnote">
                      <span className="text-muted-foreground">Tiến độ</span>
                      <span className="font-medium tabular-nums">
                        {project.stageProgress}%
                      </span>
                    </div>
                    <ProgressBar value={project.stageProgress} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.id}
                            className="h-7 w-7 border-2 border-background ring-0"
                          >
                            {member.user.avatar && (
                              <AvatarImage src={member.user.avatar} />
                            )}
                            <AvatarFallback className="text-[10px] font-medium bg-muted">
                              {member.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.team.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Table/List View - Apple style
          <div className="space-y-2">
            {data.projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-4 rounded-xl bg-card border border-border/50 p-4 cursor-pointer hover:bg-muted/30 hover:shadow-sm transition-all duration-200"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Icon */}
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-callout truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  <p className="text-footnote text-muted-foreground truncate">
                    {project.code}
                    {project.client && ` · ${project.client.companyName}`}
                  </p>
                </div>

                {/* Status */}
                <div className="hidden sm:block">
                  <StatusBadge status={project.status} />
                </div>

                {/* Stage */}
                <div className="hidden md:block">
                  <StagePill stage={project.stage} />
                </div>

                {/* Progress */}
                <div className="hidden lg:flex items-center gap-3 w-32">
                  <ProgressBar value={project.stageProgress} className="flex-1" />
                  <span className="text-footnote font-medium tabular-nums w-8 text-right">
                    {project.stageProgress}%
                  </span>
                </div>

                {/* Timeline */}
                <div className="hidden xl:flex items-center gap-1.5 text-footnote text-muted-foreground w-20">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(project.endDate)}</span>
                </div>

                {/* Team */}
                <div className="flex -space-x-2">
                  {project.team.slice(0, 3).map((member) => (
                    <Avatar
                      key={member.id}
                      className="h-7 w-7 border-2 border-background ring-0"
                    >
                      {member.user.avatar && <AvatarImage src={member.user.avatar} />}
                      <AvatarFallback className="text-[10px] font-medium bg-muted">
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 3 && (
                    <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                      +{project.team.length - 3}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )
      ) : (
        // Empty State - Apple style
        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-headline font-semibold mb-2">Chưa có dự án nào</h3>
            <p className="text-callout text-muted-foreground text-center max-w-sm mb-6">
              Bắt đầu bằng cách tạo dự án đầu tiên của bạn để quản lý công việc hiệu quả hơn.
            </p>
            <Button
              onClick={() => router.push('/dashboard/projects/new')}
              className="rounded-full px-6 h-11 shadow-apple-sm hover:shadow-apple transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo dự án đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination info - Apple style */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-footnote text-muted-foreground">
          <span>
            Hiển thị {data.projects.length} trong số {data.total} dự án
          </span>
          {data.totalPages > 1 && (
            <span className="tabular-nums">
              Trang {data.page} / {data.totalPages}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
