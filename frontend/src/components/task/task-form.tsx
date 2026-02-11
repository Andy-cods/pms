'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, Clock, Tag, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import {
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/api/tasks';
import {
  AppleStatusLabels,
  ApplePriorityLabels,
  getStatusStyles,
  getPriorityStyles,
} from '@/lib/task-design-tokens';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'PENDING', 'REVIEW', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional().nullable(),
  deadline: z.date().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onSuccess?: () => void;
}

/**
 * Apple-style Task Form Component
 * - Clean, well-spaced form fields
 * - Rounded inputs with subtle borders
 * - Apple-style select dropdowns with status indicators
 * - Smooth focus transitions
 */
export function TaskForm({ projectId, task, onSuccess }: TaskFormProps) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
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

  const onSubmit = async (data: TaskFormData) => {
    const input = {
      ...data,
      deadline: data.deadline?.toISOString(),
      estimatedHours: data.estimatedHours ?? undefined,
      actualHours: data.actualHours ?? undefined,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({
        id: task.id,
        input,
      });
    } else {
      await createMutation.mutateAsync({
        ...input,
        projectId,
      });
    }

    onSuccess?.();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-muted-foreground">
                Title
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Task title"
                  {...field}
                  className="h-11 rounded-xl border-border/50 focus:border-[#007aff] transition-colors"
                />
              </FormControl>
              <FormMessage className="text-[12px] text-[#ff3b30]" />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-muted-foreground">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description..."
                  className="min-h-[100px] rounded-xl border-border/50 focus:border-[#007aff] transition-colors resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[12px] text-[#ff3b30]" />
            </FormItem>
          )}
        />

        {/* Status & Priority Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Status
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-border/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
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
                <FormMessage className="text-[12px] text-[#ff3b30]" />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  Priority
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-border/50">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
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
                <FormMessage className="text-[12px] text-[#ff3b30]" />
              </FormItem>
            )}
          />
        </div>

        {/* Deadline & Hours Row */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Deadline */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Deadline
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-11 pl-3 text-left font-normal rounded-xl border-border/50',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, field.value.getHours() || field.value.getMinutes() ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: vi })
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => {
                        if (date && field.value) {
                          date.setHours(field.value.getHours(), field.value.getMinutes());
                        }
                        field.onChange(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.value && (
                  <Input
                    type="time"
                    className="h-9 rounded-xl border-border/50 text-[13px]"
                    value={field.value ? format(field.value, 'HH:mm') : ''}
                    onChange={(e) => {
                      if (field.value && e.target.value) {
                        const [h, m] = e.target.value.split(':').map(Number);
                        const updated = new Date(field.value);
                        updated.setHours(h, m);
                        field.onChange(updated);
                      }
                    }}
                  />
                )}
                <FormMessage className="text-[12px] text-[#ff3b30]" />
              </FormItem>
            )}
          />

          {/* Estimated Hours */}
          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Est. Hours
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    className="h-11 rounded-xl border-border/50"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage className="text-[12px] text-[#ff3b30]" />
              </FormItem>
            )}
          />

          {/* Actual Hours (only for editing) */}
          {isEditing && (
            <FormField
              control={form.control}
              name="actualHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Actual Hours
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      className="h-11 rounded-xl border-border/50"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-[12px] text-[#ff3b30]" />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl bg-[#007aff] hover:bg-[#007aff]/90"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
