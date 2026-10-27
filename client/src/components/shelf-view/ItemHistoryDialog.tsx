import { useEffect, useState } from 'react';
import { fetchItemHistory } from '../../api/itemsApi';
import type { ItemHistoryEntry } from '../../types/shelf';
import { Modal } from './Modal';
import styles from './ItemHistoryDialog.module.css';

interface ItemHistoryDialogProps {
  shelfId: number;
  itemId: number;
  itemLabel: string;
  onClose: () => void;
}

function describe(entry: ItemHistoryEntry): string {
  if (entry.changeType === 'created') {
    return 'Added this item';
  }
  if (entry.changeType === 'deleted') {
    return 'Removed this item';
  }
  return `Changed "${entry.fieldLabel}" from "${entry.oldValue ?? '(not set)'}" to "${entry.newValue ?? '(not set)'}"`;
}

export function ItemHistoryDialog({ shelfId, itemId, itemLabel, onClose }: ItemHistoryDialogProps) {
  const [entries, setEntries] = useState<ItemHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItemHistory(shelfId, itemId)
      .then(setEntries)
      .catch(() => setError("Unable to load this item's history."));
  }, [shelfId, itemId]);

  return (
    <Modal title={`History — ${itemLabel}`} onClose={onClose}>
      {error && <p className={styles.error}>{error}</p>}
      {!error && !entries && <p className={styles.hint}>Loading...</p>}
      {entries && entries.length === 0 && <p className={styles.hint}>No history yet.</p>}
      {entries && entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <p className={styles.description}>{describe(entry)}</p>
              <p className={styles.meta}>
                {entry.changedBy.displayName} — {new Date(entry.changedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
