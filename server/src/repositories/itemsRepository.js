// Items belonging to an item type, their per-field values, and the
// append-only edit history those changes write to `item_history`. Values
// are stored as plain TEXT in `item_field_values` regardless of field
// type; typing happens at the edges — `toApiValue` when reading for the
// client, raw strings in, already validated by the controller, going in.

import { db, runInTransaction } from '../db/connection.js';

const selectItemType = db.prepare('SELECT * FROM item_types WHERE id = ?');
const selectFieldsByItemType = db.prepare(
  'SELECT * FROM item_type_fields WHERE item_type_id = ? ORDER BY sort_order',
);

const selectItem = db.prepare('SELECT * FROM items WHERE id = ? AND deleted_at IS NULL');
const selectItemAny = db.prepare('SELECT * FROM items WHERE id = ?');
const selectItemsByType = db.prepare(
  'SELECT * FROM items WHERE item_type_id = ? AND deleted_at IS NULL ORDER BY created_at, id',
);
const selectItemsByShelf = db.prepare(`
  SELECT items.* FROM items
  JOIN item_types ON item_types.id = items.item_type_id
  WHERE item_types.shelf_id = ? AND items.deleted_at IS NULL
  ORDER BY items.created_at, items.id
`);
const selectValuesByItem = db.prepare('SELECT * FROM item_field_values WHERE item_id = ?');
const selectUserById = db.prepare('SELECT * FROM users WHERE id = ?');

