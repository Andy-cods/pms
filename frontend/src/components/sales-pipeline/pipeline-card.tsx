'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, User2, Briefcase } from 'lucide-react';
import type { SalesPipeline } from '@/types';

const DECISION_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  DECLINED: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

const DECISION_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  ACCEPTED: 'Đã duyệt',
  DECLINED: 'Từ chối',
};

function formatCompact(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
}

interface PipelineCardProps {
  pipeline: SalesPipeline;
  onClick?: () => void;
  isDragging?: boolean;
}

export function PipelineCard({ pipeline, onClick, isDragging }: PipelineCardProps) {
  const margin = pipeline.profitMargin;
  const marginColor =
    margin != null && margin >= 30
      ? 'text-emerald-600 dark:text-emerald-400'
      : margin != null && margin >= 15
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';
  const marginBg =
    margin != null && margin >= 30
      ? 'bg-emerald-500'
      : margin != null && margin >= 15
        ? 'bg-amber-500'
        : 'bg-rose-500';

  const decision = DECISION_STYLES[pipeline.decision] || DECISION_STYLES.PENDING;
  const decisionLabel = DECISION_LABELS[pipeline.decision] || 'Chờ duyệt';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer rounded-xl bg-card border border-border/40',
        'p-3.5 transition-all duration-200 ease-out',
        'hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] hover:border-border/80',
        'hover:-translate-y-0.5',
        'active:scale-[0.98]',
        isDragging && 'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] ring-2 ring-primary/25 scale-[1.02]'
      )}
    >
      {/* Top: Project Name + Decision Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h4 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 flex-1">
          {pipeline.projectName}
        </h4>
        <span className={cn(
          'inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide',
          decision.bg, decision.text
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', decision.dot)} />
          {decisionLabel}
        </span>
      </div>

      {/* Meta: Client & Product */}
      {(pipeline.clientType || pipeline.productType) && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <Briefcase className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate">
            {[pipeline.clientType, pipeline.productType].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Budget + Margin row */}
      <div className="flex items-center justify-between mb-3">
        {pipeline.totalBudget != null ? (
          <span className="text-[15px] font-bold tabular-nums text-foreground tracking-tight">
            {formatCompact(pipeline.totalBudget)}
            <span className="text-[10px] font-medium text-muted-foreground ml-0.5">VND</span>
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground italic">Chưa có ngân sách</span>
        )}

        {margin != null && (
          <div className="flex items-center gap-1">
            <TrendingUp className={cn('h-3 w-3', marginColor)} />
            <span className={cn('text-[12px] font-bold tabular-nums', marginColor)}>
              {margin.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Margin Progress Bar */}
      {margin != null && (
        <div className="h-1 rounded-full bg-secondary/80 overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all duration-500 ease-out', marginBg)}
            style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
          />
        </div>
      )}

      {/* Bottom: PM */}
      {pipeline.pm && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10">
            <User2 className="h-2.5 w-2.5 text-primary" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {pipeline.pm.name}
          </span>
        </div>
      )}
    </div>
  );
}

export function PipelineCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-3.5 space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
        <div className="h-4 w-12 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="h-3 w-1/2 bg-muted rounded-md animate-pulse" />
      <div className="flex justify-between">
        <div className="h-5 w-20 bg-muted rounded-md animate-pulse" />
        <div className="h-4 w-10 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="h-1 w-full bg-muted rounded-full animate-pulse" />
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
        <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
        <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
      </div>
    </div>
  );
}
