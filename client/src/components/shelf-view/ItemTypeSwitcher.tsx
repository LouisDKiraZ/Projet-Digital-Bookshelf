import type { SavedItemType } from '../../types/shelf';
import styles from './ItemTypeSwitcher.module.css';

interface ItemTypeSwitcherProps {
  itemTypes: SavedItemType[];
  selectedId: number;
  onSelect: (itemTypeId: number) => void;
}

// A shelf can hold several item types (e.g. Book, Manga); both the Items
// tab and the Statistics tab need to let you pick which one you're
// looking at, so this is shared between them.
export function ItemTypeSwitcher({ itemTypes, selectedId, onSelect }: ItemTypeSwitcherProps) {
  if (itemTypes.length <= 1) {
    return null;
  }

  return (
    <div className={styles.tabs}>
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
