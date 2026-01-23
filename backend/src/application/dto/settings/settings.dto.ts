import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  key!: string;

  @IsObject()
  value!: Record<string, unknown>;
}

export class SettingResponseDto {
  id!: string;
  key!: string;
  value!: Record<string, unknown>;
  updatedAt!: string;
}

export class SettingsResponseDto {
  settings!: SettingResponseDto[];
}

// Enhanced system settings DTOs
export interface NotificationDefaultsDto {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  taskAssignment: boolean;
  taskDueReminder: boolean;
  approvalRequest: boolean;
  projectUpdate: boolean;
  commentMention: boolean;
}

export interface SystemSettingsDto {
  companyName: string;
  companyLogo: string | null;
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  defaultNotifications: NotificationDefaultsDto;
}

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyLogo?: string | null;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @IsOptional()
  @IsString()
  telegramBotToken?: string;

  @IsOptional()
  @IsString()
  telegramBotUsername?: string;

  @IsOptional()
  @IsObject()
  defaultNotifications?: Partial<NotificationDefaultsDto>;
}

// Setting keys constants
export const SettingKeys = {
  COMPANY_INFO: 'company_info',
  EMAIL_SETTINGS: 'email_settings',
  TELEGRAM_SETTINGS: 'telegram_settings',
  NOTIFICATION_DEFAULTS: 'notification_defaults',
} as const;
