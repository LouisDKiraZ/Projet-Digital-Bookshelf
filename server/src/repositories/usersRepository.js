// There is no authentication yet (see CLAUDE.md "Known gaps"). A user is
// just a display name, created the first time it's seen. This is enough to
// attribute a shelf to its creator and list shelf members.

import { db } from '../db/connection.js';

const findByName = db.prepare('SELECT * FROM users WHERE display_name = ?');
const insert = db.prepare('INSERT INTO users (display_name) VALUES (?)');
const findById = db.prepare('SELECT * FROM users WHERE id = ?');

export function findOrCreateUser(displayName) {
  const existing = findByName.get(displayName);
  if (existing) {
    return existing;
  }
  const { lastInsertRowid } = insert.run(displayName);
  return findById.get(lastInsertRowid);
}

export function getUserById(id) {
  return findById.get(id);
}
