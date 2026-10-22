import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { fetchFieldTypes } from '../api/fieldTypesApi';
import { fetchFieldSuggestions } from '../api/fieldSuggestionsApi';
import { createShelf, fetchShelf, updateShelf } from '../api/shelfApi';
import { ApiError } from '../api/httpClient';
import { rememberShelf } from '../lib/recentShelves';
import type { FieldType, FieldSuggestion, SavedShelf, ShelfDraft } from '../types/shelf';
import { createEmptyItemType, parseListOptions, type ItemTypeFormState } from '../types/shelfForm';
import { ShelfIconPicker } from '../components/shelf-form/ShelfIconPicker';
import { ItemTypeList } from '../components/shelf-form/ItemTypeList';
import styles from './CreateShelfPage.module.css';

interface CreateShelfPageProps {
  mode?: 'create' | 'edit';
}

function validateDraft(
  name: string,
  iconMode: 'emoji' | 'image',
  emoji: string,
  imageFile: File | null,
  imagePreviewUrl: string | null,
  itemTypes: ItemTypeFormState[],
): string | null {
  if (!name.trim()) {
    return 'Please give your shelf a name.';
  }
  if (iconMode === 'emoji' && !emoji.trim()) {
    return 'Please pick an emoji for your shelf.';
  }
  if (iconMode === 'image' && !imageFile && !imagePreviewUrl) {
    return 'Please choose a photo for your shelf.';
  }
  if (itemTypes.length === 0) {
    return 'Please add at least one item type.';
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

function toItemTypeFormState(shelf: SavedShelf): ItemTypeFormState[] {
  return shelf.itemTypes.map((itemType) => ({
    uiId: crypto.randomUUID(),
    savedId: itemType.id,
    name: itemType.name,
    fields: itemType.fields.map((field) => ({
      uiId: crypto.randomUUID(),
      savedId: field.id,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      listOptionsText: field.listOptions?.join(', ') ?? '',
    })),
  }));
}

export function CreateShelfPage({ mode = 'create' }: CreateShelfPageProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const editingShelfId = mode === 'edit' ? Number(id) : null;
  const resolvedEditingShelfId = editingShelfId ?? 0;

  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isLoadingShelf, setIsLoadingShelf] = useState(mode === 'edit');

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
      .catch(() => setError('Could not load the local form data. Please refresh the page.'))
      .finally(() => setIsLoadingMeta(false));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !editingShelfId) {
      return;
    }

    setIsLoadingShelf(true);
    fetchShelf(editingShelfId)
      .then((shelf) => {
        setName(shelf.name);
        setItemTypes(toItemTypeFormState(shelf));
        if (shelf.icon.type === 'emoji') {
          setIconMode('emoji');
          setEmoji(shelf.icon.value);
          setBgColor(shelf.icon.bgColor ?? '#f1e4d3');
          setImagePreviewUrl(null);
        } else {
          setIconMode('image');
          setImagePreviewUrl(shelf.icon.value);
          setImageFile(null);
        }
      })
      .catch(() => setError('This shelf could not be found.'))
      .finally(() => setIsLoadingShelf(false));
  }, [mode, editingShelfId]);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setImagePreviewUrl((previousUrl) => {
      if (previousUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previousUrl);
      }
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit() {
    if (!user || (mode === 'edit' && !editingShelfId)) {
      return;
    }

    const validationError = validateDraft(name, iconMode, emoji, imageFile, imagePreviewUrl, itemTypes);
    if (validationError) {
      setError(validationError);
      return;
    }

    const draft: ShelfDraft = {
      name: name.trim(),
      icon:
        iconMode === 'emoji'
          ? { type: 'emoji', value: emoji.trim(), bgColor }
          : {
              type: 'image',
              value: imagePreviewUrl ?? '',
              bgColor: null,
            },
      itemTypes: itemTypes.map((itemType) => ({
        id: itemType.savedId,
        name: itemType.name.trim(),
        fields: itemType.fields.map((field) => ({
          id: field.savedId,
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
      const shelf =
        mode === 'create'
          ? await createShelf(draft, user.id, imageFile)
          : await updateShelf(resolvedEditingShelfId, draft, imageFile);
      rememberShelf({ id: shelf.id, name: shelf.name, icon: shelf.icon });
      navigate(`/shelves/${shelf.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : `Could not ${mode === 'create' ? 'create' : 'update'} the shelf.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingMeta || isLoadingShelf) {
    return <p>Loading...</p>;
  }

  const title = mode === 'create' ? 'Create a shelf' : 'Edit shelf configuration';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <Link to="/" className={styles.secondaryLink}>
        Retour aux étagères
      </Link>

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
          {isSubmitting
            ? mode === 'create'
              ? 'Creating shelf...'
              : 'Saving changes...'
            : mode === 'create'
              ? 'Create shelf'
              : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
