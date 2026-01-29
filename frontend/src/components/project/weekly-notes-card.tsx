'use client';

import { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { useAddWeeklyNote } from '@/hooks/use-projects';

interface WeeklyNotesCardProps {
  project: Project;
  editable?: boolean;
}

function formatNoteDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function WeeklyNotesCard({ project, editable = false }: WeeklyNotesCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');
  const addNote = useAddWeeklyNote();

  const notes = project.weeklyNotes ?? [];

  function handleAdd() {
    if (!note.trim()) return;
    addNote.mutate(
      { id: project.id, note: note.trim() },
      {
        onSuccess: () => {
          toast.success('Đã thêm ghi chú');
          setNote('');
          setShowForm(false);
        },
        onError: () => toast.error('Không thể thêm ghi chú'),
      },
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-subheadline font-semibold">
          Ghi chú hàng tuần
        </CardTitle>
        {editable && !showForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-footnote text-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 p-3 rounded-xl bg-surface/50 border border-border/50">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nội dung ghi chú tuần này..."
              className="min-h-[80px]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => { setShowForm(false); setNote(''); }}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-lg"
                onClick={handleAdd}
                disabled={!note.trim() || addNote.isPending}
              >
                Thêm ghi chú
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showForm && (
          <p className="text-footnote text-muted-foreground/50 italic">Chưa có ghi chú</p>
        )}

        {notes.slice().reverse().map((n, idx) => (
          <div
            key={idx}
            className="flex gap-3 p-3 rounded-xl bg-surface/30"
          >
            <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-caption font-medium text-muted-foreground">
                  Tuần {n.week}
                </span>
                <span className="text-caption text-muted-foreground/60">
                  {formatNoteDate(n.date)}
                </span>
              </div>
              <p className="text-footnote whitespace-pre-wrap">{n.note}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
