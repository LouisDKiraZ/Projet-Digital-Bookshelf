import type {
  FieldSuggestion,
  FieldType,
  ItemFieldValue,
  ItemHistoryEntry,
  ItemTypeDraft,
  SavedField,
  SavedItem,
  SavedShelf,
  ShelfDraft,
  ShelfMember,
} from '../types/shelf';

const STORAGE_KEY = 'digital-bookshelf.local-db.v1';

const FIELD_TYPES: FieldType[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'A short line of text, e.g. a title or an author name.',
    hasOptions: false,
  },
  {
    id: 'number',
    label: 'Number',
    description: 'A numeric value, e.g. a price or a page count.',
    hasOptions: false,
  },
  {
    id: 'date',
    label: 'Date',
    description: 'A calendar date, e.g. a purchase date.',
    hasOptions: false,
  },
  {
    id: 'list',
    label: 'List of options',
    description: 'A choice from a fixed set of options, e.g. a genre.',
    hasOptions: true,
  },
  {
    id: 'photo',
    label: 'Photo',
    description: 'An image, e.g. a cover photo.',
    hasOptions: false,
  },
  {
    id: 'person',
    label: 'Person',
    description: 'A reference to someone on the shelf, e.g. a real-world owner or borrower.',
    hasOptions: false,
  },
];

type LocalValue = string | number | null;

interface LocalUser {
  id: number;
  displayName: string;
  createdAt: string;
}

interface LocalField extends SavedField {}

interface LocalItemType {
  id: number;
  name: string;
  fields: LocalField[];
}

interface LocalShelf {
  id: number;
  name: string;
  icon: { type: 'emoji' | 'image'; value: string; bgColor: string | null };
  createdBy: number;
  createdAt: string;
  memberUserIds: number[];
  itemTypes: LocalItemType[];
}

interface LocalItem {
  id: number;
  shelfId: number;
  itemTypeId: number;
  createdBy: number;
  createdAt: string;
  deletedAt: string | null;
  values: Record<string, LocalValue>;
}

interface LocalHistoryEntry {
  id: number;
  shelfId: number;
  itemId: number;
  changeType: 'created' | 'updated' | 'deleted';
  fieldLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: number;
  changedAt: string;
}

interface LocalDb {
  counters: {
    userId: number;
    shelfId: number;
    itemTypeId: number;
    fieldId: number;
    itemId: number;
    historyId: number;
  };
  users: LocalUser[];
  shelves: LocalShelf[];
  items: LocalItem[];
  history: LocalHistoryEntry[];
}

function nowIso() {
  return new Date().toISOString();
}

function nextId(db: LocalDb, key: keyof LocalDb['counters']): number {
  const value = db.counters[key];
  db.counters[key] += 1;
  return value;
}

function createSeedDb(): LocalDb {
  const createdAt = nowIso();
  const users: LocalUser[] = [{ id: 1, displayName: 'Demo user', createdAt }];

  const shelves: LocalShelf[] = [
    {
      id: 1,
      name: 'Sample bookshelf',
      icon: { type: 'emoji', value: '📚', bgColor: '#f1e4d3' },
      createdBy: 1,
      createdAt,
      memberUserIds: [1],
      itemTypes: [
        {
          id: 1,
          name: 'Book',
          fields: [
            { id: 1, label: 'Title', fieldType: 'text', isRequired: true, listOptions: null },
            { id: 2, label: 'Genre', fieldType: 'list', isRequired: false, listOptions: ['Novel', 'Essay', 'Manga'] },
            { id: 3, label: 'Price', fieldType: 'number', isRequired: false, listOptions: null },
          ],
        },
      ],
    },
  ];

  const items: LocalItem[] = [
    {
      id: 1,
      shelfId: 1,
      itemTypeId: 1,
      createdBy: 1,
      createdAt,
      deletedAt: null,
      values: {
        '1': 'Clean Code',
        '2': 'Essay',
        '3': 29.9,
      },
    },
  ];

  const history: LocalHistoryEntry[] = [
    {
      id: 1,
      shelfId: 1,
      itemId: 1,
      changeType: 'created',
      fieldLabel: null,
      oldValue: null,
      newValue: null,
      changedBy: 1,
      changedAt: createdAt,
    },
  ];

  return {
    counters: {
      userId: 2,
      shelfId: 2,
      itemTypeId: 2,
      fieldId: 4,
      itemId: 2,
      historyId: 2,
    },
    users,
    shelves,
    items,
    history,
  };
}

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedDb();
      saveDb(seeded);
      return seeded;
    }
    return JSON.parse(raw) as LocalDb;
  } catch {
    const seeded = createSeedDb();
    saveDb(seeded);
    return seeded;
  }
}

