import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from '../../presentation/controllers/project.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectController],
  providers: [],
  exports: [],
})
export class ProjectModule {}
