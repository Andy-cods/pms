'use client';

import { useParams, useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  ExternalLink,
  FolderKanban,
  CheckSquare,
  Files,
  Clock,
  MoreHorizontal,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

import { useProject, useArchiveProject } from '@/hooks/use-projects';
import {
  ProjectStatusLabels,
  ProjectStageLabels,
  ProjectStatusColors,
} from '@/lib/api/projects';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const archiveMutation = useArchiveProject();

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(projectId);
    router.push('/dashboard/projects');
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTimeDiff = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
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

  const taskProgress = project.taskStats.total > 0
    ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={ProjectStatusColors[project.status]}>
                {ProjectStatusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {project.code}
              {project.client && ` • ${project.client.companyName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}/tasks`)}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}/files`)}
          >
            <Files className="h-4 w-4 mr-2" />
            Files
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Lưu trữ
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lưu trữ dự án?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dự án sẽ được lưu trữ và không hiển thị trong danh sách.
                      Bạn có thể khôi phục lại sau.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleArchive}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Lưu trữ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="team">Team ({project.team.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Mô tả</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Chưa có mô tả
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Tiến độ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Giai đoạn</span>
                      <span className="text-sm">
                        <Badge variant="outline">
                          {ProjectStageLabels[project.stage]}
                        </Badge>
                        <span className="ml-2 font-medium">{project.stageProgress}%</span>
                      </span>
                    </div>
                    <Progress value={project.stageProgress} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasks hoàn thành</span>
                      <span className="text-sm">
                        {project.taskStats.done}/{project.taskStats.total} tasks
                        <span className="ml-2 font-medium">({taskProgress}%)</span>
                      </span>
                    </div>
                    <Progress value={taskProgress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {project.taskStats.total}
                      </div>
                      <div className="text-xs text-muted-foreground">Tổng tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {project.taskStats.inProgress}
                      </div>
                      <div className="text-xs text-muted-foreground">Đang làm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {project.taskStats.todo}
                      </div>
                      <div className="text-xs text-muted-foreground">Chờ xử lý</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {project.taskStats.done}
                      </div>
                      <div className="text-xs text-muted-foreground">Hoàn thành</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Timeline</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        {getTimeDiff(project.startDate, project.endDate) && (
                          <span className="ml-1">
                            ({getTimeDiff(project.startDate, project.endDate)} ngày)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {project.productType && (
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Loại sản phẩm</div>
                        <div className="text-sm text-muted-foreground">
                          {project.productType}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Cập nhật lần cuối</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Liên kết</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.driveLink ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(project.driveLink!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Google Drive
                    </Button>
                  ) : null}
                  {project.planLink ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(project.planLink!, '_blank')}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Kế hoạch
                    </Button>
                  ) : null}
                  {project.trackingLink ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(project.trackingLink!, '_blank')}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Tracking
                    </Button>
                  ) : null}
                  {!project.driveLink && !project.planLink && !project.trackingLink && (
                    <p className="text-sm text-muted-foreground italic text-center py-2">
                      Chưa có liên kết nào
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team</CardTitle>
                <CardDescription>
                  {project.team.length} thành viên
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Thêm thành viên
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.team.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.user.name}
                          {member.isPrimary && (
                            <Badge variant="secondary" className="ml-2">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
