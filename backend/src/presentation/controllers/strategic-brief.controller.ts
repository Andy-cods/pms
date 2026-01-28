import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { StrategicBriefService } from '../../modules/strategic-brief/strategic-brief.service.js';
import { CreateBriefDto } from '../../application/dto/strategic-brief/create-brief.dto.js';
import { UpdateSectionDto } from '../../application/dto/strategic-brief/update-section.dto.js';
import { RequestRevisionDto } from '../../application/dto/strategic-brief/brief-action.dto.js';

const BRIEF_INCLUDE = {
  sections: { orderBy: { sectionNum: 'asc' as const } },
  pipeline: { select: { id: true, projectName: true } },
  project: { select: { id: true, code: true, name: true } },
};

@Controller('strategic-briefs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StrategicBriefController {
  constructor(
    private prisma: PrismaService,
    private briefService: StrategicBriefService,
  ) {}

  /** POST /api/strategic-briefs - Create brief with 16 empty sections */
  @Post()
  async create(@Body() dto: CreateBriefDto) {
    return this.briefService.create(dto.pipelineId, dto.projectId);
  }

  /** GET /api/strategic-briefs/:id - Get full brief with sections */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const brief = await this.prisma.strategicBrief.findUnique({
      where: { id },
      include: BRIEF_INCLUDE,
    });
    if (!brief) throw new NotFoundException('Brief not found');
    return brief;
  }

  /** GET /api/strategic-briefs/by-pipeline/:pipelineId */
  @Get('by-pipeline/:pipelineId')
  async getByPipeline(@Param('pipelineId') pipelineId: string) {
    const brief = await this.prisma.strategicBrief.findUnique({
      where: { pipelineId },
      include: BRIEF_INCLUDE,
    });
    if (!brief) throw new NotFoundException('Brief not found for this pipeline');
    return brief;
  }

  /** PATCH /api/strategic-briefs/:id/sections/:sectionNum - Update section data */
  @Patch(':id/sections/:sectionNum')
  async updateSection(
    @Param('id') id: string,
    @Param('sectionNum', ParseIntPipe) sectionNum: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.briefService.updateSection(id, sectionNum, dto);
  }

  /** POST /api/strategic-briefs/:id/submit - Submit for approval */
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.briefService.submit(id);
  }

  /** POST /api/strategic-briefs/:id/approve - Approve brief */
  @Post(':id/approve')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approve(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.briefService.approve(id, req.user.sub);
  }

  /** POST /api/strategic-briefs/:id/request-revision - Request revision */
  @Post(':id/request-revision')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async requestRevision(
    @Param('id') id: string,
    @Body() _dto: RequestRevisionDto,
  ) {
    return this.briefService.requestRevision(id);
  }
}
