'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Edit } from 'lucide-react';

import { useProject } from '@/hooks/use-projects';
import { ProjectForm } from '@/components/project/project-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton with Apple styling
function EditFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>

      {/* Form skeleton */}
      <div className="rounded-2xl border border-border/50 p-8 space-y-10">
        {/* Section 1 */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
          <Skeleton className="h-11 w-20 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return <EditFormSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-headline font-semibold mb-2">
          Không tìm thấy dự án
        </h3>
        <p className="text-callout text-muted-foreground text-center max-w-sm mb-6">
          Dự án này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-full px-5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Apple style with clean hierarchy */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-lg shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-title font-semibold tracking-tight">
                Chỉnh sửa dự án
              </h1>
              <p className="text-callout text-muted-foreground">
                {project.code} · {project.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card - Apple style with generous padding */}
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="p-8">
          <ProjectForm
            project={project}
            onSuccess={() => router.push(`/dashboard/projects/${projectId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
