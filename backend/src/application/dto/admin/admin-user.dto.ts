import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString({ message: 'Tên là bắt buộc' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  name!: string;

  @IsString({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password!: string;

  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role!: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  name?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  avatar!: string | null;
  isActive!: boolean;
  createdAt!: string;
  lastLoginAt!: string | null;
}

export class UserListResponseDto {
  users!: UserResponseDto[];
  total!: number;
}

export class ResetPasswordResponseDto {
  tempPassword!: string;
  message!: string;
}
