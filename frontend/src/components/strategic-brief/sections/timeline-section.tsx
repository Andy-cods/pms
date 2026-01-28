'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface TimelinePhase {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface TimelineSectionProps {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function TimelineSection({ section, onSave, readOnly = false }: TimelineSectionProps) {
  const initialData = section.data as { phases?: TimelinePhase[] } | null;
  const [phases, setPhases] = useState<TimelinePhase[]>(initialData?.phases ?? [
    { name: 'Phase 1: Research & Planning', startDate: '', endDate: '', description: '' },
    { name: 'Phase 2: Content Production', startDate: '', endDate: '', description: '' },
    { name: 'Phase 3: Launch & Execution', startDate: '', endDate: '', description: '' },
    { name: 'Phase 4: Optimization', startDate: '', endDate: '', description: '' },
  ]);

  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      onSave({ data: { phases } });
    }, 500);
    return () => clearTimeout(timer);
  }, [phases, readOnly, onSave]);

  const updatePhase = (index: number, field: keyof TimelinePhase, value: string) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPhase = () => {
    setPhases((prev) => [...prev, { name: '', startDate: '', endDate: '', description: '' }]);
  };

  const removePhase = (index: number) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => (
        <div key={idx} className="rounded-xl border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Input
              value={phase.name}
              onChange={(e) => updatePhase(idx, 'name', e.target.value)}
              disabled={readOnly}
              placeholder="Tên giai đoạn"
              className="font-medium"
            />
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 shrink-0" onClick={() => removePhase(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground">Bắt đầu</label>
              <Input
                type="date"
                value={phase.startDate}
                onChange={(e) => updatePhase(idx, 'startDate', e.target.value)}
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground">Kết thúc</label>
              <Input
                type="date"
                value={phase.endDate}
                onChange={(e) => updatePhase(idx, 'endDate', e.target.value)}
                disabled={readOnly}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Mô tả</label>
            <Input
              value={phase.description}
              onChange={(e) => updatePhase(idx, 'description', e.target.value)}
              disabled={readOnly}
              placeholder="Chi tiết giai đoạn..."
              className="mt-1"
            />
          </div>
        </div>
      ))}

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addPhase}>
          <Plus className="h-4 w-4 mr-1" /> Thêm giai đoạn
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
