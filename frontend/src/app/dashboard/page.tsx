'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatus, TaskStatus, TaskPriority } from '@/types';
import { ProjectStatusBadge, TaskStatusBadge, TaskPriorityBadge } from '@/components/common/status-badge';
import { FolderKanban, CheckSquare, ClipboardCheck, Bell } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: 'Dự án đang chạy', value: '8', icon: FolderKanban, change: '+2 tuần này' },
    { title: 'Tasks của tôi', value: '12', icon: CheckSquare, change: '3 sắp đến hạn' },
    { title: 'Chờ duyệt', value: '5', icon: ClipboardCheck, change: '2 mới hôm nay' },
    { title: 'Thông báo', value: '3', icon: Bell, change: 'Chưa đọc' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Xin chào, {user?.name}!</h1>
        <p className="text-muted-foreground">Chào mừng bạn đến với hệ thống quản lý dự án BC Agency.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Badges Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
          <CardDescription>Các loại badge hiển thị trạng thái</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Project Status:</p>
            <div className="flex flex-wrap gap-2">
              <ProjectStatusBadge status={ProjectStatus.STABLE} />
              <ProjectStatusBadge status={ProjectStatus.WARNING} />
              <ProjectStatusBadge status={ProjectStatus.CRITICAL} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Task Status:</p>
            <div className="flex flex-wrap gap-2">
              <TaskStatusBadge status={TaskStatus.TODO} />
              <TaskStatusBadge status={TaskStatus.IN_PROGRESS} />
              <TaskStatusBadge status={TaskStatus.REVIEW} />
              <TaskStatusBadge status={TaskStatus.DONE} />
              <TaskStatusBadge status={TaskStatus.BLOCKED} />
              <TaskStatusBadge status={TaskStatus.CANCELLED} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Task Priority:</p>
            <div className="flex flex-wrap gap-2">
              <TaskPriorityBadge priority={TaskPriority.LOW} />
              <TaskPriorityBadge priority={TaskPriority.MEDIUM} />
              <TaskPriorityBadge priority={TaskPriority.HIGH} />
              <TaskPriorityBadge priority={TaskPriority.URGENT} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Content */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Dashboard content sẽ được phát triển trong các phase tiếp theo.</p>
          <p className="mt-2 text-sm text-muted-foreground">Phase 2 - Week 4: Dashboard & Analytics</p>
        </CardContent>
      </Card>
    </div>
  );
}
