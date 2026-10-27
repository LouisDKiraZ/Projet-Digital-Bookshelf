import { useRef } from 'react';
import { EmojiPicker } from './EmojiPicker';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { ShelfIcon } from '../shelf/ShelfIcon';
import styles from './ShelfIconPicker.module.css';

interface ShelfIconPickerProps {
  iconMode: 'emoji' | 'image';
  onIconModeChange: (mode: 'emoji' | 'image') => void;
  emoji: string;
  onEmojiChange: (emoji: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  imagePreviewUrl: string | null;
  onImageSelected: (file: File) => void;
}

export function ShelfIconPicker({
  iconMode,
  onIconModeChange,
  emoji,
  onEmojiChange,
  bgColor,
  onBgColorChange,
  imagePreviewUrl,
  onImageSelected,
}: ShelfIconPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${iconMode === 'emoji' ? styles.tabActive : ''}`}
          onClick={() => onIconModeChange('emoji')}
        >
          Choose an emoji
        </button>
        <button
          type="button"
          className={`${styles.tab} ${iconMode === 'image' ? styles.tabActive : ''}`}
          onClick={() => onIconModeChange('image')}
        >
          Upload a photo
        </button>
      </div>

      {iconMode === 'emoji' ? (
        <div className={styles.emojiMode}>
          <ShelfIcon icon={{ type: 'emoji', value: emoji || '📚', bgColor }} size={56} />
          <div className={styles.emojiControls}>
            <EmojiPicker value={emoji} onChange={onEmojiChange} />
            <ColorSwatchPicker value={bgColor} onChange={onBgColorChange} />
          </div>
        </div>
      ) : (
        <div className={styles.imageRow}>
          {imagePreviewUrl ? (
            <img className={styles.preview} src={imagePreviewUrl} alt="Preview of the shelf icon" />
          ) : (
            <div className={styles.previewPlaceholder}>No photo</div>
          )}
          <button type="button" className={styles.tab} onClick={() => fileInputRef.current?.click()}>
            Choose from gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImageSelected(file);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
