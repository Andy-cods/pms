'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface ChannelMix {
  channel: string;
  percentage: number;
  funnelRole: string;
}

interface Props {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

const EMPTY_CHANNEL: ChannelMix = { channel: '', percentage: 0, funnelRole: '' };

export function ChannelStrategySection({ section, onSave, readOnly = false }: Props) {
  const raw = (section.data ?? {}) as Record<string, unknown>;
  const [channels, setChannels] = useState<ChannelMix[]>(
    (raw.channelMix as ChannelMix[]) ?? [{ ...EMPTY_CHANNEL }],
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    (c: ChannelMix[]) => {
      if (readOnly) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave({ data: { channelMix: c } });
      }, 500);
    },
    [onSave, readOnly],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const totalPct = channels.reduce((sum, c) => sum + (c.percentage || 0), 0);
  const isValid = Math.abs(totalPct - 100) < 0.01;

  function updateChannel(idx: number, field: keyof ChannelMix, value: string | number) {
    const next = channels.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    setChannels(next);
    debouncedSave(next);
  }

  function addChannel() {
    const next = [...channels, { ...EMPTY_CHANNEL }];
    setChannels(next);
    debouncedSave(next);
  }

  function removeChannel(idx: number) {
    const next = channels.filter((_, i) => i !== idx);
    setChannels(next);
    debouncedSave(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-semibold">Channel Mix</Label>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addChannel} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Thêm kênh
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_1fr_32px] gap-3 px-3">
        <span className="text-[11px] font-medium text-muted-foreground">Kênh</span>
        <span className="text-[11px] font-medium text-muted-foreground text-center">%</span>
        <span className="text-[11px] font-medium text-muted-foreground">Vai trò trong Funnel</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {channels.map((c, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_80px_1fr_32px] gap-3 items-center p-3 rounded-lg border border-border/40 bg-muted/10">
            <Input
              value={c.channel}
              onChange={(e) => updateChannel(idx, 'channel', e.target.value)}
              disabled={readOnly}
              placeholder="VD: Facebook Ads"
              className="text-xs"
            />
            <Input
              type="number"
              value={c.percentage}
              onChange={(e) => updateChannel(idx, 'percentage', Number(e.target.value))}
              disabled={readOnly}
              className="text-xs text-center"
              min={0}
              max={100}
            />
            <Input
              value={c.funnelRole}
              onChange={(e) => updateChannel(idx, 'funnelRole', e.target.value)}
              disabled={readOnly}
              placeholder="VD: Awareness"
              className="text-xs"
            />
            {!readOnly && channels.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeChannel(idx)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div className={cn(
        'flex items-center justify-between rounded-lg border p-3',
        isValid
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5',
      )}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-[13px] font-medium">
            Tổng: <span className="tabular-nums font-bold">{totalPct}%</span>
          </span>
        </div>
        <span className={cn('text-[11px]', isValid ? 'text-emerald-600' : 'text-amber-600')}>
          {isValid ? 'Hợp lệ' : 'Tổng phải bằng 100%'}
        </span>
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
