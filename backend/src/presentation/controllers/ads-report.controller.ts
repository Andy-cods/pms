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
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
} from '../../application/dto/ads-report.dto.js';

@ApiTags('Ads Reports')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/ads-reports')
@UseGuards(JwtAuthGuard)
export class AdsReportController {
  constructor(private readonly adsReportService: AdsReportService) {}

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
}
