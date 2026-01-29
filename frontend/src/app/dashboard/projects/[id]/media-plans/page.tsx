'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, BarChart3, Search, Megaphone, Palette, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-projects';
import { useMediaPlans } from '@/hooks/use-media-plans';
import {
  type MediaPlanStatus,
  type MediaPlanType,
  type MediaPlanListParams,
  MediaPlanStatusLabels,
  MediaPlanTypeLabels,
  MONTHS,
} from '@/lib/api/media-plans';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaPlanCard, MediaPlanCardSkeleton } from '@/components/media-plan/media-plan-card';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  ...Object.entries(MediaPlanStatusLabels).map(([value, label]) => ({ value, label })),
];

// Enhanced tab config with icons and colors
const TYPE_TABS: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  activeColor?: string;
  badgeColor?: string;
}[] = [
  { value: 'ALL', label: 'Tất cả' },
  {
    value: 'ADS',
    label: 'Ads',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    activeColor: 'text-[#007aff] dark:text-[#0a84ff]',
    badgeColor: 'bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]',
  },
  {
    value: 'DESIGN',
    label: 'Design',
    icon: <Palette className="h-3.5 w-3.5" />,
    activeColor: 'text-[#af52de] dark:text-[#bf5af2]',
    badgeColor: 'bg-[#af52de]/10 text-[#af52de] dark:bg-[#bf5af2]/15 dark:text-[#bf5af2]',
  },
  {
    value: 'CONTENT',
    label: 'Content',
    icon: <FileText className="h-3.5 w-3.5" />,
    activeColor: 'text-[#ff9f0a] dark:text-[#ffd60a]',
    badgeColor: 'bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ff9f0a]/15 dark:text-[#ffd60a]',
  },
];

export default function MediaPlansListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const queryParams: MediaPlanListParams = {
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as MediaPlanStatus) : undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as MediaPlanType) : undefined,
    month: monthFilter !== 'ALL' ? Number(monthFilter) : undefined,
    limit: 50,
  };

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: plansData, isLoading: plansLoading } = useMediaPlans(projectId, queryParams);

  const isLoading = projectLoading || plansLoading;
  const plans = plansData?.data ?? [];

  // We also fetch ALL plans (no type filter) for counting badges
  // Use current plans for badge counts when "ALL" is selected, otherwise need separate query
  const { data: allPlansData } = useMediaPlans(projectId, {
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as MediaPlanStatus) : undefined,
    month: monthFilter !== 'ALL' ? Number(monthFilter) : undefined,
    limit: 50,
  });

  const typeCounts = useMemo(() => {
    const allPlans = allPlansData?.data ?? [];
    return {
      ALL: allPlans.length,
      ADS: allPlans.filter((p) => p.type === 'ADS').length,
      DESIGN: allPlans.filter((p) => p.type === 'DESIGN').length,
      CONTENT: allPlans.filter((p) => p.type === 'CONTENT').length,
    };
  }, [allPlansData]);

  if (isLoading) {
    return <MediaPlansListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className="h-10 w-10 rounded-xl hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-headline font-semibold tracking-tight">
              Media Plans
            </h1>
            <p className="text-[14px] text-muted-foreground">
              {project?.dealCode} - {project?.name}
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/projects/${projectId}/media-plans/new`)}
          className="h-10 px-4 rounded-xl bg-[#007aff] hover:bg-[#007aff]/90"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo kế hoạch
        </Button>
      </div>

      {/* Enhanced Type Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        {TYPE_TABS.map((tab) => {
          const isActive = typeFilter === tab.value;
          const count = typeCounts[tab.value as keyof typeof typeCounts] ?? 0;
          return (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? cn('bg-background shadow-sm', tab.activeColor ?? 'text-foreground')
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-semibold tabular-nums',
                    isActive && tab.badgeColor
                      ? tab.badgeColor
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm kế hoạch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/30 focus:bg-background"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ALL" className="rounded-lg">
              Tất cả tháng
            </SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)} className="rounded-lg">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-headline font-semibold mb-2">
            Chưa có kế hoạch media
          </h3>
          <p className="text-callout text-muted-foreground text-center max-w-sm mb-6">
            Tạo kế hoạch media đầu tiên để bắt đầu quản lý ngân sách và kênh quảng cáo.
          </p>
          <Button
            onClick={() => router.push(`/dashboard/projects/${projectId}/media-plans/new`)}
            className="rounded-full px-6 bg-[#007aff] hover:bg-[#007aff]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo kế hoạch đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <MediaPlanCard
              key={plan.id}
              plan={plan}
              onClick={() =>
                router.push(
                  `/dashboard/projects/${projectId}/media-plans/${plan.id}`,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaPlansListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <MediaPlanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
