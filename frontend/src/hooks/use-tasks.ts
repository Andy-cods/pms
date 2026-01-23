'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tasksApi,
  type Task,
  type TaskListParams,
  type TaskListResponse,
  type KanbanResponse,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskStatus,
  type ReorderTaskInput,
} from '@/lib/api/tasks';

// Query keys factory
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TaskListParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  kanban: (projectId: string) => [...taskKeys.all, 'kanban', projectId] as const,
  myTasks: () => [...taskKeys.all, 'my-tasks'] as const,
  myTasksList: (params?: Omit<TaskListParams, 'projectId' | 'assigneeId'>) =>
    [...taskKeys.myTasks(), params] as const,
};

// List tasks
export function useTasks(params?: TaskListParams) {
  return useQuery<TaskListResponse>({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(params),
  });
}

// Get single task
export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}

// Get kanban view
export function useKanban(projectId: string) {
  return useQuery<KanbanResponse>({
    queryKey: taskKeys.kanban(projectId),
    queryFn: () => tasksApi.getKanban(projectId),
    enabled: !!projectId,
  });
}

// Get my tasks
export function useMyTasks(params?: Omit<TaskListParams, 'projectId' | 'assigneeId'>) {
  return useQuery<TaskListResponse>({
    queryKey: taskKeys.myTasksList(params),
    queryFn: () => tasksApi.getMyTasks(params),
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.kanban(task.projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasksApi.update(id, input),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.kanban(task.projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

// Update task status
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.kanban(task.projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task status');
    },
  });
}

// Assign users to task
export function useAssignUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      tasksApi.assignUsers(id, userIds),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.kanban(task.projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      toast.success('Task assignees updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assignees');
    },
  });
}

// Delete task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      toast.success('Task deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
}

// Reorder tasks (for kanban drag and drop)
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      tasks,
    }: {
      projectId: string;
      tasks: ReorderTaskInput[];
    }) => tasksApi.reorder(projectId, tasks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.kanban(variables.projectId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder tasks');
    },
  });
}
