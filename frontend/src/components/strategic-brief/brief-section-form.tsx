'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FieldConfig } from './brief-section-config';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface BriefSectionFormProps {
  section: BriefSection;
  fields: FieldConfig[];
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function BriefSectionForm({ section, fields, onSave, readOnly = false }: BriefSectionFormProps) {
  const form = useForm({
    defaultValues: (section.data as Record<string, string | number> | null) ?? {},
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const debouncedSave = useCallback(
    (values: Record<string, unknown>) => {
      const serialized = JSON.stringify(values);
      if (serialized === lastSavedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastSavedRef.current = serialized;
        onSave({ data: values });
      }, 500);
    },
    [onSave],
  );

  useEffect(() => {
    if (readOnly) return;
    const subscription = form.watch((values) => {
      debouncedSave(values as Record<string, unknown>);
    });
    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, debouncedSave, readOnly]);

  const handleCompleteToggle = (checked: boolean) => {
    onSave({ isComplete: checked });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="text-[13px]">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                {...form.register(field.name)}
                disabled={readOnly}
                placeholder={field.placeholder}
                rows={4}
                className="mt-1.5 resize-none"
              />
            ) : field.type === 'number' ? (
              <Input
                id={field.name}
                type="number"
                {...form.register(field.name)}
                disabled={readOnly}
                placeholder={field.placeholder}
                className="mt-1.5"
              />
            ) : field.type === 'select' && field.options ? (
              <select
                id={field.name}
                {...form.register(field.name)}
                disabled={readOnly}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Chọn --</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
                {...form.register(field.name)}
                disabled={readOnly}
                placeholder={field.placeholder}
                className="mt-1.5"
              />
            )}
          </div>
        ))}
      </div>

      {/* Completion toggle */}
      <div className={cn(
        'flex items-center justify-between rounded-lg border p-4 transition-colors',
        section.isComplete
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border/40 bg-muted/20'
      )}>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={cn(
            'h-5 w-5',
            section.isComplete ? 'text-emerald-500' : 'text-muted-foreground/40'
          )} />
          <div>
            <p className="text-[13px] font-semibold text-foreground">Đánh dấu hoàn thành</p>
            <p className="text-[11px] text-muted-foreground">
              {section.isComplete ? 'Section đã hoàn thành' : 'Đánh dấu section này là đã hoàn thành'}
            </p>
          </div>
        </div>
        <Switch
          checked={section.isComplete}
          onCheckedChange={handleCompleteToggle}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
