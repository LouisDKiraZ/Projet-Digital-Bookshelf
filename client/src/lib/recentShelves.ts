// There's no shelf dashboard yet (see CLAUDE.md "Known gaps") — the only
// way back into a shelf is its URL. This keeps a small local record of
// shelves this browser has created or opened, so the home page can list
// them instead of making you recreate a shelf every time you test.

export interface RecentShelf {
  id: number;
  name: string;
  icon: { type: 'emoji' | 'image'; value: string; bgColor: string | null };
}

const STORAGE_KEY = 'digital-bookshelf.recentShelves';
const MAX_ENTRIES = 20;

function readAll(): RecentShelf[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(shelves: RecentShelf[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shelves));
}

export function getRecentShelves(): RecentShelf[] {
  return readAll();
}

export function rememberShelf(shelf: RecentShelf) {
  const withoutThisOne = readAll().filter((entry) => entry.id !== shelf.id);
  writeAll([shelf, ...withoutThisOne].slice(0, MAX_ENTRIES));
}

export function forgetShelf(shelfId: number) {
  writeAll(readAll().filter((entry) => entry.id !== shelfId));
}
