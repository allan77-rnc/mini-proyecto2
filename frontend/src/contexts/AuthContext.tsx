import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        const profile = snap.exists() ? (snap.data() as UserProfile) : null;
        setState({ user: profile, firebaseUid: fbUser.uid, initialized: true });
      } else {
        setState({ user: null, firebaseUid: null, initialized: true });
      }
    });
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp({
    firstName,
    lastName,
    username,
    email,
    password,
    avatarUrl,
  }: RegisterPayload) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });
    const lowerUsername = username.toLowerCase();
    const profile: UserProfile = {
      uid: user.uid,
      email,
      firstName,
      lastName,
      username: lowerUsername,
      avatarUrl:
        avatarUrl ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName}`)}`,
      provider: 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    await setDoc(doc(db, 'usernames', lowerUsername), { uid: user.uid });
  }

  async function signInWithGoogle(): Promise<{ needsProfile: boolean }> {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, 'users', user.uid));
    return { needsProfile: !snap.exists() };
  }

  async function completeProfile({ username }: CompleteProfilePayload) {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('No authenticated user');
    const nameParts = (fbUser.displayName ?? '').split(' ');
    const lowerUsername = username.toLowerCase();
    const profile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email!,
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' '),
      username: lowerUsername,
      avatarUrl:
        fbUser.photoURL ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(lowerUsername)}`,
      provider: 'google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', fbUser.uid), profile);
    await setDoc(doc(db, 'usernames', lowerUsername), { uid: fbUser.uid });
    setState(prev => ({ ...prev, user: profile }));
  }

  async function sendResetEmail(email: string) {
    await sendPasswordResetEmail(auth, email);
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
