import { Module } from '@nestjs/common';
import { SettingsController } from '../../presentation/controllers/settings.controller';
import { AdminClientController } from '../../presentation/controllers/admin-client.controller';
import { AdminUserController } from '../../presentation/controllers/admin-user.controller';
import { AuditLogController } from '../../presentation/controllers/audit-log.controller';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

@Module({
  controllers: [
    SettingsController,
    AdminClientController,
    AdminUserController,
    AuditLogController,
  ],
  providers: [PrismaService],
})
export class AdminModule {}
