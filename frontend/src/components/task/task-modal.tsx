'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarIcon,
  Loader2,
  Paperclip,
  MessageSquare,
  Clock,
  User,
  Tag,
  Flag,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/api/tasks';
import {
  ApplePriorityLabels,
  AppleStatusLabels,
  getPriorityStyles,
  getStatusStyles,
} from '@/lib/task-design-tokens';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Form schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional().nullable(),
  deadline: z.date().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projectId?: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Apple-style Task Modal/Dialog
 * - Clean header with close button
 * - Form fields well-spaced
 * - Comments section at bottom (placeholder)
 * - Attachments as file pills (placeholder)
 * - Action buttons in footer
 */
export function TaskModal({
  open,
  onOpenChange,
  task,
  onSubmit,
  onDelete,
  isSubmitting = false,
}: TaskModalProps) {
  const isEditing = !!task;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: (task?.status as TaskStatus) ?? 'TODO',
      priority: (task?.priority as TaskPriority) ?? 'MEDIUM',
      estimatedHours: task?.estimatedHours ?? null,
      actualHours: task?.actualHours ?? null,
      deadline: task?.deadline ? new Date(task.deadline) : null,
    },
  });

  // Reset form when task changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: (task?.status as TaskStatus) ?? 'TODO',
        priority: (task?.priority as TaskPriority) ?? 'MEDIUM',
        estimatedHours: task?.estimatedHours ?? null,
        actualHours: task?.actualHours ?? null,
        deadline: task?.deadline ? new Date(task.deadline) : null,
      });
    }
  }, [open, task, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Clean Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Form Content */}
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-muted-foreground">
                Title
              </label>
              <Input
                {...form.register('title')}
                placeholder="Task title"
                className="h-11 rounded-xl border-border/50 focus:border-primary"
              />
              {form.formState.errors.title && (
                <p className="text-[12px] text-[#ff3b30]">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-muted-foreground">
                Description
              </label>
              <Textarea
                {...form.register('description')}
                placeholder="Add a description..."
                className="min-h-[100px] rounded-xl border-border/50 focus:border-primary resize-none"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Status
                </label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(v) => form.setValue('status', v as TaskStatus)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AppleStatusLabels).map(([value, label]) => {
                      const styles = getStatusStyles(value as TaskStatus);
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
                            {label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  Priority
                </label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(v) => form.setValue('priority', v as TaskPriority)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border/50">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ApplePriorityLabels).map(([value, label]) => {
                      const styles = getPriorityStyles(value as TaskPriority);
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
                            {label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deadline & Hours Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Deadline
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 justify-start text-left font-normal rounded-xl border-border/50',
                        !form.watch('deadline') && 'text-muted-foreground'
                      )}
                    >
                      {form.watch('deadline') ? (
                        format(form.watch('deadline')!, 'dd/MM/yyyy', { locale: vi })
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch('deadline') ?? undefined}
                      onSelect={(date) => form.setValue('deadline', date ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Est. Hours
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={form.watch('estimatedHours') ?? ''}
                  onChange={(e) =>
                    form.setValue('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="h-11 rounded-xl border-border/50"
                />
              </div>

              {/* Actual Hours (only for editing) */}
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Actual Hours
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={form.watch('actualHours') ?? ''}
                    onChange={(e) =>
                      form.setValue('actualHours', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="h-11 rounded-xl border-border/50"
                  />
                </div>
              )}
            </div>

            {/* Assignees Section (Read only for now) */}
            {isEditing && task?.assignees && task.assignees.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Assignees
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {task.assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary"
                      >
                        <Avatar className="h-5 w-5">
                          {assignee.user.avatar ? (
                            <AvatarImage src={assignee.user.avatar} alt={assignee.user.name} />
                          ) : null}
                          <AvatarFallback className="text-[10px]">
                            {getInitials(assignee.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px]">{assignee.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Attachments Placeholder */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments
              </label>
              <button
                type="button"
                className={cn(
                  'w-full h-20 rounded-xl border-2 border-dashed border-border/50',
                  'flex flex-col items-center justify-center gap-1',
                  'text-muted-foreground text-[13px]',
                  'hover:border-primary/50 hover:bg-secondary/30',
                  'transition-colors duration-200'
                )}
              >
                <Paperclip className="h-4 w-4" />
                <span>Drop files here or click to upload</span>
              </button>
            </div>

            {/* Comments Section Placeholder */}
            {isEditing && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments
                  </label>
                  <div className="space-y-3">
                    {/* Comment input */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[11px]">U</AvatarFallback>
                      </Avatar>
                      <Input
                        placeholder="Add a comment..."
                        className="flex-1 h-10 rounded-xl border-border/50"
                      />
                    </div>
                    {/* Placeholder for comments */}
                    <p className="text-[13px] text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with Action Buttons */}
          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-secondary/30">
            <div className="flex items-center justify-between w-full">
              {/* Delete button (for editing) */}
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#ff3b30] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
              {!isEditing && <div />}

              {/* Submit buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#007aff] hover:bg-[#007aff]/90 rounded-xl px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
