import { Pool } from 'pg';

// Must be a function, not a constant: imports are evaluated before
// ConfigModule loads .env, so env vars have to be read at call time
export function getPoolSettings() {
  return {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    connectionTimeoutMillis: 0,   // no timeout
    idleTimeoutMillis: 300_000,   // 300s
  };
}

export function createPgPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ...getPoolSettings(),
  });
}