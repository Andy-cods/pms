'use client';

import { useState, useMemo } from 'react';
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
  Columns3,
} from 'lucide-react';

import { useProjects } from '@/hooks/use-projects';
import {
  HealthStatusLabels,
  ProjectLifecycleLabels,
  HealthStatusDotColors,
  PhaseGroupLabels,
  PhaseGroupDotColors,
  LIFECYCLE_TO_PHASE,
  PHASE_GROUP_ORDER,
  PHASE_LIFECYCLES,
  formatCompactCurrency,
} from '@/lib/api/projects';
import { HealthStatus, ProjectLifecycle, ProjectPhaseGroup, type Project } from '@/types';

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
function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', HealthStatusDotColors[status])} />
      <span className="text-footnote font-medium text-foreground">
        {HealthStatusLabels[status]}
      </span>
    </div>
  );
}

// Phase group badge (small pill)
function PhaseGroupPill({ phase }: { phase: ProjectPhaseGroup }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-footnote font-medium',
      phase === ProjectPhaseGroup.INTAKE && 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      phase === ProjectPhaseGroup.EVALUATION && 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      phase === ProjectPhaseGroup.OPERATIONS && 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      phase === ProjectPhaseGroup.COMPLETED && 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
      phase === ProjectPhaseGroup.LOST && 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    )}>
      {PhaseGroupLabels[phase]}
    </span>
  );
}

// Lifecycle sub-stage pill (smaller, muted)
function LifecyclePill({ lifecycle }: { lifecycle: ProjectLifecycle }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface text-caption text-muted-foreground font-medium">
      {ProjectLifecycleLabels[lifecycle]}
    </span>
  );
}

// Thin progress bar
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

