import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUser } from '../../context/UserContext';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useUser();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandEmoji} aria-hidden="true">
            📚
          </span>
          Digital Bookshelf
        </Link>
        {user && (
          <div className={styles.userMenu}>
            <NotificationBell />
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className={styles.viewer}>{user.displayName}</span>
            </div>
            <Button variant="secondary" size="small" onClick={logout}>
              Log out
            </Button>
          </div>
        )}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
