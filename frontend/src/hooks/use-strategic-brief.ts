import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategicBriefApi } from '@/lib/api/strategic-brief';

export const briefKeys = {
  all: ['strategic-briefs'] as const,
  detail: (id: string) => [...briefKeys.all, id] as const,
  byProject: (projectId: string) => [...briefKeys.all, 'project', projectId] as const,
};

export function useBrief(id: string) {
  return useQuery({
    queryKey: briefKeys.detail(id),
    queryFn: () => strategicBriefApi.getById(id),
    enabled: !!id,
  });
}

export function useBriefByProject(projectId: string) {
  return useQuery({
    queryKey: briefKeys.byProject(projectId),
    queryFn: () => strategicBriefApi.getByProject(projectId),
    enabled: !!projectId,
    retry: false,
  });
}

export function useCreateBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string }) =>
      strategicBriefApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: briefKeys.all });
    },
  });
}

export function useUpdateBriefSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      briefId,
      sectionNum,
      payload,
    }: {
      briefId: string;
      sectionNum: number;
      payload: { data?: Record<string, unknown>; isComplete?: boolean };
    }) => strategicBriefApi.updateSection(briefId, sectionNum, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: briefKeys.detail(vars.briefId) });
    },
  });
}

export function useSubmitBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategicBriefApi.submit(id),
    onSuccess: (data) => {
      qc.setQueryData(briefKeys.detail(data.id), data);
    },
  });
}

export function useApproveBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategicBriefApi.approve(id),
    onSuccess: (data) => {
      qc.setQueryData(briefKeys.detail(data.id), data);
    },
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      strategicBriefApi.requestRevision(id, comment),
    onSuccess: (data) => {
      qc.setQueryData(briefKeys.detail(data.id), data);
    },
  });
}
