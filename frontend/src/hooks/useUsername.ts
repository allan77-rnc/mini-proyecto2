import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * Validates username format and checks real-time availability via the REST API.
 * Debounces the network lookup by 500 ms to limit requests while the user types.
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
        const { available } = await api.get<{ available: boolean }>(
          `/api/users/username/${encodeURIComponent(username.toLowerCase())}/available`
        );
        if (available) {
          setStatus('available');
          setError(null);
        } else {
          setStatus('taken');
          setError(t('validation.usernameTaken'));
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
