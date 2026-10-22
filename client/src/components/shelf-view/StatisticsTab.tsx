import { useEffect, useState } from 'react';
import { fetchItems } from '../../api/itemsApi';
import type { SavedItem, SavedShelf } from '../../types/shelf';
import { ItemTypeSwitcher } from './ItemTypeSwitcher';
import { BarChart } from '../charts/BarChart';
import { buildChartData, getDimensionOptions } from '../../lib/statistics';
import styles from './StatisticsTab.module.css';

interface StatisticsTabProps {
  shelf: SavedShelf;
  selectedItemTypeId: number;
  onSelectItemType: (itemTypeId: number | null) => void;
}

// No dedicated stats endpoint: this reuses the same item list the Items
// tab fetches and slices it client-side by whichever criterion (or
// "Added by") the reader picks — point-and-click instead of a pivot
// table, which is the "more accessible than Excel" ask.
export function StatisticsTab({ shelf, selectedItemTypeId, onSelectItemType }: StatisticsTabProps) {
  const itemType = shelf.itemTypes.find((candidate) => candidate.id === selectedItemTypeId) ?? shelf.itemTypes[0];
  const dimensionOptions = getDimensionOptions(itemType);

  const [dimensionKey, setDimensionKey] = useState(dimensionOptions[0].key);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchItems(shelf.id, itemType.id)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, [shelf.id, itemType.id]);

  useEffect(() => {
    setDimensionKey(getDimensionOptions(itemType)[0].key);
  }, [itemType.id]);

  const data = buildChartData(itemType, dimensionKey, items);
  const selectedOption = dimensionOptions.find((option) => option.key === dimensionKey) ?? dimensionOptions[0];
  const isPerItemNumber = selectedOption.field?.fieldType === 'number';

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <ItemTypeSwitcher
          itemTypes={shelf.itemTypes}
          selectedId={itemType.id}
          onSelect={(itemTypeId) => {
            if (itemTypeId !== null) {
              onSelectItemType(itemTypeId);
            }
          }}
        />
        <label className={styles.selectRow}>
          Chart by
          <select
            className={styles.select}
            value={dimensionKey}
            onChange={(event) => setDimensionKey(event.target.value)}
          >
            {dimensionOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className={styles.hint}>Loading...</p>}

      {!isLoading && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              {itemType.name} by {selectedOption.label}
            </h3>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowTable((current) => !current)}
            >
              {showTable ? 'Show chart' : 'Show as table'}
            </button>
          </div>

          {showTable ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isPerItemNumber ? 'Item' : selectedOption.label}</th>
                  <th>{isPerItemNumber ? selectedOption.label : 'Count'}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((datum) => (
                  <tr key={datum.label}>
                    <td>{datum.label}</td>
                    <td>{datum.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <BarChart data={data} ariaLabel={`${itemType.name} by ${selectedOption.label}`} />
          )}
        </div>
      )}
    </div>
  );
}
