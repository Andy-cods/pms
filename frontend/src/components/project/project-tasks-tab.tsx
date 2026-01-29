'use client';

import { useState } from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  useKanban,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/use-tasks';
import type {
  Task,
  TaskStatus,
  TaskPriority,
} from '@/lib/api/tasks';

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

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('TODO');

  const { data: kanban, isLoading: kanbanLoading } = useKanban(projectId);
  const { data: taskList, isLoading: listLoading } = useTasks({
    projectId,
    search: search || undefined,
    limit: 100,
  });

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();

  const isLoading = viewMode === 'kanban' ? kanbanLoading : listLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus, _newIndex: number) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDelete = async () => {
    if (deletingTaskId) {
      await deleteMutation.mutateAsync(deletingTaskId);
      setDeletingTaskId(null);
      setEditingTask(null);
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* View toggle */}
          <div className="flex bg-secondary/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200',
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
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {/* Search - list view only */}
          {viewMode === 'list' && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/30 focus:bg-background"
              />
            </div>
          )}
        </div>

        {/* Create button */}
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

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col w-[300px] min-w-[300px] rounded-2xl bg-secondary/30">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-6 rounded-full" />
                  </div>
                  <div className="px-2 space-y-2 pb-4">
                    <TaskCardSkeleton variant="kanban" />
                    <TaskCardSkeleton variant="kanban" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30">
              {[1, 2, 3, 4, 5].map((i) => (
                <TaskCardSkeleton key={i} variant="list" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {!isLoading && viewMode === 'kanban' && kanban && (
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
      {!isLoading && viewMode === 'list' && taskList && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {taskList.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-muted-foreground/50 mb-4">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-[17px] font-medium mb-1">Chưa có task</h3>
              <p className="text-[14px] text-muted-foreground mb-4">Tạo task mới để bắt đầu</p>
              <Button
                onClick={() => {
                  setCreateInitialStatus('TODO');
                  setIsCreateModalOpen(true);
                }}
                className="h-10 px-4 rounded-xl bg-[#007aff] hover:bg-[#007aff]/90"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Tạo Task
              </Button>
            </div>
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
          if (editingTask) setDeletingTaskId(editingTask.id);
        }}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa task?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Task và tất cả subtask sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-[#ff3b30] hover:bg-[#ff3b30]/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
