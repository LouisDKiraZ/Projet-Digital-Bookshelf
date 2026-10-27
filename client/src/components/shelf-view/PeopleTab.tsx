import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { fetchPendingInvitation, searchUsers, sendInvitation } from '../../api/notificationsApi';
import { Button } from '../common/Button';
import { Modal } from './Modal';
import type { SavedShelf, ShelfMember } from '../../types/shelf';
import styles from './PeopleTab.module.css';

interface PeopleTabProps {
  shelf: SavedShelf;
  members: ShelfMember[];
}

export function PeopleTab({ shelf, members }: PeopleTabProps) {
  const { user } = useUser();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShelfMember[]>([]);
  const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(new Set());
  const [sendingUserId, setSendingUserId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !user) {
      setResults([]);
      return;
    }
    const timeoutId = window.setTimeout(async () => {
      const excludeIds = [...members.map((member) => member.id), user.id];
      const found = await searchUsers(trimmed, excludeIds);
      setResults(found);
      const pendingChecks = await Promise.all(
        found.map((candidate) => fetchPendingInvitation(shelf.id, candidate.id)),
      );
      setPendingUserIds(
        new Set(found.filter((_candidate, index) => pendingChecks[index] !== null).map((candidate) => candidate.id)),
      );
    }, 300);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, shelf.id, user?.id]);

  function openInviteModal() {
    setIsInviteOpen(true);
    setQuery('');
    setResults([]);
    setSearchError(null);
  }

  async function handleInvite(targetUserId: number) {
    if (!user) {
      return;
    }
    setSendingUserId(targetUserId);
    setSearchError(null);
    try {
      await sendInvitation(shelf.id, user.id, targetUserId);
      setPendingUserIds((prev) => new Set(prev).add(targetUserId));
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Unable to send the invitation.");
    } finally {
      setSendingUserId(null);
    }
  }

  return (
    <div className={styles.tab}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Members</h2>
        <Button variant="primary" size="small" onClick={openInviteModal}>
          Invite someone
        </Button>
      </div>

      <ul className={styles.list}>
        {members.map((member) => (
          <li key={member.id} className={styles.member}>
            {member.displayName}
          </li>
        ))}
      </ul>

      {isInviteOpen && (
        <Modal title="Invite someone" onClose={() => setIsInviteOpen(false)}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          {searchError && <p className={styles.error}>{searchError}</p>}

          <ul className={styles.resultList}>
            {results.map((result) => {
              const isPending = pendingUserIds.has(result.id);
              return (
                <li key={result.id} className={styles.resultItem}>
                  <span className={styles.resultName}>{result.displayName}</span>
                  {isPending ? (
                    <span className={styles.sentBadge}>✓ Invitation sent</span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={sendingUserId === result.id}
                      onClick={() => handleInvite(result.id)}
                    >
                      Invite
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          {query.trim() && results.length === 0 && (
            <p className={styles.hint}>No user found for "{query.trim()}".</p>
          )}
        </Modal>
      )}
    </div>
  );
}
