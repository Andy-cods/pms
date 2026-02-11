'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { useAddWeeklyNote, useUpdateWeeklyNote, useDeleteWeeklyNote } from '@/hooks/use-projects';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const addNote = useAddWeeklyNote();
  const updateNote = useUpdateWeeklyNote();
  const deleteNote = useDeleteWeeklyNote();

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

  function startEdit(originalIndex: number, currentNote: string) {
    setEditingIndex(originalIndex);
    setEditingText(currentNote);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingText('');
  }

  function handleUpdate() {
    if (editingIndex === null || !editingText.trim()) return;
    updateNote.mutate(
      { id: project.id, weekIndex: editingIndex, note: editingText.trim() },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật ghi chú');
          cancelEdit();
        },
        onError: () => toast.error('Không thể cập nhật ghi chú'),
      },
    );
  }

  function handleDelete(originalIndex: number) {
    deleteNote.mutate(
      { id: project.id, weekIndex: originalIndex },
      {
        onSuccess: () => toast.success('Đã xóa ghi chú'),
        onError: () => toast.error('Không thể xóa ghi chú'),
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

        {notes.slice().reverse().map((n, reverseIdx) => {
          const originalIndex = notes.length - 1 - reverseIdx;
          const isEditing = editingIndex === originalIndex;

          return (
            <div
              key={originalIndex}
              className="flex gap-3 p-3 rounded-xl bg-surface/30 group"
            >
              <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-medium text-muted-foreground">
                      Tuần {n.week}
                    </span>
                    <span className="text-caption text-muted-foreground/60">
                      {formatNoteDate(n.date)}
                    </span>
                  </div>
                  {editable && !isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md"
                        onClick={() => startEdit(originalIndex, n.note)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-[#ff3b30]"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ghi chú Tuần {n.week} sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
                              onClick={() => handleDelete(originalIndex)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[60px] text-footnote"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg text-xs"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 rounded-lg text-xs"
                        onClick={handleUpdate}
                        disabled={!editingText.trim() || updateNote.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-footnote whitespace-pre-wrap">{n.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
