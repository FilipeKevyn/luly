import * as SQLite from 'expo-sqlite';

import { MIGRATIONS, SCHEMA_VERSION } from './schema';

const DATABASE_NAME = 'luly.db';

export const USUARIO_DEMO_ID = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }
  return databasePromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  await seedUsuarioDemo(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }
  for (let version = currentVersion; version < MIGRATIONS.length; version += 1) {
    await db.execAsync(MIGRATIONS[version]);
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

async function seedUsuarioDemo(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO usuarios (id, nome, email, senha) VALUES (?, ?, ?, ?)',
    USUARIO_DEMO_ID,
    'Visitante',
    'visitante@luly.app',
    'luly'
  );
}
