'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';

import { useMyTasks } from '@/hooks/use-tasks';
import {
  type TaskStatus,
  type TaskPriority,
  TaskStatusColors,
  TaskStatusLabels,
  TaskPriorityColors,
  TaskPriorityLabels,
} from '@/lib/api/tasks';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Group tasks by status
  const todoTasks = data?.tasks.filter((t) => t.status === 'TODO') ?? [];
  const inProgressTasks = data?.tasks.filter((t) => t.status === 'IN_PROGRESS') ?? [];
  const reviewTasks = data?.tasks.filter((t) => t.status === 'REVIEW') ?? [];
  const doneTasks = data?.tasks.filter((t) => t.status === 'DONE') ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">
          Tasks assigned to you across all projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{todoTasks.length}</div>
              <div className="text-sm text-muted-foreground">To Do</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{reviewTasks.length}</div>
              <div className="text-sm text-muted-foreground">In Review</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{doneTasks.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | 'ALL')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.entries(TaskStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'ALL')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            {Object.entries(TaskPriorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({todoTasks.length + inProgressTasks.length + reviewTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done">Completed ({doneTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-2">
          {[...todoTasks, ...inProgressTasks, ...reviewTasks].length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 font-medium">No active tasks</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            [...todoTasks, ...inProgressTasks, ...reviewTasks].map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/dashboard/projects/${task.projectId}/tasks`)
                }
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={TaskStatusColors[task.status]}>
                        {TaskStatusLabels[task.status]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={TaskPriorityColors[task.priority]}
                      >
                        {TaskPriorityLabels[task.priority]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{task.project.code}</span>
                      {task.deadline && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue(task.deadline) ? 'text-red-600' : ''
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.deadline)}
                          {isOverdue(task.deadline) && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4 space-y-2">
          {doneTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 font-medium">No completed tasks</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete some tasks to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            doneTasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow opacity-70"
                onClick={() =>
                  router.push(`/dashboard/projects/${task.projectId}/tasks`)
                }
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium line-through">{task.title}</h4>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{task.project.code}</span>
                      {task.completedAt && (
                        <span>Completed {formatDate(task.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
