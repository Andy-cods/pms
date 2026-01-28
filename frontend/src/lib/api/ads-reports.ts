import { api } from './index';

export type AdsReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type AdsPlatform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK' | 'OTHER';
export type AdsReportSource = 'MANUAL' | 'ZAPIER';

export const AdsPlatformLabels: Record<AdsPlatform, string> = {
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  OTHER: 'Khác',
};

export const AdsReportPeriodLabels: Record<AdsReportPeriod, string> = {
  DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
};

export interface AdsReport {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface AdsReportSummary {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalConversions: number;
  avgRoas: number;
  totalAdSpend: number;
}

export interface CreateAdsReportInput {
  period: AdsReportPeriod;
  reportDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: AdsPlatform;
  campaignName?: string;
}

export interface AdsReportQuery {
  platform?: AdsPlatform;
  period?: AdsReportPeriod;
  startDate?: string;
  endDate?: string;
}

export const adsReportsApi = {
  list: async (projectId: string, query?: AdsReportQuery): Promise<AdsReport[]> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports`, { params: query });
    return data;
  },
  summary: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportSummary> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/summary`, { params: query });
    return data;
  },
  create: async (projectId: string, input: CreateAdsReportInput): Promise<AdsReport> => {
    const { data } = await api.post(`/projects/${projectId}/ads-reports`, input);
    return data;
  },
};
