import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contentPostsApi,
  type ContentPost,
  type ContentPostListResponse,
  type ContentPostListParams,
  type CreateContentPostInput,
  type UpdateContentPostInput,
  type ChangeStatusInput,
  type DuplicatePostInput,
  type ReorderPostsInput,
} from "@/lib/api/content-posts";

// Query Keys
export const contentPostKeys = {
  all: ["content-posts"] as const,
  lists: () => [...contentPostKeys.all, "list"] as const,
  list: (
    projectId: string,
    planId: string,
    itemId: string,
    params?: ContentPostListParams,
  ) => [...contentPostKeys.lists(), projectId, planId, itemId, params] as const,
  details: () => [...contentPostKeys.all, "detail"] as const,
  detail: (projectId: string, planId: string, itemId: string, postId: string) =>
    [...contentPostKeys.details(), projectId, planId, itemId, postId] as const,
};

// List content posts
export function useContentPosts(
  projectId: string,
  planId: string,
  itemId: string,
  params?: ContentPostListParams,
) {
  return useQuery<ContentPostListResponse>({
    queryKey: contentPostKeys.list(projectId, planId, itemId, params),
    queryFn: () => contentPostsApi.list(projectId, planId, itemId, params),
    enabled: !!projectId && !!planId && !!itemId,
  });
}

// Get single content post
export function useContentPost(
  projectId: string,
  planId: string,
  itemId: string,
  postId: string,
) {
  return useQuery<ContentPost>({
    queryKey: contentPostKeys.detail(projectId, planId, itemId, postId),
    queryFn: () => contentPostsApi.getById(projectId, planId, itemId, postId),
    enabled: !!projectId && !!planId && !!itemId && !!postId,
  });
}

// Create content post
export function useCreateContentPost() {
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
      input: CreateContentPostInput;
    }) => contentPostsApi.create(projectId, planId, itemId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.list(
          variables.projectId,
          variables.planId,
          variables.itemId,
        ),
      });
    },
  });
}

// Update content post
export function useUpdateContentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
      postId,
      input,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
      postId: string;
      input: UpdateContentPostInput;
    }) => contentPostsApi.update(projectId, planId, itemId, postId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        contentPostKeys.detail(
          variables.projectId,
          variables.planId,
          variables.itemId,
          variables.postId,
        ),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.list(
          variables.projectId,
          variables.planId,
          variables.itemId,
        ),
      });
    },
  });
}

// Delete content post
export function useDeleteContentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
      postId,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
      postId: string;
    }) => contentPostsApi.delete(projectId, planId, itemId, postId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.list(
          variables.projectId,
          variables.planId,
          variables.itemId,
        ),
      });
      queryClient.removeQueries({
        queryKey: contentPostKeys.detail(
          variables.projectId,
          variables.planId,
          variables.itemId,
          variables.postId,
        ),
      });
    },
  });
}

// Change content post status
export function useChangeContentPostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
      postId,
      input,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
      postId: string;
      input: ChangeStatusInput;
    }) =>
      contentPostsApi.changeStatus(projectId, planId, itemId, postId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        contentPostKeys.detail(
          variables.projectId,
          variables.planId,
          variables.itemId,
          variables.postId,
        ),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.list(
          variables.projectId,
          variables.planId,
          variables.itemId,
        ),
      });
    },
  });
}

// Duplicate content post to another channel
export function useDuplicateContentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      planId,
      itemId,
      postId,
      input,
    }: {
      projectId: string;
      planId: string;
      itemId: string;
      postId: string;
      input: DuplicatePostInput;
    }) => contentPostsApi.duplicate(projectId, planId, itemId, postId, input),
    onSuccess: () => {
      // Invalidate all lists since the duplicate could be in a different item
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.lists(),
      });
    },
  });
}

// Reorder content posts
export function useReorderContentPosts() {
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
      input: ReorderPostsInput;
    }) => contentPostsApi.reorder(projectId, planId, itemId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentPostKeys.list(
          variables.projectId,
          variables.planId,
          variables.itemId,
        ),
      });
    },
  });
}
