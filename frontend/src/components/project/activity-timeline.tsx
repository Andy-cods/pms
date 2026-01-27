'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import {
  useProjectLogs,
  useCreateLog,
  useUpdateLog,
  useDeleteLog,
} from '@/hooks/use-project-logs';
import type { ProjectLog, CreateLogInput } from '@/lib/api/log';

interface ActivityTimelineProps {
  projectId: string;
}

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const { data: logs, isLoading } = useProjectLogs(projectId);
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const deleteLog = useDeleteLog();

  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<ProjectLog | null>(null);
  const [form, setForm] = useState<CreateLogInput>({
    logDate: new Date().toISOString().split('T')[0],
    rootCause: '',
    action: '',
    nextAction: '',
    notes: '',
  });

  const openCreate = () => {
    setEditingLog(null);
    setForm({
      logDate: new Date().toISOString().split('T')[0],
      rootCause: '',
      action: '',
      nextAction: '',
      notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (log: ProjectLog) => {
    setEditingLog(log);
    setForm({
      logDate: log.logDate.split('T')[0],
      rootCause: log.rootCause || '',
      action: log.action || '',
      nextAction: log.nextAction || '',
      notes: log.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLog) {
        await updateLog.mutateAsync({
          projectId,
          logId: editingLog.id,
          input: form,
        });
        toast.success('Đã cập nhật log');
      } else {
        await createLog.mutateAsync({ projectId, input: form });
        toast.success('Đã tạo log');
      }
      setShowForm(false);
    } catch {
      toast.error('Không thể lưu log');
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteLog.mutateAsync({ projectId, logId });
      toast.success('Đã xóa log');
    } catch {
      toast.error('Không thể xóa log');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-subheadline font-semibold">
            Nhật ký dự án
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-9 px-4"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm log
          </Button>
        </CardHeader>
        <CardContent>
          {(!logs || logs.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-callout text-muted-foreground mb-3">
                Chưa có nhật ký nào
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-4"
                onClick={openCreate}
              >
                Tạo nhật ký đầu tiên
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-6 bottom-6 w-px bg-border/50" />

              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id} className="relative pl-10 group">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background',
                        index === 0
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                      )}
                    />

                    <div className="p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-footnote font-medium text-muted-foreground">
                          {formatDate(log.logDate)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => openEdit(log)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#ff3b30]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa log?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Log ngày {formatDate(log.logDate)} sẽ bị xóa
                                  vĩnh viễn.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">
                                  Hủy
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
                                  onClick={() => handleDelete(log.id)}
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {log.rootCause && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-[#ff9f0a] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
                                Nguyên nhân
                              </span>
                              <p className="text-footnote mt-0.5">
                                {log.rootCause}
                              </p>
                            </div>
                          </div>
                        )}
                        {log.action && (
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-[#0071e3] dark:text-[#0a84ff] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
                                Hành động
                              </span>
                              <p className="text-footnote mt-0.5">
                                {log.action}
                              </p>
                            </div>
                          </div>
                        )}
                        {log.nextAction && (
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-[#34c759] dark:text-[#30d158] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
                                Bước tiếp theo
                              </span>
                              <p className="text-footnote mt-0.5">
                                {log.nextAction}
                              </p>
                            </div>
                          </div>
                        )}
                        {log.notes && (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
                                Ghi chú
                              </span>
                              <p className="text-footnote text-muted-foreground mt-0.5">
                                {log.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLog ? 'Chỉnh sửa log' : 'Thêm log mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-footnote">Ngày *</Label>
              <Input
                type="date"
                value={form.logDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, logDate: e.target.value }))
                }
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-footnote">Nguyên nhân gốc</Label>
              <Textarea
                value={form.rootCause}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, rootCause: e.target.value }))
                }
                placeholder="Root cause..."
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-footnote">Hành động</Label>
              <Textarea
                value={form.action}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, action: e.target.value }))
                }
                placeholder="Action taken..."
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-footnote">Bước tiếp theo</Label>
              <Textarea
                value={form.nextAction}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nextAction: e.target.value }))
                }
                placeholder="Next steps..."
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-footnote">Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
                className="rounded-lg min-h-[60px]"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={createLog.isPending || updateLog.isPending}
              >
                {(createLog.isPending || updateLog.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingLog ? 'Cập nhật' : 'Tạo log'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
