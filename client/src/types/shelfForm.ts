// Local, UI-only draft shapes used while the creation wizard is being
// filled in. They carry a `uiId` (for React keys and removal) and keep
// list options as raw text the user is still typing — distinct from the
// `shelf.ts` types that mirror what the API actually expects on submit.

export interface FieldFormState {
  uiId: string;
  savedId?: number;
  label: string;
  fieldType: string;
  isRequired: boolean;
  listOptionsText: string;
}

export interface ItemTypeFormState {
  uiId: string;
  savedId?: number;
  name: string;
  fields: FieldFormState[];
}

export function createEmptyField(): FieldFormState {
  return {
    uiId: crypto.randomUUID(),
    label: '',
    fieldType: 'text',
    isRequired: false,
    listOptionsText: '',
  };
}

export function createEmptyItemType(): ItemTypeFormState {
  return {
    uiId: crypto.randomUUID(),
    name: '',
    fields: [createEmptyField()],
  };
}

export function parseListOptions(raw: string): string[] {
  return raw
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}
