'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import type { SalesPipeline } from '@/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return formatCurrency(value);
}

interface PipelineProfitCalculatorProps {
  pipeline: SalesPipeline;
}

export function PipelineProfitCalculator({ pipeline }: PipelineProfitCalculatorProps) {
  const cogs =
    (pipeline.costNSQC ?? 0) +
    (pipeline.costDesign ?? 0) +
    (pipeline.costMedia ?? 0) +
    (pipeline.costKOL ?? 0) +
    (pipeline.costOther ?? 0);
  const budget = pipeline.totalBudget ?? 0;
  const grossProfit = budget - cogs;
  const margin = budget > 0 ? (grossProfit / budget) * 100 : 0;

  const marginColor = margin >= 30
    ? { text: 'text-emerald-600', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' }
    : margin >= 15
      ? { text: 'text-amber-600', bg: 'bg-amber-500/10', bar: 'bg-amber-500' }
      : { text: 'text-rose-600', bg: 'bg-rose-500/10', bar: 'bg-rose-500' };

  const costItems = [
    { label: 'Chi phí NSQC', value: pipeline.costNSQC ?? 0 },
    { label: 'Chi phí Design', value: pipeline.costDesign ?? 0 },
    { label: 'Chi phí Media', value: pipeline.costMedia ?? 0 },
    { label: 'Chi phí KOL', value: pipeline.costKOL ?? 0 },
    { label: 'Chi phí khác', value: pipeline.costOther ?? 0 },
  ];

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
            <PieChart className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground">Profit Calculator</h3>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">COGS</p>
            <p className="text-[14px] font-bold tabular-nums text-foreground">{formatCompact(cogs)}</p>
          </div>
          <div className={cn('rounded-lg p-3 text-center', grossProfit >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5')}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Gross Profit</p>
            <p className={cn('text-[14px] font-bold tabular-nums', grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {formatCompact(grossProfit)}
            </p>
          </div>
          <div className={cn('rounded-lg p-3 text-center', marginColor.bg)}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Margin</p>
            <div className="flex items-center justify-center gap-1">
              {margin >= 0 ? (
                <TrendingUp className={cn('h-3.5 w-3.5', marginColor.text)} />
              ) : (
                <TrendingDown className={cn('h-3.5 w-3.5', marginColor.text)} />
              )}
              <p className={cn('text-[14px] font-bold tabular-nums', marginColor.text)}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Margin Bar */}
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out', marginColor.bar)}
              style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="border-t border-border/30 px-5 py-4 space-y-2">
        <div className="flex items-center gap-1.5 mb-3">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Chi tiết</h4>
        </div>

        <div className="space-y-1.5">
          <BreakdownRow label="Tổng ngân sách" value={formatCurrency(budget)} highlight />
          {costItems.map((item) => (
            <BreakdownRow key={item.label} label={item.label} value={formatCurrency(item.value)} />
          ))}
          <div className="border-t border-border/30 pt-2 mt-2 space-y-1.5">
            <BreakdownRow label="Tổng COGS" value={formatCurrency(cogs)} bold />
            <BreakdownRow
              label="Lợi nhuận gộp"
              value={formatCurrency(grossProfit)}
              bold
              color={grossProfit >= 0 ? 'emerald' : 'rose'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
  highlight,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  color?: 'emerald' | 'rose';
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={cn(
        'text-[13px]',
        bold ? 'font-semibold text-foreground' : 'text-muted-foreground',
        highlight && 'text-foreground font-medium'
      )}>
        {label}
      </span>
      <span className={cn(
        'text-[13px] tabular-nums',
        bold ? 'font-bold' : 'font-medium',
        color === 'emerald' && 'text-emerald-600',
        color === 'rose' && 'text-rose-600',
        !color && (bold || highlight ? 'text-foreground' : 'text-foreground/80')
      )}>
        {value}
      </span>
    </div>
  );
}