// Filter pill button
function FilterPill({
  label,
  active,
  count,
  dotColor,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  dotColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-footnote font-medium transition-all duration-200',
        active
          ? 'bg-foreground text-background'
          : 'bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {dotColor && !active && (
        <span className={cn('h-2 w-2 rounded-full', dotColor)} />
      )}
      {label}
      {count !== undefined && (
        <span className={cn(
          'text-caption tabular-nums',
          active ? 'opacity-70' : 'opacity-50',
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// Stats card
function StatCard({
  label,
  count,
  value,
  dotColor,
  active,
  onClick,
}: {
  label: string;
  count: number;
  value?: number;
  dotColor: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 p-4 rounded-2xl border transition-all duration-200 text-left min-w-[140px]',
        active
          ? 'border-primary/30 bg-primary/5 shadow-sm'
          : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotColor)} />
        <span className="text-footnote font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-headline font-semibold tabular-nums">{count}</span>
      {value !== undefined && value > 0 && (
        <span className="text-caption text-muted-foreground tabular-nums">
          {formatCompactCurrency(value)}
        </span>
      )}
    </button>
  );
}

// Loading skeleton
function ProjectSkeleton({ viewMode }: { viewMode: 'table' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
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
        <div key={i} className="flex items-center gap-4 rounded-xl bg-card border border-border/50 p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-1 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HealthStatus | 'all'>('all');
  const [phaseFilter, setPhaseFilter] = useState<ProjectPhaseGroup | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('grid');

  // Load all projects
  const { data, isLoading } = useProjects({
    search: search || undefined,
    healthStatus: statusFilter !== 'all' ? statusFilter : undefined,
    lifecycle: phaseFilter !== 'all' ? PHASE_LIFECYCLES[phaseFilter] : undefined,
    limit: 200,
  });

  const projects = data?.projects ?? [];

  // Compute stats per phase group
  const phaseStats = useMemo(() => {
    if (!data?.projects) return null;
    const allProjects = data.projects;

    const stats: Record<ProjectPhaseGroup | 'all', { count: number; value: number }> = {
      all: { count: allProjects.length, value: 0 },
      [ProjectPhaseGroup.INTAKE]: { count: 0, value: 0 },
      [ProjectPhaseGroup.EVALUATION]: { count: 0, value: 0 },
      [ProjectPhaseGroup.OPERATIONS]: { count: 0, value: 0 },
      [ProjectPhaseGroup.COMPLETED]: { count: 0, value: 0 },
      [ProjectPhaseGroup.LOST]: { count: 0, value: 0 },
    };

    for (const p of allProjects) {
      const phase = LIFECYCLE_TO_PHASE[p.lifecycle];
      const budget = p.totalBudget ?? 0;
      stats[phase].count++;
      stats[phase].value += budget;
      stats.all.value += budget;
    }

    return stats;
  }, [data?.projects]);

  // Group projects by phase for kanban
  const projectsByPhase = useMemo(() => {
    if (!projects.length) return null;
    const grouped: Record<string, Project[]> = {};
    for (const pg of PHASE_GROUP_ORDER) {
      grouped[pg] = [];
    }
    // Also add LOST
    grouped[ProjectPhaseGroup.LOST] = [];

    for (const p of projects) {
      const phase = LIFECYCLE_TO_PHASE[p.lifecycle];
      if (grouped[phase]) {
        grouped[phase].push(p);
      }
    }
    return grouped;
  }, [projects]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-title font-semibold tracking-tight">Dự án</h1>
          <p className="text-callout text-muted-foreground">
            Quản lý và theo dõi tất cả dự án
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

      {/* Stats Row */}
      {phaseStats && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {PHASE_GROUP_ORDER.map((pg) => (
            <StatCard
              key={pg}
              label={PhaseGroupLabels[pg]}
              count={phaseStats[pg].count}
              value={phaseStats[pg].value}
              dotColor={PhaseGroupDotColors[pg]}
              active={phaseFilter === pg}
              onClick={() => setPhaseFilter(phaseFilter === pg ? 'all' : pg)}
            />
          ))}
          {phaseStats[ProjectPhaseGroup.LOST].count > 0 && (
            <StatCard
              label={PhaseGroupLabels[ProjectPhaseGroup.LOST]}
              count={phaseStats[ProjectPhaseGroup.LOST].count}
              value={phaseStats[ProjectPhaseGroup.LOST].value}
              dotColor={PhaseGroupDotColors[ProjectPhaseGroup.LOST]}
              active={phaseFilter === ProjectPhaseGroup.LOST}
              onClick={() => setPhaseFilter(phaseFilter === ProjectPhaseGroup.LOST ? 'all' : ProjectPhaseGroup.LOST)}
            />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dự án..."
            className="pl-11 h-11 rounded-xl bg-surface border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 text-callout"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Health status filter */}
        <div className="flex items-center gap-2">
          <FilterPill
            label="Tất cả"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <FilterPill
            label="On Track"
            active={statusFilter === HealthStatus.STABLE}
            dotColor={HealthStatusDotColors[HealthStatus.STABLE]}
            onClick={() => setStatusFilter(HealthStatus.STABLE)}
          />
          <FilterPill
            label="At Risk"
            active={statusFilter === HealthStatus.WARNING}
            dotColor={HealthStatusDotColors[HealthStatus.WARNING]}
            onClick={() => setStatusFilter(HealthStatus.WARNING)}
          />
          <FilterPill
            label="Critical"
            active={statusFilter === HealthStatus.CRITICAL}
            dotColor={HealthStatusDotColors[HealthStatus.CRITICAL]}
            onClick={() => setStatusFilter(HealthStatus.CRITICAL)}
          />
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center p-1 rounded-lg bg-surface">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Grid view"
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
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'kanban'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Kanban view"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ProjectSkeleton viewMode={viewMode === 'kanban' ? 'grid' : viewMode} />
      ) : viewMode === 'kanban' && projectsByPhase ? (
        /* ========== KANBAN VIEW - 4 Phase Group Columns ========== */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {[...PHASE_GROUP_ORDER, ProjectPhaseGroup.LOST].map((pg) => {
              const phaseProjects = projectsByPhase[pg] || [];
              if (pg === ProjectPhaseGroup.LOST && phaseProjects.length === 0) return null;

              return (
                <div
                  key={pg}
                  className={cn(
                    'w-80 shrink-0 rounded-2xl p-3',
                    phaseProjects.length > 0 ? 'bg-surface/50' : 'bg-surface/30'
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', PhaseGroupDotColors[pg])} />
                      <span className="text-footnote font-semibold">
                        {PhaseGroupLabels[pg]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-background text-caption font-medium text-muted-foreground">
                        {phaseProjects.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-2">
                    {phaseProjects.length > 0 ? (
                      phaseProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          className="group bg-background rounded-xl p-3 cursor-pointer border border-border/50 hover:shadow-apple-sm hover:border-border transition-all duration-200"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FolderKanban className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-footnote font-medium truncate group-hover:text-primary transition-colors">
                                {project.name}
                              </h4>
                              <p className="text-caption text-muted-foreground truncate">
                                {project.dealCode}
                                {project.client && ` · ${project.client.companyName}`}
                              </p>
                            </div>
                          </div>

                          {/* Sub-stage + status */}
                          <div className="flex items-center gap-2 mb-2">
                            <LifecyclePill lifecycle={project.lifecycle} />
                            <StatusDot status={project.healthStatus} />
                          </div>

                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-caption text-muted-foreground">Tiến độ</span>
                              <span className="text-caption font-medium tabular-nums">
                                {project.stageProgress}%
                              </span>
                            </div>
                            <ProgressBar value={project.stageProgress} />
                          </div>

                          {/* Team */}
                          {project.team.length > 0 && (
                            <div className="flex -space-x-1.5 mt-2">
                              {project.team.slice(0, 4).map((member) => (
                                <Avatar key={member.id} className="h-6 w-6 border-2 border-background ring-0">
                                  {member.user?.avatar && <AvatarImage src={member.user?.avatar} />}
                                  <AvatarFallback className="text-[9px] font-medium bg-muted">
                                    {member.user?.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {project.team.length > 4 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                                  +{project.team.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-caption text-muted-foreground">
                        Không có dự án
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : projects.length > 0 ? (
        viewMode === 'grid' ? (
          /* ========== GRID VIEW ========== */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const phaseGroup = LIFECYCLE_TO_PHASE[project.lifecycle];
              return (
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
                            {project.dealCode}
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
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project.id}`); }}
                            className="rounded-lg"
                          >
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {project.driveLink && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); window.open(project.driveLink!, '_blank'); }}
                              className="rounded-lg"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Mở Drive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Phase + Status */}
                    <div className="flex items-center gap-2">
                      <PhaseGroupPill phase={phaseGroup} />
                      <LifecyclePill lifecycle={project.lifecycle} />
                      <StatusDot status={project.healthStatus} />
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-footnote">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className="font-medium tabular-nums">{project.stageProgress}%</span>
                      </div>
                      <ProgressBar value={project.stageProgress} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(project.endDate)}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-7 w-7 border-2 border-background ring-0">
                            {member.user?.avatar && <AvatarImage src={member.user?.avatar} />}
                            <AvatarFallback className="text-[10px] font-medium bg-muted">
                              {member.user?.name.charAt(0).toUpperCase()}
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ========== TABLE VIEW ========== */
          <div className="space-y-2">
            {projects.map((project) => {
              const phaseGroup = LIFECYCLE_TO_PHASE[project.lifecycle];
              return (
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
                    <h3 className="font-medium text-callout truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-footnote text-muted-foreground truncate">
                      {project.dealCode}
                      {project.client && ` · ${project.client.companyName}`}
                    </p>
                  </div>

                  {/* Phase Group */}
                  <div className="hidden sm:block">
                    <PhaseGroupPill phase={phaseGroup} />
                  </div>

                  {/* Lifecycle sub-stage */}
                  <div className="hidden md:block">
                    <LifecyclePill lifecycle={project.lifecycle} />
                  </div>

                  {/* Health status */}
                  <div className="hidden md:block">
                    <StatusDot status={project.healthStatus} />
                  </div>

                  {/* Progress */}
                  <div className="hidden lg:flex items-center gap-3 w-32">
                    <ProgressBar value={project.stageProgress} className="flex-1" />
                    <span className="text-footnote font-medium tabular-nums w-8 text-right">
                      {project.stageProgress}%
                    </span>
                  </div>

                  {/* Date */}
                  <div className="hidden xl:flex items-center gap-1.5 text-footnote text-muted-foreground w-20">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(project.endDate)}</span>
                  </div>

                  {/* Team */}
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-7 w-7 border-2 border-background ring-0">
                        {member.user?.avatar && <AvatarImage src={member.user?.avatar} />}
                        <AvatarFallback className="text-[10px] font-medium bg-muted">
                          {member.user?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team.length > 3 && (
                      <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========== EMPTY STATE ========== */
        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-headline font-semibold mb-2">Chưa có dự án nào</h3>
            <p className="text-callout text-muted-foreground text-center max-w-sm mb-6">
              Bắt đầu bằng cách tạo dự án đầu tiên để quản lý công việc hiệu quả hơn.
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

      {/* Pagination info */}
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
