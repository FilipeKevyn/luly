import { readFileSync } from 'node:fs';

import { pool } from '../src/db/client';

const sql = readFileSync(new URL('../drizzle/0003_manual_catalog.sql', import.meta.url), 'utf8');

await pool.query(sql);
console.log('✅ Migration 0003_manual_catalog applied');
await pool.end();
