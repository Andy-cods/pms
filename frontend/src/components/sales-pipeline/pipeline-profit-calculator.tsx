'use client';

import { cn } from '@/lib/utils';
import type { SalesPipeline } from '@/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Profit Calculator</h3>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="COGS" value={formatCurrency(cogs)} />
        <MetricCard
          label="Gross Profit"
          value={formatCurrency(grossProfit)}
          color={grossProfit >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          label="Profit Margin"
          value={`${margin.toFixed(1)}%`}
          color={margin >= 30 ? 'green' : margin >= 15 ? 'yellow' : 'red'}
        />
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-border/50 p-4 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết</h4>
        <div className="space-y-1.5 text-[13px]">
          <Row label="Tổng ngân sách" value={formatCurrency(budget)} />
          <Row label="Chi phí NSQC" value={formatCurrency(pipeline.costNSQC ?? 0)} />
          <Row label="Chi phí Design" value={formatCurrency(pipeline.costDesign ?? 0)} />
          <Row label="Chi phí Media" value={formatCurrency(pipeline.costMedia ?? 0)} />
          <Row label="Chi phí KOL" value={formatCurrency(pipeline.costKOL ?? 0)} />
          <Row label="Chi phí khác" value={formatCurrency(pipeline.costOther ?? 0)} />
          <div className="border-t border-border/50 pt-1.5">
            <Row label="Tổng COGS" value={formatCurrency(cogs)} bold />
            <Row
              label="Lợi nhuận gộp"
              value={formatCurrency(grossProfit)}
              bold
              color={grossProfit >= 0 ? 'green' : 'red'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: 'text-[#34c759]',
    yellow: 'text-[#ff9f0a]',
    red: 'text-[#ff3b30]',
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn('text-lg font-bold', color ? colorClasses[color] : 'text-foreground')}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: 'green' | 'red';
}) {
  const colorClasses = {
    green: 'text-[#34c759]',
    red: 'text-[#ff3b30]',
  };

  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-muted-foreground', bold && 'font-semibold text-foreground')}>
        {label}
      </span>
      <span className={cn(bold ? 'font-semibold' : '', color ? colorClasses[color] : 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}
