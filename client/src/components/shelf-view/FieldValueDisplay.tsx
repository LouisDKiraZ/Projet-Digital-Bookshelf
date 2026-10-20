import { API_URL } from '../../api/httpClient';
import type { ItemFieldValue, SavedField } from '../../types/shelf';
import styles from './FieldValueDisplay.module.css';

interface FieldValueDisplayProps {
  field: SavedField;
  value: ItemFieldValue;
}

export function FieldValueDisplay({ field, value }: FieldValueDisplayProps) {
  if (value === null || value === undefined || value === '') {
    return <span className={styles.empty}>—</span>;
  }

  if (field.fieldType === 'photo' && typeof value === 'string') {
    return <img className={styles.thumbnail} src={`${API_URL}${value}`} alt="" />;
  }

  if (field.fieldType === 'person' && typeof value === 'object') {
    return <span>{value.displayName}</span>;
  }

  if (typeof value === 'number') {
    return <span>{value.toLocaleString()}</span>;
  }

  return <span>{String(value)}</span>;
}
