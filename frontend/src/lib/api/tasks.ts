import { api } from './index';

// Enums
export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DONE'
  | 'BLOCKED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Types
export interface TaskAssignee {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number | null;
  actualHours: number | null;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  orderIndex: number;
  reviewerId: string | null;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  assignees: TaskAssignee[];
  subtaskCount: number;
  completedSubtaskCount: number;
  project: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskListParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface KanbanColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface KanbanResponse {
  columns: KanbanColumn[];
  projectId: string;
}

export interface CreateTaskInput {
  projectId: string;
  parentId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  deadline?: string;
  reviewerId?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  deadline?: string;
  reviewerId?: string;
  orderIndex?: number;
}

export interface ReorderTaskInput {
  id: string;
  orderIndex: number;
  status?: TaskStatus;
}

// API Functions
export const tasksApi = {
  // List tasks with filters
  list: async (params?: TaskListParams): Promise<TaskListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.append('projectId', params.projectId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.assigneeId) searchParams.append('assigneeId', params.assigneeId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await api.get(`/tasks${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Get single task
  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  create: async (input: CreateTaskInput): Promise<Task> => {
    const response = await api.post('/tasks', input);
    return response.data;
  },

  // Update task
  update: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, input);
    return response.data;
  },

  // Update task status only
  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Assign users to task
  assignUsers: async (id: string, userIds: string[]): Promise<Task> => {
    const response = await api.post(`/tasks/${id}/assign`, { userIds });
    return response.data;
  },

  // Delete task
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Get kanban view for project
  getKanban: async (projectId: string): Promise<KanbanResponse> => {
    const response = await api.get(`/tasks/project/${projectId}/kanban`);
    return response.data;
  },

  // Reorder tasks (for drag and drop)
  reorder: async (projectId: string, tasks: ReorderTaskInput[]): Promise<void> => {
    await api.patch(`/tasks/project/${projectId}/reorder`, { tasks });
  },

  // Get my tasks
  getMyTasks: async (params?: Omit<TaskListParams, 'projectId' | 'assigneeId'>): Promise<TaskListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await api.get(`/tasks/user/my-tasks${query ? `?${query}` : ''}`);
    return response.data;
  },
};

// Status colors for UI
export const TaskStatusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  DONE: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

export const TaskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

export const TaskPriorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};
