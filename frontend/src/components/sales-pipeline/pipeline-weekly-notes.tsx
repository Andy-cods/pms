'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { SalesPipeline, WeeklyNote } from '@/types';
import { useAddWeeklyNote } from '@/hooks/use-sales-pipeline';

interface PipelineWeeklyNotesProps {
  pipeline: SalesPipeline;
  readOnly?: boolean;
}

export function PipelineWeeklyNotes({ pipeline, readOnly = false }: PipelineWeeklyNotesProps) {
  const [note, setNote] = useState('');
  const addNote = useAddWeeklyNote();

  const notes: WeeklyNote[] = Array.isArray(pipeline.weeklyNotes) ? pipeline.weeklyNotes : [];
  const sorted = [...notes].sort((a, b) => b.week - a.week);

  const handleSubmit = () => {
    if (!note.trim()) return;
    addNote.mutate(
      { id: pipeline.id, note: note.trim() },
      { onSuccess: () => setNote('') }
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Weekly Notes</h3>

      {/* Add Note Form */}
      {!readOnly && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Thêm ghi chú tuần..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!note.trim() || addNote.isPending}
            >
              {addNote.isPending ? 'Đang lưu...' : 'Thêm ghi chú'}
            </Button>
          </div>
        </div>
      )}

      {/* Notes Timeline */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-8">
            Chưa có ghi chú nào
          </p>
        )}
        {sorted.map((n, idx) => (
          <div
            key={`${n.week}-${idx}`}
            className="relative pl-6 pb-3 border-l-2 border-border/50 last:border-l-0"
          >
            {/* Timeline dot */}
            <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />

            <div className="rounded-xl border border-border/50 bg-card p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                  Tuần {n.week}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(n.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-[13px] text-foreground whitespace-pre-wrap">{n.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
