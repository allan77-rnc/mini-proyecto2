import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}