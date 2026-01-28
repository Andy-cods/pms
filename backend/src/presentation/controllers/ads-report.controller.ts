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
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { AdsReportService } from '../../modules/ads-report/ads-report.service.js';
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
} from '../../application/dto/ads-report.dto.js';

@Controller('projects/:projectId/ads-reports')
@UseGuards(JwtAuthGuard)
export class AdsReportController {
  constructor(private readonly adsReportService: AdsReportService) {}

  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportResponse[]> {
    return this.adsReportService.list(projectId, query);
  }

  @Get('summary')
  async summary(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportSummary> {
    return this.adsReportService.summary(projectId, query);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportResponse> {
    return this.adsReportService.create(projectId, req.user.sub, dto);
  }
}
