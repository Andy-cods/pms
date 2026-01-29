'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface Persona {
  role: string;
  painPoint: string;
  goal: string;
  trigger: string;
}

interface JourneyStep {
  stage: string;
  description: string;
}

interface CustomerData {
  personas: Persona[];
  customerJourney: JourneyStep[];
}

interface Props {
  section: BriefSection;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

const EMPTY_PERSONA: Persona = { role: '', painPoint: '', goal: '', trigger: '' };
const EMPTY_JOURNEY: JourneyStep = { stage: '', description: '' };

export function CustomerResearchSection({ section, onSave, readOnly = false }: Props) {
  const raw = (section.data ?? {}) as Record<string, unknown>;
  const [personas, setPersonas] = useState<Persona[]>(
    (raw.personas as Persona[]) ?? [{ ...EMPTY_PERSONA }],
  );
  const [journey, setJourney] = useState<JourneyStep[]>(
    (raw.customerJourney as JourneyStep[]) ?? [{ ...EMPTY_JOURNEY }],
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    (p: Persona[], j: JourneyStep[]) => {
      if (readOnly) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave({ data: { personas: p, customerJourney: j } });
      }, 500);
    },
    [onSave, readOnly],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function updatePersona(idx: number, field: keyof Persona, value: string) {
    const next = personas.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    setPersonas(next);
    debouncedSave(next, journey);
  }

  function addPersona() {
    const next = [...personas, { ...EMPTY_PERSONA }];
    setPersonas(next);
    debouncedSave(next, journey);
  }

  function removePersona(idx: number) {
    const next = personas.filter((_, i) => i !== idx);
    setPersonas(next);
    debouncedSave(next, journey);
  }

  function updateJourney(idx: number, field: keyof JourneyStep, value: string) {
    const next = journey.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setJourney(next);
    debouncedSave(personas, next);
  }

  function addJourney() {
    const next = [...journey, { ...EMPTY_JOURNEY }];
    setJourney(next);
    debouncedSave(personas, next);
  }

  function removeJourney(idx: number) {
    const next = journey.filter((_, i) => i !== idx);
    setJourney(next);
    debouncedSave(personas, next);
  }

  return (
    <div className="space-y-6">
      {/* Personas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-[13px] font-semibold">Customer Personas</Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addPersona} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Thêm Persona
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {personas.map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-muted-foreground">Persona {idx + 1}</span>
                {!readOnly && personas.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removePersona(idx)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Vai trò</Label>
                  <Input value={p.role} onChange={(e) => updatePersona(idx, 'role', e.target.value)} disabled={readOnly} placeholder="VD: Marketing Manager" className="mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Trigger mua hàng</Label>
                  <Input value={p.trigger} onChange={(e) => updatePersona(idx, 'trigger', e.target.value)} disabled={readOnly} placeholder="VD: Mùa sale cuối năm" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Pain Point</Label>
                <Textarea value={p.painPoint} onChange={(e) => updatePersona(idx, 'painPoint', e.target.value)} disabled={readOnly} className="mt-1 min-h-[50px]" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Mục tiêu</Label>
                <Textarea value={p.goal} onChange={(e) => updatePersona(idx, 'goal', e.target.value)} disabled={readOnly} className="mt-1 min-h-[50px]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Journey */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-[13px] font-semibold">Customer Journey</Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addJourney} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Thêm giai đoạn
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {journey.map((s, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="w-32 shrink-0">
                <Input value={s.stage} onChange={(e) => updateJourney(idx, 'stage', e.target.value)} disabled={readOnly} placeholder="Giai đoạn" className="text-xs" />
              </div>
              <div className="flex-1">
                <Input value={s.description} onChange={(e) => updateJourney(idx, 'description', e.target.value)} disabled={readOnly} placeholder="Mô tả hành vi" className="text-xs" />
              </div>
              {!readOnly && journey.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeJourney(idx)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
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
