import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUser } from '../../context/UserContext';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandEmoji} aria-hidden="true">
            📖
          </span>
          Digital Bookshelf
        </Link>
        {user && <span className={styles.viewer}>Signed in as {user.displayName}</span>}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
