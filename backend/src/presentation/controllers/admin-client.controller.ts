import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import {
  CreateClientDto,
  UpdateClientDto,
  type ClientResponseDto,
  type ClientListResponseDto,
} from '../../application/dto/admin/client.dto';

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Controller('admin/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminClientController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listClients(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ): Promise<ClientListResponseDto> {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { accessCode: { contains: search.toUpperCase() } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.client.count({ where });

    return {
      clients: clients.map((c) => this.mapToResponse(c)),
      total,
    };
  }

  @Get(':id')
  async getClient(@Param('id') id: string): Promise<ClientResponseDto> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.mapToResponse(client);
  }

  @Post()
  async createClient(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    let accessCode = generateAccessCode();
    let attempts = 0;

    while (attempts < 10) {
      const existing = await this.prisma.client.findUnique({
        where: { accessCode },
      });
      if (!existing) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    const client = await this.prisma.client.create({
      data: {
        companyName: dto.companyName,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        accessCode,
      },
      include: { _count: { select: { projects: true } } },
    });

    return this.mapToResponse(client);
  }

  @Patch(':id')
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const existing = await this.prisma.client.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        isActive: dto.isActive,
      },
      include: { _count: { select: { projects: true } } },
    });

    return this.mapToResponse(client);
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client._count.projects > 0) {
      throw new BadRequestException(
        'Cannot delete client with attached projects. Deactivate instead.',
      );
    }

    await this.prisma.client.delete({ where: { id } });
  }

  @Post(':id/regenerate-code')
  async regenerateAccessCode(@Param('id') id: string): Promise<ClientResponseDto> {
    const existing = await this.prisma.client.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    let accessCode = generateAccessCode();
    let attempts = 0;

    while (attempts < 10) {
      const existingCode = await this.prisma.client.findUnique({
        where: { accessCode },
      });
      if (!existingCode) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: { accessCode },
      include: { _count: { select: { projects: true } } },
    });

    return this.mapToResponse(client);
  }

  private mapToResponse(client: {
    id: string;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    accessCode: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { projects: number };
  }): ClientResponseDto {
    return {
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      accessCode: client.accessCode,
      isActive: client.isActive,
      projectCount: client._count.projects,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }
}
