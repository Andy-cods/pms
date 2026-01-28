'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  budgetEventsApi,
  type BudgetEvent,
  type BudgetEventType,
  type BudgetEventCategory,
  type BudgetEventStatus,
  type CreateBudgetEventInput,
  type BudgetThreshold,
} from '@/lib/api/budget-events';

export function useBudgetEvents(projectId: string, params?: { stage?: string; category?: BudgetEventCategory; status?: BudgetEventStatus }) {
  return useQuery<BudgetEvent[]>({
    queryKey: ['budget-events', projectId, params],
    queryFn: () => budgetEventsApi.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useCreateBudgetEvent(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetEventInput) => budgetEventsApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-events', projectId] });
      qc.invalidateQueries({ queryKey: ['project-budget', projectId] });
      qc.invalidateQueries({ queryKey: ['budget-threshold', projectId] });
    },
  });
}

export function useUpdateBudgetEventStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: BudgetEventStatus }) =>
      budgetEventsApi.updateStatus(projectId, eventId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-events', projectId] });
      qc.invalidateQueries({ queryKey: ['project-budget', projectId] });
      qc.invalidateQueries({ queryKey: ['budget-threshold', projectId] });
    },
  });
}

export function useBudgetThreshold(projectId: string) {
  return useQuery<BudgetThreshold>({
    queryKey: ['budget-threshold', projectId],
    queryFn: () => budgetEventsApi.getThreshold(projectId),
    enabled: !!projectId,
  });
}

export type { BudgetEvent, BudgetEventType, BudgetEventCategory, BudgetEventStatus, CreateBudgetEventInput, BudgetThreshold } from '@/lib/api/budget-events';
