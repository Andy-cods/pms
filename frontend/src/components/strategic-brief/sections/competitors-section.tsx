'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
  marketShare: string;
}

interface CompetitorsSectionProps {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function CompetitorsSection({ section, onSave, readOnly = false }: CompetitorsSectionProps) {
  const initialData = section.data as { competitors?: Competitor[] } | null;
  const [competitors, setCompetitors] = useState<Competitor[]>(initialData?.competitors ?? [
    { name: '', strengths: '', weaknesses: '', marketShare: '' },
  ]);

  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      onSave({ data: { competitors } });
    }, 500);
    return () => clearTimeout(timer);
  }, [competitors, readOnly, onSave]);

  const updateCompetitor = (index: number, field: keyof Competitor, value: string) => {
    setCompetitors((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCompetitor = () => {
    setCompetitors((prev) => [...prev, { name: '', strengths: '', weaknesses: '', marketShare: '' }]);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {competitors.map((comp, idx) => (
        <div key={idx} className="rounded-xl border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Input
              value={comp.name}
              onChange={(e) => updateCompetitor(idx, 'name', e.target.value)}
              disabled={readOnly}
              placeholder="Tên đối thủ"
              className="font-medium"
            />
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 shrink-0" onClick={() => removeCompetitor(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground">Điểm mạnh</label>
              <Textarea
                value={comp.strengths}
                onChange={(e) => updateCompetitor(idx, 'strengths', e.target.value)}
                disabled={readOnly}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground">Điểm yếu</label>
              <Textarea
                value={comp.weaknesses}
                onChange={(e) => updateCompetitor(idx, 'weaknesses', e.target.value)}
                disabled={readOnly}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Thị phần</label>
            <Input
              value={comp.marketShare}
              onChange={(e) => updateCompetitor(idx, 'marketShare', e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 25%"
              className="mt-1 w-32"
            />
          </div>
        </div>
      ))}

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addCompetitor}>
          <Plus className="h-4 w-4 mr-1" /> Thêm đối thủ
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
