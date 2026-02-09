import { IsNumber, IsOptional, IsString, IsIn, IsDateString, Min } from 'class-validator';

export const AdsReportPeriods = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type AdsReportPeriod = (typeof AdsReportPeriods)[number];

export const AdsPlatforms = ['FACEBOOK', 'GOOGLE', 'TIKTOK', 'OTHER'] as const;
export type AdsPlatform = (typeof AdsPlatforms)[number];

export const AdsReportSources = ['MANUAL', 'ZAPIER'] as const;
export type AdsReportSource = (typeof AdsReportSources)[number];

export class CreateAdsReportDto {
  @IsIn(AdsReportPeriods)
  period!: AdsReportPeriod;

  @IsDateString()
  reportDate!: string;

  @IsNumber()
  @Min(0)
  impressions!: number;

  @IsNumber()
  @Min(0)
  clicks!: number;

  @IsNumber()
  @Min(0)
  ctr!: number;

  @IsNumber()
  @Min(0)
  cpc!: number;

  @IsNumber()
  @Min(0)
  cpm!: number;

  @IsNumber()
  @Min(0)
  cpa!: number;

  @IsNumber()
  @Min(0)
  conversions!: number;

  @IsNumber()
  @Min(0)
  roas!: number;

  @IsNumber()
  @Min(0)
  adSpend!: number;

  @IsIn(AdsPlatforms)
  platform!: AdsPlatform;

  @IsOptional()
  @IsString()
  campaignName?: string;
}

export class AdsReportQueryDto {
  @IsOptional()
  @IsIn(AdsPlatforms)
  platform?: AdsPlatform;

  @IsOptional()
  @IsIn(AdsReportPeriods)
  period?: AdsReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface AdsReportResponse {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: Date;
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
  createdAt: Date;
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

// ============================================
// ADS REPORT TEMPLATE TYPES
// ============================================

export type AdsReportTemplate = 'message' | 'lead' | 'conversion';

export const AdsReportTemplateLabels: Record<AdsReportTemplate, string> = {
  message: 'Tin nhắn (Messenger/Zalo)',
  lead: 'Thu thập Lead',
  conversion: 'Chuyển đổi (Mua hàng)',
};

// ============================================
// BASE DTO (shared fields)
// ============================================

export class AdsReportBaseDto {
  @IsIn(AdsReportPeriods)
  period!: AdsReportPeriod;

  @IsDateString()
  reportDate!: string;

  @IsIn(AdsPlatforms)
  platform!: AdsPlatform;

  @IsOptional()
  @IsString()
  campaignName?: string;

  // Common metrics
  @IsNumber() @Min(0) impressions!: number;
  @IsNumber() @Min(0) reach!: number;
  @IsNumber() @Min(0) clicks!: number;
  @IsNumber() @Min(0) videoViews!: number;
  @IsNumber() @Min(0) postComments!: number;
  @IsNumber() @Min(0) engagement!: number;
  @IsNumber() @Min(0) ctr!: number;
  @IsNumber() @Min(0) cpm!: number;
  @IsNumber() @Min(0) cpc!: number;
  @IsNumber() @Min(0) adSpend!: number;
}

// ============================================
// MESSAGE TEMPLATE DTOs
// ============================================

export class CreateAdsReportMessageDto extends AdsReportBaseDto {
  @IsNumber() @Min(0) welcomeMessageViews!: number;
  @IsNumber() @Min(0) messagingConversationsStarted!: number;
  @IsNumber() @Min(0) costPerMessagingConversation!: number;
  @IsNumber() @Min(0) messagingConversationsReplied!: number;
  @IsNumber() @Min(0) inboxConversions!: number;
  @IsNumber() @Min(0) qualifiedRate!: number;
}

export interface AdsReportMessageResponse {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: Date;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: Date;
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

// ============================================
// LEAD TEMPLATE DTOs
// ============================================

export class CreateAdsReportLeadDto extends AdsReportBaseDto {
  @IsNumber() @Min(0) leads!: number;
  @IsNumber() @Min(0) costPerLead!: number;
  @IsNumber() @Min(0) validLeads!: number;
  @IsNumber() @Min(0) invalidLeads!: number;
  @IsNumber() @Min(0) qualifiedLeadRate!: number;
}

export interface AdsReportLeadResponse {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: Date;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: Date;
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

// ============================================
// CONVERSION TEMPLATE DTOs
// ============================================

export class CreateAdsReportConversionDto extends AdsReportBaseDto {
  @IsNumber() @Min(0) conversions!: number;
  @IsNumber() @Min(0) cpa!: number;
  @IsNumber() @Min(0) conversionRate!: number;
  @IsNumber() @Min(0) revenue!: number;
  @IsNumber() @Min(0) roas!: number;
  @IsNumber() @Min(0) aov!: number;
}

export interface AdsReportConversionResponse {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: Date;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: Date;
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
