import { createContext } from 'react';
import type { AuthState, RegisterPayload, CompleteProfilePayload } from '../types/auth';

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: () => Promise<{ needsProfile: boolean }>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);