import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  type DashboardStats,
  type RecentActivity,
  type MyTasksResponse,
} from '@/lib/api/dashboard';

export interface ProjectDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TaskTrend {
  date: string;
  completed: number;
  created: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
  });
}

export function useProjectDistribution() {
  return useQuery<ProjectDistribution[]>({
    queryKey: ['dashboard', 'project-distribution'],
    queryFn: async () => {
      // Stub implementation - returns empty array
      return [];
    },
  });
}

export function useTaskTrend(days: number = 7) {
  return useQuery<TaskTrend[]>({
    queryKey: ['dashboard', 'task-trend', days],
    queryFn: async () => {
      // Stub implementation - returns empty array
      return [];
    },
  });
}

export function useRecentActivities(limit: number = 10) {
  return useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: () => dashboardApi.getRecentActivity(limit),
  });
}

export function useDashboardMyTasks() {
  return useQuery<MyTasksResponse>({
    queryKey: ['dashboard', 'my-tasks'],
    queryFn: () => dashboardApi.getMyTasks(),
  });
}
