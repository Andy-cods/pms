'use client';

import { cn } from '@/lib/utils';
import type { SalesPipeline, PipelineDecision } from '@/types';

const DECISION_STYLES: Record<string, string> = {
  PENDING: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
  ACCEPTED: 'bg-[#34c759]/10 text-[#34c759]',
  DECLINED: 'bg-[#ff3b30]/10 text-[#ff3b30]',
};

const DECISION_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

function formatCurrency(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
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
      ? 'text-[#34c759]'
      : margin != null && margin >= 15
        ? 'text-[#ff9f0a]'
        : 'text-[#ff3b30]';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl border border-border/50 bg-card p-3.5',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'hover:border-border',
        isDragging && 'shadow-lg ring-2 ring-primary/20'
      )}
    >
      {/* Project Name */}
      <h4 className="text-[13px] font-semibold text-foreground truncate mb-1.5">
        {pipeline.projectName}
      </h4>

      {/* Client & Product */}
      {(pipeline.clientType || pipeline.productType) && (
        <p className="text-[11px] text-muted-foreground truncate mb-2">
          {[pipeline.clientType, pipeline.productType].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Budget */}
      {pipeline.totalBudget != null && (
        <p className="text-[12px] font-medium text-foreground mb-2">
          {formatCurrency(pipeline.totalBudget)}
        </p>
      )}

      {/* Bottom row: PM + Margin + Decision */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {pipeline.pm && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-muted-foreground">
            PM: {pipeline.pm.name.split(' ').pop()}
          </span>
        )}
        {margin != null && (
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium', marginColor)}>
            {margin.toFixed(1)}%
          </span>
        )}
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ml-auto', DECISION_STYLES[pipeline.decision] || DECISION_STYLES.PENDING)}>
          {DECISION_LABELS[pipeline.decision] || 'Pending'}
        </span>
      </div>
    </div>
  );
}

export function PipelineCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3.5 space-y-2">
      <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-secondary rounded animate-pulse" />
      <div className="h-3 w-1/3 bg-secondary rounded animate-pulse" />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-secondary rounded-md animate-pulse" />
        <div className="h-5 w-10 bg-secondary rounded-md animate-pulse" />
      </div>
    </div>
  );
}
