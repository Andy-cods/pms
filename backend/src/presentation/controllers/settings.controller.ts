import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  UpdateSettingDto,
  type SettingResponseDto,
  type SettingsResponseDto,
} from '../../application/dto/settings/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class SettingsController {
  constructor(private prisma: PrismaService) {}

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

  @Get(':key')
  async getSetting(@Param('key') key: string): Promise<SettingResponseDto | null> {
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
