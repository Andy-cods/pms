import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
} from '../../application/dto/ads-report.dto.js';

@Injectable()
export class AdsReportService {
  constructor(private prisma: PrismaService) {}

  async list(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportResponse[]> {
    const where: Record<string, unknown> = { projectId };
    if (query.platform) where.platform = query.platform;
    if (query.period) where.period = query.period;
    if (query.startDate || query.endDate) {
      const reportDate: Record<string, Date> = {};
      if (query.startDate) reportDate.gte = new Date(query.startDate);
      if (query.endDate) reportDate.lte = new Date(query.endDate);
      where.reportDate = reportDate;
    }

    const reports = await this.prisma.adsReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return reports.map((r) => this.map(r));
  }

  async summary(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportSummary> {
    const reports = await this.list(projectId, query);
    if (reports.length === 0) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgCpc: 0,
        totalConversions: 0,
        avgRoas: 0,
        totalAdSpend: 0,
      };
    }

    const totalImpressions = reports.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = reports.reduce((s, r) => s + r.clicks, 0);
    const totalConversions = reports.reduce((s, r) => s + r.conversions, 0);
    const totalAdSpend = reports.reduce((s, r) => s + r.adSpend, 0);
    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const avgRoas =
      reports.reduce((s, r) => s + r.roas, 0) / reports.length;

    return {
      totalImpressions,
      totalClicks,
      avgCtr: +avgCtr.toFixed(2),
      avgCpc: +avgCpc.toFixed(2),
      totalConversions,
      avgRoas: +avgRoas.toFixed(2),
      totalAdSpend,
    };
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateAdsReportDto,
    source: string = 'MANUAL',
  ): Promise<AdsReportResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const created = await this.prisma.adsReport.create({
      data: {
        projectId,
        period: dto.period,
        reportDate: new Date(dto.reportDate),
        impressions: dto.impressions,
        clicks: dto.clicks,
        ctr: dto.ctr,
        cpc: dto.cpc,
        cpm: dto.cpm,
        cpa: dto.cpa,
        conversions: dto.conversions,
        roas: dto.roas,
        adSpend: dto.adSpend,
        platform: dto.platform,
        campaignName: dto.campaignName,
        source: source as any,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return this.map(created);
  }

  private map(report: any): AdsReportResponse {
    return {
      id: report.id,
      projectId: report.projectId,
      period: report.period,
      reportDate: report.reportDate,
      impressions: report.impressions,
      clicks: report.clicks,
      ctr: report.ctr,
      cpc: Number(report.cpc),
      cpm: Number(report.cpm),
      cpa: Number(report.cpa),
      conversions: report.conversions,
      roas: report.roas,
      adSpend: Number(report.adSpend),
      platform: report.platform,
      campaignName: report.campaignName,
      source: report.source,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
    };
  }
}
