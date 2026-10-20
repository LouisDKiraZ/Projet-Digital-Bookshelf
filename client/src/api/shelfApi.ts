import { apiGet, apiPostForm } from './httpClient';
import type { ShelfDraft, SavedShelf, ShelfMember } from '../types/shelf';

export function createShelf(
  draft: ShelfDraft,
  createdByUserId: number,
  imageFile: File | null,
): Promise<SavedShelf> {
  const formData = new FormData();
  formData.append('name', draft.name);
  formData.append('iconType', draft.icon.type);
  formData.append('createdByUserId', String(createdByUserId));
  formData.append('itemTypes', JSON.stringify(draft.itemTypes));

  if (draft.icon.type === 'emoji') {
    formData.append('iconValue', draft.icon.value);
    formData.append('iconBgColor', draft.icon.bgColor);
  } else if (imageFile) {
    formData.append('iconImage', imageFile);
  }

  return apiPostForm<SavedShelf>('/api/shelves', formData);
}

export function fetchShelf(id: number): Promise<SavedShelf> {
  return apiGet<SavedShelf>(`/api/shelves/${id}`);
}

export async function fetchShelfMembers(shelfId: number): Promise<ShelfMember[]> {
  const { members } = await apiGet<{ members: ShelfMember[] }>(`/api/shelves/${shelfId}/members`);
  return members;
}
