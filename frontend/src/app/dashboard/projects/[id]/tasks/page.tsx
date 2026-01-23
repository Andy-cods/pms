'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { useProject } from '@/hooks/use-projects';
import {
  useKanban,
  useTasks,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useReorderTasks,
} from '@/hooks/use-tasks';
import {
  type Task,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';

import { TaskForm } from '@/components/task/task-form';

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: kanban, isLoading: kanbanLoading } = useKanban(projectId);
  const { data: taskList, isLoading: listLoading } = useTasks({
    projectId,
    search: search || undefined,
  });

  const createMutation = useCreateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();
  const reorderMutation = useReorderTasks();

  const isLoading = projectLoading || (viewMode === 'kanban' ? kanbanLoading : listLoading);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateStatusMutation.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleDelete = async () => {
    if (deletingTaskId) {
      await deleteMutation.mutateAsync(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              {project?.code} - {project?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>
                  Add a new task to {project?.name}
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                projectId={projectId}
                onSuccess={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      {viewMode === 'list' && (
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && kanban && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanban.columns.map((column) => (
            <div
              key={column.status}
              className="flex-shrink-0 w-72 bg-muted/30 rounded-lg"
            >
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{column.label}</h3>
                  <Badge variant="secondary">{column.tasks.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => setDeletingTaskId(task.id)}
                    onStatusChange={handleStatusChange}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && taskList && (
        <div className="space-y-2">
          {taskList.tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 font-medium">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new task to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            taskList.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={() => setEditingTask(task)}
                onDelete={() => setDeletingTaskId(task.id)}
                onStatusChange={handleStatusChange}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              projectId={projectId}
              task={editingTask}
              onSuccess={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingTaskId}
        onOpenChange={() => setDeletingTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task and all its subtasks will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Task Card Component (for Kanban)
function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  formatDate,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  formatDate: (date: string | null) => string;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={TaskPriorityColors[task.priority]}>
            {TaskPriorityLabels[task.priority]}
          </Badge>
          {task.deadline && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.deadline)}
            </span>
          )}
        </div>

        {task.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">
                  {assignee.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}

        {task.subtaskCount > 0 && (
          <div className="text-xs text-muted-foreground">
            {task.completedSubtaskCount}/{task.subtaskCount} subtasks
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Task Row Component (for List)
function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  formatDate,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  formatDate: (date: string | null) => string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{task.title}</h4>
            <Badge className={TaskStatusColors[task.status]}>
              {TaskStatusLabels[task.status]}
            </Badge>
            <Badge variant="outline" className={TaskPriorityColors[task.priority]}>
              {TaskPriorityLabels[task.priority]}
            </Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {task.deadline && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(task.deadline)}
            </span>
          )}

          {task.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 2).map((assignee) => (
                <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {assignee.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees.length > 2 && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{task.assignees.length - 2}
                </div>
              )}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
