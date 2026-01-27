'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { type Project, type ProjectStage, ProjectStageLabels } from '@/lib/api/projects';
import { StageProgressSlider } from '@/components/project/stage-progress-slider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from '@/lib/utils';

const projectFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Tên dự án là bắt buộc'),
  description: z.string().optional(),
  productType: z.string().optional(),
  status: z.enum(['STABLE', 'WARNING', 'CRITICAL']).optional(),
  stage: z
    .enum([
      'INTAKE',
      'DISCOVERY',
      'PLANNING',
      'UNDER_REVIEW',
      'PROPOSAL_PITCH',
      'ONGOING',
      'OPTIMIZATION',
      'COMPLETED',
      'CLOSED',
    ])
    .optional(),
  stageProgress: z.number().min(0).max(100).optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  driveLink: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  planLink: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  trackingLink: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
}

// Apple-style form section component
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-subheadline font-semibold">{title}</h3>
        {description && (
          <p className="text-footnote text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const isEditing = !!project;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      code: project?.code ?? '',
      name: project?.name ?? '',
      description: project?.description ?? '',
      productType: project?.productType ?? '',
      status: project?.status ?? 'STABLE',
      stage: project?.stage ?? 'INTAKE',
      stageProgress: project?.stageProgress ?? 0,
      startDate: project?.startDate ? new Date(project.startDate) : null,
      endDate: project?.endDate ? new Date(project.endDate) : null,
      driveLink: project?.driveLink ?? '',
      planLink: project?.planLink ?? '',
      trackingLink: project?.trackingLink ?? '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    const input = {
      ...data,
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
      driveLink: data.driveLink || undefined,
      planLink: data.planLink || undefined,
      trackingLink: data.trackingLink || undefined,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({
        id: project.id,
        input,
      });
    } else {
      await createMutation.mutateAsync(input);
    }

    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/dashboard/projects');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Basic Information Section */}
        <FormSection
          title="Thông tin cơ bản"
          description="Các thông tin chính của dự án"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Mã dự án
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: PRJ001"
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormDescription className="text-caption">
                    Để trống để tự động tạo mã
                  </FormDescription>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Tên dự án <span className="text-[#ff3b30] dark:text-[#ff453a]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập tên dự án"
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-footnote font-medium">Mô tả</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Mô tả chi tiết về dự án..."
                    className="min-h-[120px] rounded-xl bg-surface border-0 text-callout resize-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Status & Stage Section */}
        <FormSection
          title="Trạng thái dự án"
          description="Cập nhật trạng thái và giai đoạn hiện tại"
        >
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Product Type */}
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Loại sản phẩm
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Website, App, Branding..."
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Trạng thái
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl bg-surface border-0 text-callout focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="STABLE" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#34c759] dark:bg-[#30d158]" />
                          On Track
                        </div>
                      </SelectItem>
                      <SelectItem value="WARNING" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" />
                          At Risk
                        </div>
                      </SelectItem>
                      <SelectItem value="CRITICAL" className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#ff3b30] dark:bg-[#ff453a]" />
                          Critical
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />

            {/* Stage */}
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Giai đoạn
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl bg-surface border-0 text-callout focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Chọn giai đoạn" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {Object.entries(ProjectStageLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="rounded-lg">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
          </div>

          {/* Stage Progress - only show when editing */}
          {isEditing && (
            <FormField
              control={form.control}
              name="stageProgress"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <StageProgressSlider
                      stage={(form.watch('stage') ?? 'INTAKE') as ProjectStage}
                      progress={field.value ?? 0}
                      onChange={field.onChange}
                      showLabel={true}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
          )}
        </FormSection>

        {/* Timeline Section */}
        <FormSection
          title="Timeline"
          description="Thời gian bắt đầu và kết thúc dự án"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-footnote font-medium">
                    Ngày bắt đầu
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="ghost"
                          className={cn(
                            'h-11 w-full justify-between rounded-xl bg-surface text-left font-normal text-callout hover:bg-surface/80',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-footnote font-medium">
                    Ngày kết thúc
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="ghost"
                          className={cn(
                            'h-11 w-full justify-between rounded-xl bg-surface text-left font-normal text-callout hover:bg-surface/80',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* External Links Section */}
        <FormSection
          title="Liên kết ngoài"
          description="Các đường dẫn đến tài liệu và công cụ liên quan"
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="driveLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Google Drive
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="planLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Link kế hoạch
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trackingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-footnote font-medium">
                    Link tracking
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      className="h-11 rounded-xl bg-surface border-0 text-callout focus-visible:ring-2 focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-caption text-[#ff3b30] dark:text-[#ff453a]" />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-11 px-6 rounded-full text-callout"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 rounded-full shadow-apple-sm hover:shadow-apple transition-shadow text-callout"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Cập nhật dự án' : 'Tạo dự án'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
