import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectsApi,
  type Project,
  type ProjectListParams,
  type ProjectListResponse,
  type CreateProjectInput,
  type UpdateProjectInput,
  type AddTeamMemberInput,
  type UpdateTeamMemberInput,
  type ProjectTeamMember,
} from '@/lib/api/projects';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  team: (id: string) => [...projectKeys.detail(id), 'team'] as const,
};

// List projects
export function useProjects(params?: ProjectListParams) {
  return useQuery<ProjectListResponse>({
    queryKey: projectKeys.list(params ?? {}),
    queryFn: () => projectsApi.list(params),
  });
}

// Get single project
export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
}

// Get project team
export function useProjectTeam(projectId: string) {
  return useQuery<ProjectTeamMember[]>({
    queryKey: projectKeys.team(projectId),
    queryFn: () => projectsApi.getTeam(projectId),
    enabled: !!projectId,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectsApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(variables.id), data);
    },
  });
}

// Archive project mutation
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Add team member mutation
export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: AddTeamMemberInput;
    }) => projectsApi.addTeamMember(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.team(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

// Update team member mutation
export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      memberId,
      input,
    }: {
      projectId: string;
      memberId: string;
      input: UpdateTeamMemberInput;
    }) => projectsApi.updateTeamMember(projectId, memberId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.team(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

// Remove team member mutation
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      memberId,
    }: {
      projectId: string;
      memberId: string;
    }) => projectsApi.removeTeamMember(projectId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.team(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}
