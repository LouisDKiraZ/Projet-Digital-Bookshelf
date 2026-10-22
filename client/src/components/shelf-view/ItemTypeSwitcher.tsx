import type { SavedItemType } from '../../types/shelf';
import styles from './ItemTypeSwitcher.module.css';

interface ItemTypeSwitcherProps {
  itemTypes: SavedItemType[];
  selectedId: number | null;
  onSelect: (itemTypeId: number | null) => void;
  includeAll?: boolean;
}

// A shelf can hold several item types (e.g. Book, Manga); both the Items
// tab and the Statistics tab need to let you pick which one you're
// looking at, so this is shared between them.
export function ItemTypeSwitcher({
  itemTypes,
  selectedId,
  onSelect,
  includeAll = false,
}: ItemTypeSwitcherProps) {
  if (itemTypes.length <= 1 && !includeAll) {
    return null;
  }

  return (
    <div className={styles.tabs}>
      {includeAll && (
        <button
          type="button"
          className={`${styles.tab} ${selectedId === null ? styles.tabActive : ''}`}
          onClick={() => onSelect(null)}
        >
          All
        </button>
      )}
      {itemTypes.map((itemType) => (
        <button
          key={itemType.id}
          type="button"
          className={`${styles.tab} ${itemType.id === selectedId ? styles.tabActive : ''}`}
          onClick={() => onSelect(itemType.id)}
        >
          {itemType.name}
        </button>
      ))}
    </div>
  );
}
