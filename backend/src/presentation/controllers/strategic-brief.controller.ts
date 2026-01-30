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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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
  project: { select: { id: true, dealCode: true, name: true } },
};

@ApiTags('Strategic Brief')
@ApiBearerAuth('JWT-auth')
@Controller('strategic-briefs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StrategicBriefController {
  constructor(
    private prisma: PrismaService,
    private briefService: StrategicBriefService,
  ) {}

  /** POST /api/strategic-briefs - Create brief with 16 empty sections */
  @ApiOperation({ summary: 'Create strategic brief with 16 default sections' })
  @ApiResponse({ status: 201, description: 'Brief created' })
  @Post()
  async create(@Body() dto: CreateBriefDto) {
    return this.briefService.create(dto.projectId);
  }

  /** GET /api/strategic-briefs/:id - Get full brief with sections */
  @ApiOperation({ summary: 'Get strategic brief by ID with all sections' })
  @ApiResponse({ status: 200, description: 'Returns brief with sections' })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const brief = await this.prisma.strategicBrief.findUnique({
      where: { id },
      include: BRIEF_INCLUDE,
    });
    if (!brief) throw new NotFoundException('Brief not found');
    return brief;
  }

  /** GET /api/strategic-briefs/by-project/:projectId */
  @ApiOperation({ summary: 'Get strategic brief by project ID' })
  @ApiResponse({ status: 200, description: 'Returns brief for project' })
  @ApiResponse({ status: 404, description: 'Brief not found for project' })
  @Get('by-project/:projectId')
  async getByProject(@Param('projectId') projectId: string) {
    const brief = await this.prisma.strategicBrief.findUnique({
      where: { projectId },
      include: BRIEF_INCLUDE,
    });
    if (!brief) throw new NotFoundException('Brief not found for this project');
    return brief;
  }

  /** PATCH /api/strategic-briefs/:id/sections/:sectionNum - Update section data */
  @ApiOperation({ summary: 'Update a brief section content' })
  @ApiResponse({ status: 200, description: 'Section updated' })
  @Patch(':id/sections/:sectionNum')
  async updateSection(
    @Param('id') id: string,
    @Param('sectionNum', ParseIntPipe) sectionNum: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.briefService.updateSection(id, sectionNum, dto);
  }

  /** POST /api/strategic-briefs/:id/submit - Submit for approval */
  @ApiOperation({ summary: 'Submit brief for approval' })
  @ApiResponse({ status: 200, description: 'Brief submitted' })
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.briefService.submit(id);
  }

  /** POST /api/strategic-briefs/:id/approve - Approve brief */
  @ApiOperation({ summary: 'Approve a strategic brief' })
  @ApiResponse({ status: 200, description: 'Brief approved' })
  @Post(':id/approve')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approve(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.briefService.approve(id, req.user.sub);
  }

  /** POST /api/strategic-briefs/:id/request-revision - Request revision */
  @ApiOperation({ summary: 'Request revision on a strategic brief' })
  @ApiResponse({ status: 200, description: 'Revision requested' })
  @Post(':id/request-revision')
  @Roles(UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async requestRevision(
    @Param('id') id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: RequestRevisionDto,
  ) {
    return this.briefService.requestRevision(id);
  }
}
