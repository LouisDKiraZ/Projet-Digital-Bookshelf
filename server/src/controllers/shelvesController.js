import { config } from '../config.js';
import { isValidFieldType, fieldTypeHasOptions } from '../constants/fieldTypes.js';
import { getUserById } from '../repositories/usersRepository.js';
import {
  createShelf,
  getShelfById,
  listShelfMembers,
} from '../repositories/shelvesRepository.js';

const MAX_NAME_LENGTH = 60;
const MAX_FIELD_LABEL_LENGTH = 40;
const MAX_ITEM_TYPES = 10;
const MAX_FIELDS_PER_ITEM_TYPE = 20;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// Parses and validates the multipart body of POST /api/shelves into a
// draft the repository can save, or returns an error message. Kept as a
// plain function (not a generic validation library) since it only ever
// serves this one endpoint.
function parseShelfDraft(body, file) {
  const name = String(body.name ?? '').trim();
  if (!name) {
    return { error: 'The shelf name is required.' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `The shelf name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  const iconType = body.iconType;
  if (iconType !== 'emoji' && iconType !== 'image') {
    return { error: 'iconType must be "emoji" or "image".' };
  }

  let iconValue;
  let iconBgColor = null;
  if (iconType === 'emoji') {
    iconValue = String(body.iconValue ?? '').trim();
    if (!iconValue) {
      return { error: 'iconValue is required when iconType is "emoji".' };
    }
    iconBgColor = String(body.iconBgColor ?? '').trim();
    if (!HEX_COLOR_PATTERN.test(iconBgColor)) {
      return { error: 'iconBgColor must be a hex color (e.g. "#f1e4d3") when iconType is "emoji".' };
    }
  } else {
    if (!file) {
      return { error: 'An image file is required when iconType is "image".' };
    }
    iconValue = `${config.uploadsUrlPrefix}/shelf-icons/${file.filename}`;
  }

  const createdByUserId = Number(body.createdByUserId);
  if (!Number.isInteger(createdByUserId) || !getUserById(createdByUserId)) {
    return { error: 'createdByUserId must reference an existing user.' };
  }

  let rawItemTypes;
  try {
    rawItemTypes = JSON.parse(body.itemTypes ?? '[]');
  } catch {
    return { error: 'itemTypes must be valid JSON.' };
  }
  if (!Array.isArray(rawItemTypes) || rawItemTypes.length === 0) {
    return { error: 'At least one item type is required.' };
  }
  if (rawItemTypes.length > MAX_ITEM_TYPES) {
    return { error: `A shelf can have at most ${MAX_ITEM_TYPES} item types.` };
  }

  const itemTypes = [];
  for (const rawItemType of rawItemTypes) {
    const itemTypeName = String(rawItemType?.name ?? '').trim();
    if (!itemTypeName) {
      return { error: 'Every item type needs a name.' };
    }

    const rawFields = rawItemType.fields;
    if (!Array.isArray(rawFields) || rawFields.length === 0) {
      return { error: `Item type "${itemTypeName}" needs at least one field.` };
    }
    if (rawFields.length > MAX_FIELDS_PER_ITEM_TYPE) {
      return { error: `Item type "${itemTypeName}" has too many fields (max ${MAX_FIELDS_PER_ITEM_TYPE}).` };
    }

    const fields = [];
    for (const rawField of rawFields) {
      const label = String(rawField?.label ?? '').trim();
      if (!label) {
        return { error: `Every field in "${itemTypeName}" needs a label.` };
      }
      if (label.length > MAX_FIELD_LABEL_LENGTH) {
        return { error: `Field label "${label}" is too long (max ${MAX_FIELD_LABEL_LENGTH} characters).` };
      }
      if (!isValidFieldType(rawField?.fieldType)) {
        return { error: `Field "${label}" has an unknown type.` };
      }

      const needsOptions = fieldTypeHasOptions(rawField.fieldType);
      let listOptions = null;
      if (needsOptions) {
        const rawOptions = Array.isArray(rawField.listOptions) ? rawField.listOptions : [];
        listOptions = rawOptions.map((option) => String(option).trim()).filter(Boolean);
        if (listOptions.length === 0) {
          return { error: `Field "${label}" needs at least one option.` };
        }
      }

      fields.push({
        label,
        fieldType: rawField.fieldType,
        isRequired: Boolean(rawField.isRequired),
        listOptions,
      });
    }

    itemTypes.push({ name: itemTypeName, fields });
  }

  return { draft: { name, iconType, iconValue, iconBgColor, createdByUserId, itemTypes } };
}

export function postShelf(req, res) {
  const { draft, error } = parseShelfDraft(req.body, req.file);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const shelfId = createShelf(draft);
  res.status(201).json(getShelfById(shelfId));
}

export function getShelf(req, res) {
  const shelfId = Number(req.params.id);
  const shelf = getShelfById(shelfId);
  if (!shelf) {
    res.status(404).json({ error: 'Shelf not found.' });
    return;
  }
  res.json(shelf);
}

export function getMembers(req, res) {
  const shelfId = Number(req.params.id);
  if (!getShelfById(shelfId)) {
    res.status(404).json({ error: 'Shelf not found.' });
    return;
  }
  res.json({ members: listShelfMembers(shelfId) });
}
