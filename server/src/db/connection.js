// Single shared database handle. node:sqlite (Node 24, still experimental)
// was picked over better-sqlite3 to avoid any native build step on Windows.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { config } from '../config.js';
import { applySchema } from './schema.js';

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.shelfIconsDir, { recursive: true });
fs.mkdirSync(config.itemPhotosDir, { recursive: true });

export const db = new DatabaseSync(config.dbPath, {
  enableForeignKeyConstraints: true,
});

applySchema(db);

export function runInTransaction(work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
