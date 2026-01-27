'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Calendar,
  ExternalLink,
  FolderKanban,
  CheckSquare,
  Files,
  Clock,
  MoreHorizontal,
  Trash2,
  Link as LinkIcon,
  Users,
  Briefcase,
  TrendingUp,
  UserPlus,
  Pencil,
  UserMinus,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

import {
  useProject,
  useProjectTeam,
  useArchiveProject,
  useUpdateProject,
  useUpdateTeamMember,
  useRemoveTeamMember,
} from '@/hooks/use-projects';
import {
  ProjectStatusLabels,
  ProjectStageLabels,
  ProjectStatusDotColors,
  type ProjectStage,
} from '@/lib/api/projects';
import type { UserRole } from '@/lib/api/admin-users';
import { ProjectStageTimeline } from '@/components/project/project-stage-timeline';
import { TeamMemberModal } from '@/components/project/team-member-modal';
import { BudgetCard } from '@/components/project/budget-card';
import { BudgetFormModal } from '@/components/project/budget-form-modal';
import { KpiCard } from '@/components/project/kpi-card';
import { ActivityTimeline } from '@/components/project/activity-timeline';
import { StageHistoryTimeline } from '@/components/project/stage-history-timeline';
import { useProjectBudget } from '@/hooks/use-project-budget';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Apple-style thin progress bar
function ProgressBar({
  value,
  className,
  size = 'default',
}: {
  value: number;
  className?: string;
  size?: 'default' | 'lg';
}) {
  return (
    <div
      className={cn(
        'w-full rounded-full bg-surface overflow-hidden',
        size === 'lg' ? 'h-2' : 'h-1',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// Apple-style segment control
function SegmentControl({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-surface">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-footnote font-medium transition-all duration-200',
            value === item.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="ml-1.5 text-muted-foreground">({item.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// Floating action pill button
function ActionPill({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-footnote font-medium transition-all duration-200',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground shadow-apple-sm hover:shadow-apple'
          : 'bg-surface text-foreground hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'blue' | 'green' | 'orange' | 'default';
}) {
  const colorClasses = {
    blue: 'text-[#0071e3] dark:text-[#0a84ff]',
    green: 'text-[#34c759] dark:text-[#30d158]',
    orange: 'text-[#ff9f0a] dark:text-[#ff9f0a]',
    default: 'text-foreground',
  };

  return (
    <div className="text-center p-4">
      <div
        className={cn(
          'text-2xl font-bold tabular-nums',
          colorClasses[color || 'default']
        )}
      >
        {value}
      </div>
      <div className="text-footnote text-muted-foreground mt-1">{label}</div>
      {subValue && (
        <div className="text-caption text-muted-foreground/70 mt-0.5">
          {subValue}
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="flex items-start gap-6">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      {/* Action pills skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  const [showAddMember, setShowAddMember] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const { data: project, isLoading, error } = useProject(projectId);
  const { data: teamWithWorkload } = useProjectTeam(projectId);
  const { data: budget } = useProjectBudget(projectId);
  const archiveMutation = useArchiveProject();
  const updateMutation = useUpdateProject();
  const updateTeamMember = useUpdateTeamMember();
  const removeTeamMember = useRemoveTeamMember();

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(projectId);
    router.push('/dashboard/projects');
  };

  // Handler for stage change from timeline
  const handleStageChange = async (newStage: ProjectStage, reason?: string) => {
    if (!project) return;
    await updateMutation.mutateAsync({
      id: projectId,
      input: { stage: newStage, stageChangeReason: reason },
    });
  };

  // Handler for progress change from timeline (debounced in component)
  const handleProgressChange = async (newProgress: number) => {
    if (!project) return;
    await updateMutation.mutateAsync({
      id: projectId,
      input: { stageProgress: newProgress },
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatShortDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getTimeDiff = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays;
  };

  const getDaysRemaining = (end: string | null) => {
    if (!end) return null;
    const endDate = new Date(end);
    const today = new Date();
    const diffDays = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays;
  };

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-headline font-semibold mb-2">
          Không tìm thấy dự án
        </h3>
        <p className="text-callout text-muted-foreground text-center max-w-sm mb-6">
          Dự án này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-full px-5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const taskProgress =
    project.taskStats.total > 0
      ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
      : 0;

  const daysRemaining = getDaysRemaining(project.endDate);
  const totalDays = getTimeDiff(project.startDate, project.endDate);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex items-start gap-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-lg shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-title font-semibold tracking-tight truncate">
              {project.name}
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  ProjectStatusDotColors[project.status]
                )}
              />
              <span className="text-callout font-medium">
                {ProjectStatusLabels[project.status]}
              </span>
            </div>
          </div>
          <p className="text-callout text-muted-foreground">
            {project.code}
            {project.client && ` · ${project.client.companyName}`}
            {' · '}
            <span className="font-medium">
              {ProjectStageLabels[project.stage]}
            </span>
          </p>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
              className="rounded-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-lg text-[#ff3b30] dark:text-[#ff453a] focus:text-[#ff3b30] dark:focus:text-[#ff453a]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Lưu trữ
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Lưu trữ dự án?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dự án sẽ được lưu trữ và không hiển thị trong danh sách. Bạn
                    có thể khôi phục lại sau.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">
                    Hủy
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleArchive}
                    className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 dark:bg-[#ff453a] dark:hover:bg-[#ff453a]/90"
                  >
                    Lưu trữ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Floating Action Pills */}
      <div className="flex flex-wrap gap-3">
        <ActionPill
          icon={CheckSquare}
          label="Tasks"
          onClick={() => router.push(`/dashboard/projects/${projectId}/tasks`)}
          variant="primary"
        />
        <ActionPill
          icon={Files}
          label="Files"
          onClick={() => router.push(`/dashboard/projects/${projectId}/files`)}
        />
        <ActionPill
          icon={BarChart3}
          label="Media Plans"
          onClick={() => router.push(`/dashboard/projects/${projectId}/media-plans`)}
        />
        {project.driveLink && (
          <ActionPill
            icon={ExternalLink}
            label="Drive"
            onClick={() => window.open(project.driveLink!, '_blank')}
          />
        )}
        {project.planLink && (
          <ActionPill
            icon={LinkIcon}
            label="Kế hoạch"
            onClick={() => window.open(project.planLink!, '_blank')}
          />
        )}
        {project.trackingLink && (
          <ActionPill
            icon={TrendingUp}
            label="Tracking"
            onClick={() => window.open(project.trackingLink!, '_blank')}
          />
        )}
      </div>

      {/* Segment Control Tabs */}
      <SegmentControl
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'overview', label: 'Tổng quan' },
          { value: 'team', label: 'Team', count: project.team.length },
          { value: 'budget', label: 'Ngân sách' },
          { value: 'kpi', label: 'KPIs' },
          { value: 'logs', label: 'Nhật ký' },
          { value: 'history', label: 'Lịch sử' },
        ]}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="rounded-2xl border-border/50 shadow-apple-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-subheadline font-semibold">
                  Mô tả
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="text-callout text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-callout text-muted-foreground/50 italic">
                    Chưa có mô tả
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="rounded-2xl border-border/50 shadow-apple-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-subheadline font-semibold">
                  Tiến độ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stage Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-callout font-medium">
                      Giai đoạn dự án
                    </span>
                    <span className="text-footnote text-muted-foreground">
                      {ProjectStageLabels[project.stage]} · {project.stageProgress}%
                    </span>
                  </div>
                  <ProjectStageTimeline
                    currentStage={project.stage as ProjectStage}
                    stageProgress={project.stageProgress}
                    isEditable={true}
                    onStageChange={handleStageChange}
                    onProgressChange={handleProgressChange}
                  />
                </div>

                {/* Task Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-callout font-medium">
                      Tasks hoàn thành
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-footnote text-muted-foreground tabular-nums">
                        {project.taskStats.done}/{project.taskStats.total} tasks
                      </span>
                      <span className="text-callout font-semibold tabular-nums">
                        {taskProgress}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={taskProgress} size="lg" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border/50">
                  <StatCard
                    label="Tổng"
                    value={project.taskStats.total}
                    color="default"
                  />
                  <StatCard
                    label="Đang làm"
                    value={project.taskStats.inProgress}
                    color="blue"
                  />
                  <StatCard
                    label="Chờ xử lý"
                    value={project.taskStats.todo}
                    color="orange"
                  />
                  <StatCard
                    label="Hoàn thành"
                    value={project.taskStats.done}
                    color="green"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="rounded-2xl border-border/50 shadow-apple-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-subheadline font-semibold">
                  Thông tin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Timeline */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-footnote font-medium">Timeline</div>
                    <div className="text-footnote text-muted-foreground">
                      {formatShortDate(project.startDate)} -{' '}
                      {formatShortDate(project.endDate)}
                    </div>
                    {totalDays && (
                      <div className="text-caption text-muted-foreground/70 mt-0.5">
                        {totalDays} ngày
                        {daysRemaining !== null && daysRemaining > 0 && (
                          <span className="ml-1">
                            · còn {daysRemaining} ngày
                          </span>
                        )}
                        {daysRemaining !== null && daysRemaining <= 0 && (
                          <span className="ml-1 text-[#ff3b30] dark:text-[#ff453a]">
                            · quá hạn {Math.abs(daysRemaining)} ngày
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Type */}
                {project.productType && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-footnote font-medium">
                        Loại sản phẩm
                      </div>
                      <div className="text-footnote text-muted-foreground">
                        {project.productType}
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-footnote font-medium">Cập nhật</div>
                    <div className="text-footnote text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Preview */}
            <Card className="rounded-2xl border-border/50 shadow-apple-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-subheadline font-semibold">
                  Team
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-footnote text-primary"
                  onClick={() => setActiveTab('team')}
                >
                  Xem tất cả
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {project.team.slice(0, 5).map((member) => (
                      <Avatar
                        key={member.id}
                        className="h-10 w-10 border-2 border-background ring-0"
                      >
                        {member.user.avatar && (
                          <AvatarImage src={member.user.avatar} />
                        )}
                        <AvatarFallback className="text-xs font-medium bg-muted">
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team.length > 5 && (
                      <div className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{project.team.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="ml-3 text-footnote text-muted-foreground">
                    {project.team.length} thành viên
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Budget Preview */}
            <BudgetCard
              budget={budget ?? null}
              onEdit={() => setShowBudgetForm(true)}
              compact
            />
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <>
          <Card className="rounded-2xl border-border/50 shadow-apple-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-subheadline font-semibold">
                  Team Members
                </CardTitle>
                <p className="text-footnote text-muted-foreground mt-1">
                  {project.team.length} thành viên
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-9 px-4"
                onClick={() => setShowAddMember(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm thành viên
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(teamWithWorkload || project.team).map((member) => {
                  const workload = 'workload' in member ? member.workload : undefined;
                  const taskCompletion = workload && workload.projectTasks > 0
                    ? Math.round((workload.projectTasksDone / workload.projectTasks) * 100)
                    : 0;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar with completion ring */}
                        <div className="relative">
                          <Avatar className="h-11 w-11">
                            {member.user.avatar && (
                              <AvatarImage src={member.user.avatar} />
                            )}
                            <AvatarFallback className="text-sm font-medium bg-muted">
                              {member.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {workload && workload.projectTasksOverdue > 0 && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#ff3b30] dark:bg-[#ff453a] flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">
                                {workload.projectTasksOverdue}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-callout font-medium truncate">
                              {member.user.name}
                            </span>
                            {member.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-medium shrink-0">
                                Primary
                              </span>
                            )}
                          </div>

                          {/* Workload Stats */}
                          {workload ? (
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1.5">
                                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-footnote text-muted-foreground tabular-nums">
                                  <span className="font-medium text-foreground">
                                    {workload.projectTasksDone}
                                  </span>
                                  /{workload.projectTasks} tasks
                                </span>
                              </div>
                              {workload.projectTasks > 0 && (
                                <span className={cn(
                                  'text-caption font-medium tabular-nums',
                                  taskCompletion === 100
                                    ? 'text-[#34c759] dark:text-[#30d158]'
                                    : taskCompletion >= 50
                                    ? 'text-[#0071e3] dark:text-[#0a84ff]'
                                    : 'text-muted-foreground'
                                )}>
                                  {taskCompletion}%
                                </span>
                              )}
                              {workload.projectTasksOverdue > 0 && (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-[#ff3b30] dark:text-[#ff453a]" />
                                  <span className="text-caption font-medium text-[#ff3b30] dark:text-[#ff453a] tabular-nums">
                                    {workload.projectTasksOverdue} quá hạn
                                  </span>
                                </div>
                              )}
                              <span className="text-caption text-muted-foreground/60 tabular-nums">
                                · {workload.totalTasks} tổng
                              </span>
                            </div>
                          ) : (
                            <div className="text-footnote text-muted-foreground">
                              {member.user.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Role Selector */}
                        <Select
                          value={member.role}
                          onValueChange={async (newRole: string) => {
                            try {
                              await updateTeamMember.mutateAsync({
                                projectId,
                                memberId: member.id,
                                input: { role: newRole },
                              });
                              toast.success(`Đã cập nhật vai trò của ${member.user.name}`);
                            } catch {
                              toast.error('Không thể cập nhật vai trò');
                            }
                          }}
                        >
                          <SelectTrigger className="w-[130px] h-8 rounded-lg text-footnote border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {(['PM', 'ACCOUNT', 'CONTENT', 'DESIGN', 'MEDIA', 'PLANNER', 'TECHNICAL', 'NVKD'] as UserRole[]).map(
                              (r) => (
                                <SelectItem key={r} value={r} className="rounded-lg text-sm">
                                  {r === 'NVKD' ? 'Sales' : r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        {/* Remove Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-[#ff3b30]"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa thành viên?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa{' '}
                                <span className="font-medium text-foreground">
                                  {member.user.name}
                                </span>{' '}
                                khỏi team dự án?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full">
                                Hủy
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
                                onClick={async () => {
                                  try {
                                    await removeTeamMember.mutateAsync({
                                      projectId,
                                      memberId: member.id,
                                    });
                                    toast.success(
                                      `Đã xóa ${member.user.name} khỏi team`
                                    );
                                  } catch (error: unknown) {
                                    const err = error as {
                                      response?: { data?: { message?: string } };
                                    };
                                    toast.error(
                                      err?.response?.data?.message ||
                                        'Không thể xóa thành viên'
                                    );
                                  }
                                }}
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add Member Modal */}
          <TeamMemberModal
            projectId={projectId}
            existingMemberIds={project.team.map((m) => m.userId)}
            open={showAddMember}
            onOpenChange={setShowAddMember}
          />
        </>
      )}

      {activeTab === 'budget' && (
        <BudgetCard
          budget={budget ?? null}
          onEdit={() => setShowBudgetForm(true)}
        />
      )}

      {activeTab === 'kpi' && (
        <KpiCard projectId={projectId} />
      )}

      {activeTab === 'logs' && (
        <ActivityTimeline projectId={projectId} />
      )}

      {activeTab === 'history' && (
        <StageHistoryTimeline projectId={projectId} />
      )}

      {/* Budget Form Modal */}
      <BudgetFormModal
        projectId={projectId}
        budget={budget ?? null}
        open={showBudgetForm}
        onOpenChange={setShowBudgetForm}
      />
    </div>
  );
}
