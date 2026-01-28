import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPipelineApi, type PipelineListParams } from '@/lib/api/sales-pipeline';

export const pipelineKeys = {
  all: ['sales-pipeline'] as const,
  lists: () => [...pipelineKeys.all, 'list'] as const,
  list: (params: PipelineListParams) => [...pipelineKeys.lists(), params] as const,
  details: () => [...pipelineKeys.all, 'detail'] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
};

export function usePipelines(params?: PipelineListParams) {
  return useQuery({
    queryKey: pipelineKeys.list(params ?? {}),
    queryFn: () => salesPipelineApi.list(params),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(id),
    queryFn: () => salesPipelineApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => salesPipelineApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
}

export function useUpdatePipelineSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      salesPipelineApi.updateSaleFields(id, input),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.lists() });
      qc.setQueryData(pipelineKeys.detail(vars.id), data);
    },
  });
}

export function useEvaluatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      salesPipelineApi.evaluate(id, input),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.lists() });
      qc.setQueryData(pipelineKeys.detail(vars.id), data);
    },
  });
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      salesPipelineApi.updateStage(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
}

export function useAddWeeklyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      salesPipelineApi.addWeeklyNote(id, note),
    onSuccess: (data, vars) => {
      qc.setQueryData(pipelineKeys.detail(vars.id), data);
    },
  });
}

export function useDecidePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: string; note?: string }) =>
      salesPipelineApi.decide(id, decision, note),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.lists() });
      qc.setQueryData(pipelineKeys.detail(vars.id), data);
    },
  });
}
