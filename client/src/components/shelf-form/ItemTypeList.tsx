import type { FieldType, FieldSuggestion } from '../../types/shelf';
import { createEmptyItemType, type ItemTypeFormState, parseListOptions } from '../../types/shelfForm';
import { ItemTypeEditor } from './ItemTypeEditor';
import styles from './ItemTypeList.module.css';

interface ItemTypeListProps {
  itemTypes: ItemTypeFormState[];
  fieldTypes: FieldType[];
  globalSuggestions: FieldSuggestion[];
  onChange: (itemTypes: ItemTypeFormState[]) => void;
}

// Fields already defined on OTHER item types in this same draft are just
// as reusable as the ones fetched from the server (e.g. "Author" defined
// on "Book" should be suggested again while defining "Manga").
function collectLocalSuggestions(
  itemTypes: ItemTypeFormState[],
  excludeUiId: string,
): FieldSuggestion[] {
  return itemTypes
    .filter((itemType) => itemType.uiId !== excludeUiId)
    .flatMap((itemType) =>
      itemType.fields
        .filter((field) => field.label.trim())
        .map((field) => ({
          label: field.label.trim(),
          fieldType: field.fieldType,
          listOptions: parseListOptions(field.listOptionsText) || null,
        })),
    );
}

function dedupeSuggestions(suggestions: FieldSuggestion[]): FieldSuggestion[] {
  const seen = new Map<string, FieldSuggestion>();
  for (const suggestion of suggestions) {
    const key = `${suggestion.label.toLowerCase()}|${suggestion.fieldType}`;
    if (!seen.has(key)) {
      seen.set(key, suggestion);
    }
  }
  return [...seen.values()];
}

export function ItemTypeList({
  itemTypes,
  fieldTypes,
  globalSuggestions,
  onChange,
}: ItemTypeListProps) {
  function updateItemType(uiId: string, updated: ItemTypeFormState) {
    onChange(itemTypes.map((itemType) => (itemType.uiId === uiId ? updated : itemType)));
  }

  function removeItemType(uiId: string) {
    onChange(itemTypes.filter((itemType) => itemType.uiId !== uiId));
  }

  function addItemType() {
    onChange([...itemTypes, createEmptyItemType()]);
  }

  return (
    <div className={styles.list}>
      {itemTypes.map((itemType) => (
        <ItemTypeEditor
          key={itemType.uiId}
          itemType={itemType}
          fieldTypes={fieldTypes}
          suggestions={dedupeSuggestions([
            ...collectLocalSuggestions(itemTypes, itemType.uiId),
            ...globalSuggestions,
          ])}
          onChange={(updated) => updateItemType(itemType.uiId, updated)}
          onRemove={() => removeItemType(itemType.uiId)}
          canRemove={itemTypes.length > 1}
        />
      ))}
      <button type="button" className={styles.addButton} onClick={addItemType}>
        + Add another item type
      </button>
    </div>
  );
}
