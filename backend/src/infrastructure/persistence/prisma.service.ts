import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pgPool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>(
      'DATABASE_URL',
      'postgresql://bc_user:bc_password@localhost:5433/bc_pms',
    );
    const pool = new Pool({
      connectionString,
      max: 20,                    // Maximum connections in pool
      min: 5,                     // Minimum idle connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 5000, // Timeout waiting for connection
      statement_timeout: 30000,   // Kill queries after 30s
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pgPool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pgPool.end();
  }
}
