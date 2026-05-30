import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * Validates username format and checks real-time availability in Firestore.
 * Debounces the Firestore lookup by 500 ms to limit reads while the user types.
 *
 * @param username - Raw value from the username input field
 * @returns `status`, `error`, `isValid`, `isChecking`
 */
export function useUsername(username: string) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const validateFormat = useCallback(
    (value: string): string | null => {
      if (!value) return null;
      if (value.length < 3) return t('validation.usernameMin');
      if (value.length > 20) return t('validation.usernameMax');
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return t('validation.usernameChars');
      return null;
    },
    [t]
  );

  useEffect(() => {
    if (!username) {
      setStatus('idle');
      setError(null);
      return;
    }

    const formatError = validateFormat(username);
    if (formatError) {
      setStatus('invalid');
      setError(formatError);
      return;
    }

    setStatus('checking');
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        if (snap.exists()) {
          setStatus('taken');
          setError(t('validation.usernameTaken'));
        } else {
          setStatus('available');
          setError(null);
        }
      } catch {
        setStatus('idle');
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, validateFormat, t]);

  return { status, error, isValid: status === 'available', isChecking: status === 'checking' };
}
