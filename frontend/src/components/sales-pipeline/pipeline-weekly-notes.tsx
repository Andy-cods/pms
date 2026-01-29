'use client';

import { useState } from 'react';
import { MessageSquarePlus, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Project, WeeklyNote } from '@/types';
import { useAddWeeklyNote } from '@/hooks/use-projects';

interface PipelineWeeklyNotesProps {
  pipeline: Project;
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
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground">Weekly Notes</h3>
          <span className="text-[11px] font-medium text-muted-foreground ml-auto">
            {sorted.length} ghi chú
          </span>
        </div>

        {/* Add Note Form */}
        {!readOnly && (
          <div className="space-y-2.5">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú tuần..."
              rows={3}
              className="resize-none text-[13px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!note.trim() || addNote.isPending}
                className="gap-1.5"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {addNote.isPending ? 'Đang lưu...' : 'Thêm ghi chú'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notes Timeline */}
      <div className="border-t border-border/30 px-5 py-4">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-[13px] font-medium">Chưa có ghi chú nào</p>
          </div>
        )}
        <div className="space-y-0">
          {sorted.map((n, idx) => (
            <div key={`${n.week}-${idx}`} className="relative pl-7 pb-4 last:pb-0">
              {/* Timeline line */}
              {idx < sorted.length - 1 && (
                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border/50" />
              )}
              {/* Timeline dot */}
              <div className={cn(
                'absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-background',
                idx === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
              )} />

              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold',
                    idx === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    Tuần {n.week}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(n.date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {n.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
