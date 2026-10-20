import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { fetchItems, createItem, updateItem, deleteItem } from '../../api/itemsApi';
import { ApiError } from '../../api/httpClient';
import type { SavedItem, SavedItemType, SavedShelf, ShelfMember } from '../../types/shelf';
import { ItemTypeSwitcher } from './ItemTypeSwitcher';
import { FieldValueDisplay } from './FieldValueDisplay';
import { ItemFormDialog } from './ItemFormDialog';
import { ItemHistoryDialog } from './ItemHistoryDialog';
import styles from './ItemsTab.module.css';

interface ItemsTabProps {
  shelf: SavedShelf;
  members: ShelfMember[];
  selectedItemTypeId: number;
  onSelectItemType: (itemTypeId: number) => void;
}

function itemLabel(item: SavedItem, itemType: SavedItemType): string {
  const firstTextField = itemType.fields.find((field) => field.fieldType === 'text');
  const value = firstTextField ? item.values[String(firstTextField.id)] : null;
  return typeof value === 'string' && value.trim() ? value : `Item #${item.id}`;
}

export function ItemsTab({ shelf, members, selectedItemTypeId, onSelectItemType }: ItemsTabProps) {
  const { user } = useUser();
  const itemType = shelf.itemTypes.find((candidate) => candidate.id === selectedItemTypeId) ?? shelf.itemTypes[0];

  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
  const [historyItem, setHistoryItem] = useState<SavedItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchItems(shelf.id, itemType.id)
      .then(setItems)
      .catch(() => setError('Could not load items for this shelf.'))
      .finally(() => setIsLoading(false));
  }, [shelf.id, itemType.id]);

  if (!user) {
    return null;
  }
  const userId = user.id;

  async function handleCreate(values: Record<number, string>, photoFiles: Record<number, File>) {
    const created = await createItem(shelf.id, itemType.id, userId, { values, photoFiles });
    setItems((prev) => [...prev, created]);
    setIsCreating(false);
  }

  async function handleUpdate(values: Record<number, string>, photoFiles: Record<number, File>) {
    if (!editingItem) {
      return;
    }
    const updated = await updateItem(shelf.id, editingItem.id, userId, { values, photoFiles });
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
  }

  async function handleDelete(item: SavedItem) {
    if (!window.confirm(`Remove "${itemLabel(item, itemType)}"? This can't be undone.`)) {
      return;
    }
    try {
      await deleteItem(shelf.id, item.id, userId);
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : 'Could not remove this item.');
    }
  }

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <ItemTypeSwitcher
          itemTypes={shelf.itemTypes}
          selectedId={itemType.id}
          onSelect={onSelectItemType}
        />
        <button type="button" className={styles.addButton} onClick={() => setIsCreating(true)}>
          + Add {itemType.name}
        </button>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}
      {isLoading && <p className={styles.hint}>Loading...</p>}
      {!isLoading && items.length === 0 && (
        <p className={styles.hint}>No {itemType.name.toLowerCase()} items yet.</p>
      )}

      {!isLoading && items.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {itemType.fields.map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
                <th>Added by</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {itemType.fields.map((field) => (
                    <td key={field.id}>
                      <FieldValueDisplay field={field} value={item.values[String(field.id)]} />
                    </td>
                  ))}
                  <td className={styles.addedBy}>{item.createdBy.displayName}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setHistoryItem(item)}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className={styles.linkButtonDanger}
                        onClick={() => handleDelete(item)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && (
        <ItemFormDialog
          itemType={itemType}
          members={members}
          initialItem={null}
          onSubmit={handleCreate}
          onClose={() => setIsCreating(false)}
        />
      )}
      {editingItem && (
        <ItemFormDialog
          itemType={itemType}
          members={members}
          initialItem={editingItem}
          onSubmit={handleUpdate}
          onClose={() => setEditingItem(null)}
        />
      )}
      {historyItem && (
        <ItemHistoryDialog
          shelfId={shelf.id}
          itemId={historyItem.id}
          itemLabel={itemLabel(historyItem, itemType)}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </div>
  );
}
