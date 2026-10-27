import { useEffect, useState } from 'react';
import { API_URL } from '../../api/httpClient';
import type { SavedField, SavedItem, SavedItemType, ShelfMember } from '../../types/shelf';
import { FieldValueInput } from './FieldValueInput';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import styles from './ItemFormDialog.module.css';

interface ItemFormDialogProps {
  itemType: SavedItemType;
  members: ShelfMember[];
  initialItem: SavedItem | null;
  onSubmit: (values: Record<number, string>, photoFiles: Record<number, File>) => Promise<void>;
  onClose: () => void;
}

function initialValueFor(field: SavedField, item: SavedItem | null): string {
  if (!item) {
    return '';
  }
  const value = item.values[String(field.id)];
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'object' ? String(value.id) : String(value);
}

export function ItemFormDialog({ itemType, members, initialItem, onSubmit, onClose }: ItemFormDialogProps) {
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(itemType.fields.map((field) => [field.id, initialValueFor(field, initialItem)])),
  );
  const [photoFiles, setPhotoFiles] = useState<Record<number, File>>({});
  const [previews, setPreviews] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(
      itemType.fields
        .filter((field) => field.fieldType === 'photo')
        .map((field) => {
          const current = initialValueFor(field, initialItem);
          return [field.id, current ? `${API_URL}${current}` : null];
        }),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(
    () => () => {
      for (const url of Object.values(previews)) {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
    },
    // Only clean up on unmount — `previews` deliberately isn't a dep here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handlePhotoChange(fieldId: number, file: File) {
    setPhotoFiles((prev) => ({ ...prev, [fieldId]: file }));
    setPreviews((prev) => {
      const previous = prev[fieldId];
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return { ...prev, [fieldId]: URL.createObjectURL(file) };
    });
  }

  function handleClearPhoto(fieldId: number) {
    setValues((prev) => ({ ...prev, [fieldId]: '' }));
    setPhotoFiles((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setPreviews((prev) => {
      const previous = prev[fieldId];
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return { ...prev, [fieldId]: null };
    });
  }

  function validate(): string | null {
    for (const field of itemType.fields) {
      if (!field.isRequired) {
        continue;
      }
      const satisfied =
        field.fieldType === 'photo'
          ? Boolean(photoFiles[field.id] || values[field.id])
          : Boolean(values[field.id]?.trim());
      if (!satisfied) {
        return `"${field.label}" is required.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(values, photoFiles);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={initialItem ? `Edit "${itemType.name}"` : `Add "${itemType.name}"`} onClose={onClose}>
      <div className={styles.form}>
        {itemType.fields.map((field) => (
          <div key={field.id} className={styles.row}>
            <label className={styles.label}>
              {field.label}
              {field.isRequired && <span className={styles.required}> *</span>}
            </label>
            <FieldValueInput
              field={field}
              value={values[field.id] ?? ''}
              onChange={(value) => setValues((prev) => ({ ...prev, [field.id]: value }))}
              members={members}
              previewUrl={previews[field.id] ?? null}
              onPhotoChange={(file) => handlePhotoChange(field.id, file)}
              onClearPhoto={() => handleClearPhoto(field.id)}
            />
          </div>
        ))}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
