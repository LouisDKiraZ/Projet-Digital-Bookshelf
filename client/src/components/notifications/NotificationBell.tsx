import { useEffect, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  respondToInvitation,
} from '../../api/notificationsApi';
import { LOCAL_DB_STORAGE_KEY } from '../../lib/localStore';
import type { AppNotification } from '../../types/shelf';
import { NotificationPanel } from './NotificationPanel';
import styles from './NotificationBell.module.css';

export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousUnreadRef = useRef(0);

  async function refresh() {
    if (!user) {
      return;
    }
    const loaded = await fetchNotifications(user.id);
    const unreadCount = loaded.filter((entry) => !entry.readAt).length;
    if (unreadCount > previousUnreadRef.current) {
      setIsRinging(true);
    }
    previousUnreadRef.current = unreadCount;
    setNotifications(loaded);
  }

  useEffect(() => {
    refresh();
    function handleStorage(event: StorageEvent) {
      if (event.key === LOCAL_DB_STORAGE_KEY) {
        refresh();
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && user) {
      await markAllNotificationsRead(user.id);
      previousUnreadRef.current = 0;
      refresh();
    }
  }

  async function handleRespond(invitationId: number, accept: boolean) {
    if (!user) {
      return;
    }
    await respondToInvitation(invitationId, user.id, accept);
    refresh();
  }

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter((entry) => !entry.readAt).length;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.bell} ${isRinging ? styles.ringing : ''}`}
        onClick={handleToggle}
        onAnimationEnd={() => setIsRinging(false)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {isOpen && <NotificationPanel notifications={notifications} onRespond={handleRespond} />}
    </div>
  );
}