function saveDb(db: LocalDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getUser(db: LocalDb, userId: number): ShelfMember {
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return { id: userId, displayName: 'Unknown' };
  }
  return { id: user.id, displayName: user.displayName };
}

function toSavedShelf(localShelf: LocalShelf): SavedShelf {
  return {
    id: localShelf.id,
    name: localShelf.name,
    icon: localShelf.icon,
    createdBy: localShelf.createdBy,
    createdAt: localShelf.createdAt,
    itemTypes: localShelf.itemTypes,
  };
}

function toSavedValue(db: LocalDb, field: SavedField, value: LocalValue): ItemFieldValue {
  if (value === null || value === '' || value === undefined) {
    return null;
  }
  if (field.fieldType === 'person') {
    if (typeof value !== 'number') {
      return null;
    }
    return getUser(db, value);
  }
  if (field.fieldType === 'number') {
    return typeof value === 'number' ? value : null;
  }
  return typeof value === 'string' ? value : String(value);
}

function normalizeListOptions(fieldType: string, listOptions: string[] | null): string[] | null {
  if (fieldType !== 'list') {
    return null;
  }
  const options = (listOptions ?? []).map((option) => option.trim()).filter(Boolean);
  return options.length > 0 ? options : null;
}

function parseDate(input: string): string | null {
  if (!input.trim()) {
    return null;
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error('Please enter a valid date.');
  }
  return input;
}

function parseFieldValue(field: SavedField, raw: string, memberIds: Set<number>): LocalValue {
  if (field.fieldType === 'number') {
    if (!raw.trim()) {
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new Error(`"${field.label}" must be a valid number.`);
    }
    return parsed;
  }

  if (field.fieldType === 'date') {
    return parseDate(raw);
  }

  if (field.fieldType === 'person') {
    if (!raw.trim()) {
      return null;
    }
    const personId = Number(raw);
    if (!Number.isInteger(personId) || !memberIds.has(personId)) {
      throw new Error(`"${field.label}" must be a member of this shelf.`);
    }
    return personId;
  }

  if (field.fieldType === 'list') {
    if (!raw.trim()) {
      return null;
    }
    if (!field.listOptions?.includes(raw)) {
      throw new Error(`"${raw}" is not a valid option for "${field.label}".`);
    }
    return raw;
  }

  if (!raw.trim()) {
    return null;
  }

  if (field.fieldType === 'text') {
    return raw.slice(0, 500);
  }

  return raw;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read this file.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function toDisplayValue(field: SavedField, value: LocalValue, db: LocalDb): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (field.fieldType === 'person') {
    if (typeof value !== 'number') {
      return null;
    }
    return getUser(db, value).displayName;
  }
  return String(value);
}

function sameValue(left: LocalValue, right: LocalValue): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return Number.isNaN(left) && Number.isNaN(right);
  }
  return false;
}

function ensureShelf(db: LocalDb, shelfId: number): LocalShelf {
  const shelf = db.shelves.find((candidate) => candidate.id === shelfId);
  if (!shelf) {
    throw new Error('This shelf could not be found.');
  }
  return shelf;
}

function ensureItemType(shelf: LocalShelf, itemTypeId: number): LocalItemType {
  const itemType = shelf.itemTypes.find((candidate) => candidate.id === itemTypeId);
  if (!itemType) {
    throw new Error('This item type could not be found.');
  }
  return itemType;
}

function ensureItem(db: LocalDb, shelfId: number, itemId: number): LocalItem {
  const item = db.items.find((candidate) => candidate.id === itemId && candidate.shelfId === shelfId);
  if (!item || item.deletedAt) {
    throw new Error('This item could not be found.');
  }
  return item;
}

