import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approvalsApi,
  type Approval,
  type ApprovalListParams,
  type ApprovalListResponse,
  type ApprovalStats,
  type CreateApprovalInput,
  type UpdateApprovalInput,
  type ApproveApprovalInput,
  type RejectApprovalInput,
  type RequestChangesInput,
} from '@/lib/api/approvals';

// Query Keys
export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (params: ApprovalListParams) => [...approvalKeys.lists(), params] as const,
  pending: () => [...approvalKeys.all, 'pending'] as const,
  stats: () => [...approvalKeys.all, 'stats'] as const,
  details: () => [...approvalKeys.all, 'detail'] as const,
  detail: (id: string) => [...approvalKeys.details(), id] as const,
};

// List approvals
export function useApprovals(params?: ApprovalListParams) {
  return useQuery<ApprovalListResponse>({
    queryKey: approvalKeys.list(params ?? {}),
    queryFn: () => approvalsApi.list(params),
  });
}

// Get pending approvals (for approvers)
export function usePendingApprovals() {
  return useQuery<Approval[]>({
    queryKey: approvalKeys.pending(),
    queryFn: () => approvalsApi.getPending(),
  });
}

// Get approval stats
export function useApprovalStats() {
  return useQuery<ApprovalStats>({
    queryKey: approvalKeys.stats(),
    queryFn: () => approvalsApi.getStats(),
  });
}

// Get single approval with history
export function useApproval(id: string) {
  return useQuery<Approval>({
    queryKey: approvalKeys.detail(id),
    queryFn: () => approvalsApi.getById(id),
    enabled: !!id,
  });
}

// Submit for approval mutation
export function useSubmitApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApprovalInput) => approvalsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.stats() });
    },
  });
}

// Update/resubmit approval mutation
export function useUpdateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateApprovalInput }) =>
      approvalsApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.stats() });
      queryClient.setQueryData(approvalKeys.detail(variables.id), data);
    },
  });
}

// Approve mutation
export function useApproveApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: ApproveApprovalInput }) =>
      approvalsApi.approve(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.stats() });
      queryClient.setQueryData(approvalKeys.detail(variables.id), data);
    },
  });
}

// Reject mutation
export function useRejectApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectApprovalInput }) =>
      approvalsApi.reject(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.stats() });
      queryClient.setQueryData(approvalKeys.detail(variables.id), data);
    },
  });
}

// Request changes mutation
export function useRequestChangesApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RequestChangesInput }) =>
      approvalsApi.requestChanges(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.stats() });
      queryClient.setQueryData(approvalKeys.detail(variables.id), data);
    },
  });
}
