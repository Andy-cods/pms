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

// ============================================
// TEMPLATE TYPES
// ============================================

export type AdsReportTemplate = 'message' | 'lead' | 'conversion';

export const AdsReportTemplateLabels: Record<AdsReportTemplate, string> = {
  message: 'Tin nhắn',
  lead: 'Lead',
  conversion: 'Chuyển đổi',
};

// ============================================
// MESSAGE TEMPLATE
// ============================================

export interface AdsReportMessage {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Message-specific
  welcomeMessageViews: number;
  messagingConversationsStarted: number;
  costPerMessagingConversation: number;
  messagingConversationsReplied: number;
  inboxConversions: number;
  qualifiedRate: number;
}

export interface AdsReportMessageSummary {
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalAdSpend: number;
  totalMessagingConversations: number;
  totalInboxConversions: number;
  avgQualifiedRate: number;
  avgCostPerConversation: number;
}

export interface CreateAdsReportMessageInput {
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Message-specific
  welcomeMessageViews: number;
  messagingConversationsStarted: number;
  costPerMessagingConversation: number;
  messagingConversationsReplied: number;
  inboxConversions: number;
  qualifiedRate: number;
}

export const adsReportMessageApi = {
  list: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportMessage[]> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/message`, { params: query });
    return data;
  },
  summary: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportMessageSummary> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/message/summary`, { params: query });
    return data;
  },
  create: async (projectId: string, input: CreateAdsReportMessageInput): Promise<AdsReportMessage> => {
    const { data } = await api.post(`/projects/${projectId}/ads-reports/message`, input);
    return data;
  },
};

// ============================================
// LEAD TEMPLATE
// ============================================

export interface AdsReportLead {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Lead-specific
  leads: number;
  costPerLead: number;
  validLeads: number;
  invalidLeads: number;
  qualifiedLeadRate: number;
}

export interface AdsReportLeadSummary {
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalAdSpend: number;
  totalLeads: number;
  totalValidLeads: number;
  totalInvalidLeads: number;
  avgCostPerLead: number;
  avgQualifiedLeadRate: number;
}

export interface CreateAdsReportLeadInput {
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Lead-specific
  leads: number;
  costPerLead: number;
  validLeads: number;
  invalidLeads: number;
  qualifiedLeadRate: number;
}

export const adsReportLeadApi = {
  list: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportLead[]> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/lead`, { params: query });
    return data;
  },
  summary: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportLeadSummary> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/lead/summary`, { params: query });
    return data;
  },
  create: async (projectId: string, input: CreateAdsReportLeadInput): Promise<AdsReportLead> => {
    const { data } = await api.post(`/projects/${projectId}/ads-reports/lead`, input);
    return data;
  },
};

// ============================================
// CONVERSION TEMPLATE
// ============================================

export interface AdsReportConversion {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Conversion-specific
  conversions: number;
  cpa: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  aov: number;
}

export interface AdsReportConversionSummary {
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalAdSpend: number;
  totalConversions: number;
  avgCpa: number;
  avgConversionRate: number;
  totalRevenue: number;
  avgRoas: number;
  avgAov: number;
}

export interface CreateAdsReportConversionInput {
  period: AdsReportPeriod;
  reportDate: string;
  platform: AdsPlatform;
  campaignName?: string;
  // Common
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  postComments: number;
  engagement: number;
  ctr: number;
  cpm: number;
  cpc: number;
  adSpend: number;
  // Conversion-specific
  conversions: number;
  cpa: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  aov: number;
}

export const adsReportConversionApi = {
  list: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportConversion[]> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/conversion`, { params: query });
    return data;
  },
  summary: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportConversionSummary> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/conversion/summary`, { params: query });
    return data;
  },
  create: async (projectId: string, input: CreateAdsReportConversionInput): Promise<AdsReportConversion> => {
    const { data } = await api.post(`/projects/${projectId}/ads-reports/conversion`, input);
    return data;
  },
};

// ============================================
// FIELD LABELS (Vietnamese)
// ============================================

export const FieldLabels = {
  // Common
  impressions: 'Impressions',
  reach: 'Reach',
  clicks: 'Clicks',
  videoViews: 'Lượt xem video',
  postComments: 'Bình luận',
  engagement: 'Tương tác',
  ctr: 'CTR (%)',
  cpm: 'CPM (đ)',
  cpc: 'CPC (đ)',
  adSpend: 'Chi tiêu (đ)',
  // MESSAGE
  welcomeMessageViews: 'Lượt xem tin chào mừng',
  messagingConversationsStarted: 'Hội thoại bắt đầu',
  costPerMessagingConversation: 'Chi phí/hội thoại (đ)',
  messagingConversationsReplied: 'Hội thoại đã trả lời',
  inboxConversions: 'Chuyển đổi inbox',
  qualifiedRate: 'Tỷ lệ qualified (%)',
  // LEAD
  leads: 'Leads',
  costPerLead: 'CPL (đ)',
  validLeads: 'Lead hợp lệ',
  invalidLeads: 'Lead không hợp lệ',
  qualifiedLeadRate: 'Tỷ lệ lead qualified (%)',
  // CONVERSION
  conversions: 'Conversions',
  cpa: 'CPA (đ)',
  conversionRate: 'Tỷ lệ chuyển đổi (%)',
  revenue: 'Doanh thu (đ)',
  roas: 'ROAS',
  aov: 'AOV (đ)',
};
