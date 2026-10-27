import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchShelves } from '../api/shelfApi';
import type { SavedShelf } from '../types/shelf';
import { ShelfIcon } from '../components/shelf/ShelfIcon';
import { Button } from '../components/common/Button';
import styles from './HomePage.module.css';

export function HomePage() {
  const [shelves, setShelves] = useState<SavedShelf[]>([]);

  useEffect(() => {
    fetchShelves().then(setShelves).catch(() => setShelves([]));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Keep a shared shelf of everything you collect</h1>
        <p className={styles.subtitle}>
          Create a shelf for your books, vinyls, or any other collection, invite the
          people you collect with, and define exactly what you want to track
          for each item.
        </p>
        <Button as="link" to="/create" variant="primary" className={styles.cta}>
          Create a shelf
        </Button>
      </div>

      {shelves.length > 0 && (
        <div className={styles.recent}>
          <h2 className={styles.recentTitle}>Your shelves</h2>
          <p className={styles.recentHint}>Stored locally in this browser.</p>
          <ul className={styles.recentList}>
            {shelves.map((shelf, index) => (
              <li
                key={shelf.id}
                className={styles.recentItem}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
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
