import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  UpdateSettingDto,
  UpdateSystemSettingsDto,
  SettingKeys,
  type SettingResponseDto,
  type SettingsResponseDto,
  type SystemSettingsDto,
  type NotificationDefaultsDto,
} from '../../application/dto/settings/settings.dto';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationDefaultsDto = {
  emailEnabled: true,
  telegramEnabled: true,
  taskAssignment: true,
  taskDueReminder: true,
  approvalRequest: true,
  projectUpdate: true,
  commentMention: true,
};

@ApiTags('Admin - Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Returns all settings' })
  @Get()
  async getAllSettings(): Promise<SettingsResponseDto> {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return {
      settings: settings.map((s) => ({
        id: s.id,
        key: s.key,
        value: s.value as Record<string, unknown>,
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  }

  @ApiOperation({ summary: 'Get consolidated system settings' })
  @ApiResponse({ status: 200, description: 'Returns system settings' })
  @Get('system')
  async getSystemSettings(): Promise<SystemSettingsDto> {
    const [companyInfo, emailSettings, telegramSettings, notificationDefaults] =
      await Promise.all([
        this.prisma.systemSetting.findUnique({
          where: { key: SettingKeys.COMPANY_INFO },
        }),
        this.prisma.systemSetting.findUnique({
          where: { key: SettingKeys.EMAIL_SETTINGS },
        }),
        this.prisma.systemSetting.findUnique({
          where: { key: SettingKeys.TELEGRAM_SETTINGS },
        }),
        this.prisma.systemSetting.findUnique({
          where: { key: SettingKeys.NOTIFICATION_DEFAULTS },
        }),
      ]);

    const company = (companyInfo?.value as Record<string, unknown>) || {};
    const email = (emailSettings?.value as Record<string, unknown>) || {};
    const telegram = (telegramSettings?.value as Record<string, unknown>) || {};
    const notifications =
      (notificationDefaults?.value as unknown as NotificationDefaultsDto) ||
      DEFAULT_NOTIFICATION_SETTINGS;

    return {
      companyName: (company.name as string) || 'BC Agency',
      companyLogo: (company.logo as string) || null,
      emailEnabled: (email.enabled as boolean) ?? false,
      smtpHost: email.host as string | undefined,
      smtpPort: email.port as number | undefined,
      smtpUser: email.user as string | undefined,
      telegramEnabled: (telegram.enabled as boolean) ?? false,
      telegramBotToken: telegram.botToken
        ? '********' // Hide token for security
        : undefined,
      telegramBotUsername: telegram.botUsername as string | undefined,
      defaultNotifications: notifications,
    };
  }

  @ApiOperation({
    summary: 'Update system settings (company, email, telegram, notifications)',
  })
  @ApiResponse({ status: 200, description: 'System settings updated' })
  @Patch('system')
  async updateSystemSettings(
    @Body() dto: UpdateSystemSettingsDto,
    @Request() req: { user: { id: string } },
  ): Promise<SystemSettingsDto> {
    const updates: Promise<unknown>[] = [];

    // Update company info
    if (dto.companyName !== undefined || dto.companyLogo !== undefined) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: SettingKeys.COMPANY_INFO },
      });
      const currentValue = (existing?.value as Record<string, unknown>) || {};
      const newValue = {
        ...currentValue,
        ...(dto.companyName !== undefined && { name: dto.companyName }),
        ...(dto.companyLogo !== undefined && { logo: dto.companyLogo }),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: SettingKeys.COMPANY_INFO },
          update: { value: newValue as Prisma.InputJsonValue },
          create: {
            key: SettingKeys.COMPANY_INFO,
            value: newValue as Prisma.InputJsonValue,
          },
        }),
      );
    }

    // Update email settings
    if (
      dto.emailEnabled !== undefined ||
      dto.smtpHost !== undefined ||
      dto.smtpPort !== undefined ||
      dto.smtpUser !== undefined
    ) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: SettingKeys.EMAIL_SETTINGS },
      });
      const currentValue = (existing?.value as Record<string, unknown>) || {};
      const newValue = {
        ...currentValue,
        ...(dto.emailEnabled !== undefined && { enabled: dto.emailEnabled }),
        ...(dto.smtpHost !== undefined && { host: dto.smtpHost }),
        ...(dto.smtpPort !== undefined && { port: dto.smtpPort }),
        ...(dto.smtpUser !== undefined && { user: dto.smtpUser }),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: SettingKeys.EMAIL_SETTINGS },
          update: { value: newValue as Prisma.InputJsonValue },
          create: {
            key: SettingKeys.EMAIL_SETTINGS,
            value: newValue as Prisma.InputJsonValue,
          },
        }),
      );
    }

    // Update telegram settings
    if (
      dto.telegramEnabled !== undefined ||
      dto.telegramBotToken !== undefined ||
      dto.telegramBotUsername !== undefined
    ) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: SettingKeys.TELEGRAM_SETTINGS },
      });
      const currentValue = (existing?.value as Record<string, unknown>) || {};
      const newValue = {
        ...currentValue,
        ...(dto.telegramEnabled !== undefined && {
          enabled: dto.telegramEnabled,
        }),
        ...(dto.telegramBotToken !== undefined && {
          botToken: dto.telegramBotToken,
        }),
        ...(dto.telegramBotUsername !== undefined && {
          botUsername: dto.telegramBotUsername,
        }),
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: SettingKeys.TELEGRAM_SETTINGS },
          update: { value: newValue as Prisma.InputJsonValue },
          create: {
            key: SettingKeys.TELEGRAM_SETTINGS,
            value: newValue as Prisma.InputJsonValue,
          },
        }),
      );
    }

    // Update notification defaults
    if (dto.defaultNotifications) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: SettingKeys.NOTIFICATION_DEFAULTS },
      });
      const currentValue =
        (existing?.value as unknown as NotificationDefaultsDto) ||
        DEFAULT_NOTIFICATION_SETTINGS;
      const newValue = {
        ...currentValue,
        ...dto.defaultNotifications,
      };
      updates.push(
        this.prisma.systemSetting.upsert({
          where: { key: SettingKeys.NOTIFICATION_DEFAULTS },
          update: { value: newValue as unknown as Prisma.InputJsonValue },
          create: {
            key: SettingKeys.NOTIFICATION_DEFAULTS,
            value: newValue as unknown as Prisma.InputJsonValue,
          },
        }),
      );
    }

    // Execute all updates
    await Promise.all(updates);

    // Log the settings update
    await this.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SETTINGS_UPDATE',
        entityType: 'SystemSetting',
        entityId: null,
        newValue: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return this.getSystemSettings();
  }

  @ApiOperation({ summary: 'Get a specific setting by key' })
  @ApiResponse({ status: 200, description: 'Returns setting value' })
  @Get(':key')
  async getSetting(
    @Param('key') key: string,
  ): Promise<SettingResponseDto | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    return {
      id: setting.id,
      key: setting.key,
      value: setting.value as Record<string, unknown>,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  @ApiOperation({ summary: 'Upsert a setting by key' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  @Put(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ): Promise<SettingResponseDto> {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: dto.value as Prisma.InputJsonValue },
      create: { key, value: dto.value as Prisma.InputJsonValue },
    });

    return {
      id: setting.id,
      key: setting.key,
      value: setting.value as Record<string, unknown>,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
