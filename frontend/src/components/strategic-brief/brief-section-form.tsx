'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

  // Debounced auto-save
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

  // Watch all fields for auto-save
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
            <Label htmlFor={field.name}>
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
                className="mt-1.5"
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
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Đánh dấu hoàn thành</p>
          <p className="text-[12px] text-muted-foreground">
            Đánh dấu section này là đã hoàn thành
          </p>
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
