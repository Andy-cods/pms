'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adsReportsApi,
  type AdsReport,
  type AdsReportSummary,
  type CreateAdsReportInput,
  type AdsReportQuery,
} from '@/lib/api/ads-reports';

export function useAdsReports(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReport[]>({
    queryKey: ['ads-reports', projectId, query],
    queryFn: () => adsReportsApi.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useAdsReportSummary(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportSummary>({
    queryKey: ['ads-report-summary', projectId, query],
    queryFn: () => adsReportsApi.summary(projectId, query),
    enabled: !!projectId,
  });
}

export function useCreateAdsReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdsReportInput) => adsReportsApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-reports', projectId] });
      qc.invalidateQueries({ queryKey: ['ads-report-summary', projectId] });
    },
  });
}
