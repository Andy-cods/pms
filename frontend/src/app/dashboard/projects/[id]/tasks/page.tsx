'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-projects';
import {
  useKanban,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useReorderTasks,
} from '@/hooks/use-tasks';
import {
  type Task,
  type TaskStatus,
  type TaskPriority,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/lib/api/tasks';
import {
  AppleStatusLabels,
  ApplePriorityLabels,
} from '@/lib/task-design-tokens';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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

import { KanbanBoard } from '@/components/task/kanban-board';
import { TaskCard, TaskCardSkeleton } from '@/components/task/task-card';
import { TaskModal } from '@/components/task/task-modal';

/**
 * Project Tasks Page - Apple Design
 *
 * Features:
 * - Clean header with back navigation
 * - View toggle (Kanban/List) with Apple-style segmented control
 * - Full-featured Kanban board with drag-and-drop
 * - List view with Apple-style task cards
 * - Task modal for create/edit
 */
export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // View and filter state
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('TODO');

  // Data fetching
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: kanban, isLoading: kanbanLoading } = useKanban(projectId);
  const { data: taskList, isLoading: listLoading } = useTasks({
    projectId,
    search: search || undefined,
    limit: 100,
  });

  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();
  const reorderMutation = useReorderTasks();

  const isLoading = projectLoading || (viewMode === 'kanban' ? kanbanLoading : listLoading);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Handle task creation
  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    estimatedHours?: number | null;
    deadline?: Date | null;
  }) => {
    await createMutation.mutateAsync({
      projectId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      estimatedHours: data.estimatedHours ?? undefined,
      deadline: data.deadline?.toISOString(),
    });
    setIsCreateModalOpen(false);
  };

  // Handle task update
  const handleUpdateTask = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    estimatedHours?: number | null;
    actualHours?: number | null;
    deadline?: Date | null;
  }) => {
    if (!editingTask) return;
    await updateMutation.mutateAsync({
      id: editingTask.id,
      input: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours ?? undefined,
        actualHours: data.actualHours ?? undefined,
        deadline: data.deadline?.toISOString(),
      },
    });
    setEditingTask(null);
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  // Handle task move (drag and drop)
  const handleTaskMove = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    // Update the task status
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
    // Optionally reorder if needed
    // reorderMutation.mutate({ projectId, tasks: [...] });
  };

  // Handle delete
  const handleDelete = async () => {
    if (deletingTaskId) {
      await deleteMutation.mutateAsync(deletingTaskId);
      setDeletingTaskId(null);
      setEditingTask(null);
    }
  };

  // Handle add task from kanban column
  const handleAddTask = (status: TaskStatus) => {
    setCreateInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  if (isLoading) {
    return <ProjectTasksPageSkeleton viewMode={viewMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className="h-10 w-10 rounded-xl hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Title */}
          <div>
            <h1 className="text-headline font-semibold tracking-tight">Tasks</h1>
            <p className="text-[14px] text-muted-foreground">
              {project?.dealCode} - {project?.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Toggle - Apple-style segmented control */}
          <div className="flex bg-secondary/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium',
                'transition-all duration-200',
                viewMode === 'kanban'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium',
                'transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {/* Create Task Button */}
          <Button
            onClick={() => {
              setCreateInitialStatus('TODO');
              setIsCreateModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#007aff] hover:bg-[#007aff]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search - List view only */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/30 focus:bg-background"
            />
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && kanban && (
        <KanbanBoard
          columns={kanban.columns}
          onTaskMove={handleTaskMove}
          onTaskClick={(task) => setEditingTask(task)}
          onTaskStatusChange={handleStatusChange}
          onTaskDelete={(taskId) => setDeletingTaskId(taskId)}
          onAddTask={handleAddTask}
          isLoading={kanbanLoading}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && taskList && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {taskList.tasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12" />}
              title="No tasks found"
              description="Create a new task to get started"
              actionLabel="Create Task"
              onAction={() => {
                setCreateInitialStatus('TODO');
                setIsCreateModalOpen(true);
              }}
            />
          ) : (
            <div className="divide-y divide-border/30">
              {taskList.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="list"
                  onClick={() => setEditingTask(task)}
                  onStatusChange={(status) => handleStatusChange(task.id, status)}
                  onDelete={() => setDeletingTaskId(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <TaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projectId={projectId}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {/* Edit Task Modal */}
      <TaskModal
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        projectId={projectId}
        onSubmit={handleUpdateTask}
        onDelete={async () => {
          if (editingTask) {
            setDeletingTaskId(editingTask.id);
          }
        }}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTaskId}
        onOpenChange={() => setDeletingTaskId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task and all its subtasks will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-[#ff3b30] hover:bg-[#ff3b30]/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-muted-foreground/50 mb-4">{icon}</div>
      <h3 className="text-[17px] font-medium mb-1">{title}</h3>
      <p className="text-[14px] text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="h-10 px-4 rounded-xl bg-[#007aff] hover:bg-[#007aff]/90"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Loading Skeleton
function ProjectTasksPageSkeleton({ viewMode }: { viewMode: 'kanban' | 'list' }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col w-[300px] min-w-[300px] rounded-2xl bg-secondary/30"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-6 rounded-full" />
                </div>
              </div>
              <div className="px-2 space-y-2 pb-4">
                <TaskCardSkeleton variant="kanban" />
                <TaskCardSkeleton variant="kanban" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <TaskCardSkeleton key={i} variant="list" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
