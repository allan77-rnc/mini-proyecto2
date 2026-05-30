# Auth Module — StudySphere

Complete authentication flow using Firebase Auth + Firestore.

## Supported flows

| Flow | Entry point |
|------|-------------|
| Email/password registration | `/register` |
| Email/password sign-in | `/login` |
| Google OAuth sign-in | `/` (landing) |
| Google profile completion | `/complete-profile` |
| Password reset | `/login` → "Forgot password?" |

## Directory structure

```
src/
├── lib/
│   └── firebase.ts          # Firebase app, auth, and Firestore instances
├── types/
│   └── auth.ts              # UserProfile, AuthState, RegisterPayload, CompleteProfilePayload
├── contexts/
│   ├── AuthContext.tsx      # AuthProvider + useAuthContext
│   └── ToastContext.tsx     # ToastProvider + useToast
├── hooks/
│   ├── useAuth.ts           # Convenience re-export of useAuthContext
│   └── useUsername.ts       # Real-time username availability (500ms debounce)
└── components/
    ├── ProtectedRoute.tsx   # Guards routes; shows spinner while session resolves
    ├── Toast.tsx            # ToastContainer renders floating notifications
    ├── UsernameField.tsx    # Reusable input with Firestore availability check
    ├── PasswordStrength.tsx # 5-segment strength bar
    └── icons.tsx            # Inline SVG icon components
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional — restrict sign-up to a specific email domain (e.g. university.edu)
VITE_INSTITUTIONAL_DOMAIN=
```

## Firestore data model

### `users/{uid}`
```ts
{
  uid: string
  email: string
  firstName: string
  lastName: string
  username: string        // lowercase, unique
  avatarUrl: string
  provider: 'email' | 'google'
  createdAt: string       // ISO-8601
  updatedAt: string
}
```

### `usernames/{username}`
```ts
{ uid: string }
```
Used for O(1) uniqueness checks without reading the full `users` collection.

## Key design decisions

- `ProtectedRoute` redirects to `/complete-profile` when `firebaseUid` is set but `user` (Firestore profile) is null — this handles first-time Google sign-ins.
- Login errors use generic messaging ("Credenciales incorrectas") regardless of whether the email or password was wrong, to prevent user-enumeration attacks.
- `useUsername` writes to `usernames/{username}` on both email and Google registration paths, ensuring uniqueness across providers.
- Password strength uses a local scoring function; no external library is required.
