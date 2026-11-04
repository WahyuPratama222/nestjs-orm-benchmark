import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { BOOK_REPOSITORY } from '../repository.interface';
import { PG_POOL } from './raw.constants';
import { RawBookRepository } from './raw.repository';
import { RawPoolService } from './raw-pool.service';

@Module({
  providers: [
    {
      provide: PG_POOL,
      // Pool size comes from env so it is identical across all approaches
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
          max: Number(process.env.DB_POOL_MAX ?? 10),
          connectionTimeoutMillis: 0, // no timeout, same as Prisma pool_timeout=0
          idleTimeoutMillis: 300_000, // 300s, same as Prisma idle lifetime
        }),
    },
    { provide: BOOK_REPOSITORY, useClass: RawBookRepository },
    RawPoolService
  ],
  exports: [BOOK_REPOSITORY],
})
export class RawDataModule {}