import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { fetchItems, createItem, updateItem, deleteItem } from '../../api/itemsApi';
import { ApiError } from '../../api/httpClient';
import type { SavedItem, SavedItemType, SavedShelf, ShelfMember } from '../../types/shelf';
import { ItemTypeSwitcher } from './ItemTypeSwitcher';
import { FieldValueDisplay } from './FieldValueDisplay';
import { ItemFormDialog } from './ItemFormDialog';
import { ItemHistoryDialog } from './ItemHistoryDialog';
import { Button } from '../common/Button';
import styles from './ItemsTab.module.css';

interface ItemsTabProps {
  shelf: SavedShelf;
  members: ShelfMember[];
  selectedItemTypeId: number | null;
  onSelectItemType: (itemTypeId: number | null) => void;
}

function itemLabel(item: SavedItem, itemType: SavedItemType): string {
  const firstTextField = itemType.fields.find((field) => field.fieldType === 'text');
  const value = firstTextField ? item.values[String(firstTextField.id)] : null;
  return typeof value === 'string' && value.trim() ? value : `Item #${item.id}`;
}

export function ItemsTab({ shelf, members, selectedItemTypeId, onSelectItemType }: ItemsTabProps) {
  const { user } = useUser();
  const itemType = shelf.itemTypes.find((candidate) => candidate.id === selectedItemTypeId) ?? shelf.itemTypes[0];
  const isAllFilter = selectedItemTypeId === null;

  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
  const [historyItem, setHistoryItem] = useState<SavedItem | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchItems(shelf.id, selectedItemTypeId)
      .then(setItems)
      .catch(() => setError('Unable to load this shelf\'s items.'))
      .finally(() => setIsLoading(false));
  }, [shelf.id, selectedItemTypeId]);

  useEffect(() => {
    if (newItemId === null) {
      return;
    }
    const timeoutId = window.setTimeout(() => setNewItemId(null), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [newItemId]);

  if (!user) {
    return null;
  }
  const userId = user.id;

  async function handleCreate(values: Record<number, string>, photoFiles: Record<number, File>) {
    const created = await createItem(shelf.id, itemType.id, userId, { values, photoFiles });
    setItems((prev) => [...prev, created]);
    setNewItemId(created.id);
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

  async function handleDelete(item: SavedItem, itemTypeForItem: SavedItemType) {
    if (!window.confirm(`Remove "${itemLabel(item, itemTypeForItem)}"? This action is irreversible.`)) {
      return;
    }
    try {
      await deleteItem(shelf.id, item.id, userId);
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : 'Unable to remove this item.');
    }
  }

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <ItemTypeSwitcher
          itemTypes={shelf.itemTypes}
          selectedId={selectedItemTypeId}
          onSelect={onSelectItemType}
          includeAll
        />
        <Button variant="primary" size="small" onClick={() => setIsCreating(true)} disabled={isAllFilter}>
          + Add {itemType.name}
        </Button>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}
      {isLoading && <p className={styles.hint}>Loading...</p>}
      {!isLoading && items.length === 0 && (
        <p className={styles.hint}>
          {isAllFilter ? 'No items yet.' : `No items of type ${itemType.name.toLowerCase()} yet.`}
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              {isAllFilter ? (
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Added by</th>
                  <th aria-label="Actions" />
                </tr>
              ) : (
                <tr>
                  {itemType.fields.map((field) => (
                    <th key={field.id}>{field.label}</th>
                  ))}
                  <th>Added by</th>
                  <th aria-label="Actions" />
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((item) => {
                const itemTypeForRow =
                  shelf.itemTypes.find((candidate) => candidate.id === item.itemTypeId) ?? itemType;
                return (
                  <tr key={item.id} className={item.id === newItemId ? styles.isNew : ''}>
                    {isAllFilter ? (
                      <>
                        <td>{itemTypeForRow.name}</td>
                        <td>{itemLabel(item, itemTypeForRow)}</td>
                      </>
                    ) : (
                      itemType.fields.map((field) => (
                        <td key={field.id}>
                         <FieldValueDisplay field={field} value={item.values[String(field.id)]} />
                        </td>
                      ))
                    )}
                    <td className={styles.addedBy}>{item.createdBy.displayName}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                         type="button"
                         className={styles.linkButton}
                         onClick={() => {
                           onSelectItemType(item.itemTypeId);
                           setEditingItem(item);
                         }}
                        >
                         Edit
                        </button>
                        <button
                         type="button"
                         className={styles.linkButton}
                         onClick={() => {
                           onSelectItemType(item.itemTypeId);
                           setHistoryItem(item);
                         }}
                        >
                         History
                        </button>
                        <button
                         type="button"
                         className={styles.linkButtonDanger}
                         onClick={() => {
                           onSelectItemType(item.itemTypeId);
                           handleDelete(item, itemTypeForRow);
                         }}
                        >
                         Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