function validateRequired(fields: SavedField[], values: Record<string, LocalValue>) {
  for (const field of fields) {
    if (!field.isRequired) {
      continue;
    }
    const value = values[String(field.id)];
    const hasValue = value !== null && value !== undefined && value !== '';
    if (!hasValue) {
      throw new Error(`"${field.label}" is required.`);
    }
  }
}

function parseDraftItemTypes(db: LocalDb, itemTypes: ItemTypeDraft[]): LocalItemType[] {
  return itemTypes.map((itemTypeDraft) => ({
    id: itemTypeDraft.id ?? nextId(db, 'itemTypeId'),
    name: itemTypeDraft.name,
    fields: itemTypeDraft.fields.map((fieldDraft) => ({
      id: fieldDraft.id ?? nextId(db, 'fieldId'),
      label: fieldDraft.label,
      fieldType: fieldDraft.fieldType,
      isRequired: fieldDraft.isRequired,
      listOptions: normalizeListOptions(fieldDraft.fieldType, fieldDraft.listOptions),
    })),
  }));
}

function sanitizeDraft(draft: ShelfDraft): ShelfDraft {
  return {
    name: draft.name.trim(),
    icon: draft.icon,
    itemTypes: draft.itemTypes.map((itemType) => ({
      id: itemType.id,
      name: itemType.name.trim(),
      fields: itemType.fields.map((field) => ({
        id: field.id,
        label: field.label.trim(),
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        listOptions: normalizeListOptions(field.fieldType, field.listOptions),
      })),
    })),
  };
}

export function getFieldTypes(): FieldType[] {
  return FIELD_TYPES;
}

export function identifyUser(displayName: string): { id: number; displayName: string } {
  const trimmedName = displayName.trim();
  if (!trimmedName) {
    throw new Error('Please enter a display name.');
  }

  const db = loadDb();
  const existing = db.users.find(
    (user) => user.displayName.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
  );
  if (existing) {
    return { id: existing.id, displayName: existing.displayName };
  }

  const user = {
    id: nextId(db, 'userId'),
    displayName: trimmedName,
    createdAt: nowIso(),
  };
  db.users.push(user);
  saveDb(db);
  return { id: user.id, displayName: user.displayName };
}

export function getFieldSuggestions(): FieldSuggestion[] {
  const db = loadDb();
  const seen = new Map<string, FieldSuggestion>();

  for (const shelf of db.shelves) {
    for (const itemType of shelf.itemTypes) {
      for (const field of itemType.fields) {
        const key = JSON.stringify([field.label, field.fieldType, field.listOptions]);
        if (!seen.has(key)) {
          seen.set(key, {
            label: field.label,
            fieldType: field.fieldType,
            listOptions: field.listOptions,
          });
        }
      }
    }
  }

  return [...seen.values()];
}

export function listShelves(): SavedShelf[] {
  return loadDb().shelves.map(toSavedShelf);
}

export function getShelf(shelfId: number): SavedShelf {
  const db = loadDb();
  return toSavedShelf(ensureShelf(db, shelfId));
}

export function getShelfMembers(shelfId: number): ShelfMember[] {
  const db = loadDb();
  const shelf = ensureShelf(db, shelfId);
  return shelf.memberUserIds.map((id) => getUser(db, id));
}

export async function createShelf(
  rawDraft: ShelfDraft,
  createdByUserId: number,
  imageFile: File | null,
): Promise<SavedShelf> {
  const draft = sanitizeDraft(rawDraft);
  const db = loadDb();
  const iconValue =
    draft.icon.type === 'image' ? await fileToDataUrl(imageFile as File) : draft.icon.value;

  const shelf: LocalShelf = {
    id: nextId(db, 'shelfId'),
    name: draft.name,
    icon:
      draft.icon.type === 'emoji'
        ? { type: 'emoji', value: draft.icon.value, bgColor: draft.icon.bgColor }
        : { type: 'image', value: iconValue, bgColor: null },
    createdBy: createdByUserId,
    createdAt: nowIso(),
    memberUserIds: [createdByUserId],
    itemTypes: parseDraftItemTypes(db, draft.itemTypes),
  };

  db.shelves.push(shelf);
  saveDb(db);
  return toSavedShelf(shelf);
}

