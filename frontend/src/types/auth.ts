/**
 * Full user profile stored in Firestore at `users/{uid}`.
 * Created on registration (email) or after `CompleteProfilePage` (Google).
 */
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
  provider: 'email' | 'google';
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth state maintained by `AuthContext`.
 *
 * @property user         - Firestore profile; null if not loaded or profile incomplete
 * @property firebaseUid  - Firebase Auth UID; null when signed out
 * @property initialized  - True once Firebase has resolved the initial session check
 */
export interface AuthState {
  user: UserProfile | null;
  firebaseUid: string | null;
  initialized: boolean;
}

/** Fields required to register a new email/password user */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

/** Fields required to finish a Google sign-in profile */
export interface CompleteProfilePayload {
  username: string;
}

/** Editable profile fields sent to `PATCH /users/me`. Only changed fields are included. */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}
