import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchShelves } from '../api/shelfApi';
import type { SavedShelf } from '../types/shelf';
import { ShelfIcon } from '../components/shelf/ShelfIcon';
import styles from './HomePage.module.css';

export function HomePage() {
  const [shelves, setShelves] = useState<SavedShelf[]>([]);

  useEffect(() => {
    fetchShelves().then(setShelves).catch(() => setShelves([]));
  }, []);

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

      {shelves.length > 0 && (
        <div className={styles.recent}>
          <h2 className={styles.recentTitle}>Shelves</h2>
          <p className={styles.recentHint}>Stored locally in this browser.</p>
          <ul className={styles.recentList}>
            {shelves.map((shelf) => (
              <li key={shelf.id} className={styles.recentItem}>
                <Link to={`/shelves/${shelf.id}`} className={styles.recentLink}>
                  <ShelfIcon icon={shelf.icon} size={40} />
                  <span className={styles.recentName}>{shelf.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
