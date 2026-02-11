'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  PauseCircle,
} from 'lucide-react';

import { useMyTasks, useUpdateTaskStatus } from '@/hooks/use-tasks';
import {
  type TaskStatus,
  type TaskPriority,
} from '@/lib/api/tasks';
import {
  AppleStatusLabels,
  ApplePriorityLabels,
  getStatusStyles,
} from '@/lib/task-design-tokens';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard, TaskCardSkeleton } from '@/components/task/task-card';
import { cn } from '@/lib/utils';

/**
 * My Tasks Page - Apple Design
 *
 * Features:
 * - Clean, minimal layout
 * - Apple-style stat cards with subtle backgrounds
 * - Task list with subtle separators
 * - Status and priority filters
 * - Smooth transitions throughout
 */
export default function MyTasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  const { data, isLoading } = useMyTasks({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
    limit: 100,
  });

  const updateStatusMutation = useUpdateTaskStatus();

  // Group tasks by status
  const todoTasks = data?.tasks.filter((t) => t.status === 'TODO') ?? [];
  const inProgressTasks = data?.tasks.filter((t) => t.status === 'IN_PROGRESS') ?? [];
  const pendingTasks = data?.tasks.filter((t) => t.status === 'PENDING') ?? [];
  const reviewTasks = data?.tasks.filter((t) => t.status === 'REVIEW') ?? [];
  const doneTasks = data?.tasks.filter((t) => t.status === 'DONE') ?? [];
  const activeTasks = [...todoTasks, ...inProgressTasks, ...pendingTasks, ...reviewTasks];

  // Handle task status change
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status });
  };

  // Handle task click
  const handleTaskClick = (taskId: string, projectId: string) => {
    router.push(`/dashboard/projects/${projectId}/tasks`);
  };

  if (isLoading) {
    return <MyTasksPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-headline font-semibold tracking-tight">My Tasks</h1>
        <p className="text-[15px] text-muted-foreground">
          Tasks assigned to you across all projects
        </p>
      </div>

      {/* Stats Cards - Apple Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Circle className="h-5 w-5" />}
          label="To Do"
          count={todoTasks.length}
          color="#86868b"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="In Progress"
          count={inProgressTasks.length}
          color="#007aff"
        />
        <StatCard
          icon={<PauseCircle className="h-5 w-5" />}
          label="Pending"
          count={pendingTasks.length}
          color="#ff9500"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="In Review"
          count={reviewTasks.length}
          color="#ff9f0a"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          count={doneTasks.length}
          color="#34c759"
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/30 focus:bg-background"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | 'ALL')}
        >
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-border/50 bg-secondary/30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ALL">All Status</SelectItem>
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

        {/* Priority Filter */}
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'ALL')}
        >
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-border/50 bg-secondary/30">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ALL">All Priority</SelectItem>
            {Object.entries(ApplePriorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List with Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger
            value="active"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Active
            <span className="ml-2 text-[12px] text-muted-foreground">
              {activeTasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Completed
            <span className="ml-2 text-[12px] text-muted-foreground">
              {doneTasks.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {activeTasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-12 w-12" />}
                title="No active tasks"
                description="You're all caught up!"
              />
            ) : (
              <div className="divide-y divide-border/30">
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    variant="list"
                    onClick={() => handleTaskClick(task.id, task.projectId)}
                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {doneTasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-12 w-12" />}
                title="No completed tasks"
                description="Complete some tasks to see them here"
              />
            ) : (
              <div className="divide-y divide-border/30">
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    variant="list"
                    onClick={() => handleTaskClick(task.id, task.projectId)}
                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                    className="opacity-70"
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

function StatCard({ icon, label, count, color }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'bg-card border border-border/50',
        'transition-all duration-200 hover:shadow-apple-sm'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <div className="text-2xl font-semibold">{count}</div>
          <div className="text-[13px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-muted-foreground/50 mb-4">{icon}</div>
      <h3 className="text-[17px] font-medium mb-1">{title}</h3>
      <p className="text-[14px] text-muted-foreground">{description}</p>
    </div>
  );
}

// Loading Skeleton
function MyTasksPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 bg-card border border-border/50"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-[140px] rounded-xl" />
        <Skeleton className="h-10 w-[140px] rounded-xl" />
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30">
          {[1, 2, 3, 4, 5].map((i) => (
            <TaskCardSkeleton key={i} variant="list" />
          ))}
        </div>
      </div>
    </div>
  );
}
