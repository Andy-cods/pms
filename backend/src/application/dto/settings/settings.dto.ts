import { IsString, IsObject } from 'class-validator';

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
