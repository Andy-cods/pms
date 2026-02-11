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
  type UpdateSaleFieldsInput,
  type EvaluateProjectInput,
  type UpdateBudgetInput,
  type StageHistoryEntry,
} from '@/lib/api/projects';
import type { ProjectLifecycle } from '@/types';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  team: (id: string) => [...projectKeys.detail(id), 'team'] as const,
  stageHistory: (id: string) => [...projectKeys.detail(id), 'stage-history'] as const,
  budget: (id: string) => [...projectKeys.detail(id), 'budget'] as const,
};

// ─── Queries ─────────────────────────────────────────

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

// Get stage history
export function useProjectStageHistory(projectId: string) {
  return useQuery<StageHistoryEntry[]>({
    queryKey: projectKeys.stageHistory(projectId),
    queryFn: () => projectsApi.getStageHistory(projectId),
    enabled: !!projectId,
  });
}

// Get project budget
export function useProjectBudget(projectId: string) {
  return useQuery<Project>({
    queryKey: projectKeys.budget(projectId),
    queryFn: () => projectsApi.getBudget(projectId),
    enabled: !!projectId,
  });
}

// ─── Mutations ───────────────────────────────────────

// Create project (NVKD creates deal)
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Update project (general)
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

// Archive project
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Update sale fields (NVKD)
export function useUpdateProjectSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSaleFieldsInput }) =>
      projectsApi.updateSaleFields(id, input),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Evaluate project (PM/Planner)
export function useEvaluateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EvaluateProjectInput }) =>
      projectsApi.evaluate(id, input),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Update lifecycle stage
export function useUpdateProjectLifecycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, lifecycle, reason }: { id: string; lifecycle: ProjectLifecycle; reason?: string }) =>
      projectsApi.updateLifecycle(id, lifecycle, reason),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.stageHistory(vars.id) });
    },
  });
}

// Add weekly note
export function useAddWeeklyNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      projectsApi.addWeeklyNote(id, note),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Update weekly note
export function useUpdateWeeklyNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, weekIndex, note }: { id: string; weekIndex: number; note: string }) =>
      projectsApi.updateWeeklyNote(id, weekIndex, note),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Delete weekly note
export function useDeleteWeeklyNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, weekIndex }: { id: string; weekIndex: number }) =>
      projectsApi.deleteWeeklyNote(id, weekIndex),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Decide (Accept/Decline deal)
export function useDecideProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: string; note?: string }) =>
      projectsApi.decide(id, decision, note),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(vars.id), data);
    },
  });
}

// Update budget
export function useUpdateProjectBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateBudgetInput }) =>
      projectsApi.updateBudget(projectId, input),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.budget(vars.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}

// ─── Team Mutations ──────────────────────────────────

// Add team member
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

// Update team member
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

// Remove team member
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
