# Backend — Agent Instructions

## Project Context
NestJS backend for a collaborative study platform (mini-proyecto2).
Sprint 1 scope: authentication module + user profile management via Firebase.

## Tech Stack
- **Framework**: NestJS 11 + TypeScript (strict, nodenext modules)
- **Auth**: Firebase Admin SDK (token verification + user creation)
- **Database**: Cloud Firestore (via Firebase Admin SDK)
- **Docs**: @nestjs/swagger (Swagger UI at `/api/docs`)
- **Validation**: class-validator + class-transformer
- **Config**: @nestjs/config + Joi schema validation

## Key Commands
```bash
nest start:dev          # Dev server (watch mode)
nest build              # Production build
npm run lint            # ESLint
npm test                # Jest unit tests
nest generate module <name>     # Scaffold module
nest generate service <name>    # Scaffold service
nest generate controller <name> # Scaffold controller
```

## Module Structure
```
src/
├── config/
│   └── env.validation.ts       # Joi schema for required env vars
├── firebase/
│   ├── firebase.module.ts      # Global module — exports FirebaseService
│   └── firebase.service.ts     # Wraps firebase-admin (auth + firestore)
├── common/
│   ├── types/
│   │   └── index.ts            # UserProfile, AuthProvider, FirestoreUserDoc
│   └── filters/
│       └── http-exception.filter.ts  # Maps Firebase errors → HTTP exceptions
├── users/
│   ├── repositories/
│   │   ├── users.repository.interface.ts   # IUsersRepository (SOLID D)
│   │   └── users.repository.ts             # Firestore implementation
│   ├── dto/
│   │   └── update-profile.dto.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── users.module.ts
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── google-auth.dto.ts
│   │   ├── complete-profile.dto.ts
│   │   └── reset-password.dto.ts
│   ├── guards/
│   │   └── firebase-auth.guard.ts    # Verifies Firebase ID token in Bearer header
│   ├── decorators/
│   │   └── current-user.decorator.ts # @CurrentUser() injects DecodedIdToken
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
├── app.module.ts
└── main.ts
```

## Firestore Collections
| Collection | Document ID | Fields |
|---|---|---|
| `users` | `{uid}` | uid, email, firstName, lastName, username, avatarUrl, provider, createdAt, updatedAt |
| `usernames` | `{username_lowercase}` | uid |

The `usernames` collection maps lowercase username → uid for O(1) uniqueness checks.
Username claims are done inside a Firestore **transaction** to prevent race conditions.

## Environment Variables (required)
```
PORT=3000
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=   # copy exactly from service account JSON, \n as literal \n
```
Get credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key.

## API Endpoints (Sprint 1)

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create Firebase user + Firestore profile + returns customToken |
| POST | `/google` | — | Verify Google ID token; returns profile or `needsUsername:true` |
| POST | `/google/complete-profile` | Bearer | Save Firestore profile after Google OAuth |
| POST | `/reset-password` | — | Generate + send Firebase password reset email |
| GET | `/me` | Bearer | Return own Firestore profile |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/username/:username/available` | — | Check if username is taken |
| PATCH | `/me` | Bearer | Update own profile fields |

## SOLID Notes
- **S**: Each service has one responsibility. `FirebaseService` wraps the SDK; `UsersRepository` handles Firestore CRUD; `UsersService` handles user business logic; `AuthService` handles auth orchestration.
- **O/D**: `UsersService` depends on `IUsersRepository` (interface token `USERS_REPOSITORY`), not the concrete class. Swap the Firestore impl without touching the service.
- **I**: Controllers only call the methods of the service they actually need.

## Auth Flow Summary
```
Registration (email/password):
  POST /auth/register → backend creates Firebase user (Admin SDK)
                      → atomic Firestore write (users + usernames)
                      → returns { customToken, user }
  Frontend: signInWithCustomToken(auth, customToken)

Google OAuth:
  1. Frontend: Firebase Google popup → gets idToken
  2. POST /auth/google { idToken } → backend verifies token
     → if Firestore profile exists: returns { user }
     → if new user: returns { needsUsername: true, googleData }
  3. POST /auth/google/complete-profile (Bearer) { username }
     → atomic Firestore write → returns { user }

Protected routes: Authorization: Bearer <Firebase ID token>
  → FirebaseAuthGuard calls auth.verifyIdToken(token)
  → DecodedIdToken injected via @CurrentUser()
```

## Sprint 1 Checklist
### C1 — Full auth flow
- [x] Firebase Admin SDK initialized in FirebaseModule
- [ ] `POST /auth/register` — creates Firebase user + Firestore profile
- [ ] `POST /auth/google` — verifies Google ID token, checks Firestore
- [ ] `POST /auth/google/complete-profile` — saves profile for new Google users
- [ ] `POST /auth/reset-password` — sendPasswordResetEmail equivalent
- [ ] `GET /auth/me` — returns own profile

### C2 — Username validation
- [ ] `usernames` Firestore collection with atomic writes
- [ ] `GET /users/username/:username/available` — public availability check
- [ ] Transaction-based username claim on registration

### C3 — Protected routes & loading states
- [ ] `FirebaseAuthGuard` on all protected endpoints
- [ ] Proper 401 errors on missing/invalid tokens

### C4 — Swagger / docs
- [ ] SwaggerModule configured in main.ts at `/api/docs`
- [ ] All DTOs and responses decorated with @ApiProperty
- [ ] Bearer auth configured in Swagger UI
- [ ] firestore.rules file with security rules

## Coding Rules
1. **No `any` types** — use `unknown` + type guards for caught errors
2. **Explicit return types** on all public methods
3. **SOLID**: inject `IUsersRepository` via `USERS_REPOSITORY` symbol, not concrete class
4. **Swagger**: every endpoint needs `@ApiOperation`, `@ApiResponse`, `@ApiBody` or `@ApiParam`
5. **Commits**: `feat: added xxx, changed xxx` — concise, not ambiguous
6. **Validation**: always `whitelist: true` + `forbidNonWhitelisted: true` on ValidationPipe