function migrateItemsAfterShelfConfigUpdate(db: LocalDb, shelf: LocalShelf, previousItemTypes: LocalItemType[]) {
  const nextTypeIds = new Set(shelf.itemTypes.map((itemType) => itemType.id));
  const previousTypeById = new Map(previousItemTypes.map((itemType) => [itemType.id, itemType]));

  db.items = db.items.filter((item) => {
    if (item.shelfId !== shelf.id) {
      return true;
    }
    return nextTypeIds.has(item.itemTypeId);
  });

  const validItemIds = new Set(db.items.map((item) => item.id));
  db.history = db.history.filter((entry) => validItemIds.has(entry.itemId));

  for (const item of db.items) {
    if (item.shelfId !== shelf.id) {
      continue;
    }

    const nextItemType = shelf.itemTypes.find((candidate) => candidate.id === item.itemTypeId);
    if (!nextItemType) {
      continue;
    }
    const previousItemType = previousTypeById.get(item.itemTypeId);
    const previousFieldById = new Map(previousItemType?.fields.map((field) => [field.id, field]) ?? []);
    const migratedValues: Record<string, LocalValue> = {};

    for (const field of nextItemType.fields) {
      const previousField = previousFieldById.get(field.id);
      const previousValue = item.values[String(field.id)] ?? null;
      const compatible = previousField?.fieldType === field.fieldType;
      migratedValues[String(field.id)] = compatible ? previousValue : null;
    }

    item.values = migratedValues;
  }
}

export async function updateShelf(
  shelfId: number,
  rawDraft: ShelfDraft,
  imageFile: File | null,
): Promise<SavedShelf> {
  const draft = sanitizeDraft(rawDraft);
  const db = loadDb();
  const shelf = ensureShelf(db, shelfId);
  const previousItemTypes = shelf.itemTypes.map((itemType) => ({
    ...itemType,
    fields: itemType.fields.map((field) => ({ ...field })),
  }));

  shelf.name = draft.name;

  if (draft.icon.type === 'emoji') {
    shelf.icon = { type: 'emoji', value: draft.icon.value, bgColor: draft.icon.bgColor };
  } else {
    const existingImage = shelf.icon.type === 'image' ? shelf.icon.value : null;
    const nextImageValue = imageFile ? await fileToDataUrl(imageFile) : existingImage;
    if (!nextImageValue) {
      throw new Error('Please choose a photo for your shelf.');
    }
    shelf.icon = { type: 'image', value: nextImageValue, bgColor: null };
  }

  shelf.itemTypes = parseDraftItemTypes(db, draft.itemTypes);
  migrateItemsAfterShelfConfigUpdate(db, shelf, previousItemTypes);
  saveDb(db);

  return toSavedShelf(shelf);
}

export function getItems(shelfId: number, itemTypeId: number | null): SavedItem[] {
  const db = loadDb();
  const shelf = ensureShelf(db, shelfId);
  const typeById = new Map(shelf.itemTypes.map((itemType) => [itemType.id, itemType]));

  return db.items
    .filter((item) => item.shelfId === shelfId && !item.deletedAt)
    .filter((item) => (itemTypeId === null ? true : item.itemTypeId === itemTypeId))
    .map((item) => {
      const itemType = typeById.get(item.itemTypeId);
      if (!itemType) {
        throw new Error('This item type could not be found.');
      }

      const values: Record<string, ItemFieldValue> = {};
      for (const field of itemType.fields) {
        values[String(field.id)] = toSavedValue(db, field, item.values[String(field.id)] ?? null);
      }

      return {
        id: item.id,
        itemTypeId: item.itemTypeId,
        createdBy: getUser(db, item.createdBy),
        createdAt: item.createdAt,
        values,
      };
    });
}

