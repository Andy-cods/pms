'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface KpiRow {
  name: string;
  target: string;
  unit: string;
  baseline: string;
}

interface KpiMetricsSectionProps {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function KpiMetricsSection({ section, onSave, readOnly = false }: KpiMetricsSectionProps) {
  const initialData = section.data as { kpis?: KpiRow[] } | null;
  const [kpis, setKpis] = useState<KpiRow[]>(initialData?.kpis ?? [
    { name: 'Reach', target: '', unit: 'impressions', baseline: '' },
    { name: 'Engagement Rate', target: '', unit: '%', baseline: '' },
    { name: 'Conversions', target: '', unit: 'leads', baseline: '' },
    { name: 'ROAS', target: '', unit: 'x', baseline: '' },
  ]);

  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      onSave({ data: { kpis } });
    }, 500);
    return () => clearTimeout(timer);
  }, [kpis, readOnly, onSave]);

  const updateKpi = (index: number, field: keyof KpiRow, value: string) => {
    setKpis((prev) => prev.map((k, i) => (i === index ? { ...k, [field]: value } : k)));
  };

  const addKpi = () => {
    setKpis((prev) => [...prev, { name: '', target: '', unit: '', baseline: '' }]);
  };

  const removeKpi = (index: number) => {
    setKpis((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-4 py-2.5 font-medium">KPI</th>
              <th className="text-left px-4 py-2.5 font-medium w-32">Mục tiêu</th>
              <th className="text-left px-4 py-2.5 font-medium w-28">Đơn vị</th>
              <th className="text-left px-4 py-2.5 font-medium w-32">Baseline</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi, idx) => (
              <tr key={idx} className="border-t border-border/30">
                <td className="px-4 py-2">
                  <Input
                    value={kpi.name}
                    onChange={(e) => updateKpi(idx, 'name', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                    placeholder="Tên KPI"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={kpi.target}
                    onChange={(e) => updateKpi(idx, 'target', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                    placeholder="Mục tiêu"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={kpi.unit}
                    onChange={(e) => updateKpi(idx, 'unit', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                    placeholder="Đơn vị"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={kpi.baseline}
                    onChange={(e) => updateKpi(idx, 'baseline', e.target.value)}
                    disabled={readOnly}
                    className="h-8"
                    placeholder="Baseline"
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeKpi(idx)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addKpi}>
          <Plus className="h-4 w-4 mr-1" /> Thêm KPI
        </Button>
      )}

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
