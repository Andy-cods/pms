import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  type UserResponseDto,
  type UserListResponseDto,
  type ResetPasswordResponseDto,
} from '../../application/dto/admin/admin-user.dto';
import type { RequestWithUser } from '../../modules/auth/guards/jwt-auth.guard';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminUserController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<UserListResponseDto> {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    const skip = (pageNum - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.mapToResponse(u)),
      total,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.mapToResponse(user);
  }

  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    // Only SUPER_ADMIN can create ADMIN users
    if (dto.role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Chỉ Super Admin mới có thể tạo Admin');
    }

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: hashedPassword,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Log the creation
    await this.logAction(req.user.id, 'CREATE_USER', 'User', user.id);

    return this.mapToResponse(user);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Only SUPER_ADMIN can change role to/from ADMIN
    if (dto.role !== undefined) {
      const changingToAdmin = dto.role === UserRole.ADMIN;
      const changingFromAdmin = existing.role === UserRole.ADMIN;

      if ((changingToAdmin || changingFromAdmin) && req.user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Chỉ Super Admin mới có thể thay đổi vai trò Admin');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Log the update
    await this.logAction(req.user.id, 'UPDATE_USER', 'User', user.id);

    return this.mapToResponse(user);
  }

  @Patch(':id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    // Users cannot deactivate themselves
    if (id === req.user.id) {
      throw new BadRequestException('Bạn không thể vô hiệu hóa chính mình');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Only SUPER_ADMIN can deactivate ADMIN users
    if (existing.role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Chỉ Super Admin mới có thể vô hiệu hóa Admin');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Log the deactivation
    await this.logAction(req.user.id, 'DEACTIVATE_USER', 'User', user.id);

    return this.mapToResponse(user);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ResetPasswordResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Only SUPER_ADMIN can reset password for ADMIN users
    if (existing.role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Chỉ Super Admin mới có thể đặt lại mật khẩu Admin');
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log the password reset
    await this.logAction(req.user.id, 'RESET_PASSWORD', 'User', id);

    return {
      tempPassword,
      message: 'Mật khẩu đã được đặt lại. Vui lòng gửi mật khẩu tạm thời cho người dùng.',
    };
  }

  private mapToResponse(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar: string | null;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  private async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
        },
      });
    } catch {
      // Silently fail - logging should not break the operation
    }
  }
}
