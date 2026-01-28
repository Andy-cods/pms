'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  type BudgetEvent,
  type BudgetEventCategory,
  BudgetEventCategoryLabels,
  CATEGORY_COLORS,
} from '@/lib/api/budget-events';

interface BudgetDonutChartProps {
  events: BudgetEvent[];
}

interface CategoryData {
  name: string;
  value: number;
  category: BudgetEventCategory;
  color: string;
}

const formatVND = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
};

export function BudgetDonutChart({ events }: BudgetDonutChartProps) {
  // Only count APPROVED SPEND events for the chart
  const spendEvents = events.filter(
    (e) => e.type === 'SPEND' && e.status === 'APPROVED'
  );

  const categoryMap = new Map<BudgetEventCategory, number>();
  for (const event of spendEvents) {
    const current = categoryMap.get(event.category) || 0;
    categoryMap.set(event.category, current + event.amount);
  }

  const data: CategoryData[] = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      name: BudgetEventCategoryLabels[category],
      value,
      category,
      color: CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Chưa có dữ liệu chi tiêu
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString('vi-VN')} đ`,
                '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-lg font-semibold">{formatVND(total)}</div>
            <div className="text-xs text-muted-foreground">Đã chi</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((entry) => (
          <div key={entry.category} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium">{formatVND(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
