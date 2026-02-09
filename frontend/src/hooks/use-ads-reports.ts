'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adsReportsApi,
  adsReportMessageApi,
  adsReportLeadApi,
  adsReportConversionApi,
  type AdsReport,
  type AdsReportSummary,
  type CreateAdsReportInput,
  type AdsReportQuery,
  type AdsReportMessage,
  type AdsReportMessageSummary,
  type CreateAdsReportMessageInput,
  type AdsReportLead,
  type AdsReportLeadSummary,
  type CreateAdsReportLeadInput,
  type AdsReportConversion,
  type AdsReportConversionSummary,
  type CreateAdsReportConversionInput,
} from '@/lib/api/ads-reports';

// ============================================
// GENERIC ADS REPORTS (legacy)
// ============================================

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

// ============================================
// MESSAGE TEMPLATE
// ============================================

export function useAdsReportMessage(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportMessage[]>({
    queryKey: ['ads-reports-message', projectId, query],
    queryFn: () => adsReportMessageApi.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useAdsReportMessageSummary(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportMessageSummary>({
    queryKey: ['ads-reports-message-summary', projectId, query],
    queryFn: () => adsReportMessageApi.summary(projectId, query),
    enabled: !!projectId,
  });
}

export function useCreateAdsReportMessage(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdsReportMessageInput) => adsReportMessageApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-reports-message', projectId] });
      qc.invalidateQueries({ queryKey: ['ads-reports-message-summary', projectId] });
    },
  });
}

// ============================================
// LEAD TEMPLATE
// ============================================

export function useAdsReportLead(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportLead[]>({
    queryKey: ['ads-reports-lead', projectId, query],
    queryFn: () => adsReportLeadApi.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useAdsReportLeadSummary(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportLeadSummary>({
    queryKey: ['ads-reports-lead-summary', projectId, query],
    queryFn: () => adsReportLeadApi.summary(projectId, query),
    enabled: !!projectId,
  });
}

export function useCreateAdsReportLead(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdsReportLeadInput) => adsReportLeadApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-reports-lead', projectId] });
      qc.invalidateQueries({ queryKey: ['ads-reports-lead-summary', projectId] });
    },
  });
}

// ============================================
// CONVERSION TEMPLATE
// ============================================

export function useAdsReportConversion(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportConversion[]>({
    queryKey: ['ads-reports-conversion', projectId, query],
    queryFn: () => adsReportConversionApi.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useAdsReportConversionSummary(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportConversionSummary>({
    queryKey: ['ads-reports-conversion-summary', projectId, query],
    queryFn: () => adsReportConversionApi.summary(projectId, query),
    enabled: !!projectId,
  });
}

export function useCreateAdsReportConversion(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdsReportConversionInput) => adsReportConversionApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-reports-conversion', projectId] });
      qc.invalidateQueries({ queryKey: ['ads-reports-conversion-summary', projectId] });
    },
  });
}
