import { useState, useEffect, useRef, useMemo, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function validateUsernameFormat(value: string, t: (key: string) => string): string | null {
  if (!value) return null;
  if (value.length < 3) return t('validation.usernameMin');
  if (value.length > 20) return t('validation.usernameMax');
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return t('validation.usernameChars');
  return null;
}

/**
 * Validates username format and checks real-time availability via the REST API.
 * Debounces the network lookup by 500 ms to limit requests while the user types.
 *
 * @param username - Raw value from the username input field
 * @returns `status`, `error`, `isValid`, `isChecking`
 */
export function useUsername(username: string) {
  const { t } = useTranslation();
  const formatError = useMemo(() => validateUsernameFormat(username, t), [username, t]);

  const [apiResult, setApiResult] = useState<{ status: UsernameStatus; error: string | null }>({
    status: 'idle',
    error: null,
  });
  const pendingUsernameRef = useRef<string | null>(null);

  useEffect(() => {
    if (formatError || !username) {
      pendingUsernameRef.current = null;
      return;
    }

    pendingUsernameRef.current = username;
    startTransition(() => {
      setApiResult({ status: 'checking', error: null });
    });

    const timer = setTimeout(async () => {
      const checkFor = pendingUsernameRef.current;
      if (!checkFor) return;

      try {
        const { available } = await api.get<{ available: boolean }>(
          `/api/users/username/${encodeURIComponent(checkFor.toLowerCase())}/available`
        );
        if (pendingUsernameRef.current !== checkFor) return;
        setApiResult({
          status: available ? 'available' : 'taken',
          error: available ? null : t('validation.usernameTaken'),
        });
      } catch {
        if (pendingUsernameRef.current !== checkFor) return;
        setApiResult({ status: 'idle', error: null });
      }
    }, 500);

    return () => {
      pendingUsernameRef.current = null;
      clearTimeout(timer);
    };
  }, [username, t, formatError]);

  const status = formatError ? 'invalid' : apiResult.status;
  const error = formatError || apiResult.error;

  return { status, error, isValid: status === 'available', isChecking: apiResult.status === 'checking' };
}