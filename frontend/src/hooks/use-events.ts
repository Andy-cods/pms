'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eventsApi,
  type EventListParams,
  type CreateEventInput,
  type UpdateEventInput,
  type RespondToEventInput,
} from '@/lib/api/events';

// Query key factory
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: EventListParams) => [...eventKeys.lists(), params] as const,
  deadlines: (params: EventListParams) => [...eventKeys.all, 'deadlines', params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Hooks
export function useEvents(params: EventListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventsApi.list(params),
    enabled: options?.enabled !== false,
  });
}

export function useDeadlines(params: EventListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.deadlines(params),
    queryFn: () => eventsApi.getDeadlines(params),
    enabled: options?.enabled !== false,
  });
}

export function useEvent(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: options?.enabled !== false && !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => eventsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      eventsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useRespondToEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RespondToEventInput }) =>
      eventsApi.respond(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
    },
  });
}
