import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * Validates username format and checks real-time availability in Firestore.
 * Debounces the Firestore lookup by 500 ms to limit reads while the user types.
 *
 * @param username - Raw value from the username input field
 * @returns
 *   - `status` — current validation state
 *   - `error` — human-readable error string, or null
 *   - `isValid` — true only when the username is available and format is correct
 *   - `isChecking` — true while the Firestore query is in flight
 *
 * @example
 * const { isValid, error, isChecking } = useUsername(usernameInput);
 */
export function useUsername(username: string) {
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const validateFormat = useCallback((value: string): string | null => {
    if (!value) return null;
    if (value.length < 3) return 'Mínimo 3 caracteres requeridos.';
    if (value.length > 20) return 'Máximo 20 caracteres permitidos.';
    if (!/^[a-zA-Z0-9_-]+$/.test(value))
      return 'Solo letras, números, guiones y guiones bajos.';
    return null;
  }, []);

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
          setError('Este nombre ya está en uso, elige otro.');
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
  }, [username, validateFormat]);

  return {
    status,
    error,
    isValid: status === 'available',
    isChecking: status === 'checking',
  };
}
