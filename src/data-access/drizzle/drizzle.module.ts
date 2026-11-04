import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createPgPool } from '../../common/pg-pool';
import { BOOK_REPOSITORY } from '../repository.interface';
import { DRIZZLE_DB, DRIZZLE_POOL } from './drizzle.constants';
import { DrizzleBookRepository } from './drizzle.repository';

@Injectable()
class DrizzlePoolShutdown implements OnApplicationShutdown {
  constructor(@Inject(DRIZZLE_POOL) private readonly pool: Pool) {}
  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Module({
  providers: [
    { provide: DRIZZLE_POOL, useFactory: createPgPool },
    {
      provide: DRIZZLE_DB,
      useFactory: (pool: Pool) => drizzle({ client: pool }), // no schema needed for the query builder
      inject: [DRIZZLE_POOL],
    },
    { provide: BOOK_REPOSITORY, useClass: DrizzleBookRepository },
    DrizzlePoolShutdown,
  ],
  exports: [BOOK_REPOSITORY],
})
export class DrizzleDataModule {}