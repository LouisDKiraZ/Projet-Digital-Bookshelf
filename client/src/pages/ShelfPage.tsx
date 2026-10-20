import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchShelf, fetchShelfMembers } from '../api/shelfApi';
import { rememberShelf } from '../lib/recentShelves';
import type { SavedShelf, ShelfMember } from '../types/shelf';
import { ShelfIcon } from '../components/shelf/ShelfIcon';
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
  const [selectedItemTypeId, setSelectedItemTypeId] = useState<number | null>(null);

  useEffect(() => {
    if (!shelfId) {
      return;
    }
    Promise.all([fetchShelf(shelfId), fetchShelfMembers(shelfId)])
      .then(([loadedShelf, loadedMembers]) => {
        setShelf(loadedShelf);
        setMembers(loadedMembers);
        setSelectedItemTypeId(loadedShelf.itemTypes[0]?.id ?? null);
        rememberShelf({ id: loadedShelf.id, name: loadedShelf.name, icon: loadedShelf.icon });
      })
      .catch(() => setError('This shelf could not be found.'));
  }, [shelfId]);

  if (error) {
    return <p>{error}</p>;
  }
  if (!shelf || selectedItemTypeId === null) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.page}>
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
          People
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'items' && (
          <ItemsTab
            shelf={shelf}
            members={members}
            selectedItemTypeId={selectedItemTypeId}
            onSelectItemType={setSelectedItemTypeId}
          />
        )}
        {tab === 'statistics' && (
          <StatisticsTab
            shelf={shelf}
            selectedItemTypeId={selectedItemTypeId}
            onSelectItemType={setSelectedItemTypeId}
          />
        )}
        {tab === 'people' && <PeopleTab members={members} />}
      </div>
    </div>
  );
}
