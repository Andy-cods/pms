import { Module } from '@nestjs/common';
import { SettingsController } from '../../presentation/controllers/settings.controller';
import { AdminClientController } from '../../presentation/controllers/admin-client.controller';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

@Module({
  controllers: [SettingsController, AdminClientController],
  providers: [PrismaService],
})
export class AdminModule {}
