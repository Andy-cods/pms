import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { AdsReportSource, AdsReportMessage } from '@prisma/client';
import {
  CreateAdsReportMessageDto,
  AdsReportQueryDto,
  AdsReportMessageResponse,
  AdsReportMessageSummary,
} from '../../application/dto/ads-report.dto.js';

type AdsReportMessageWithCreator = AdsReportMessage & {
  createdBy: { id: string; name: string };
};

@Injectable()
export class AdsReportMessageService {
  constructor(private prisma: PrismaService) {}

  async list(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportMessageResponse[]> {
    const where: Record<string, unknown> = { projectId };
    if (query.platform) where.platform = query.platform;
    if (query.period) where.period = query.period;
    if (query.startDate || query.endDate) {
      const reportDate: Record<string, Date> = {};
      if (query.startDate) reportDate.gte = new Date(query.startDate);
      if (query.endDate) reportDate.lte = new Date(query.endDate);
      where.reportDate = reportDate;
    }

    const reports = await this.prisma.adsReportMessage.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return reports.map((r) => this.map(r));
  }

  async summary(
    projectId: string,
    query: AdsReportQueryDto,
  ): Promise<AdsReportMessageSummary> {
    const reports = await this.list(projectId, query);
    if (reports.length === 0) {
      return {
        totalImpressions: 0,
        totalReach: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgCpc: 0,
        totalAdSpend: 0,
        totalMessagingConversations: 0,
        totalInboxConversions: 0,
        avgQualifiedRate: 0,
        avgCostPerConversation: 0,
      };
    }

    const totalImpressions = reports.reduce((s, r) => s + r.impressions, 0);
    const totalReach = reports.reduce((s, r) => s + r.reach, 0);
    const totalClicks = reports.reduce((s, r) => s + r.clicks, 0);
    const totalAdSpend = reports.reduce((s, r) => s + r.adSpend, 0);
    const totalMessagingConversations = reports.reduce(
      (s, r) => s + r.messagingConversationsStarted,
      0,
    );
    const totalInboxConversions = reports.reduce(
      (s, r) => s + r.inboxConversions,
      0,
    );

    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const avgQualifiedRate =
      reports.reduce((s, r) => s + r.qualifiedRate, 0) / reports.length;
    const avgCostPerConversation =
      totalMessagingConversations > 0
        ? totalAdSpend / totalMessagingConversations
        : 0;

    return {
      totalImpressions,
      totalReach,
      totalClicks,
      avgCtr: +avgCtr.toFixed(2),
      avgCpc: +avgCpc.toFixed(2),
      totalAdSpend,
      totalMessagingConversations,
      totalInboxConversions,
      avgQualifiedRate: +avgQualifiedRate.toFixed(2),
      avgCostPerConversation: +avgCostPerConversation.toFixed(2),
    };
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateAdsReportMessageDto,
    source: string = 'MANUAL',
  ): Promise<AdsReportMessageResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const created = await this.prisma.adsReportMessage.create({
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
        // Message-specific
        welcomeMessageViews: dto.welcomeMessageViews,
        messagingConversationsStarted: dto.messagingConversationsStarted,
        costPerMessagingConversation: dto.costPerMessagingConversation,
        messagingConversationsReplied: dto.messagingConversationsReplied,
        inboxConversions: dto.inboxConversions,
        qualifiedRate: dto.qualifiedRate,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return this.map(created);
  }

  private map(report: AdsReportMessageWithCreator): AdsReportMessageResponse {
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
      // Message-specific
      welcomeMessageViews: report.welcomeMessageViews,
      messagingConversationsStarted: report.messagingConversationsStarted,
      costPerMessagingConversation: Number(report.costPerMessagingConversation),
      messagingConversationsReplied: report.messagingConversationsReplied,
      inboxConversions: report.inboxConversions,
      qualifiedRate: report.qualifiedRate,
    };
  }
}
