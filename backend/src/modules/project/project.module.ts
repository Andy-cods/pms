import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { ProjectController } from '../../presentation/controllers/project.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController],
  providers: [],
  exports: [],
})
export class ProjectModule {}
