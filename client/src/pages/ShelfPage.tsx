import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchShelf, fetchShelfMembers } from '../api/shelfApi';
import { rememberShelf } from '../lib/recentShelves';
import type { SavedShelf, ShelfMember } from '../types/shelf';
import { ShelfIcon } from '../components/shelf/ShelfIcon';
import { Button } from '../components/common/Button';
import { ItemsTab } from '../components/shelf-view/ItemsTab';
import { StatisticsTab } from '../components/shelf-view/StatisticsTab';
import { PeopleTab } from '../components/shelf-view/PeopleTab';
import styles from './ShelfPage.module.css';

type Tab = 'items' | 'statistics' | 'people';

export function ShelfPage() {
  const { id } = useParams<{ id: string }>();
  const shelfId = Number(id);

  const [shelf, setShelf] = useState<SavedShelf | null>(null);
  const [members, setMembers] = useState<ShelfMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('items');
  const [selectedItemsTypeId, setSelectedItemsTypeId] = useState<number | null>(null);
  const [selectedStatsTypeId, setSelectedStatsTypeId] = useState<number | null>(null);

  function loadShelf() {
    if (!shelfId) {
      return;
    }
    Promise.all([fetchShelf(shelfId), fetchShelfMembers(shelfId)])
      .then(([loadedShelf, loadedMembers]) => {
        setShelf(loadedShelf);
        setMembers(loadedMembers);
        setSelectedItemsTypeId(null);
        setSelectedStatsTypeId(loadedShelf.itemTypes[0]?.id ?? null);
        rememberShelf({ id: loadedShelf.id, name: loadedShelf.name, icon: loadedShelf.icon });
      })
      .catch(() => setError('This shelf was not found.'));
  }

  useEffect(() => {
    loadShelf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfId]);

  if (error) {
    return <p>{error}</p>;
  }
  if (!shelf || selectedStatsTypeId === null) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.actionsRow}>
        <Button as="link" to="/" variant="secondary" size="small">
          Back to shelves
        </Button>
        <Button as="link" to={`/shelves/${shelf.id}/edit`} variant="secondary" size="small">
          Edit shelf
        </Button>
      </div>

      <div className={styles.header}>
        <ShelfIcon icon={shelf.icon} size={56} />
        <h1 className={styles.name}>{shelf.name}</h1>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'items' ? styles.tabActive : ''}`}
          onClick={() => setTab('items')}
        >
          Items
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'statistics' ? styles.tabActive : ''}`}
          onClick={() => setTab('statistics')}
        >
          Statistics
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'people' ? styles.tabActive : ''}`}
          onClick={() => setTab('people')}
        >
          Members
        </button>
      </div>

      <div className={styles.content} key={tab}>
        {tab === 'items' && (
          <ItemsTab
            shelf={shelf}
            members={members}
            selectedItemTypeId={selectedItemsTypeId}
            onSelectItemType={setSelectedItemsTypeId}
          />
        )}
        {tab === 'statistics' && (
          <StatisticsTab
            shelf={shelf}
            selectedItemTypeId={selectedStatsTypeId}
            onSelectItemType={setSelectedStatsTypeId}
          />
        )}
        {tab === 'people' && <PeopleTab shelf={shelf} members={members} />}
      </div>
    </div>
  );
}