const insertItem = db.prepare('INSERT INTO items (item_type_id, created_by) VALUES (?, ?)');
const insertValue = db.prepare(
  'INSERT INTO item_field_values (item_id, field_id, value) VALUES (?, ?, ?)',
);
const updateValueStmt = db.prepare(
  'UPDATE item_field_values SET value = ? WHERE item_id = ? AND field_id = ?',
);
const deleteValueStmt = db.prepare(
  'DELETE FROM item_field_values WHERE item_id = ? AND field_id = ?',
);
const insertHistory = db.prepare(`
  INSERT INTO item_history (item_id, change_type, field_label, old_value, new_value, changed_by)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const selectHistoryByItem = db.prepare(
  'SELECT * FROM item_history WHERE item_id = ? ORDER BY changed_at DESC, id DESC',
);
const markDeleted = db.prepare("UPDATE items SET deleted_at = datetime('now') WHERE id = ?");

function mapField(row) {
  return {
    id: row.id,
    itemTypeId: row.item_type_id,
    label: row.label,
    fieldType: row.field_type,
    isRequired: Boolean(row.is_required),
    listOptions: row.list_options ? JSON.parse(row.list_options) : null,
  };
}

export function getItemTypeWithFields(itemTypeId) {
  const itemType = selectItemType.get(itemTypeId);
  if (!itemType) {
    return null;
  }
  return {
    id: itemType.id,
    shelfId: itemType.shelf_id,
    name: itemType.name,
    fields: selectFieldsByItemType.all(itemTypeId).map(mapField),
  };
}

// Looks up an item's item_type_id even if it's been soft-deleted — used
// only to check shelf ownership before returning its history.
export function getItemItemTypeId(itemId) {
  const row = selectItemAny.get(itemId);
  return row ? row.item_type_id : null;
}

function resolveUser(userId) {
  const user = selectUserById.get(userId);
  return user ? { id: user.id, displayName: user.display_name } : null;
}

// Typed value for API responses: numbers come back as numbers, a
// `person` field resolves to {id, displayName} instead of a bare id.
function toApiValue(field, rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }
  if (field.fieldType === 'number') {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (field.fieldType === 'person') {
    return resolveUser(Number(rawValue));
  }
  return rawValue;
}

// Human-readable snapshot written into item_history, so the visible edit
// history never has to re-resolve ids (e.g. a person's name) later.
function toDisplayValue(field, rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }
  if (field.fieldType === 'person') {
    return resolveUser(Number(rawValue))?.displayName ?? null;
  }
  return String(rawValue);
}

function loadItemValues(itemId, fields) {
  const byFieldId = new Map(selectValuesByItem.all(itemId).map((row) => [row.field_id, row.value]));
  const values = {};
  for (const field of fields) {
    values[field.id] = toApiValue(field, byFieldId.get(field.id) ?? null);
  }
  return values;
}

function mapItem(row, fields) {
  return {
    id: row.id,
    itemTypeId: row.item_type_id,
    createdBy: resolveUser(row.created_by),
    createdAt: row.created_at,
    values: loadItemValues(row.id, fields),
  };
}

export function listItemsByItemType(itemTypeId) {
  const fields = selectFieldsByItemType.all(itemTypeId).map(mapField);
  return selectItemsByType.all(itemTypeId).map((row) => mapItem(row, fields));
}

export function listItemsByShelf(shelfId) {
  const fieldsByItemType = new Map();
  function fieldsFor(itemTypeId) {
    if (!fieldsByItemType.has(itemTypeId)) {
      fieldsByItemType.set(itemTypeId, selectFieldsByItemType.all(itemTypeId).map(mapField));
    }
    return fieldsByItemType.get(itemTypeId);
  }
  return selectItemsByShelf.all(shelfId).map((row) => mapItem(row, fieldsFor(row.item_type_id)));
}

export function getItemById(itemId) {
  const row = selectItem.get(itemId);
  if (!row) {
    return null;
  }
  const fields = selectFieldsByItemType.all(row.item_type_id).map(mapField);
  return mapItem(row, fields);
}

/**
 * @param {{ itemTypeId: number, createdByUserId: number, values: Record<number, string|null> }} input
 */
export function createItem({ itemTypeId, createdByUserId, values }) {
  return runInTransaction(() => {
    const { lastInsertRowid: itemId } = insertItem.run(itemTypeId, createdByUserId);
    for (const [fieldId, rawValue] of Object.entries(values)) {
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        continue;
      }
      insertValue.run(itemId, Number(fieldId), String(rawValue));
    }
    insertHistory.run(itemId, 'created', null, null, null, createdByUserId);
    return itemId;
  });
}

/**
 * @param {{ itemId: number, updatedByUserId: number, fields: Array, values: Record<number, string|null> }} input
 */
export function updateItem({ itemId, updatedByUserId, fields, values }) {
  return runInTransaction(() => {
    const currentByFieldId = new Map(
      selectValuesByItem.all(itemId).map((row) => [row.field_id, row.value]),
    );

    for (const field of fields) {
      const nextRaw = values[field.id] ?? null;
      const normalizedNext = nextRaw === '' ? null : nextRaw;
      const previousRaw = currentByFieldId.get(field.id) ?? null;
      if (normalizedNext === previousRaw) {
        continue;
      }

      if (normalizedNext === null) {
        deleteValueStmt.run(itemId, field.id);
      } else if (currentByFieldId.has(field.id)) {
        updateValueStmt.run(String(normalizedNext), itemId, field.id);
      } else {
        insertValue.run(itemId, field.id, String(normalizedNext));
      }

      insertHistory.run(
        itemId,
        'updated',
        field.label,
        toDisplayValue(field, previousRaw),
        toDisplayValue(field, normalizedNext),
        updatedByUserId,
      );
    }
  });
}

export function softDeleteItem(itemId, deletedByUserId) {
  runInTransaction(() => {
    markDeleted.run(itemId);
    insertHistory.run(itemId, 'deleted', null, null, null, deletedByUserId);
  });
}

export function getItemHistory(itemId) {
  return selectHistoryByItem.all(itemId).map((row) => ({
    id: row.id,
    changeType: row.change_type,
    fieldLabel: row.field_label,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: resolveUser(row.changed_by),
    changedAt: row.changed_at,
  }));
}
