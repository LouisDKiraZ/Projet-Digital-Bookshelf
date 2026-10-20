import type { SavedField, ShelfMember } from '../../types/shelf';
import styles from './FieldValueInput.module.css';

interface FieldValueInputProps {
  field: SavedField;
  value: string;
  onChange: (value: string) => void;
  members: ShelfMember[];
  previewUrl: string | null;
  onPhotoChange: (file: File) => void;
  onClearPhoto: () => void;
}

// Renders the right input for a criterion's field type — the data-entry
// counterpart to FieldEditor, which only lets you DEFINE a criterion.
export function FieldValueInput({
  field,
  value,
  onChange,
  members,
  previewUrl,
  onPhotoChange,
  onClearPhoto,
}: FieldValueInputProps) {
  switch (field.fieldType) {
    case 'number':
      return (
        <input
          className={styles.input}
          type="number"
          step="any"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'date':
      return (
        <input
          className={styles.input}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'list':
      return (
        <select
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select...</option>
          {field.listOptions?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case 'person':
      return (
        <select
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select a person...</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      );
    case 'photo':
      return (
        <div className={styles.photoRow}>
          {previewUrl ? (
            <img className={styles.photoPreview} src={previewUrl} alt="" />
          ) : (
            <div className={styles.photoPlaceholder}>No photo</div>
          )}
          <label className={styles.photoButton}>
            Choose a photo
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onPhotoChange(file);
                }
              }}
            />
          </label>
          {previewUrl && (
            <button type="button" className={styles.photoClear} onClick={onClearPhoto}>
              Remove
            </button>
          )}
        </div>
      );
    default:
      return (
        <input
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={500}
        />
      );
  }
}
