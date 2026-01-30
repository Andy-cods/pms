import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  NotificationListQueryDto,
  UpdateNotificationPreferencesDto,
  DefaultNotificationPreferences,
  type NotificationResponseDto,
  type NotificationListResponseDto,
  type UnreadCountResponseDto,
  type NotificationPreferencesDto,
  type NotificationType,
} from '../../application/dto/notification/notification.dto.js';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({ status: 200, description: 'Returns paginated notifications' })
  @Get()
  async listNotifications(
    @Query() query: NotificationListQueryDto,
    @Req() req: { user: { sub: string } },
  ): Promise<NotificationListResponseDto> {
    const { unreadOnly, page = 1, limit = 20 } = query;

    const where: Record<string, unknown> = {
      userId: req.user.sub,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId: req.user.sub, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => this.mapToResponse(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  @Get('unread-count')
  async getUnreadCount(
    @Req() req: { user: { sub: string } },
  ): Promise<UnreadCountResponseDto> {
    const count = await this.prisma.notification.count({
      where: { userId: req.user.sub, isRead: false },
    });

    return { count };
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== req.user.sub) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToResponse(updated);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @Patch('read-all')
  async markAllAsRead(
    @Req() req: { user: { sub: string } },
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: req.user.sub,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Returns notification preferences' })
  @Get('preferences')
  async getPreferences(
    @Req() req: { user: { sub: string } },
  ): Promise<NotificationPreferencesDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { notificationPrefs: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return saved preferences or defaults
    if (user.notificationPrefs && typeof user.notificationPrefs === 'object') {
      return {
        ...DefaultNotificationPreferences,
        ...(user.notificationPrefs as object),
      };
    }

    return DefaultNotificationPreferences;
  }

  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @Patch('preferences')
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Req() req: { user: { sub: string } },
  ): Promise<NotificationPreferencesDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { notificationPrefs: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge with existing preferences
    const currentPrefs: Record<string, unknown> =
      user.notificationPrefs && typeof user.notificationPrefs === 'object'
        ? (user.notificationPrefs as Record<string, unknown>)
        : {};

    const newPrefs = {
      ...DefaultNotificationPreferences,
      ...currentPrefs,
      ...dto,
    };

    await this.prisma.user.update({
      where: { id: req.user.sub },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { notificationPrefs: JSON.parse(JSON.stringify(newPrefs)) },
    });

    return newPrefs;
  }

  private mapToResponse(notification: {
    id: string;
    type: string;
    title: string;
    content: string;
    link: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      content: notification.content,
      link: notification.link,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
