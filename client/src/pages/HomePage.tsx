import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentShelves, forgetShelf, type RecentShelf } from '../lib/recentShelves';
import { ShelfIcon } from '../components/shelf/ShelfIcon';
import styles from './HomePage.module.css';

export function HomePage() {
  const [recentShelves, setRecentShelves] = useState<RecentShelf[]>([]);

  useEffect(() => {
    setRecentShelves(getRecentShelves());
  }, []);

  function handleForget(shelfId: number) {
    forgetShelf(shelfId);
    setRecentShelves((shelves) => shelves.filter((shelf) => shelf.id !== shelfId));
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Keep a shared shelf of anything you collect</h1>
        <p className={styles.subtitle}>
          Create a shelf for your books, vinyls, or any other collection, invite the people
          you collect with, and define exactly what you want to track about each item.
        </p>
        <Link to="/create" className={styles.cta}>
          Create a shelf
        </Link>
      </div>

      {recentShelves.length > 0 && (
        <div className={styles.recent}>
          <h2 className={styles.recentTitle}>Your shelves</h2>
          <p className={styles.recentHint}>Remembered on this device — not a real account yet.</p>
          <ul className={styles.recentList}>
            {recentShelves.map((shelf) => (
              <li key={shelf.id} className={styles.recentItem}>
                <Link to={`/shelves/${shelf.id}`} className={styles.recentLink}>
                  <ShelfIcon icon={shelf.icon} size={40} />
                  <span className={styles.recentName}>{shelf.name}</span>
                </Link>
                <button
                  type="button"
                  className={styles.forgetButton}
                  onClick={() => handleForget(shelf.id)}
                  title="Remove from this list (does not delete the shelf)"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
