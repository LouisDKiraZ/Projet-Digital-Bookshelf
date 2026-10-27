import { useState } from 'react';
import { Button } from '../common/Button';
import { ShelfIcon } from '../shelf/ShelfIcon';
import { formatRelativeTime } from '../../lib/relativeTime';
import type { AppNotification } from '../../types/shelf';
import styles from './NotificationCard.module.css';

interface NotificationCardProps {
  notification: AppNotification;
  onRespond: (invitationId: number, accept: boolean) => Promise<void>;
}

function buildMessage(notification: AppNotification): string {
  const actorName = notification.actor.displayName;
  const shelfName = notification.shelf.name;
  switch (notification.type) {
    case 'invite_received':
      return `${actorName} invited you to join "${shelfName}".`;
    case 'invite_accepted':
      return `${actorName} joined "${shelfName}". Your invitation was accepted!`;
    case 'invite_declined':
      return `${actorName} declined your invitation to join "${shelfName}".`;
    default:
      return '';
  }
}

export function NotificationCard({ notification, onRespond }: NotificationCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const isPendingInvite = notification.type === 'invite_received' && notification.invitationStatus === 'pending';

  async function handleRespond(accept: boolean) {
    if (!notification.invitationId || isResponding) {
      return;
    }
    setIsResponding(true);
    try {
      await onRespond(notification.invitationId, accept);
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <div className={`${styles.envelope} ${notification.readAt ? styles.read : styles.unread}`}>
      <div className={styles.flap} aria-hidden="true" />
      <div className={styles.seal} aria-hidden="true">
        <ShelfIcon icon={notification.shelf.icon} size={28} />
      </div>
      <div className={styles.body}>
        <p className={styles.message}>{buildMessage(notification)}</p>
        <span className={styles.time}>{formatRelativeTime(notification.createdAt)}</span>
        {isPendingInvite && (
          <div className={styles.actions}>
            <Button variant="primary" size="small" disabled={isResponding} onClick={() => handleRespond(true)}>
              Accept
            </Button>
            <Button variant="ghost" size="small" disabled={isResponding} onClick={() => handleRespond(false)}>
              Decline
            </Button>
          </div>
        )}
        {notification.type === 'invite_received' && notification.invitationStatus === 'accepted' && (
          <p className={styles.statusNote}>You accepted this invitation.</p>
        )}
        {notification.type === 'invite_received' && notification.invitationStatus === 'declined' && (
          <p className={styles.statusNote}>You declined this invitation.</p>
        )}
      </div>
    </div>
  );
}
