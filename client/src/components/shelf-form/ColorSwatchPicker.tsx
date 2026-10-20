import styles from './ColorSwatchPicker.module.css';

// A curated set of soft background tones (the "frame" behind the chosen
// emoji) plus a native color input for anything else — same spirit as
// EmojiPicker's curated-grid-plus-free-text approach.
const SWATCHES = [
  '#f1e4d3',
  '#fbe3d0',
  '#fde2e2',
  '#e8e0fb',
  '#dceefb',
  '#dbf0e3',
  '#fdf0c7',
  '#e3e8f0',
];

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Background color:</span>
      <div className={styles.swatches}>
        {SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            className={`${styles.swatch} ${
              value.toLowerCase() === color ? styles.swatchSelected : ''
            }`}
            style={{ background: color }}
            onClick={() => onChange(color)}
            aria-pressed={value.toLowerCase() === color}
            aria-label={`Use ${color} as background color`}
          />
        ))}
        <input
          className={styles.customSwatch}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Choose a custom background color"
        />
      </div>
    </div>
  );
}
