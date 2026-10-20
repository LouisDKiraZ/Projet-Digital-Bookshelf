import styles from './EmojiPicker.module.css';

// A small curated grid covers the common collection themes; the text
// input next to it lets anyone pick any emoji their OS keyboard offers
// (building a full searchable emoji picker is out of scope here).
const COMMON_EMOJIS = [
  '📚', '📖', '📀', '💿', '🎵', '🎮', '🃏', '🎲',
  '🧸', '👕', '👟', '💎', '🏺', '🖼️', '🎬', '📷',
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`${styles.emojiButton} ${
              value === emoji ? styles.emojiButtonSelected : ''
            }`}
            onClick={() => onChange(emoji)}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className={styles.customRow}>
        <span className={styles.customLabel}>Or type any emoji:</span>
        <input
          className={styles.customInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={4}
        />
      </div>
    </div>
  );
}
