import { useQuery } from '@tanstack/react-query';
import { clientProjectsApi, type ClientProjectListResponse, type ClientProjectDetail, type ClientFile, type ClientProgress } from '@/lib/api/client-projects';

export function useClientProjects(params?: { status?: string; search?: string }) {
  return useQuery<ClientProjectListResponse>({
    queryKey: ['client-projects', params],
    queryFn: () => clientProjectsApi.list(params),
  });
}

export function useClientProject(id: string) {
  return useQuery<ClientProjectDetail>({
    queryKey: ['client-project', id],
    queryFn: () => clientProjectsApi.getById(id),
    enabled: !!id,
  });
}

export function useClientProjectFiles(id: string) {
  return useQuery<ClientFile[]>({
    queryKey: ['client-project-files', id],
    queryFn: () => clientProjectsApi.getFiles(id),
    enabled: !!id,
  });
}

export function useClientProjectProgress(id: string) {
  return useQuery<ClientProgress>({
    queryKey: ['client-project-progress', id],
    queryFn: () => clientProjectsApi.getProgress(id),
    enabled: !!id,
  });
}
