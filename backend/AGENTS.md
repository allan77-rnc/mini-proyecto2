# Backend — Agent Instructions

## Project Context
NestJS backend for a collaborative study platform (mini-proyecto2).
Current scope: authentication, user profile management, rooms (REST + WebSocket) via Firebase.

## Tech Stack
- **Framework**: NestJS 11 + TypeScript (strict, nodenext modules)
- **Auth**: Firebase Admin SDK (token verification + user creation)
- **Database**: Cloud Firestore (via Firebase Admin SDK)
- **Real-time**: Socket.io via `@nestjs/websockets` + `@nestjs/platform-socket.io`
- **Docs**: @nestjs/swagger (Swagger UI at `/api/docs`)
- **Validation**: class-validator + class-transformer
- **Config**: @nestjs/config + Joi schema validation

## Key Commands
```bash
bun run start:dev           # Dev server (watch mode)
bun run build               # Production build
bun run lint                # ESLint
bun run test                # Jest unit tests
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
├── rooms/
│   ├── repositories/
│   │   ├── rooms.repository.interface.ts   # IRoomsRepository + Room type (SOLID D)
│   │   ├── rooms.repository.ts             # Firestore implementation
│   │   └── messages.repository.ts          # Messages subcollection CRUD
│   ├── dto/
│   │   ├── create-room.dto.ts
│   │   ├── room-response.dto.ts
│   │   └── message-response.dto.ts
│   ├── rooms.service.ts         # Business logic: create, list, get, delete rooms
│   ├── rooms.controller.ts      # REST endpoints for rooms
│   ├── rooms.gateway.ts         # Socket.io gateway — namespace /rooms
│   └── rooms.module.ts
├── app.module.ts
└── main.ts
```

## Firestore Collections
| Collection | Document ID | Fields |
|---|---|---|
| `users` | `{uid}` | uid, email, firstName, lastName, username, avatarUrl, provider, createdAt, updatedAt |
| `usernames` | `{username_lowercase}` | uid |
| `rooms` | `{roomId}` (UUID) | id, name, description?, hostUid, hostUsername, isActive, participantCount, createdAt, updatedAt |
| `rooms/{roomId}/messages` | `{messageId}` (UUID) | id, roomId, senderUid, senderUsername, text, createdAt |

- `usernames` maps lowercase username → uid for O(1) uniqueness checks. Claims use Firestore transactions.
- All writes go through the Admin SDK (bypasses Firestore security rules).

## Environment Variables (required)
```
PORT=3000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.com   # comma-separated (optional, overrides FRONTEND_URL)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=   # copy exactly from service account JSON, \n as literal \n
FIREBASE_WEB_API_KEY=   # from Firebase Console → Project Settings → General → Web API Key
```
Get service account credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key.

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create Firebase user + Firestore profile + returns customToken |
| POST | `/google` | — | Verify Google ID token; returns profile or `needsUsername:true` |
| POST | `/google/complete-profile` | Bearer | Save Firestore profile after Google OAuth |
| POST | `/reset-password` | — | Send Firebase password reset email via Identity Toolkit REST API |
| GET | `/me` | Bearer | Return own Firestore profile |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/username/:username/available` | — | Check if username is taken |
| GET | `/me` | Bearer | Get own profile |
| PATCH | `/me` | Bearer | Update profile (firstName, lastName, avatarUrl, username, email) |
| DELETE | `/me` | Bearer | Delete own account (Firestore + Firebase Auth) |

### Rooms (`/api/rooms`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Create a new room |
| GET | `/` | Bearer | List own rooms (hosted by current user) |
| GET | `/:id` | Bearer | Get a room by ID |
| DELETE | `/:id` | Bearer | Delete a room (host only) |

### WebSocket Gateway (`/rooms` namespace)
| Event (client→server) | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, idToken }` | Join a room's Socket.io channel |
| `leave-room` | — | Leave current room |
| `send-message` | `{ roomId, text, idToken }` | Broadcast a message to the room |

| Event (server→client) | Payload | Description |
|---|---|---|
| `room:joined` | `{ roomId }` | Confirms join to the joining client |
| `room:user-joined` | `{ username }` | Notifies others when a user joins |
| `room:user-left` | `{ username }` | Notifies others when a user leaves |
| `room:message` | MessageResponse | Broadcasts a persisted message to all room members |

## SOLID Notes
- **S**: Each service has one responsibility. `FirebaseService` wraps the SDK; repositories handle Firestore CRUD; services handle business logic; controllers/gateway handle transport.
- **O/D**: `UsersService` depends on `IUsersRepository` (token `USERS_REPOSITORY`); `RoomsService` depends on `IRoomsRepository` (token `ROOMS_REPOSITORY`). Swap impls without touching services.
- **I**: Controllers only call the methods they actually need from their service.

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

Protected REST routes: Authorization: Bearer <Firebase ID token>
  → FirebaseAuthGuard calls auth.verifyIdToken(token)
  → DecodedIdToken injected via @CurrentUser()

WebSocket auth: pass idToken in each event payload
  → RoomsGateway.verifyToken() calls auth.verifyIdToken(idToken)
```

## Coding Rules
1. **No `any` types** — use `unknown` + type guards for caught errors
2. **Explicit return types** on all public methods
3. **SOLID**: inject repositories via Symbol tokens, not concrete classes
4. **Swagger**: every REST endpoint needs `@ApiOperation`, `@ApiResponse`, `@ApiBody` or `@ApiParam`
5. **Validation**: always `whitelist: true` + `forbidNonWhitelisted: true` on ValidationPipe
6. **Package manager**: use `bun` (not npm/yarn)

---

## Commit Convention (MANDATORY)

Format: `<type>: <short description in imperative, max 72 chars>`

| Type | When to use |
|------|-------------|
| `feat` | New functionality added |
| `fix` | Bug corrected |
| `refactor` | Code restructured without behavior change |
| `chore` | Maintenance, config, dependencies |
| `test` | Tests added or modified |
| `docs` | Documentation updated |
| `style` | Formatting changes that don't affect logic |

### Rules
- **Max 72 characters** per commit message
- **English only** — never mix languages within the same project
- Description must be **specific**, never vague
- **One logical unit per commit** — if 2+ hours pass without a commit, the task is too large and must be split
- **Commit regularly as checkpoints** — after each completed module, feature, or meaningful fix. Never accumulate a large batch of unrelated changes in a single commit. Checkpoint commits give the team traceability and the ability to roll back to a known-good state at any point
- **Never add Claude as co-author** — do not include `Co-Authored-By: Claude` or any AI attribution in commit messages. Commits must only reflect the human authors of the project

### Correct examples
```bash
git commit -m "feat: added user authentication endpoint"
git commit -m "fix: removed null pointer on payment validation"
git commit -m "refactor: updated login service to use async/await"
git commit -m "chore: added eslint configuration"
git commit -m "feat: added export to PDF, removed deprecated print method"
```

### Incorrect examples
```bash
git commit -m "fix: corrections"          # too vague
git commit -m "feat: various changes"     # too vague
git commit -m "update"                    # no type, no description
# too long — split into multiple commits:
git commit -m "feat: added login, fixed dashboard bug, updated styles, removed old api calls"
```
