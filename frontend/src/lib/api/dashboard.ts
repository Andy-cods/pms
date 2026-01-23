import { api } from './index';

export const ProjectStatusColors: Record<string, string> = {
  STABLE: 'bg-green-100 text-green-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const TaskStatusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  DONE: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export interface DashboardStats {
  projects: {
    total: number;
    warning: number;
    critical: number;
  };
  tasks: {
    total: number;
    inProgress: number;
    done: number;
  };
  users: {
    total: number;
    active: number;
  };
  files: {
    total: number;
    totalSize: number;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface MyTaskItem {
  id: string;
  title: string;
  projectCode: string;
  projectName: string;
  status: string;
  priority: string;
  deadline: string | null;
}

export interface MyTasksResponse {
  overdue: number;
  dueToday: number;
  tasks: MyTaskItem[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (limit?: number): Promise<RecentActivity[]> => {
    const response = await api.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data;
  },

  getMyTasks: async (): Promise<MyTasksResponse> => {
    const response = await api.get('/dashboard/my-tasks');
    return response.data;
  },
};
