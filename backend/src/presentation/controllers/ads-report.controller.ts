import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { AdsReportService } from '../../modules/ads-report/ads-report.service.js';
import { AdsReportMessageService } from '../../modules/ads-report/ads-report-message.service.js';
import { AdsReportLeadService } from '../../modules/ads-report/ads-report-lead.service.js';
import { AdsReportConversionService } from '../../modules/ads-report/ads-report-conversion.service.js';
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
  CreateAdsReportMessageDto,
  AdsReportMessageResponse,
  AdsReportMessageSummary,
  CreateAdsReportLeadDto,
  AdsReportLeadResponse,
  AdsReportLeadSummary,
  CreateAdsReportConversionDto,
  AdsReportConversionResponse,
  AdsReportConversionSummary,
} from '../../application/dto/ads-report.dto.js';

@ApiTags('Ads Reports')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/ads-reports')
@UseGuards(JwtAuthGuard)
export class AdsReportController {
  constructor(
    private readonly adsReportService: AdsReportService,
    private readonly messageService: AdsReportMessageService,
    private readonly leadService: AdsReportLeadService,
    private readonly conversionService: AdsReportConversionService,
  ) {}

  // ============================================
  // GENERIC ADS REPORTS (legacy)
  // ============================================

  @ApiOperation({ summary: 'List ads reports for a project' })
  @ApiResponse({ status: 200, description: 'Returns ads report list' })
  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportResponse[]> {
    return this.adsReportService.list(projectId, query);
  }

  @ApiOperation({ summary: 'Get ads report summary/aggregation' })
  @ApiResponse({ status: 200, description: 'Returns aggregated ads summary' })
  @Get('summary')
  async summary(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportSummary> {
    return this.adsReportService.summary(projectId, query);
  }

  @ApiOperation({ summary: 'Create a new ads report entry' })
  @ApiResponse({ status: 201, description: 'Ads report created' })
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportResponse> {
    return this.adsReportService.create(projectId, req.user.sub, dto);
  }

  // ============================================
  // MESSAGE TEMPLATE
  // ============================================

  @ApiOperation({ summary: 'List MESSAGE ads reports' })
  @ApiResponse({ status: 200, description: 'Returns MESSAGE report list' })
  @Get('message')
  async listMessage(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportMessageResponse[]> {
    return this.messageService.list(projectId, query);
  }

  @ApiOperation({ summary: 'Get MESSAGE ads report summary' })
  @ApiResponse({ status: 200, description: 'Returns MESSAGE summary' })
  @Get('message/summary')
  async summaryMessage(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportMessageSummary> {
    return this.messageService.summary(projectId, query);
  }

  @ApiOperation({ summary: 'Create a MESSAGE ads report' })
  @ApiResponse({ status: 201, description: 'MESSAGE report created' })
  @Post('message')
  async createMessage(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportMessageDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportMessageResponse> {
    return this.messageService.create(projectId, req.user.sub, dto);
  }

  // ============================================
  // LEAD TEMPLATE
  // ============================================

  @ApiOperation({ summary: 'List LEAD ads reports' })
  @ApiResponse({ status: 200, description: 'Returns LEAD report list' })
  @Get('lead')
  async listLead(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportLeadResponse[]> {
    return this.leadService.list(projectId, query);
  }

  @ApiOperation({ summary: 'Get LEAD ads report summary' })
  @ApiResponse({ status: 200, description: 'Returns LEAD summary' })
  @Get('lead/summary')
  async summaryLead(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportLeadSummary> {
    return this.leadService.summary(projectId, query);
  }

  @ApiOperation({ summary: 'Create a LEAD ads report' })
  @ApiResponse({ status: 201, description: 'LEAD report created' })
  @Post('lead')
  async createLead(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportLeadDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportLeadResponse> {
    return this.leadService.create(projectId, req.user.sub, dto);
  }

  // ============================================
  // CONVERSION TEMPLATE
  // ============================================

  @ApiOperation({ summary: 'List CONVERSION ads reports' })
  @ApiResponse({ status: 200, description: 'Returns CONVERSION report list' })
  @Get('conversion')
  async listConversion(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportConversionResponse[]> {
    return this.conversionService.list(projectId, query);
  }

  @ApiOperation({ summary: 'Get CONVERSION ads report summary' })
  @ApiResponse({ status: 200, description: 'Returns CONVERSION summary' })
  @Get('conversion/summary')
  async summaryConversion(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportConversionSummary> {
    return this.conversionService.summary(projectId, query);
  }

  @ApiOperation({ summary: 'Create a CONVERSION ads report' })
  @ApiResponse({ status: 201, description: 'CONVERSION report created' })
  @Post('conversion')
  async createConversion(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportConversionDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportConversionResponse> {
    return this.conversionService.create(projectId, req.user.sub, dto);
  }
}
