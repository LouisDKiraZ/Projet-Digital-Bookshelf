// Turns a shelf's items into chart-ready data for any criterion (field)
// of their item type, or for who added them. No dedicated stats endpoint —
// the item list already fetched for the Items tab is enough to compute
// this client-side.

import type { SavedField, SavedItem, SavedItemType } from '../types/shelf';
import type { BarChartDatum } from '../components/charts/BarChart';

export const ADDED_BY_DIMENSION = 'addedBy';
const NOT_SET = '(Not set)';

export interface DimensionOption {
  key: string;
  label: string;
  field: SavedField | null;
}

// `photo` isn't meaningful to chart, so it's left out of the picker.
export function getDimensionOptions(itemType: SavedItemType): DimensionOption[] {
  return [
    { key: ADDED_BY_DIMENSION, label: 'Added by', field: null },
    ...itemType.fields
      .filter((field) => field.fieldType !== 'photo')
      .map((field) => ({ key: String(field.id), label: field.label, field })),
  ];
}

function itemDisplayLabel(item: SavedItem, fields: SavedField[]): string {
  const firstTextField = fields.find((field) => field.fieldType === 'text');
  const value = firstTextField ? item.values[String(firstTextField.id)] : null;
  return typeof value === 'string' && value.trim() ? value : `Item #${item.id}`;
}

function countBy(items: SavedItem[], keyFn: (item: SavedItem) => string): BarChartDatum[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

export function buildChartData(
  itemType: SavedItemType,
  dimensionKey: string,
  items: SavedItem[],
): BarChartDatum[] {
  if (dimensionKey === ADDED_BY_DIMENSION) {
    return countBy(items, (item) => item.createdBy.displayName);
  }

  const field = itemType.fields.find((candidate) => String(candidate.id) === dimensionKey);
  if (!field) {
    return [];
  }

  if (field.fieldType === 'number') {
    return items
      .map((item) => {
        const value = item.values[String(field.id)];
        return typeof value === 'number'
          ? { label: itemDisplayLabel(item, itemType.fields), value }
          : null;
      })
      .filter((datum): datum is BarChartDatum => datum !== null)
      .sort((a, b) => b.value - a.value);
  }

  if (field.fieldType === 'date') {
    return countBy(items, (item) => {
      const value = item.values[String(field.id)];
      return typeof value === 'string' ? value.slice(0, 7) : NOT_SET;
    }).sort((a, b) => a.label.localeCompare(b.label));
  }

  if (field.fieldType === 'person') {
    return countBy(items, (item) => {
      const value = item.values[String(field.id)];
      return value && typeof value === 'object' ? value.displayName : NOT_SET;
    });
  }

  // text and list fields: group by their exact value.
  return countBy(items, (item) => {
    const value = item.values[String(field.id)];
    return typeof value === 'string' && value.trim() ? value : NOT_SET;
  });
}
