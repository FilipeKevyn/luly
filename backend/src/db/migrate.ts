import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pathToFileURL } from 'node:url';
import { pool, db } from './client';
import { env } from '@/config';

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations().catch(() => process.exit(1));
}

export { runMigrations };