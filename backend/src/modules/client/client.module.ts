import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProjectController } from '../../presentation/controllers/client-project.controller';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [ClientProjectController],
  providers: [PrismaService, ClientAuthGuard],
})
export class ClientModule {}
