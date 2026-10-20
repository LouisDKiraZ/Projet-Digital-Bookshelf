import { API_URL } from '../../api/httpClient';
import styles from './ShelfIcon.module.css';

interface ShelfIconProps {
  icon: { type: 'emoji' | 'image'; value: string; bgColor: string | null };
  size?: number;
}

// Shared so the emoji+background "shelf image" looks the same wherever a
// shelf is shown — the home page's recent-shelves list and the shelf
// page's own header. A shelf created before bgColor existed just falls
// back to the default swatch.
export function ShelfIcon({ icon, size = 56 }: ShelfIconProps) {
  const style = { width: size, height: size };

  if (icon.type === 'image') {
    return (
      <img
        className={styles.image}
        style={style}
        src={`${API_URL}${icon.value}`}
        alt=""
      />
    );
  }

  return (
    <span
      className={styles.emojiTile}
      style={{ ...style, background: icon.bgColor ?? '#f1e4d3', fontSize: size * 0.56 }}
    >
      {icon.value}
    </span>
  );
}
