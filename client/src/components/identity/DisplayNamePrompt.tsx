import { useState, type FormEvent } from 'react';
import { useUser } from '../../context/UserContext';
import styles from './DisplayNamePrompt.module.css';

// Shown instead of the app whenever no display name is known yet.
export function DisplayNamePrompt() {
  const { setDisplayName } = useUser();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await setDisplayName(trimmed);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Welcome to Digital Bookshelf</h1>
        <p className={styles.subtitle}>
          What name should other members of your shelves see you by?
        </p>
        <input
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          maxLength={40}
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Continuing...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
