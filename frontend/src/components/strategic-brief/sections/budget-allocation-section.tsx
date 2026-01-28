'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface BudgetRow {
  category: string;
  amount: number;
  note: string;
}

interface BudgetAllocationSectionProps {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function BudgetAllocationSection({ section, onSave, readOnly = false }: BudgetAllocationSectionProps) {
  const initialData = section.data as { rows?: BudgetRow[]; totalBudget?: number } | null;
  const [rows, setRows] = useState<BudgetRow[]>(initialData?.rows ?? [
    { category: 'Media Ads', amount: 0, note: '' },
    { category: 'Content Production', amount: 0, note: '' },
    { category: 'Design', amount: 0, note: '' },
    { category: 'KOL/Influencer', amount: 0, note: '' },
    { category: 'Other', amount: 0, note: '' },
  ]);
  const [totalBudget, setTotalBudget] = useState(initialData?.totalBudget ?? 0);

  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Auto-save on change
  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      onSave({ data: { rows, totalBudget } });
    }, 500);
    return () => clearTimeout(timer);
  }, [rows, totalBudget, readOnly, onSave]);

  const updateRow = (index: number, field: keyof BudgetRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { category: '', amount: 0, note: '' }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-foreground">Tổng ngân sách</label>
        <Input
          type="number"
          value={totalBudget}
          onChange={(e) => setTotalBudget(Number(e.target.value))}
          disabled={readOnly}
          className="mt-1.5 w-64"
        />
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-4 py-2.5 font-medium">Hạng mục</th>
              <th className="text-right px-4 py-2.5 font-medium w-40">Số tiền (VND)</th>
              <th className="text-right px-4 py-2.5 font-medium w-20">%</th>
              <th className="text-left px-4 py-2.5 font-medium">Ghi chú</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border/30">
                <td className="px-4 py-2">
                  <Input
                    value={row.category}
                    onChange={(e) => updateRow(idx, 'category', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateRow(idx, 'amount', Number(e.target.value))}
                    disabled={readOnly}
                    className="h-8 text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {totalBudget > 0 ? ((row.amount / totalBudget) * 100).toFixed(1) : '0.0'}%
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={row.note}
                    onChange={(e) => updateRow(idx, 'note', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(idx)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t border-border bg-secondary/30 font-medium">
              <td className="px-4 py-2.5">Tổng</td>
              <td className="px-4 py-2.5 text-right">{total.toLocaleString('vi-VN')}</td>
              <td className="px-4 py-2.5 text-right">
                {totalBudget > 0 ? ((total / totalBudget) * 100).toFixed(1) : '0.0'}%
              </td>
              <td colSpan={readOnly ? 1 : 2} />
            </tr>
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Thêm hạng mục
        </Button>
      )}

      {/* Completion toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Đánh dấu hoàn thành</p>
          <p className="text-[12px] text-muted-foreground">Đánh dấu section này là đã hoàn thành</p>
        </div>
        <Switch
          checked={section.isComplete}
          onCheckedChange={(val) => onSave({ isComplete: val })}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
