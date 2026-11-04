import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = new URL(process.env.DATABASE_URL!);
    // Same pool size as the other approaches
    url.searchParams.set('connection_limit', process.env.DB_POOL_MAX ?? '10');
    // pg waits in the queue without a timeout, so disable Prisma's 10s default
    // to keep queueing behavior comparable under high VU
    url.searchParams.set('pool_timeout', '0');
    url.searchParams.set('connect_timeout', '0');
    url.searchParams.set('max_idle_connection_lifetime', '300');

    super({ datasources: { db: { url: url.toString() } }, log: ['error'] });
  }

  async onModuleInit() {
    await this.$connect(); // connect eagerly, not on the first request
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}