// Creates every table if it doesn't exist yet. There is no migration
// framework: the schema is young enough that `CREATE TABLE IF NOT EXISTS`
// at startup is enough. `ensureColumn` below is the one exception — it lets
// an already-created local dev database pick up a newly added column
// without losing the shelves/items already in it. Revisit both once real
// migrations are needed.

import { FIELD_TYPE_IDS } from '../constants/fieldTypes.js';

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((col) => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function applySchema(db) {
  const fieldTypeList = FIELD_TYPE_IDS.map((id) => `'${id}'`).join(', ');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shelves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon_type TEXT NOT NULL CHECK (icon_type IN ('emoji', 'image')),
      icon_value TEXT NOT NULL,
      icon_bg_color TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shelf_members (
      shelf_id INTEGER NOT NULL REFERENCES shelves(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (shelf_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS item_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shelf_id INTEGER NOT NULL REFERENCES shelves(id),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS item_type_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type_id INTEGER NOT NULL REFERENCES item_types(id),
      label TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK (field_type IN (${fieldTypeList})),
      is_required INTEGER NOT NULL DEFAULT 0,
      list_options TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type_id INTEGER NOT NULL REFERENCES item_types(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS item_field_values (
      item_id INTEGER NOT NULL REFERENCES items(id),
      field_id INTEGER NOT NULL REFERENCES item_type_fields(id),
      value TEXT,
      PRIMARY KEY (item_id, field_id)
    );

    CREATE TABLE IF NOT EXISTS item_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id),
      change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
      field_label TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER NOT NULL REFERENCES users(id),
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Added after the first version of this schema shipped — kept as a
  // migration rather than rolled into the CREATE TABLE above so a dev
  // database created before this column existed doesn't lose its shelves.
  ensureColumn(db, 'shelves', 'icon_bg_color', 'TEXT');
}
