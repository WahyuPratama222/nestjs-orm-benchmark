import {
  Inject,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './raw.constants';

@Injectable()
export class RawPoolService implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}