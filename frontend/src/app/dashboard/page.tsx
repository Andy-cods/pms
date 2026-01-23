'use client';

import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Files,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useAuth } from '@/hooks/use-auth';
import {
  useDashboardStats,
  useProjectDistribution,
  useTaskTrend,
  useRecentActivities,
  useDashboardMyTasks,
} from '@/hooks/use-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TaskStatusBadge, TaskPriorityBadge } from '@/components/common/status-badge';
import { formatFileSize } from '@/lib/api/files';
import { ProjectStatusColors, TaskStatusColors } from '@/lib/api/dashboard';
import type { TaskStatus, TaskPriority } from '@/types';

const ProjectStatusLabels: Record<string, string> = {
  STABLE: 'Ổn định',
  WARNING: 'Cần chú ý',
  CRITICAL: 'Nghiêm trọng',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: projectDistribution, isLoading: distLoading } = useProjectDistribution();
  const { data: taskTrend, isLoading: trendLoading } = useTaskTrend(7);
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(5);
  const { data: myTasks, isLoading: myTasksLoading } = useDashboardMyTasks();

  // Prepare chart data
  const pieData = projectDistribution?.map((item) => ({
    name: ProjectStatusLabels[item.status] || item.status,
    value: item.count,
    color: ProjectStatusColors[item.status] || '#94a3b8',
  })) || [];

  const barData = taskTrend?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    'Hoàn thành': item.completed,
    'Tạo mới': item.created,
  })) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <FolderKanban className="h-4 w-4 text-blue-500" />;
      case 'task_created':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'task_completed':
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case 'file_uploaded':
        return <Files className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Xin chào, {user?.name}!</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động của bạn hôm nay.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dự án</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.projects.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.projects.warning || 0} cần chú ý, {stats?.projects.critical || 0} nghiêm trọng
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.tasks.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tasks.inProgress || 0} đang làm, {stats?.tasks.done || 0} hoàn thành
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  / {stats?.users.total || 0} tổng số
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Files</CardTitle>
                <Files className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.files.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(stats?.files.totalSize || 0)} tổng dung lượng
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái dự án</CardTitle>
            <CardDescription>Phân bố theo tình trạng</CardDescription>
          </CardHeader>
          <CardContent>
            {distLoading ? (
              <Skeleton className="h-64" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks 7 ngày qua</CardTitle>
            <CardDescription>Số lượng task tạo mới và hoàn thành</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64" />
            ) : barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Tạo mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hoàn thành" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Tasks & Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tasks của tôi</CardTitle>
              <CardDescription>
                {myTasks?.overdue || 0} quá hạn, {myTasks?.dueToday || 0} đến hạn hôm nay
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/tasks')}>
              Xem tất cả
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {myTasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : myTasks?.tasks && myTasks.tasks.length > 0 ? (
              <div className="space-y-3">
                {myTasks.tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.projectCode} - {task.projectName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status as TaskStatus} />
                      <TaskPriorityBadge priority={task.priority as TaskPriority} />
                    </div>
                    {task.deadline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Không có task nào đang chờ xử lý
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>{' '}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                    {getActivityIcon(activity.type)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Chưa có hoạt động nào
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
