'use client';

import { DollarSign, TrendingDown, TrendingUp, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectBudget } from '@/lib/api/budget';
import { formatCurrency, formatCompactCurrency, FeeLabels } from '@/lib/api/budget';

interface BudgetCardProps {
  budget: ProjectBudget | null;
  onEdit: () => void;
  compact?: boolean;
}

export function BudgetCard({ budget, onEdit, compact = false }: BudgetCardProps) {
  if (!budget) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center mb-3">
            <DollarSign className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-callout text-muted-foreground mb-3">
            Chưa có ngân sách
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 px-4"
            onClick={onEdit}
          >
            Thiết lập ngân sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  const spentPercent =
    budget.totalBudget > 0
      ? Math.round((budget.spentAmount / budget.totalBudget) * 100)
      : 0;

  const remaining = budget.totalBudget - budget.spentAmount;
  const isOverBudget = remaining < 0;

  // Fee breakdown data
  const fees = [
    { key: 'fixedAdFee', value: budget.fixedAdFee },
    { key: 'adServiceFee', value: budget.adServiceFee },
    { key: 'contentFee', value: budget.contentFee },
    { key: 'designFee', value: budget.designFee },
    { key: 'mediaFee', value: budget.mediaFee },
    { key: 'otherFee', value: budget.otherFee },
  ].filter((f) => f.value !== null && f.value > 0);

  const totalFees = fees.reduce((sum, f) => sum + (f.value || 0), 0);

  if (compact) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-subheadline font-semibold">
            Ngân sách
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">
              {formatCompactCurrency(budget.spentAmount)}
            </span>
            <span className="text-footnote text-muted-foreground tabular-nums">
              / {formatCompactCurrency(budget.totalBudget)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full rounded-full bg-surface overflow-hidden h-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                isOverBudget
                  ? 'bg-[#ff3b30] dark:bg-[#ff453a]'
                  : spentPercent > 80
                    ? 'bg-[#ff9f0a] dark:bg-[#ff9f0a]'
                    : 'bg-[#34c759] dark:bg-[#30d158]'
              )}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">
              {spentPercent}% đã chi
            </span>
            <span
              className={cn(
                'text-caption font-medium',
                isOverBudget
                  ? 'text-[#ff3b30] dark:text-[#ff453a]'
                  : 'text-muted-foreground'
              )}
            >
              {isOverBudget ? 'Vượt ' : 'Còn '}
              {formatCompactCurrency(Math.abs(remaining))}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-subheadline font-semibold">
          Ngân sách dự án
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg text-footnote"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Chỉnh sửa
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main budget overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-surface/50">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatCompactCurrency(budget.totalBudget)}
            </div>
            <div className="text-caption text-muted-foreground mt-1">
              Tổng ngân sách
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-surface/50">
            <div
              className={cn(
                'text-2xl font-bold tabular-nums',
                isOverBudget
                  ? 'text-[#ff3b30] dark:text-[#ff453a]'
                  : 'text-[#0071e3] dark:text-[#0a84ff]'
              )}
            >
              {formatCompactCurrency(budget.spentAmount)}
            </div>
            <div className="text-caption text-muted-foreground mt-1">
              Đã chi
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-surface/50">
            <div
              className={cn(
                'text-2xl font-bold tabular-nums flex items-center justify-center gap-1',
                isOverBudget
                  ? 'text-[#ff3b30] dark:text-[#ff453a]'
                  : 'text-[#34c759] dark:text-[#30d158]'
              )}
            >
              {isOverBudget ? (
                <TrendingDown className="h-5 w-5" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              {formatCompactCurrency(Math.abs(remaining))}
            </div>
            <div className="text-caption text-muted-foreground mt-1">
              {isOverBudget ? 'Vượt ngân sách' : 'Còn lại'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-footnote">
            <span className="text-muted-foreground">Tiến độ chi tiêu</span>
            <span className="font-medium tabular-nums">{spentPercent}%</span>
          </div>
          <div className="w-full rounded-full bg-surface overflow-hidden h-2.5">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                isOverBudget
                  ? 'bg-[#ff3b30] dark:bg-[#ff453a]'
                  : spentPercent > 80
                    ? 'bg-[#ff9f0a] dark:bg-[#ff9f0a]'
                    : 'bg-[#34c759] dark:bg-[#30d158]'
              )}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
        </div>

        {/* Fee breakdown */}
        {fees.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="text-footnote font-medium">Chi tiết phí</div>
            <div className="space-y-2">
              {fees.map((fee) => {
                const feePercent =
                  totalFees > 0
                    ? Math.round(((fee.value || 0) / totalFees) * 100)
                    : 0;
                return (
                  <div key={fee.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/60" />
                      <span className="text-footnote text-muted-foreground">
                        {FeeLabels[fee.key]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-footnote font-medium tabular-nums">
                        {formatCurrency(fee.value || 0)}
                      </span>
                      <span className="text-caption text-muted-foreground/60 tabular-nums w-8 text-right">
                        {feePercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly budget */}
        {budget.monthlyBudget && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-footnote text-muted-foreground">
                Ngân sách tháng
              </span>
              <span className="text-footnote font-medium tabular-nums">
                {formatCurrency(budget.monthlyBudget)}
              </span>
            </div>
          </div>
        )}

        {/* Budget pacing */}
        {budget.budgetPacing !== null && (
          <div className="flex items-center justify-between">
            <span className="text-footnote text-muted-foreground">
              Budget Pacing
            </span>
            <span
              className={cn(
                'text-footnote font-medium tabular-nums',
                budget.budgetPacing > 100
                  ? 'text-[#ff3b30] dark:text-[#ff453a]'
                  : budget.budgetPacing > 80
                    ? 'text-[#ff9f0a] dark:text-[#ff9f0a]'
                    : 'text-[#34c759] dark:text-[#30d158]'
              )}
            >
              {budget.budgetPacing.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
