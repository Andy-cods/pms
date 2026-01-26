'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Files,
  Plus,
  ListTodo,
  ArrowRight,
  Calendar,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import {
  useDashboardStats,
  useRecentActivities,
  useDashboardMyTasks,
} from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TaskStatusBadge, TaskPriorityBadge } from '@/components/common/status-badge';
import { StatsCard, StatsCardSkeleton } from '@/components/common/stats-card';
import { formatFileSize } from '@/lib/api/files';
import type { TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(8);
  const { data: myTasks, isLoading: myTasksLoading } = useDashboardMyTasks();

  // Format current date
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
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

  // Group activities by date
  const groupedActivities = useMemo(() => {
    if (!activities) return {};

    const groups: Record<string, typeof activities> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    activities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      let dateKey: string;

      if (activityDate.toDateString() === today.toDateString()) {
        dateKey = 'Hôm nay';
      } else if (activityDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Hôm qua';
      } else {
        dateKey = activityDate.toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'long',
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  }, [activities]);

  // Get activity action text
  const getActivityAction = (type: string) => {
    switch (type) {
      case 'project_created':
        return 'đã tạo dự án mới';
      case 'task_created':
        return 'đã tạo task mới';
      case 'task_completed':
        return 'đã hoàn thành task';
      case 'file_uploaded':
        return 'đã tải lên file';
      case 'member_added':
        return 'đã thêm thành viên';
      case 'comment_added':
        return 'đã bình luận';
      default:
        return 'đã thực hiện hành động';
    }
  };

  // Quick actions
  const quickActions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'Tạo dự án',
      onClick: () => router.push('/dashboard/projects/new'),
      primary: true,
    },
    {
      icon: <ListTodo className="h-4 w-4" />,
      label: 'Thêm task',
      onClick: () => router.push('/dashboard/tasks'),
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Thành viên',
      onClick: () => router.push('/dashboard/teams'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Generous top padding for breathing room */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {/* Subtle date */}
              <p className="text-sm text-muted-foreground mb-2 capitalize">
                {currentDate}
              </p>
              {/* Welcome message - prominent but not overwhelming */}
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Xin chào, {user?.name?.split(' ').pop() || 'bạn'}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Đây là tổng quan hoạt động của bạn.
              </p>
            </div>

            {/* Quick Actions - floating buttons */}
            <div className="flex items-center gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  className={cn(
                    'rounded-full px-4 transition-all duration-200',
                    action.primary
                      ? 'shadow-md hover:shadow-lg'
                      : 'bg-secondary/50 hover:bg-secondary'
                  )}
                >
                  {action.icon}
                  <span className="ml-2 hidden sm:inline">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </header>

        {/* Stats Grid - Apple-style cards */}
        <section className="mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <StatsCardSkeleton key={i} />
                ))}
              </>
            ) : (
              <>
                <StatsCard
                  title="Dự án"
                  value={stats?.projects.total || 0}
                  subtitle={`${stats?.projects.warning || 0} cần chú ý`}
                  icon={<FolderKanban className="h-5 w-5" />}
                  onClick={() => router.push('/dashboard/projects')}
                />
                <StatsCard
                  title="Tasks"
                  value={stats?.tasks.total || 0}
                  subtitle={`${stats?.tasks.done || 0} hoàn thành`}
                  icon={<CheckSquare className="h-5 w-5" />}
                  trend={{ value: 12, label: 'tuần này' }}
                  onClick={() => router.push('/dashboard/tasks')}
                />
                <StatsCard
                  title="Thành viên"
                  value={stats?.users.active || 0}
                  subtitle={`/ ${stats?.users.total || 0} tổng`}
                  icon={<Users className="h-5 w-5" />}
                  onClick={() => router.push('/dashboard/teams')}
                />
                <StatsCard
                  title="Files"
                  value={stats?.files.total || 0}
                  subtitle={formatFileSize(stats?.files.totalSize || 0)}
                  icon={<Files className="h-5 w-5" />}
                  onClick={() => router.push('/dashboard/projects')}
                />
              </>
            )}
          </div>
        </section>

        {/* Two Column Layout - Tasks & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* My Tasks Section - Takes more space */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Tasks của tôi</h2>
                {myTasks && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {myTasks.overdue > 0 && (
                      <span className="text-red-500">{myTasks.overdue} quá hạn</span>
                    )}
                    {myTasks.overdue > 0 && myTasks.dueToday > 0 && ' · '}
                    {myTasks.dueToday > 0 && (
                      <span className="text-amber-500">{myTasks.dueToday} đến hạn hôm nay</span>
                    )}
                    {myTasks.overdue === 0 && myTasks.dueToday === 0 && 'Không có task gấp'}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/tasks')}
                className="text-muted-foreground hover:text-foreground"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {myTasksLoading ? (
                // Skeleton loading
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-card border border-border/40 animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-5 w-48 bg-muted rounded mb-2" />
                        <div className="h-4 w-32 bg-muted rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-muted rounded-full" />
                        <div className="h-6 w-12 bg-muted rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : myTasks?.tasks && myTasks.tasks.length > 0 ? (
                myTasks.tasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'group p-4 rounded-xl',
                      'bg-card border border-border/40',
                      'shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
                      'transition-all duration-200 ease-out',
                      'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]',
                      'hover:border-border/60',
                      'cursor-pointer'
                    )}
                    onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {task.projectCode} · {task.projectName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <TaskStatusBadge status={task.status as TaskStatus} />
                        <TaskPriorityBadge priority={task.priority as TaskPriority} />
                      </div>

                      {task.deadline && (
                        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(task.deadline).toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      )}

                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                // Empty state
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                    <CheckSquare className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Không có task nào đang chờ xử lý
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/dashboard/tasks')}
                  >
                    Xem tất cả tasks
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Activity Feed Section */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Hoạt động</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Timeline Activity Feed */}
            <div className="relative">
              {activitiesLoading ? (
                // Skeleton loading
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 w-full bg-muted rounded mb-2" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                    <div key={date}>
                      {/* Date header */}
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        {date}
                      </div>

                      {/* Activities for this date */}
                      <div className="relative">
                        {/* Timeline connector line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />

                        <div className="space-y-4">
                          {dateActivities.map((activity, idx) => (
                            <div
                              key={activity.id}
                              className="relative flex gap-4 pl-0"
                            >
                              {/* Avatar with timeline dot */}
                              <div className="relative z-10">
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarFallback className="text-xs bg-muted">
                                    {activity.userName?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-4">
                                <p className="text-sm leading-relaxed">
                                  <span className="font-medium text-foreground">
                                    {activity.userName}
                                  </span>
                                  {' '}
                                  <span className="text-muted-foreground">
                                    {getActivityAction(activity.type)}
                                  </span>
                                </p>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                    {activity.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                  {formatRelativeTime(activity.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Empty state
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-4">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Chưa có hoạt động nào
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Bottom spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
