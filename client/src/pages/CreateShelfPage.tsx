import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { fetchFieldTypes } from '../api/fieldTypesApi';
import { fetchFieldSuggestions } from '../api/fieldSuggestionsApi';
import { createShelf } from '../api/shelfApi';
import { ApiError } from '../api/httpClient';
import { rememberShelf } from '../lib/recentShelves';
import type { FieldType, FieldSuggestion, ShelfDraft } from '../types/shelf';
import { createEmptyItemType, parseListOptions, type ItemTypeFormState } from '../types/shelfForm';
import { ShelfIconPicker } from '../components/shelf-form/ShelfIconPicker';
import { ItemTypeList } from '../components/shelf-form/ItemTypeList';
import styles from './CreateShelfPage.module.css';

function validateDraft(
  name: string,
  iconMode: 'emoji' | 'image',
  emoji: string,
  imageFile: File | null,
  itemTypes: ItemTypeFormState[],
): string | null {
  if (!name.trim()) {
    return 'Please give your shelf a name.';
  }
  if (iconMode === 'emoji' && !emoji.trim()) {
    return 'Please pick an emoji for your shelf.';
  }
  if (iconMode === 'image' && !imageFile) {
    return 'Please choose a photo for your shelf.';
  }
  for (const itemType of itemTypes) {
    if (!itemType.name.trim()) {
      return 'Every item type needs a name.';
    }
    for (const field of itemType.fields) {
      if (!field.label.trim()) {
        return `Every criterion in "${itemType.name}" needs a name.`;
      }
      const type = field.fieldType;
      if (type === 'list' && parseListOptions(field.listOptionsText).length === 0) {
        return `Criterion "${field.label}" needs at least one option.`;
      }
    }
  }
  return null;
}

export function CreateShelfPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  const [name, setName] = useState('');
  const [iconMode, setIconMode] = useState<'emoji' | 'image'>('emoji');
  const [emoji, setEmoji] = useState('📚');
  const [bgColor, setBgColor] = useState('#f1e4d3');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [itemTypes, setItemTypes] = useState<ItemTypeFormState[]>([createEmptyItemType()]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchFieldTypes(), fetchFieldSuggestions()])
      .then(([types, loadedSuggestions]) => {
        setFieldTypes(types);
        setSuggestions(loadedSuggestions);
      })
      .catch(() => setError('Could not load the form from the server. Please refresh the page.'))
      .finally(() => setIsLoadingMeta(false));
  }, []);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setImagePreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit() {
    if (!user) {
      return;
    }

    const validationError = validateDraft(name, iconMode, emoji, imageFile, itemTypes);
    if (validationError) {
      setError(validationError);
      return;
    }

    const draft: ShelfDraft = {
      name: name.trim(),
      icon:
        iconMode === 'emoji'
          ? { type: 'emoji', value: emoji.trim(), bgColor }
          : { type: 'image', value: '', bgColor: null },
      itemTypes: itemTypes.map((itemType) => ({
        name: itemType.name.trim(),
        fields: itemType.fields.map((field) => ({
          label: field.label.trim(),
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          listOptions: field.fieldType === 'list' ? parseListOptions(field.listOptionsText) : null,
        })),
      })),
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const shelf = await createShelf(draft, user.id, imageFile);
      rememberShelf({ id: shelf.id, name: shelf.name, icon: shelf.icon });
      navigate(`/shelves/${shelf.id}`);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'Could not create the shelf.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingMeta) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Create a shelf</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Name and icon</h2>
        <input
          className={styles.nameInput}
          placeholder="Shelf name (e.g. Our vinyl collection)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
        />
        <ShelfIconPicker
          iconMode={iconMode}
          onIconModeChange={setIconMode}
          emoji={emoji}
          onEmojiChange={setEmoji}
          bgColor={bgColor}
          onBgColorChange={setBgColor}
          imagePreviewUrl={imagePreviewUrl}
          onImageSelected={handleImageSelected}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What can this shelf hold?</h2>
        <p className={styles.sectionHint}>
          Add one item type per kind of object (e.g. Book, Comic, Manga), and define what you
          want to track about each one.
        </p>
        <ItemTypeList
          itemTypes={itemTypes}
          fieldTypes={fieldTypes}
          globalSuggestions={suggestions}
          onChange={setItemTypes}
        />
      </section>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <div className={styles.submitRow}>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating shelf...' : 'Create shelf'}
        </button>
      </div>
    </div>
  );
}
