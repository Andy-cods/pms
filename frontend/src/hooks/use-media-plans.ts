import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mediaPlansApi,
  type MediaPlan,
  type MediaPlanListResponse,
  type MediaPlanListParams,
  type CreateMediaPlanInput,
  type UpdateMediaPlanInput,
  type CreateMediaPlanItemInput,
  type UpdateMediaPlanItemInput,
  type ReorderMediaPlanItemsInput,
} from '@/lib/api/media-plans';

// Query Keys
export const mediaPlanKeys = {
  all: ['media-plans'] as const,
  lists: () => [...mediaPlanKeys.all, 'list'] as const,
  list: (projectId: string, params?: MediaPlanListParams) =>
    [...mediaPlanKeys.lists(), projectId, params] as const,
  details: () => [...mediaPlanKeys.all, 'detail'] as const,
  detail: (projectId: string, planId: string) =>
    [...mediaPlanKeys.details(), projectId, planId] as const,
};

// List media plans
export function useMediaPlans(projectId: string, params?: MediaPlanListParams) {
  return useQuery<MediaPlanListResponse>({
    queryKey: mediaPlanKeys.list(projectId, params),
    queryFn: () => mediaPlansApi.list(projectId, params),
    enabled: !!projectId,
  });
}

// Get single media plan
export function useMediaPlan(projectId: string, planId: string) {
  return useQuery<MediaPlan>({
    queryKey: mediaPlanKeys.detail(projectId, planId),
    queryFn: () => mediaPlansApi.getById(projectId, planId),
    enabled: !!projectId && !!planId,
  });
}

// Create media plan
export function useCreateMediaPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: CreateMediaPlanInput;
    }) => mediaPlansApi.create(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.list(variables.projectId),
      });
    },
  });
}

// Update media plan
export function useUpdateMediaPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      input,
    }: {
      projectId: string;
      planId: string;
      input: UpdateMediaPlanInput;
    }) => mediaPlansApi.update(projectId, planId, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
      queryClient.setQueryData(
        mediaPlanKeys.detail(variables.projectId, variables.planId),
        data,
      );
    },
  });
}

// Delete media plan
export function useDeleteMediaPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
    }: {
      projectId: string;
      planId: string;
    }) => mediaPlansApi.delete(projectId, planId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
      queryClient.removeQueries({
        queryKey: mediaPlanKeys.detail(variables.projectId, variables.planId),
      });
    },
  });
}

// Add item to media plan
export function useAddMediaPlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      input,
    }: {
      projectId: string;
      planId: string;
      input: CreateMediaPlanItemInput;
    }) => mediaPlansApi.addItem(projectId, planId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        mediaPlanKeys.detail(variables.projectId, variables.planId),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
    },
  });
}

// Update item
export function useUpdateMediaPlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
      input,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
      input: UpdateMediaPlanItemInput;
    }) => mediaPlansApi.updateItem(projectId, planId, itemId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        mediaPlanKeys.detail(variables.projectId, variables.planId),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
    },
  });
}

// Delete item
export function useDeleteMediaPlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
    }) => mediaPlansApi.deleteItem(projectId, planId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.detail(variables.projectId, variables.planId),
      });
      queryClient.invalidateQueries({
        queryKey: mediaPlanKeys.lists(),
      });
    },
  });
}

// Reorder items
export function useReorderMediaPlanItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      input,
    }: {
      projectId: string;
      planId: string;
      input: ReorderMediaPlanItemsInput;
    }) => mediaPlansApi.reorderItems(projectId, planId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        mediaPlanKeys.detail(variables.projectId, variables.planId),
        data,
      );
    },
  });
}
