# mini-proyecto2 — Backend

REST API + WebSocket server for the collaborative study platform.  
Built with NestJS 11, Firebase Admin SDK, and Socket.io.

## Stack

- **NestJS 11** + TypeScript (strict, nodenext)
- **Firebase Admin SDK** — Auth + Firestore
- **Socket.io** via `@nestjs/websockets`
- **Swagger UI** at `/api/docs`

## Setup

```bash
bun install
```

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
# Optional: comma-separated list of allowed CORS origins (overrides FRONTEND_URL)
ALLOWED_ORIGINS=http://localhost:5173,https://your-deploy-url.com
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=       # paste exactly from service account JSON (\n as literal \n)
FIREBASE_WEB_API_KEY=       # Firebase Console → Project Settings → General → Web API Key
```

Get `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from:  
Firebase Console → Project Settings → Service Accounts → Generate new private key.

## Running

```bash
bun run start:dev   # watch mode
bun run start:prod  # production
bun run build       # compile only
bun run lint        # ESLint
```

## API Endpoints

Base path: `/api`. Swagger UI: `http://localhost:3000/api/docs`

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account (email/password) |
| POST | `/google` | — | Verify Google ID token |
| POST | `/google/complete-profile` | Bearer | Complete Google sign-up with username |
| POST | `/reset-password` | — | Send password reset email |
| GET | `/me` | Bearer | Get own profile |

### Users (`/api/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/username/:username/available` | — | Check username availability |
| GET | `/me` | Bearer | Get own profile |
| PATCH | `/me` | Bearer | Update profile (firstName, lastName, avatarUrl, username, email) |
| DELETE | `/me` | Bearer | Delete own account |

### Rooms (`/api/rooms`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Create a room |
| GET | `/` | Bearer | List own rooms |
| GET | `/:id` | Bearer | Get a room by ID |
| DELETE | `/:id` | Bearer | Delete a room (host only) |

## WebSocket — Rooms Gateway

**Namespace:** `/rooms`  
**URL:** `ws://localhost:3000/rooms` (or `wss://` in production)

Auth is passed per-event as `idToken` (Firebase ID token), not in the connection handshake.

### Events

| Client → Server | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, idToken }` | Join a room channel |
| `leave-room` | — | Leave current room |
| `send-message` | `{ roomId, text, idToken }` | Send a message |

| Server → Client | Payload | Description |
|---|---|---|
| `room:joined` | `{ roomId }` | Confirms join (to the joining client) |
| `room:user-joined` | `{ username }` | Someone joined (to others in room) |
| `room:user-left` | `{ username }` | Someone left (to others in room) |
| `room:message` | `{ id, roomId, senderUid, senderUsername, text, createdAt }` | New message (to all in room) |

### Frontend integration

**Install:**
```bash
bun add socket.io-client
```

**Connect:**
```ts
import { io } from 'socket.io-client';
import { getAuth } from 'firebase/auth';

const socket = io('http://localhost:3000/rooms', {
  transports: ['websocket'],
  autoConnect: false,
});

async function getIdToken() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}
```

**Join a room:**
```ts
socket.connect();

socket.on('connect', async () => {
  const idToken = await getIdToken();
  socket.emit('join-room', { roomId: '<room-uuid>', idToken });
});

socket.on('room:joined', ({ roomId }) => {
  console.log('Joined room', roomId);
});

socket.on('room:user-joined', ({ username }) => {
  console.log(username, 'joined');
});

socket.on('room:user-left', ({ username }) => {
  console.log(username, 'left');
});
```

**Send and receive messages:**
```ts
socket.on('room:message', (msg) => {
  // { id, roomId, senderUid, senderUsername, text, createdAt }
  console.log(`[${msg.senderUsername}]: ${msg.text}`);
});

async function sendMessage(roomId: string, text: string) {
  const idToken = await getIdToken();
  socket.emit('send-message', { roomId, text, idToken });
}
```

**Leave:**
```ts
socket.emit('leave-room');  // notify others
socket.disconnect();        // close connection
```

> **Note:** Firebase ID tokens expire after 1 hour. If the user has been idle, refresh before emitting:  
> `await user.getIdToken(true)`
