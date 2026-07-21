import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('jobprep.db');
  
  // Enable WAL mode for concurrent reads/writes
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run migrations
  const userVersion = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = userVersion?.user_version ?? 0;

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    await db.withTransactionAsync(async () => {
      await db!.execAsync(MIGRATIONS[i] as string);
      await db!.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
  }

  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
