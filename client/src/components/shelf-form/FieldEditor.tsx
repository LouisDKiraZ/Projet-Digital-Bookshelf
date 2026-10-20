import type { FieldType } from '../../types/shelf';
import type { FieldFormState } from '../../types/shelfForm';
import styles from './FieldEditor.module.css';

interface FieldEditorProps {
  field: FieldFormState;
  fieldTypes: FieldType[];
  onChange: (field: FieldFormState) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function FieldEditor({ field, fieldTypes, onChange, onRemove, canRemove }: FieldEditorProps) {
  const selectedType = fieldTypes.find((type) => type.id === field.fieldType);

  return (
    <div>
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Criterion name (e.g. Author, Price)"
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
          maxLength={40}
        />
        <select
          className={styles.select}
          value={field.fieldType}
          onChange={(event) => onChange({ ...field, fieldType: event.target.value })}
        >
          {fieldTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <label className={styles.requiredToggle}>
          <input
            type="checkbox"
            checked={field.isRequired}
            onChange={(event) => onChange({ ...field, isRequired: event.target.checked })}
          />
          Required
        </label>
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? 'Remove this criterion' : 'An item type needs at least one criterion'}
        >
          Remove
        </button>
      </div>
      {selectedType?.hasOptions && (
        <div className={styles.optionsRow}>
          <input
            className={styles.optionsInput}
            placeholder="Options, separated by commas (e.g. Fantasy, Sci-Fi, Mystery)"
            value={field.listOptionsText}
            onChange={(event) => onChange({ ...field, listOptionsText: event.target.value })}
          />
        </div>
      )}
      {selectedType && <p className={styles.hint}>{selectedType.description}</p>}
    </div>
  );
}
