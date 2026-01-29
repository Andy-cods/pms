import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { ProjectPhaseService } from '../../modules/project-phase/project-phase.service.js';
import { CreatePhaseItemDto } from '../../application/dto/project-phase/create-phase-item.dto.js';
import { UpdatePhaseItemDto } from '../../application/dto/project-phase/update-phase-item.dto.js';
import { LinkTaskDto } from '../../application/dto/project-phase/link-task.dto.js';

@Controller('projects/:projectId/phases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectPhaseController {
  constructor(
    private prisma: PrismaService,
    private phaseService: ProjectPhaseService,
  ) {}

  /** GET /api/projects/:projectId/phases - All phases with items */
  @Get()
  async getPhases(@Param('projectId') projectId: string) {
    return this.prisma.projectPhase.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });
  }

  /** PATCH /api/projects/:projectId/phases/:phaseId - Update phase dates */
  @Patch(':phaseId')
  async updatePhase(
    @Param('phaseId') phaseId: string,
    @Body() body: { startDate?: string; endDate?: string },
  ) {
    return this.prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
      },
    });
  }

  /** POST /api/projects/:projectId/phases/:phaseId/items - Add item to phase */
  @Post(':phaseId/items')
  async addItem(
    @Param('phaseId') phaseId: string,
    @Body() dto: CreatePhaseItemDto,
  ) {
    const item = await this.prisma.projectPhaseItem.create({
      data: { phaseId, ...dto },
    });
    await this.phaseService.recalculatePhaseProgress(phaseId);
    return item;
  }

  /** PATCH /api/projects/:projectId/phases/:phaseId/items/:itemId - Update item */
  @Patch(':phaseId/items/:itemId')
  async updateItem(
    @Param('phaseId') phaseId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePhaseItemDto,
  ) {
    const item = await this.prisma.projectPhaseItem.update({
      where: { id: itemId },
      data: dto,
    });
    if (dto.isComplete !== undefined) {
      await this.phaseService.recalculatePhaseProgress(phaseId);
    }
    return item;
  }

  /** DELETE /api/projects/:projectId/phases/:phaseId/items/:itemId */
  @Delete(':phaseId/items/:itemId')
  async deleteItem(
    @Param('phaseId') phaseId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.prisma.projectPhaseItem.delete({ where: { id: itemId } });
    await this.phaseService.recalculatePhaseProgress(phaseId);
    return { success: true };
  }

  /** PATCH /api/projects/:projectId/phases/:phaseId/items/:itemId/link-task */
  @Patch(':phaseId/items/:itemId/link-task')
  async linkTask(
    @Param('itemId') itemId: string,
    @Body() dto: LinkTaskDto,
  ) {
    const action = dto.action ?? 'connect';
    return this.prisma.projectPhaseItem.update({
      where: { id: itemId },
      data: {
        tasks: action === 'disconnect'
          ? { disconnect: { id: dto.taskId } }
          : { connect: { id: dto.taskId } },
      },
      include: {
        tasks: { select: { id: true, title: true, status: true } },
      },
    });
  }
}
