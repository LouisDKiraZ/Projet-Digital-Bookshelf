// Mirrors the server's shapes (server/src/repositories/shelvesRepository.js
// and server/src/constants/fieldTypes.js). FieldType itself is NOT
// hardcoded here: it's fetched from GET /api/field-types at runtime so the
// two sides can't drift apart (see src/api/fieldTypesApi.ts).

export interface FieldType {
  id: string;
  label: string;
  description: string;
  hasOptions: boolean;
}

export interface FieldDraft {
  label: string;
  fieldType: string;
  isRequired: boolean;
  listOptions: string[] | null;
}

export interface ItemTypeDraft {
  name: string;
  fields: FieldDraft[];
}

// `bgColor` is only meaningful when type is 'emoji' (the color swatch
// behind the emoji); it's null for an uploaded image icon.
export type ShelfIcon =
  | { type: 'emoji'; value: string; bgColor: string }
  | { type: 'image'; value: string; bgColor: null };

export interface ShelfDraft {
  name: string;
  icon: ShelfIcon;
  itemTypes: ItemTypeDraft[];
}

export interface SavedField {
  id: number;
  label: string;
  fieldType: string;
  isRequired: boolean;
  listOptions: string[] | null;
}

export interface SavedItemType {
  id: number;
  name: string;
  fields: SavedField[];
}

export interface SavedShelf {
  id: number;
  name: string;
  icon: { type: 'emoji' | 'image'; value: string; bgColor: string | null };
  createdBy: number;
  createdAt: string;
  itemTypes: SavedItemType[];
}

export interface FieldSuggestion {
  label: string;
  fieldType: string;
  listOptions: string[] | null;
}

export interface ShelfMember {
  id: number;
  displayName: string;
}

// What a field's value looks like coming back from the API: a `person`
// field resolves to its member instead of a bare id, everything else is
// its plain value (or null when unset).
export type ItemFieldValue = string | number | ShelfMember | null;

export interface SavedItem {
  id: number;
  itemTypeId: number;
  createdBy: ShelfMember;
  createdAt: string;
  values: Record<string, ItemFieldValue>;
}

export interface ItemHistoryEntry {
  id: number;
  changeType: 'created' | 'updated' | 'deleted';
  fieldLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: ShelfMember;
  changedAt: string;
}
