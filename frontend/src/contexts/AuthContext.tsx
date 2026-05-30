import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
import type {
  UserProfile,
  AuthState,
  RegisterPayload,
  CompleteProfilePayload,
} from '../types/auth';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: () => Promise<{ needsProfile: boolean }>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
          const profile = await api.get<UserProfile>('/api/auth/me');
          setState({ user: profile, firebaseUid: fbUser.uid, initialized: true });
        } catch {
          // 404 = no profile yet (Google user before completing profile)
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
      setState(prev => ({ ...prev, user: data.user! }));
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

  async function signOut() {
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signInWithGoogle, completeProfile, sendResetEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
