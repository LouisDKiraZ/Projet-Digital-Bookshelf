import { apiGet, apiPostForm, apiPatchForm, apiDelete } from './httpClient';
import type { SavedItem, ItemHistoryEntry } from '../types/shelf';

// Values are sent as a fieldId -> raw string map, alongside any photo
// files named `photo_<fieldId>` — mirrors what itemsController expects.
export interface ItemValuesInput {
  values: Record<number, string>;
  photoFiles?: Record<number, File>;
}

function buildFormData(base: Record<string, string>, input: ItemValuesInput): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(base)) {
    formData.append(key, value);
  }
  formData.append('values', JSON.stringify(input.values));
  for (const [fieldId, file] of Object.entries(input.photoFiles ?? {})) {
    formData.append(`photo_${fieldId}`, file);
  }
  return formData;
}

export async function fetchItems(shelfId: number, itemTypeId: number): Promise<SavedItem[]> {
  const { items } = await apiGet<{ items: SavedItem[] }>(
    `/api/shelves/${shelfId}/items?itemTypeId=${itemTypeId}`,
  );
  return items;
}

export function createItem(
  shelfId: number,
  itemTypeId: number,
  createdByUserId: number,
  input: ItemValuesInput,
): Promise<SavedItem> {
  const formData = buildFormData(
    { itemTypeId: String(itemTypeId), createdByUserId: String(createdByUserId) },
    input,
  );
  return apiPostForm<SavedItem>(`/api/shelves/${shelfId}/items`, formData);
}

export function updateItem(
  shelfId: number,
  itemId: number,
  updatedByUserId: number,
  input: ItemValuesInput,
): Promise<SavedItem> {
  const formData = buildFormData({ updatedByUserId: String(updatedByUserId) }, input);
  return apiPatchForm<SavedItem>(`/api/shelves/${shelfId}/items/${itemId}`, formData);
}

export function deleteItem(shelfId: number, itemId: number, deletedByUserId: number): Promise<void> {
  return apiDelete(`/api/shelves/${shelfId}/items/${itemId}?deletedByUserId=${deletedByUserId}`);
}

export async function fetchItemHistory(shelfId: number, itemId: number): Promise<ItemHistoryEntry[]> {
  const { history } = await apiGet<{ history: ItemHistoryEntry[] }>(
    `/api/shelves/${shelfId}/items/${itemId}/history`,
  );
  return history;
}
