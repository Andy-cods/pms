'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface ApprovalItem {
  item: string;
  approver: string;
  sla: string;
}

interface Props {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

const EMPTY_ROW: ApprovalItem = { item: '', approver: '', sla: '' };

export function GovernanceSection({ section, onSave, readOnly = false }: Props) {
  const raw = (section.data ?? {}) as Record<string, unknown>;
  const [matrix, setMatrix] = useState<ApprovalItem[]>(
    (raw.approvalMatrix as ApprovalItem[]) ?? [{ ...EMPTY_ROW }],
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    (m: ApprovalItem[]) => {
      if (readOnly) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave({ data: { approvalMatrix: m } });
      }, 500);
    },
    [onSave, readOnly],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function update(idx: number, field: keyof ApprovalItem, value: string) {
    const next = matrix.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setMatrix(next);
    debouncedSave(next);
  }

  function add() {
    const next = [...matrix, { ...EMPTY_ROW }];
    setMatrix(next);
    debouncedSave(next);
  }

  function remove(idx: number) {
    const next = matrix.filter((_, i) => i !== idx);
    setMatrix(next);
    debouncedSave(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-semibold">Ma trận phê duyệt</Label>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={add} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Thêm hạng mục
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-3 px-3">
        <span className="text-[11px] font-medium text-muted-foreground">Hạng mục</span>
        <span className="text-[11px] font-medium text-muted-foreground">Người phê duyệt</span>
        <span className="text-[11px] font-medium text-muted-foreground">SLA</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {matrix.map((r, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_100px_32px] gap-3 items-center p-3 rounded-lg border border-border/40 bg-muted/10">
            <Input
              value={r.item}
              onChange={(e) => update(idx, 'item', e.target.value)}
              disabled={readOnly}
              placeholder="VD: Creative"
              className="text-xs"
            />
            <Input
              value={r.approver}
              onChange={(e) => update(idx, 'approver', e.target.value)}
              disabled={readOnly}
              placeholder="VD: PM"
              className="text-xs"
            />
            <Input
              value={r.sla}
              onChange={(e) => update(idx, 'sla', e.target.value)}
              disabled={readOnly}
              placeholder="VD: 2 ngày"
              className="text-xs"
            />
            {!readOnly && matrix.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => remove(idx)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
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
