import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { AdsReportSource, AdsReportConversion } from '@prisma/client';
import {
  CreateAdsReportConversionDto,
  AdsReportQueryDto,
  AdsReportConversionResponse,
  AdsReportConversionSummary,
} from '../../application/dto/ads-report.dto.js';

type AdsReportConversionWithCreator = AdsReportConversion & {
  createdBy: { id: string; name: string };
};

@Injectable()
export class AdsReportConversionService {
  constructor(private prisma: PrismaService) {}

  async list(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportConversionResponse[]> {
    const where: Record<string, unknown> = { projectId };
    if (query.platform) where.platform = query.platform;
    if (query.period) where.period = query.period;
    if (query.startDate || query.endDate) {
      const reportDate: Record<string, Date> = {};
      if (query.startDate) reportDate.gte = new Date(query.startDate);
      if (query.endDate) reportDate.lte = new Date(query.endDate);
      where.reportDate = reportDate;
    }

    const reports = await this.prisma.adsReportConversion.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return reports.map((r) => this.map(r));
  }

  async summary(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportConversionSummary> {
    const reports = await this.list(projectId, query);
    if (reports.length === 0) {
      return {
        totalImpressions: 0,
        totalReach: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgCpc: 0,
        totalAdSpend: 0,
        totalConversions: 0,
        avgCpa: 0,
        avgConversionRate: 0,
        totalRevenue: 0,
        avgRoas: 0,
        avgAov: 0,
      };
    }

    const totalImpressions = reports.reduce((s, r) => s + r.impressions, 0);
    const totalReach = reports.reduce((s, r) => s + r.reach, 0);
    const totalClicks = reports.reduce((s, r) => s + r.clicks, 0);
    const totalAdSpend = reports.reduce((s, r) => s + r.adSpend, 0);
    const totalConversions = reports.reduce((s, r) => s + r.conversions, 0);
    const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);

    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const avgCpa =
      totalConversions > 0 ? totalAdSpend / totalConversions : 0;
    const avgConversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const avgAov = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    return {
      totalImpressions,
      totalReach,
      totalClicks,
      avgCtr: +avgCtr.toFixed(2),
      avgCpc: +avgCpc.toFixed(2),
      totalAdSpend,
      totalConversions,
      avgCpa: +avgCpa.toFixed(2),
      avgConversionRate: +avgConversionRate.toFixed(2),
      totalRevenue,
      avgRoas: +avgRoas.toFixed(2),
      avgAov: +avgAov.toFixed(2),
    };
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateAdsReportConversionDto,
    source: string = 'MANUAL',
  ): Promise<AdsReportConversionResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const created = await this.prisma.adsReportConversion.create({
      data: {
        projectId,
        period: dto.period,
        reportDate: new Date(dto.reportDate),
        platform: dto.platform,
        campaignName: dto.campaignName,
        source: source as AdsReportSource,
        createdById: userId,
        // Common
        impressions: dto.impressions,
        reach: dto.reach,
        clicks: dto.clicks,
        videoViews: dto.videoViews,
        postComments: dto.postComments,
        engagement: dto.engagement,
        ctr: dto.ctr,
        cpm: dto.cpm,
        cpc: dto.cpc,
        adSpend: dto.adSpend,
        // Conversion-specific
        conversions: dto.conversions,
        cpa: dto.cpa,
        conversionRate: dto.conversionRate,
        revenue: dto.revenue,
        roas: dto.roas,
        aov: dto.aov,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return this.map(created);
  }

  private map(
    report: AdsReportConversionWithCreator,
  ): AdsReportConversionResponse {
    return {
      id: report.id,
      projectId: report.projectId,
      period: report.period,
      reportDate: report.reportDate,
      platform: report.platform,
      campaignName: report.campaignName,
      source: report.source,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      // Common
      impressions: report.impressions,
      reach: report.reach,
      clicks: report.clicks,
      videoViews: report.videoViews,
      postComments: report.postComments,
      engagement: report.engagement,
      ctr: report.ctr,
      cpm: Number(report.cpm),
      cpc: Number(report.cpc),
      adSpend: Number(report.adSpend),
      // Conversion-specific
      conversions: report.conversions,
      cpa: Number(report.cpa),
      conversionRate: report.conversionRate,
      revenue: Number(report.revenue),
      roas: report.roas,
      aov: Number(report.aov),
    };
  }
}
