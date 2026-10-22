import { ApiError } from './httpClient';
import {
  createItem as createItemLocally,
  deleteItem as deleteItemLocally,
  getItemHistory,
  getItems,
  updateItem as updateItemLocally,
} from '../lib/localStore';
import type { SavedItem, ItemHistoryEntry } from '../types/shelf';

export interface ItemValuesInput {
  values: Record<number, string>;
  photoFiles?: Record<number, File>;
}

export async function fetchItems(shelfId: number, itemTypeId: number | null): Promise<SavedItem[]> {
  try {
    return getItems(shelfId, itemTypeId);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not load items.', 404);
  }
}

export async function createItem(
  shelfId: number,
  itemTypeId: number,
  createdByUserId: number,
  input: ItemValuesInput,
): Promise<SavedItem> {
  try {
    return await createItemLocally(shelfId, itemTypeId, createdByUserId, input.values, input.photoFiles);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not create item.', 400);
  }
}

export async function updateItem(
  shelfId: number,
  itemId: number,
  updatedByUserId: number,
  input: ItemValuesInput,
): Promise<SavedItem> {
  try {
    return await updateItemLocally(shelfId, itemId, updatedByUserId, input.values, input.photoFiles);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not update item.', 400);
  }
}

export async function deleteItem(
  shelfId: number,
  itemId: number,
  deletedByUserId: number,
): Promise<void> {
  try {
    deleteItemLocally(shelfId, itemId, deletedByUserId);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not remove item.', 400);
  }
}

export async function fetchItemHistory(shelfId: number, itemId: number): Promise<ItemHistoryEntry[]> {
  try {
    return getItemHistory(shelfId, itemId);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not load history.', 404);
  }
}