export async function createItem(
  shelfId: number,
  itemTypeId: number,
  createdByUserId: number,
  valuesByFieldId: Record<number, string>,
  photoFiles: Record<number, File> = {},
): Promise<SavedItem> {
  const db = loadDb();
  const shelf = ensureShelf(db, shelfId);
  const itemType = ensureItemType(shelf, itemTypeId);
  const memberIds = new Set(shelf.memberUserIds);
  const normalizedValues: Record<string, LocalValue> = {};

  for (const field of itemType.fields) {
    if (field.fieldType === 'photo') {
      const photoFile = photoFiles[field.id];
      normalizedValues[String(field.id)] = photoFile ? await fileToDataUrl(photoFile) : null;
      continue;
    }
    const raw = valuesByFieldId[field.id] ?? '';
    normalizedValues[String(field.id)] = parseFieldValue(field, raw, memberIds);
  }

  validateRequired(itemType.fields, normalizedValues);

  const item: LocalItem = {
    id: nextId(db, 'itemId'),
    shelfId,
    itemTypeId,
    createdBy: createdByUserId,
    createdAt: nowIso(),
    deletedAt: null,
    values: normalizedValues,
  };
  db.items.push(item);

  db.history.push({
    id: nextId(db, 'historyId'),
    shelfId,
    itemId: item.id,
    changeType: 'created',
    fieldLabel: null,
    oldValue: null,
    newValue: null,
    changedBy: createdByUserId,
    changedAt: nowIso(),
  });

  saveDb(db);
  return getItems(shelfId, itemTypeId).find((candidate) => candidate.id === item.id) as SavedItem;
}

export async function updateItem(
  shelfId: number,
  itemId: number,
  updatedByUserId: number,
  valuesByFieldId: Record<number, string>,
  photoFiles: Record<number, File> = {},
): Promise<SavedItem> {
  const db = loadDb();
  const shelf = ensureShelf(db, shelfId);
  const item = ensureItem(db, shelfId, itemId);
  const itemType = ensureItemType(shelf, item.itemTypeId);
  const memberIds = new Set(shelf.memberUserIds);

  const nextValues: Record<string, LocalValue> = { ...item.values };

  for (const field of itemType.fields) {
    const key = String(field.id);
    if (field.fieldType === 'photo') {
      const photoFile = photoFiles[field.id];
      if (photoFile) {
        nextValues[key] = await fileToDataUrl(photoFile);
      } else {
        const incoming = valuesByFieldId[field.id] ?? '';
        nextValues[key] = incoming.trim() ? incoming : null;
      }
      continue;
    }

    const raw = valuesByFieldId[field.id] ?? '';
    nextValues[key] = parseFieldValue(field, raw, memberIds);
  }

  validateRequired(itemType.fields, nextValues);

  for (const field of itemType.fields) {
    const key = String(field.id);
    const previousValue = item.values[key] ?? null;
    const updatedValue = nextValues[key] ?? null;
    if (sameValue(previousValue, updatedValue)) {
      continue;
    }
    db.history.push({
      id: nextId(db, 'historyId'),
      shelfId,
      itemId,
      changeType: 'updated',
      fieldLabel: field.label,
      oldValue: toDisplayValue(field, previousValue, db),
      newValue: toDisplayValue(field, updatedValue, db),
      changedBy: updatedByUserId,
      changedAt: nowIso(),
    });
  }

  item.values = nextValues;
  saveDb(db);
  return getItems(shelfId, itemType.id).find((candidate) => candidate.id === item.id) as SavedItem;
}

export function deleteItem(shelfId: number, itemId: number, deletedByUserId: number): void {
  const db = loadDb();
  const item = ensureItem(db, shelfId, itemId);
  item.deletedAt = nowIso();

  db.history.push({
    id: nextId(db, 'historyId'),
    shelfId,
    itemId,
    changeType: 'deleted',
    fieldLabel: null,
    oldValue: null,
    newValue: null,
    changedBy: deletedByUserId,
    changedAt: nowIso(),
  });

  saveDb(db);
}

export function getItemHistory(shelfId: number, itemId: number): ItemHistoryEntry[] {
  const db = loadDb();
  ensureShelf(db, shelfId);
  return db.history
    .filter((entry) => entry.shelfId === shelfId && entry.itemId === itemId)
    .sort((a, b) => b.id - a.id)
    .map((entry) => ({
      id: entry.id,
      changeType: entry.changeType,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      changedBy: getUser(db, entry.changedBy),
      changedAt: entry.changedAt,
    }));
}
