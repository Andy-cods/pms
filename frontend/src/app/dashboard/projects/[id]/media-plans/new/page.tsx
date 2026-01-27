'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { useProject } from '@/hooks/use-projects';
import { useCreateMediaPlan } from '@/hooks/use-media-plans';
import { type CreateMediaPlanInput } from '@/lib/api/media-plans';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaPlanForm } from '@/components/media-plan/media-plan-form';

export default function NewMediaPlanPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useProject(projectId);
  const createMutation = useCreateMediaPlan();

  const handleSubmit = async (data: CreateMediaPlanInput) => {
    try {
      const plan = await createMutation.mutateAsync({
        projectId,
        input: data,
      });
      toast.success('Đã tạo kế hoạch media');
      router.push(`/dashboard/projects/${projectId}/media-plans/${plan.id}`);
    } catch {
      toast.error('Không thể tạo kế hoạch media');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/projects/${projectId}/media-plans`)}
          className="h-10 w-10 rounded-xl hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-headline font-semibold tracking-tight">
            Tạo kế hoạch media
          </h1>
          <p className="text-[14px] text-muted-foreground">
            {project?.code} - {project?.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-2xl border-border/50 shadow-apple-sm max-w-2xl">
        <CardContent className="p-6">
          <MediaPlanForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            onCancel={() => router.push(`/dashboard/projects/${projectId}/media-plans`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
