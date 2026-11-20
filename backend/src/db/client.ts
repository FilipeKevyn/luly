import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '@/config';
import * as schema from './schema';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

export const db = drizzle(pool, {
  logger: env.NODE_ENV === 'development',
  schema,
});

export async function closePool() {
  await pool.end();
}

export async function checkConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 as ok');
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}