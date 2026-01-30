import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogsResponseDto,
  AuditLogActions,
  AuditLogEntityTypes,
} from '../../application/dto/audit-log/audit-log.dto';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: 'List audit logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated audit logs' })
  @Get()
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<AuditLogsResponseDto> {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.mapToDto(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @ApiOperation({ summary: 'Get available audit log action types' })
  @ApiResponse({ status: 200, description: 'Returns list of action types' })
  @Get('actions')
  getAvailableActions(): { actions: string[] } {
    return {
      actions: Object.values(AuditLogActions),
    };
  }

  @ApiOperation({ summary: 'Get available entity types' })
  @ApiResponse({ status: 200, description: 'Returns list of entity types' })
  @Get('entity-types')
  getEntityTypes(): { entityTypes: string[] } {
    return {
      entityTypes: Object.values(AuditLogEntityTypes),
    };
  }

  @ApiOperation({ summary: 'Get audit log entry by ID' })
  @ApiResponse({ status: 200, description: 'Returns audit log details' })
  @Get(':id')
  async getAuditLog(
    @Param('id') id: string,
  ): Promise<AuditLogResponseDto | null> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!log) {
      return null;
    }

    return this.mapToDto(log);
  }

  private mapToDto(log: {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValue: unknown;
    newValue: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    } | null;
  }): AuditLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      user: log.user,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue as Record<string, unknown> | null,
      newValue: log.newValue as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
