import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { AdsReportSource, AdsReportLead } from '@prisma/client';
import {
  CreateAdsReportLeadDto,
  AdsReportQueryDto,
  AdsReportLeadResponse,
  AdsReportLeadSummary,
} from '../../application/dto/ads-report.dto.js';

type AdsReportLeadWithCreator = AdsReportLead & {
  createdBy: { id: string; name: string };
};

@Injectable()
export class AdsReportLeadService {
  constructor(private prisma: PrismaService) {}

  async list(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportLeadResponse[]> {
    const where: Record<string, unknown> = { projectId };
    if (query.platform) where.platform = query.platform;
    if (query.period) where.period = query.period;
    if (query.startDate || query.endDate) {
      const reportDate: Record<string, Date> = {};
      if (query.startDate) reportDate.gte = new Date(query.startDate);
      if (query.endDate) reportDate.lte = new Date(query.endDate);
      where.reportDate = reportDate;
    }

    const reports = await this.prisma.adsReportLead.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return reports.map((r) => this.map(r));
  }

  async summary(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportLeadSummary> {
    const reports = await this.list(projectId, query);
    if (reports.length === 0) {
      return {
        totalImpressions: 0,
        totalReach: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgCpc: 0,
        totalAdSpend: 0,
        totalLeads: 0,
        totalValidLeads: 0,
        totalInvalidLeads: 0,
        avgCostPerLead: 0,
        avgQualifiedLeadRate: 0,
      };
    }

    const totalImpressions = reports.reduce((s, r) => s + r.impressions, 0);
    const totalReach = reports.reduce((s, r) => s + r.reach, 0);
    const totalClicks = reports.reduce((s, r) => s + r.clicks, 0);
    const totalAdSpend = reports.reduce((s, r) => s + r.adSpend, 0);
    const totalLeads = reports.reduce((s, r) => s + r.leads, 0);
    const totalValidLeads = reports.reduce((s, r) => s + r.validLeads, 0);
    const totalInvalidLeads = reports.reduce((s, r) => s + r.invalidLeads, 0);

    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const avgCostPerLead = totalLeads > 0 ? totalAdSpend / totalLeads : 0;
    const avgQualifiedLeadRate =
      reports.reduce((s, r) => s + r.qualifiedLeadRate, 0) / reports.length;

    return {
      totalImpressions,
      totalReach,
      totalClicks,
      avgCtr: +avgCtr.toFixed(2),
      avgCpc: +avgCpc.toFixed(2),
      totalAdSpend,
      totalLeads,
      totalValidLeads,
      totalInvalidLeads,
      avgCostPerLead: +avgCostPerLead.toFixed(2),
      avgQualifiedLeadRate: +avgQualifiedLeadRate.toFixed(2),
    };
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateAdsReportLeadDto,
    source: string = 'MANUAL',
  ): Promise<AdsReportLeadResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const created = await this.prisma.adsReportLead.create({
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
        // Lead-specific
        leads: dto.leads,
        costPerLead: dto.costPerLead,
        validLeads: dto.validLeads,
        invalidLeads: dto.invalidLeads,
        qualifiedLeadRate: dto.qualifiedLeadRate,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return this.map(created);
  }

  private map(report: AdsReportLeadWithCreator): AdsReportLeadResponse {
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
      // Lead-specific
      leads: report.leads,
      costPerLead: Number(report.costPerLead),
      validLeads: report.validLeads,
      invalidLeads: report.invalidLeads,
      qualifiedLeadRate: report.qualifiedLeadRate,
    };
  }
}
