import { getUserById } from '../repositories/usersRepository.js';
import { listShelfMembers } from '../repositories/shelvesRepository.js';
import {
  getItemTypeWithFields,
  getItemItemTypeId,
  listItemsByItemType,
  listItemsByShelf,
  getItemById,
  createItem,
  updateItem,
  softDeleteItem,
  getItemHistory,
} from '../repositories/itemsRepository.js';

const MAX_TEXT_VALUE_LENGTH = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function photoUrlFor(file) {
  return `/uploads/item-photos/${file.filename}`;
}

// Validates and coerces every field's submitted raw value into the string
// form stored in item_field_values, or returns an error. `rawValues` is
// keyed by field id (as a string, since it travels through JSON); `files`
// is multer's file list, matched to `photo` fields by fieldname
// `photo_<fieldId>`.
function parseValues(fields, rawValues, files, memberIds) {
  const filesByFieldName = new Map((files ?? []).map((file) => [file.fieldname, file]));
  const values = {};

  for (const field of fields) {
    const key = String(field.id);

    if (field.fieldType === 'photo') {
      const uploadedFile = filesByFieldName.get(`photo_${field.id}`);
      if (uploadedFile) {
        values[field.id] = photoUrlFor(uploadedFile);
        continue;
      }
      const existingUrl = String(rawValues[key] ?? '').trim();
      if (!existingUrl && field.isRequired) {
        return { error: `"${field.label}" is required.` };
      }
      values[field.id] = existingUrl || null;
      continue;
    }

    const raw = rawValues[key];
    const trimmed = raw === null || raw === undefined ? '' : String(raw).trim();

    if (!trimmed) {
      if (field.isRequired) {
        return { error: `"${field.label}" is required.` };
      }
      values[field.id] = null;
      continue;
    }

    switch (field.fieldType) {
      case 'text':
        if (trimmed.length > MAX_TEXT_VALUE_LENGTH) {
          return { error: `"${field.label}" is too long (max ${MAX_TEXT_VALUE_LENGTH} characters).` };
        }
        values[field.id] = trimmed;
        break;
      case 'number': {
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) {
          return { error: `"${field.label}" must be a number.` };
        }
        values[field.id] = String(parsed);
        break;
      }
      case 'date':
        if (!DATE_PATTERN.test(trimmed)) {
          return { error: `"${field.label}" must be a valid date.` };
        }
        values[field.id] = trimmed;
        break;
      case 'list':
        if (!field.listOptions?.includes(trimmed)) {
          return { error: `"${field.label}" must be one of its defined options.` };
        }
        values[field.id] = trimmed;
        break;
      case 'person': {
        const userId = Number(trimmed);
        if (!memberIds.has(userId)) {
          return { error: `"${field.label}" must reference a member of this shelf.` };
        }
        values[field.id] = String(userId);
        break;
      }
      default:
        values[field.id] = trimmed;
    }
  }

  return { values };
}

function parseRawValues(body) {
  try {
    return { rawValues: JSON.parse(body.values ?? '{}') };
  } catch {
    return { error: 'values must be valid JSON.' };
  }
}

export function getItems(req, res) {
  const shelfId = Number(req.params.shelfId);
  const itemTypeId = req.query.itemTypeId ? Number(req.query.itemTypeId) : null;

  if (itemTypeId) {
    const itemType = getItemTypeWithFields(itemTypeId);
    if (!itemType || itemType.shelfId !== shelfId) {
      res.status(404).json({ error: 'Item type not found on this shelf.' });
      return;
    }
    res.json({ items: listItemsByItemType(itemTypeId) });
    return;
  }

  res.json({ items: listItemsByShelf(shelfId) });
}

export function postItem(req, res) {
  const shelfId = Number(req.params.shelfId);
  const itemTypeId = Number(req.body.itemTypeId);
  const itemType = getItemTypeWithFields(itemTypeId);
  if (!itemType || itemType.shelfId !== shelfId) {
    res.status(404).json({ error: 'Item type not found on this shelf.' });
    return;
  }

  const createdByUserId = Number(req.body.createdByUserId);
  if (!Number.isInteger(createdByUserId) || !getUserById(createdByUserId)) {
    res.status(400).json({ error: 'createdByUserId must reference an existing user.' });
    return;
  }

  const { rawValues, error: parseError } = parseRawValues(req.body);
  if (parseError) {
    res.status(400).json({ error: parseError });
    return;
  }

  const memberIds = new Set(listShelfMembers(shelfId).map((member) => member.id));
  const { values, error } = parseValues(itemType.fields, rawValues, req.files, memberIds);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const itemId = createItem({ itemTypeId, createdByUserId, values });
  res.status(201).json(getItemById(itemId));
}

export function patchItem(req, res) {
  const shelfId = Number(req.params.shelfId);
  const itemId = Number(req.params.itemId);
  const item = getItemById(itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  const itemType = getItemTypeWithFields(item.itemTypeId);
  if (!itemType || itemType.shelfId !== shelfId) {
    res.status(404).json({ error: 'Item not found on this shelf.' });
    return;
  }

  const updatedByUserId = Number(req.body.updatedByUserId);
  if (!Number.isInteger(updatedByUserId) || !getUserById(updatedByUserId)) {
    res.status(400).json({ error: 'updatedByUserId must reference an existing user.' });
    return;
  }

  const { rawValues, error: parseError } = parseRawValues(req.body);
  if (parseError) {
    res.status(400).json({ error: parseError });
    return;
  }

  const memberIds = new Set(listShelfMembers(shelfId).map((member) => member.id));
  const { values, error } = parseValues(itemType.fields, rawValues, req.files, memberIds);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  updateItem({ itemId, updatedByUserId, fields: itemType.fields, values });
  res.json(getItemById(itemId));
}

export function deleteItem(req, res) {
  const shelfId = Number(req.params.shelfId);
  const itemId = Number(req.params.itemId);
  const item = getItemById(itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  const itemType = getItemTypeWithFields(item.itemTypeId);
  if (!itemType || itemType.shelfId !== shelfId) {
    res.status(404).json({ error: 'Item not found on this shelf.' });
    return;
  }

  const deletedByUserId = Number(req.query.deletedByUserId);
  if (!Number.isInteger(deletedByUserId) || !getUserById(deletedByUserId)) {
    res.status(400).json({ error: 'deletedByUserId must reference an existing user.' });
    return;
  }

  softDeleteItem(itemId, deletedByUserId);
  res.status(204).end();
}

export function getHistory(req, res) {
  const shelfId = Number(req.params.shelfId);
  const itemId = Number(req.params.itemId);

  const itemTypeId = getItemItemTypeId(itemId);
  if (!itemTypeId) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }
  const itemType = getItemTypeWithFields(itemTypeId);
  if (!itemType || itemType.shelfId !== shelfId) {
    res.status(404).json({ error: 'Item not found on this shelf.' });
    return;
  }

  res.json({ history: getItemHistory(itemId) });
}
