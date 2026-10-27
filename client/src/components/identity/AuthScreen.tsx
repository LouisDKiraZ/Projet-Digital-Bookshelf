import { useState, type FormEvent } from 'react';
import { useUser } from '../../context/UserContext';
import { login, register } from '../../api/userApi';
import { Button } from '../common/Button';
import styles from './AuthScreen.module.css';

export function AuthScreen() {
  const { loginSession } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateStrongPassword(pass: string): string | null {
    if (pass.length < 8) return 'The password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'The password must contain an uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'The password must contain a lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'The password must contain a digit.';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'The password must contain a special character.';
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError("Please enter a display name.");
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const passwordError = validateStrongPassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await login(username, password);
        loginSession(user);
      } else {
        const user = await register(username, displayName, password);
        loginSession(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className={styles.overlay}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon} aria-hidden="true">📚</span>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Log in to access your digital bookshelf.'
              : 'Sign up to start organizing your collections.'}
          </p>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_reader"
              maxLength={40}
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="displayName" className={styles.label}>Display name</label>
              <input
                id="displayName"
                className={styles.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={40}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {mode === 'register' && (
              <span className={styles.hint}>
                8 characters min., 1 uppercase letter, 1 digit, 1 special character.
              </span>
            )}
          </div>

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button variant="primary" type="submit" disabled={isSubmitting} className={styles.submit}>
          {isSubmitting
            ? (mode === 'login' ? 'Logging in...' : 'Creating account...')
            : (mode === 'login' ? 'Log in' : "Sign up")}
        </Button>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            {mode === 'login' ? "Don't have an account yet?" : "Already have an account?"}
          </span>
          <button type="button" onClick={toggleMode} className={styles.toggleBtn}>
            {mode === 'login' ? "Sign up" : 'Log in'}
          </button>
        </div>
      </form>
    </div>
  );
}
