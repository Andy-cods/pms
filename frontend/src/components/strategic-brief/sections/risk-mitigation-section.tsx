'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface RiskItem {
  risk: string;
  mitigation: string;
}

interface Props {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

const EMPTY_RISK: RiskItem = { risk: '', mitigation: '' };

export function RiskMitigationSection({ section, onSave, readOnly = false }: Props) {
  const raw = (section.data ?? {}) as Record<string, unknown>;
  const [risks, setRisks] = useState<RiskItem[]>(
    (raw.risks as RiskItem[]) ?? [{ ...EMPTY_RISK }],
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    (r: RiskItem[]) => {
      if (readOnly) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave({ data: { risks: r } });
      }, 500);
    },
    [onSave, readOnly],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function update(idx: number, field: keyof RiskItem, value: string) {
    const next = risks.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setRisks(next);
    debouncedSave(next);
  }

  function add() {
    const next = [...risks, { ...EMPTY_RISK }];
    setRisks(next);
    debouncedSave(next);
  }

  function remove(idx: number) {
    const next = risks.filter((_, i) => i !== idx);
    setRisks(next);
    debouncedSave(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-semibold">Rủi ro & Giải pháp</Label>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={add} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Thêm rủi ro
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {risks.map((r, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-muted-foreground">Rủi ro {idx + 1}</span>
              {!readOnly && risks.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => remove(idx)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Rủi ro</Label>
              <Textarea value={r.risk} onChange={(e) => update(idx, 'risk', e.target.value)} disabled={readOnly} className="mt-1 min-h-[50px]" placeholder="Mô tả rủi ro..." />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Giải pháp</Label>
              <Textarea value={r.mitigation} onChange={(e) => update(idx, 'mitigation', e.target.value)} disabled={readOnly} className="mt-1 min-h-[50px]" placeholder="Phương án giảm thiểu..." />
            </div>
          </div>
        ))}
      </div>

      {/* Completion */}
      <div className={cn(
        'flex items-center justify-between rounded-lg border p-4 transition-colors',
        section.isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/40 bg-muted/20',
      )}>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={cn('h-5 w-5', section.isComplete ? 'text-emerald-500' : 'text-muted-foreground/40')} />
          <div>
            <p className="text-[13px] font-semibold">Đánh dấu hoàn thành</p>
            <p className="text-[11px] text-muted-foreground">{section.isComplete ? 'Section đã hoàn thành' : 'Đánh dấu section này là đã hoàn thành'}</p>
          </div>
        </div>
        <Switch checked={section.isComplete} onCheckedChange={(checked) => onSave({ isComplete: checked })} disabled={readOnly} />
      </div>
    </div>
  );
}
