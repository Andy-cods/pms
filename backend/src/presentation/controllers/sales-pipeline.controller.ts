import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import {
  UserRole,
  PipelineDecision,
  PipelineStage,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { SalesPipelineService } from '../../modules/sales-pipeline/sales-pipeline.service.js';
import { PipelineAcceptService } from '../../modules/sales-pipeline/pipeline-accept.service.js';
import { CreatePipelineDto } from '../../application/dto/sales-pipeline/create-pipeline.dto.js';
import { UpdatePipelineSaleDto } from '../../application/dto/sales-pipeline/update-pipeline-sale.dto.js';
import { UpdatePipelinePmDto } from '../../application/dto/sales-pipeline/update-pipeline-pm.dto.js';
import { PipelineListQueryDto } from '../../application/dto/sales-pipeline/pipeline-list-query.dto.js';
import { AddWeeklyNoteDto } from '../../application/dto/sales-pipeline/weekly-note.dto.js';
import { PipelineDecisionDto } from '../../application/dto/sales-pipeline/pipeline-decision.dto.js';

/** Shared include for pipeline queries */
const PIPELINE_INCLUDE = {
  nvkd: { select: { id: true, name: true, email: true, avatar: true } },
  pm: { select: { id: true, name: true, email: true, avatar: true } },
  planner: { select: { id: true, name: true, email: true, avatar: true } },
  project: { select: { id: true, code: true, name: true } },
  strategicBrief: { select: { id: true, status: true, completionPct: true } },
};

@Controller('sales-pipeline')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesPipelineController {
  constructor(
    private prisma: PrismaService,
    private pipelineService: SalesPipelineService,
    private acceptService: PipelineAcceptService,
  ) {}

  /** POST /api/sales-pipeline - Sale creates new pipeline entry */
  @Post()
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Body() dto: CreatePipelineDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.prisma.salesPipeline.create({
      data: {
        ...dto,
        nvkdId: req.user.sub,
      },
      include: PIPELINE_INCLUDE,
    });
  }

  /** GET /api/sales-pipeline - List with filters, pagination, role-based access */
  @Get()
  async list(
    @Query() query: PipelineListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    const { status, decision, nvkdId, search, page, limit, sortBy, sortOrder } =
      query;
    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.SalesPipelineWhereInput = {};

    // Role-based access: NVKD sees only their pipelines
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      if (req.user.role === UserRole.NVKD) {
        where.nvkdId = req.user.sub;
      } else if (
        req.user.role === UserRole.PM ||
        req.user.role === UserRole.PLANNER
      ) {
        where.OR = [
          { pmId: req.user.sub },
          { plannerId: req.user.sub },
        ];
      }
    }

    if (status) where.status = status;
    if (decision) where.decision = decision;
    if (nvkdId && isAdmin) where.nvkdId = nvkdId;
    if (search) {
      where.projectName = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.salesPipeline.findMany({
        where,
        include: PIPELINE_INCLUDE,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.salesPipeline.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /** GET /api/sales-pipeline/:id - Get pipeline detail */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const pipeline = await this.prisma.salesPipeline.findUnique({
      where: { id },
      include: PIPELINE_INCLUDE,
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  /** PATCH /api/sales-pipeline/:id/sale - NVKD updates sale fields */
  @Patch(':id/sale')
  @Roles(UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSaleFields(
    @Param('id') id: string,
    @Body() dto: UpdatePipelineSaleDto,
  ) {
    const existing = await this.prisma.salesPipeline.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Pipeline not found');
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Pipeline is read-only after decision');
    }

    return this.prisma.salesPipeline.update({
      where: { id },
      data: dto,
      include: PIPELINE_INCLUDE,
    });
  }

  /** PATCH /api/sales-pipeline/:id/evaluate - PM/Planner evaluation with auto-calc */
  @Patch(':id/evaluate')
  @Roles(
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  async evaluate(
    @Param('id') id: string,
    @Body() dto: UpdatePipelinePmDto,
  ) {
    const existing = await this.prisma.salesPipeline.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Pipeline not found');
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Pipeline is read-only after decision');
    }

    // Merge existing + new data for financial calculation
    const merged = { ...existing, ...dto };
    const financials = this.pipelineService.calculateFinancials(merged);

    return this.prisma.salesPipeline.update({
      where: { id },
      data: {
        ...dto,
        cogs: financials.cogs,
        grossProfit: financials.grossProfit,
        profitMargin: financials.profitMargin,
      },
      include: PIPELINE_INCLUDE,
    });
  }

  /** PATCH /api/sales-pipeline/:id/stage - Transition pipeline stage */
  @Patch(':id/stage')
  async updateStage(
    @Param('id') id: string,
    @Body('stage') stage: PipelineStage,
  ) {
    if (!stage || !Object.values(PipelineStage).includes(stage)) {
      throw new BadRequestException('Invalid stage');
    }
    const existing = await this.prisma.salesPipeline.findUniqueOrThrow({
      where: { id },
    });
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Pipeline is read-only after decision');
    }
    return this.pipelineService.updateStage(id, stage);
  }

  /** POST /api/sales-pipeline/:id/weekly-note - Append weekly note */
  @Post(':id/weekly-note')
  async addWeeklyNote(
    @Param('id') id: string,
    @Body() dto: AddWeeklyNoteDto,
    @Req() req: { user: { sub: string } },
  ) {
    const existing = await this.prisma.salesPipeline.findUniqueOrThrow({
      where: { id },
    });
    if (existing.decision !== PipelineDecision.PENDING) {
      throw new BadRequestException('Pipeline is read-only after decision');
    }
    return this.pipelineService.addWeeklyNote(id, dto.note, req.user.sub);
  }

  /** POST /api/sales-pipeline/:id/decide - PM accepts or declines */
  @Post(':id/decide')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async decide(
    @Param('id') id: string,
    @Body() dto: PipelineDecisionDto,
    @Req() req: { user: { sub: string } },
  ) {
    if (dto.decision === 'ACCEPTED') {
      return this.acceptService.acceptPipeline(id, req.user.sub, dto.decisionNote);
    } else {
      return this.acceptService.declinePipeline(id, req.user.sub, dto.decisionNote);
    }
  }
}
