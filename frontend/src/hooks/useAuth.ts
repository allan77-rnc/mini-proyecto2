import { useAuthContext } from '../contexts/useAuthContext';

/**
 * Hook for accessing Firebase authentication state and operations.
 *
 * @returns
 *   - `user` — full Firestore profile (`UserProfile | null`)
 *   - `firebaseUid` — Firebase Auth UID (`string | null`)
 *   - `initialized` — true once Firebase has resolved the initial session check
 *   - `signIn(email, password)` — sign in with email + password
 *   - `signUp(payload)` — register new user and write Firestore profile
 *   - `signInWithGoogle()` — Google popup; returns `{ needsProfile }` flag
 *   - `completeProfile(payload)` — save username after Google sign-in
 *   - `sendResetEmail(email)` — send password-reset email
 *   - `signOut()` — sign out current user
 *
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
