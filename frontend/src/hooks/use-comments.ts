'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  commentsApi,
  type CommentListParams,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@/lib/api/comments';

// Query key factory
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (params: CommentListParams) => [...commentKeys.lists(), params] as const,
};

// Hooks
export function useComments(params: CommentListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: () => commentsApi.list(params),
    enabled: options?.enabled !== false && (!!params.projectId || !!params.taskId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsApi.create(input),
    onSuccess: (_, variables) => {
      // Invalidate the relevant comment list
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.list({ projectId: variables.projectId }),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.list({ taskId: variables.taskId }),
        });
      }
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCommentInput }) =>
      commentsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
}
