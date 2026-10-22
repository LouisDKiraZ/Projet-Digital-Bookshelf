import { ApiError } from './httpClient';
import {
  createShelf as createShelfLocally,
  getShelf,
  getShelfMembers,
  listShelves,
  updateShelf as updateShelfLocally,
} from '../lib/localStore';
import type { ShelfDraft, SavedShelf, ShelfMember } from '../types/shelf';

export async function createShelf(
  draft: ShelfDraft,
  createdByUserId: number,
  imageFile: File | null,
): Promise<SavedShelf> {
  try {
    return await createShelfLocally(draft, createdByUserId, imageFile);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not create shelf.', 400);
  }
}

export async function updateShelf(
  shelfId: number,
  draft: ShelfDraft,
  imageFile: File | null,
): Promise<SavedShelf> {
  try {
    return await updateShelfLocally(shelfId, draft, imageFile);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not update shelf.', 400);
  }
}

export async function fetchShelves(): Promise<SavedShelf[]> {
  return listShelves();
}

export async function fetchShelf(id: number): Promise<SavedShelf> {
  try {
    return getShelf(id);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not load shelf.', 404);
  }
}

export async function fetchShelfMembers(shelfId: number): Promise<ShelfMember[]> {
  try {
    return getShelfMembers(shelfId);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Could not load members.', 404);
  }
}
