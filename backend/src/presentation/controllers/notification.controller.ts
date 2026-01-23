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

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private prisma: PrismaService) {}

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

  @Get('unread-count')
  async getUnreadCount(
    @Req() req: { user: { sub: string } },
  ): Promise<UnreadCountResponseDto> {
    const count = await this.prisma.notification.count({
      where: { userId: req.user.sub, isRead: false },
    });

    return { count };
  }

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
      throw new ForbiddenException('You do not have access to this notification');
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
    const currentPrefs =
      user.notificationPrefs && typeof user.notificationPrefs === 'object'
        ? (user.notificationPrefs as object)
        : {};

    const newPrefs = {
      ...DefaultNotificationPreferences,
      ...currentPrefs,
      ...dto,
    };

    await this.prisma.user.update({
      where: { id: req.user.sub },
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
