'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban } from 'lucide-react';

import { useProject } from '@/hooks/use-projects';
import { ProjectForm } from '@/components/project/project-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FolderKanban className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Không tìm thấy dự án</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Dự án này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa dự án</h1>
            <p className="text-muted-foreground">
              {project.code} - {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin dự án</CardTitle>
          <CardDescription>
            Cập nhật thông tin dự án
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={project}
            onSuccess={() => router.push(`/dashboard/projects/${projectId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
