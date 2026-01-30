import {
  Controller,
  Post,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdsReportPeriod, AdsPlatform } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { BudgetEventType } from '../../application/dto/budget-event.dto.js';

interface PancakePayload {
  projectCode: string;
  mediaPlanId?: string;
  amount: number;
  stage?: string;
  note?: string;
}

interface ZapierAdsPayload {
  projectCode: string;
  period?: string;
  reportDate: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  cpa?: number;
  conversions?: number;
  roas?: number;
  adSpend?: number;
  platform: string;
  campaignName?: string;
}

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: 'Handle Pancake webhook for budget spend events' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid secret or payload' })
  @Post('pancake/webhook')
  async handlePancake(
    @Headers('x-pancake-secret') secret: string,
    @Body() body: PancakePayload,
  ) {
    const expected = process.env.PANCAKE_WEBHOOK_SECRET;
    if (!expected || secret !== expected) {
      throw new BadRequestException('Invalid webhook secret');
    }

    if (!body.projectCode || !body.amount) {
      throw new BadRequestException('Missing projectCode or amount');
    }

    const project = await this.prisma.project.findUnique({
      where: { dealCode: body.projectCode },
      select: { id: true },
    });
    if (!project) throw new BadRequestException('Project not found');

    if (body.mediaPlanId) {
      const plan = await this.prisma.mediaPlan.findUnique({
        where: { id: body.mediaPlanId },
        select: { id: true, projectId: true },
      });
      if (!plan || plan.projectId !== project.id) {
        throw new BadRequestException('Media plan not found for project');
      }
    }

    // pick actor: env SYSTEM_USER_ID else first SUPER_ADMIN
    const systemUserId =
      process.env.SYSTEM_USER_ID ||
      (
        await this.prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' },
          select: { id: true },
        })
      )?.id;

    if (!systemUserId) {
      throw new BadRequestException('No system user configured');
    }

    await this.prisma.budgetEvent.create({
      data: {
        projectId: project.id,
        mediaPlanId: body.mediaPlanId,
        stage: body.stage,
        amount: body.amount,
        type: 'SPEND' as BudgetEventType,
        note: body.note,
        createdById: systemUserId,
      },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Handle Zapier webhook for ads report data' })
  @ApiResponse({ status: 200, description: 'Ads report ingested' })
  @ApiResponse({ status: 400, description: 'Invalid API key or payload' })
  @Post('webhook/ads-report')
  async handleZapierAdsReport(
    @Headers('x-zapier-api-key') apiKey: string,
    @Body() body: ZapierAdsPayload,
  ) {
    const expected = process.env.ZAPIER_WEBHOOK_SECRET;
    if (!expected || apiKey !== expected) {
      throw new BadRequestException('Invalid API key');
    }

    if (!body.projectCode || !body.platform || !body.reportDate) {
      throw new BadRequestException(
        'Missing required fields: projectCode, platform, reportDate',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { dealCode: body.projectCode },
      select: { id: true },
    });
    if (!project) throw new BadRequestException('Project not found');

    const systemUserId =
      process.env.SYSTEM_USER_ID ||
      (
        await this.prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' },
          select: { id: true },
        })
      )?.id;

    if (!systemUserId) {
      throw new BadRequestException('No system user configured');
    }

    await this.prisma.adsReport.create({
      data: {
        projectId: project.id,
        period: (body.period || 'DAILY') as AdsReportPeriod,
        reportDate: new Date(body.reportDate),
        impressions: body.impressions || 0,
        clicks: body.clicks || 0,
        ctr: body.ctr || 0,
        cpc: body.cpc || 0,
        cpm: body.cpm || 0,
        cpa: body.cpa || 0,
        conversions: body.conversions || 0,
        roas: body.roas || 0,
        adSpend: body.adSpend || 0,
        platform: body.platform as AdsPlatform,
        campaignName: body.campaignName,
        source: 'ZAPIER',
        createdById: systemUserId,
      },
    });

    return { success: true };
  }
}
