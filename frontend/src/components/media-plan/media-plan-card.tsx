'use client';

import { Calendar, BarChart3, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type MediaPlan,
  MediaPlanStatusLabels,
  MediaPlanStatusColors,
  formatVNDCompact,
  MONTHS,
} from '@/lib/api/media-plans';

interface MediaPlanCardProps {
  plan: MediaPlan;
  onClick: () => void;
}

export function MediaPlanCard({ plan, onClick }: MediaPlanCardProps) {
  const budgetPercent =
    plan.totalBudget > 0
      ? Math.min(100, Math.round((plan.allocatedBudget / plan.totalBudget) * 100))
      : 0;

  const monthLabel = MONTHS.find((m) => m.value === plan.month)?.label ?? `T${plan.month}`;

  return (
    <Card
      className="rounded-2xl border-border/50 shadow-apple-sm hover:shadow-apple transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-callout font-semibold truncate group-hover:text-primary transition-colors">
              {plan.name}
            </h3>
            <p className="text-footnote text-muted-foreground mt-0.5">
              {monthLabel}/{plan.year} · v{plan.version}
            </p>
          </div>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-caption font-medium shrink-0',
              MediaPlanStatusColors[plan.status],
            )}
          >
            {MediaPlanStatusLabels[plan.status]}
          </span>
        </div>

        {/* Budget Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-footnote text-muted-foreground">Ngân sách</span>
            <span className="text-footnote font-medium tabular-nums">
              {formatVNDCompact(plan.allocatedBudget)} / {formatVNDCompact(plan.totalBudget)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                budgetPercent >= 100
                  ? 'bg-[#ff3b30] dark:bg-[#ff453a]'
                  : budgetPercent >= 80
                    ? 'bg-[#ff9f0a] dark:bg-[#ffd60a]'
                    : 'bg-primary',
              )}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center gap-4 text-footnote text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span className="tabular-nums">{plan.itemCount} kênh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(plan.startDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
              {' - '}
              {new Date(plan.endDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MediaPlanCardSkeleton() {
  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-16 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-16 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
