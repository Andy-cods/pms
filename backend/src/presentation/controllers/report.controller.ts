import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { ReportService } from '../../modules/report/report.service.js';
import {
  GenerateReportDto,
  ReportFormat,
  ReportType,
} from '../../application/dto/report/report.dto.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * Generate and download report
   * POST /reports/generate
   *
   * Body:
   * - type: WEEKLY | MONTHLY | CUSTOM
   * - format: PDF | EXCEL
   * - projectId?: string (optional, filter by project)
   * - startDate?: string (required for CUSTOM type)
   * - endDate?: string (required for CUSTOM type)
   */
  @Post('generate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.ACCOUNT,
  )
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Req() req: { user: { sub: string; role: string } },
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate custom date range
      if (dto.type === ReportType.CUSTOM) {
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException(
            'Bao cao tuy chinh yeu cau startDate va endDate',
          );
        }

        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);

        if (start > end) {
          throw new BadRequestException(
            'Ngay bat dau phai truoc ngay ket thuc',
          );
        }

        // Limit date range to 1 year
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        if (end.getTime() - start.getTime() > oneYear) {
          throw new BadRequestException(
            'Khoang thoi gian bao cao khong duoc vuot qua 1 nam',
          );
        }
      }

      const buffer = await this.reportService.generateReport(
        dto,
        req.user.sub,
        req.user.role,
      );

      // Set response headers based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const reportTypeName = dto.type.toLowerCase();

      if (dto.format === ReportFormat.PDF) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="bao-cao-${reportTypeName}-${timestamp}.pdf"`,
        );
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="bao-cao-${reportTypeName}-${timestamp}.xlsx"`,
        );
      }

      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Khong the tao bao cao: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
