import { db, runInTransaction } from '../db/connection.js';

const insertShelf = db.prepare(
  'INSERT INTO shelves (name, icon_type, icon_value, icon_bg_color, created_by) VALUES (?, ?, ?, ?, ?)',
);
const insertMember = db.prepare(
  'INSERT INTO shelf_members (shelf_id, user_id) VALUES (?, ?)',
);
const insertItemType = db.prepare(
  'INSERT INTO item_types (shelf_id, name, sort_order) VALUES (?, ?, ?)',
);
const insertField = db.prepare(`
  INSERT INTO item_type_fields (item_type_id, label, field_type, is_required, list_options, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const selectShelf = db.prepare('SELECT * FROM shelves WHERE id = ?');
const selectItemTypes = db.prepare(
  'SELECT * FROM item_types WHERE shelf_id = ? ORDER BY sort_order',
);
const selectFields = db.prepare(
  'SELECT * FROM item_type_fields WHERE item_type_id = ? ORDER BY sort_order',
);
const selectMembers = db.prepare(`
  SELECT users.id, users.display_name
  FROM shelf_members
  JOIN users ON users.id = shelf_members.user_id
  WHERE shelf_members.shelf_id = ?
  ORDER BY shelf_members.joined_at
`);

/**
 * @param {{ name: string, iconType: 'emoji'|'image', iconValue: string, iconBgColor: string|null,
 *           createdByUserId: number, itemTypes: Array<{ name: string, fields: Array<{ label: string,
 *           fieldType: string, isRequired: boolean, listOptions: string[]|null }> }> }} draft
 */
export function createShelf(draft) {
  return runInTransaction(() => {
    const { lastInsertRowid: shelfId } = insertShelf.run(
      draft.name,
      draft.iconType,
      draft.iconValue,
      draft.iconBgColor,
      draft.createdByUserId,
    );
    insertMember.run(shelfId, draft.createdByUserId);

    draft.itemTypes.forEach((itemType, itemTypeIndex) => {
      const { lastInsertRowid: itemTypeId } = insertItemType.run(
        shelfId,
        itemType.name,
        itemTypeIndex,
      );

      itemType.fields.forEach((field, fieldIndex) => {
        insertField.run(
          itemTypeId,
          field.label,
          field.fieldType,
          field.isRequired ? 1 : 0,
          field.listOptions ? JSON.stringify(field.listOptions) : null,
          fieldIndex,
        );
      });
    });

    return shelfId;
  });
}

export function getShelfById(shelfId) {
  const shelf = selectShelf.get(shelfId);
  if (!shelf) {
    return null;
  }

  const itemTypes = selectItemTypes.all(shelfId).map((itemType) => ({
    id: itemType.id,
    name: itemType.name,
    fields: selectFields.all(itemType.id).map((field) => ({
      id: field.id,
      label: field.label,
      fieldType: field.field_type,
      isRequired: Boolean(field.is_required),
      listOptions: field.list_options ? JSON.parse(field.list_options) : null,
    })),
  }));

  return {
    id: shelf.id,
    name: shelf.name,
    icon: {
      type: shelf.icon_type,
      value: shelf.icon_value,
      bgColor: shelf.icon_bg_color,
    },
    createdBy: shelf.created_by,
    createdAt: shelf.created_at,
    itemTypes,
  };
}

export function listShelfMembers(shelfId) {
  return selectMembers.all(shelfId).map((row) => ({
    id: row.id,
    displayName: row.display_name,
  }));
}
