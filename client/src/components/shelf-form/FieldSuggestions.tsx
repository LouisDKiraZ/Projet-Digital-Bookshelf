import type { FieldSuggestion } from '../../types/shelf';
import styles from './FieldSuggestions.module.css';

const MAX_VISIBLE = 8;

interface FieldSuggestionsProps {
  suggestions: FieldSuggestion[];
  onPick: (suggestion: FieldSuggestion) => void;
}

// Lets the shelf creator reuse a criterion already defined elsewhere
// (another item type in this shelf, or any item type on any shelf) instead
// of retyping the same label and type by hand.
export function FieldSuggestions({ suggestions, onPick }: FieldSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Reuse a criterion:</span>
      {suggestions.slice(0, MAX_VISIBLE).map((suggestion) => (
        <button
          key={`${suggestion.label}-${suggestion.fieldType}`}
          type="button"
          className={styles.chip}
          onClick={() => onPick(suggestion)}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
