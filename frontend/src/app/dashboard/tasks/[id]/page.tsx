'use client';

import type React from 'react';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock3,
  FolderKanban,
  Link2,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useTask } from '@/hooks/use-tasks';
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/status-badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { TaskPriority as UiTaskPriority, TaskStatus as UiTaskStatus } from '@/types';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params?.id;
  const router = useRouter();

  const { data: task, isLoading, isError } = useTask(taskId);

  const subtaskPercent = useMemo(() => {
    if (!task || task.subtaskCount === 0) return 0;
    return Math.round((task.completedSubtaskCount / task.subtaskCount) * 100);
  }, [task]);

  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-28 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-6 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) return renderSkeleton();

  if (isError || !task) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-lg font-semibold">Không tìm thấy task</p>
          <p className="text-muted-foreground">
            Task có thể đã bị xóa hoặc bạn không có quyền truy cập.
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard/tasks')}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  const assignees = task.assignees || [];
  const reviewerName = task.reviewer?.name || 'Chưa phân công';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
            <TaskStatusBadge status={task.status as UiTaskStatus} />
            <TaskPriorityBadge priority={task.priority as UiTaskPriority} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4" />
              <span>
                Thuộc dự án{' '}
                <button
                  onClick={() => router.push(`/dashboard/projects/${task.projectId}`)}
                  className="text-primary hover:underline"
                >
                  {task.project.code} – {task.project.name}
                </button>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              <span>ID: {task.id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/tasks')}>
            Danh sách
          </Button>
        </div>
      </div>

      {/* Meta */}
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          title="Deadline"
          icon={<Calendar className="h-4 w-4 text-primary" />}
          value={task.deadline ? formatDate(task.deadline) : 'Chưa đặt'}
        />
        <InfoCard
          title="Người review"
          icon={<Users className="h-4 w-4 text-primary" />}
          value={reviewerName}
        />
        <InfoCard
          title="Thời gian"
          icon={<Clock3 className="h-4 w-4 text-primary" />}
          value={
            task.actualHours
              ? `${task.actualHours}h thực tế`
              : task.estimatedHours
                ? `${task.estimatedHours}h ước tính`
                : 'Chưa cập nhật'
          }
        />
      </div>

      {/* Description */}
      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle>Mô tả</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-sm text-muted-foreground space-y-2">
          {task.description ? (
            task.description.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))
          ) : (
            <p className="italic">Chưa có mô tả.</p>
          )}
          <p className="text-xs text-muted-foreground/80">
            Tạo lúc {formatDateTime(task.createdAt)} • Cập nhật {formatDateTime(task.updatedAt)}
          </p>
        </CardContent>
      </Card>

      {/* Assignees & progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Người phụ trách</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {assignees.length > 0 ? (
              assignees.map((assignee) => {
                const initials = assignee.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignee.user.avatar || undefined} alt={assignee.user.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{assignee.user.name}</p>
                      <p className="text-xs text-muted-foreground">{assignee.user.email}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Chưa phân công người phụ trách.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Tiến độ công việc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Subtask hoàn thành</span>
              <Badge variant="outline">
                {task.completedSubtaskCount}/{task.subtaskCount}
              </Badge>
            </div>
            <Progress value={subtaskPercent} />
            <p className="text-xs text-muted-foreground">
              {task.subtaskCount === 0
                ? 'Chưa có subtask nào được tạo.'
                : `${subtaskPercent}% đã hoàn thành.`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  value,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="py-4 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon}
          <span>{title}</span>
        </div>
        <CardTitle className="text-base">{value}</CardTitle>
      </CardContent>
    </Card>
  );
}
