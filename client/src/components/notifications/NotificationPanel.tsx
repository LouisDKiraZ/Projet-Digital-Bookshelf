import type { AppNotification } from '../../types/shelf';
import { NotificationCard } from './NotificationCard';
import styles from './NotificationPanel.module.css';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onRespond: (invitationId: number, accept: boolean) => Promise<void>;
}

export function NotificationPanel({ notifications, onRespond }: NotificationPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Notifications</h3>
      {notifications.length === 0 ? (
        <p className={styles.empty}>You don't have any notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} onRespond={onRespond} />
        ))
      )}
    </div>
  );
}
