import type { FieldType, FieldSuggestion } from '../../types/shelf';
import { createEmptyField, type FieldFormState, type ItemTypeFormState } from '../../types/shelfForm';
import { FieldEditor } from './FieldEditor';
import { FieldSuggestions } from './FieldSuggestions';
import styles from './ItemTypeEditor.module.css';

interface ItemTypeEditorProps {
  itemType: ItemTypeFormState;
  fieldTypes: FieldType[];
  suggestions: FieldSuggestion[];
  onChange: (itemType: ItemTypeFormState) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function ItemTypeEditor({
  itemType,
  fieldTypes,
  suggestions,
  onChange,
  onRemove,
  canRemove,
}: ItemTypeEditorProps) {
  const usedLabels = new Set(itemType.fields.map((field) => field.label.trim().toLowerCase()));
  const relevantSuggestions = suggestions.filter(
    (suggestion) => !usedLabels.has(suggestion.label.toLowerCase()),
  );

  function updateField(uiId: string, updated: FieldFormState) {
    onChange({
      ...itemType,
      fields: itemType.fields.map((field) => (field.uiId === uiId ? updated : field)),
    });
  }

  function removeField(uiId: string) {
    onChange({ ...itemType, fields: itemType.fields.filter((field) => field.uiId !== uiId) });
  }

  function addField(preset?: FieldSuggestion) {
    const field = createEmptyField();
    if (preset) {
      field.label = preset.label;
      field.fieldType = preset.fieldType;
      field.listOptionsText = preset.listOptions?.join(', ') ?? '';
    }
    onChange({ ...itemType, fields: [...itemType.fields, field] });
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <input
          className={styles.nameInput}
          placeholder="Item type name (e.g. Book, Comic, Manga)"
          value={itemType.name}
          onChange={(event) => onChange({ ...itemType, name: event.target.value })}
          maxLength={40}
        />
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? 'Remove this item type' : 'A shelf needs at least one item type'}
        >
          Remove item type
        </button>
      </div>

      <div>
        <p className={styles.fieldsLabel}>What do you want to track about each {itemType.name || 'item'}?</p>
        <div className={styles.fieldsList}>
          {itemType.fields.map((field) => (
            <FieldEditor
              key={field.uiId}
              field={field}
              fieldTypes={fieldTypes}
              onChange={(updated) => updateField(field.uiId, updated)}
              onRemove={() => removeField(field.uiId)}
              canRemove={itemType.fields.length > 1}
            />
          ))}
        </div>
        <FieldSuggestions suggestions={relevantSuggestions} onPick={(preset) => addField(preset)} />
        <button type="button" className={styles.addFieldButton} onClick={() => addField()}>
          + Add a criterion
        </button>
      </div>
    </div>
  );
}
