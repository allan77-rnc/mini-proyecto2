import { useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import type { UserProfile, AuthState, RegisterPayload, CompleteProfilePayload, UpdateProfilePayload } from '../types/auth';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUid: null,
    initialized: false,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await api.get<UserProfile>('/api/users/me');
          setState({ user: profile, firebaseUid: fbUser.uid, initialized: true });
        } catch {
          setState({ user: null, firebaseUid: fbUser.uid, initialized: true });
        }
      } else {
        setState({ user: null, firebaseUid: null, initialized: true });
      }
    });
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(payload: RegisterPayload) {
    const { customToken } = await api.post<{ customToken: string }>('/api/auth/register', payload);
    await signInWithCustomToken(auth, customToken);
  }

  async function signInWithGoogle(): Promise<{ needsProfile: boolean }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user: fbUser } = await signInWithPopup(auth, provider);
    const idToken = await fbUser.getIdToken();
    const data = await api.post<{ user?: UserProfile; isNewUser?: boolean }>(
      '/api/auth/google',
      { idToken }
    );
    if (data.isNewUser) {
      return { needsProfile: true };
    }
    if (data.user) {
      const profile = data.user;
      setState(prev => ({ ...prev, user: profile }));
    }
    return { needsProfile: false };
  }

  async function completeProfile({ username }: CompleteProfilePayload) {
    const profile = await api.post<UserProfile>('/api/auth/google/complete-profile', { username });
    setState(prev => ({ ...prev, user: profile }));
  }

  async function sendResetEmail(email: string) {
    await api.post('/api/auth/reset-password', { email });
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const profile = await api.patch<UserProfile>('/api/users/me', payload);
    setState(prev => ({ ...prev, user: profile }));
    return profile;
  }

  async function deleteAccount() {
    await api.del('/api/users/me');
    await fbSignOut(auth);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  const value: AuthContextValue = { ...state, signIn, signUp, signInWithGoogle, completeProfile, sendResetEmail, updateProfile, deleteAccount, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}