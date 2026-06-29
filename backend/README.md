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

### Event reference

**Chat + presence**

| Client → Server | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, idToken }` | Join a room channel |
| `leave-room` | — | Leave current room |
| `send-message` | `{ roomId, text, idToken }` | Send a chat message |

| Server → Client | Payload | Description |
|---|---|---|
| `room:joined` | `{ roomId, socketId, participants[] }` | Confirms join; includes own socket ID and list of current peers |
| `room:user-joined` | `{ socketId, username }` | Someone joined (to others in room) |
| `room:user-left` | `{ socketId, username }` | Someone left (to others in room) |
| `room:message` | `{ id, roomId, senderUid, senderUsername, text, createdAt }` | New chat message |

`participants[]` shape (inside `room:joined`):
```ts
{ socketId: string; username: string; audioEnabled: boolean; videoEnabled: boolean; isScreenSharing: boolean }[]
```

**WebRTC signaling** (server just relays — never touches media)

| Client → Server | Payload | Description |
|---|---|---|
| `webrtc:offer` | `{ targetSocketId, sdp, idToken }` | Send SDP offer to a specific peer |
| `webrtc:answer` | `{ targetSocketId, sdp, idToken }` | Send SDP answer to a specific peer |
| `webrtc:ice-candidate` | `{ targetSocketId, candidate, idToken }` | Send ICE candidate to a specific peer |
| `webrtc:media-state` | `{ idToken, audioEnabled, videoEnabled }` | Broadcast own mute/camera toggle |
| `webrtc:screen-share` | `{ idToken, isSharing }` | Broadcast screen share start/stop |

| Server → Client | Payload | Description |
|---|---|---|
| `webrtc:offer` | `{ fromSocketId, sdp }` | Forwarded SDP offer from a peer |
| `webrtc:answer` | `{ fromSocketId, sdp }` | Forwarded SDP answer from a peer |
| `webrtc:ice-candidate` | `{ fromSocketId, candidate }` | Forwarded ICE candidate from a peer |
| `webrtc:media-state` | `{ socketId, username, audioEnabled, videoEnabled }` | Peer toggled mute/camera |
| `webrtc:screen-share` | `{ socketId, username, isSharing }` | Peer started or stopped screen sharing |

---

### Frontend integration guide

#### 1. Install

```bash
bun add socket.io-client
```

#### 2. Setup: socket + helpers

```ts
import { io, Socket } from 'socket.io-client';
import { getAuth } from 'firebase/auth';

const BACKEND_URL = 'https://mini-proyecto2.onrender.com'; // or http://localhost:3000 locally

const socket: Socket = io(`${BACKEND_URL}/rooms`, {
  // Do NOT force transports: ['websocket'] — allow polling as fallback.
  // On Render free tier the instance may be sleeping; polling tolerates the
  // cold-start delay (~30 s) and then upgrades to WebSocket automatically.
  autoConnect: false,
});

async function getIdToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}
```

#### 3. Setup: WebRTC peer connections map

Each remote participant gets their own `RTCPeerConnection`. Keep a map keyed by `socketId`.

**Always fetch ICE servers from the backend endpoint** — never hardcode them. This avoids the "5+ STUN/TURN servers" browser warning and lets the backend add TURN credentials without a FE redeploy.

```ts
// Map<socketId, RTCPeerConnection>
const peers = new Map<string, RTCPeerConnection>();

// Map<socketId, queued ICE candidates> — needed to handle race condition
// where candidates arrive before setRemoteDescription is called
const pendingCandidates = new Map<string, RTCIceCandidateInit[]>();

// Your local camera/mic stream — set this before joining the room
let localStream: MediaStream | null = null;

// ICE config fetched from the backend (call once before joining)
let iceConfig: RTCConfiguration = { iceServers: [] };

async function fetchIceConfig(idToken: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/rooms/ice-config`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json() as { iceServers: RTCIceServer[] };
  iceConfig = { iceServers: data.iceServers };
}
```

#### 4. Get local media (camera + microphone)

Call this before connecting to the socket. If the user denies permissions, show an error and let them join in chat-only mode.

```ts
async function getLocalStream(): Promise<MediaStream | null> {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // Render own preview
    const myVideo = document.getElementById('my-video') as HTMLVideoElement;
    myVideo.srcObject = localStream;
    return localStream;
  } catch (err) {
    console.warn('Camera/mic denied, joining in chat-only mode', err);
    // Show a UI message explaining how to enable permissions
    return null;
  }
}
```

#### 5. Create a RTCPeerConnection for a peer

This helper creates the connection, attaches the local stream, and wires up all the callbacks.

```ts
function createPeerConnection(remoteSocketId: string): RTCPeerConnection {
  // Use iceConfig fetched from the backend — never hardcode ICE servers
  const pc = new RTCPeerConnection(iceConfig);
  peers.set(remoteSocketId, pc);

  // Add local tracks so the remote peer receives our stream
  localStream?.getTracks().forEach((track) => {
    pc.addTrack(track, localStream!);
  });

  // Forward ICE candidates to the signaling server
  pc.onicecandidate = async ({ candidate }) => {
    if (!candidate) return;
    const idToken = await getIdToken();
    socket.emit('webrtc:ice-candidate', {
      targetSocketId: remoteSocketId,
      candidate: candidate.toJSON(),
      idToken,
    });
  };

  // Render remote stream when tracks arrive
  pc.ontrack = ({ streams }) => {
    renderRemoteStream(remoteSocketId, streams[0]);
  };

  return pc;
}

// setRemoteDescription + flush any ICE candidates that arrived early
// IMPORTANT: always call this instead of pc.setRemoteDescription() directly.
// ICE candidates can arrive before the offer/answer — if you call
// addIceCandidate before setRemoteDescription the browser throws
// "No remoteDescription". Queue them here and flush after SDP is set.
async function applyRemoteDescription(
  socketId: string,
  sdp: RTCSessionDescriptionInit,
): Promise<void> {
  const pc = peers.get(socketId);
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));

  const queued = pendingCandidates.get(socketId) ?? [];
  for (const candidate of queued) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  pendingCandidates.delete(socketId);
}
```

#### 6. Join a room and start the P2P mesh

When `room:joined` fires, the server sends all current participants. The joining client is the **offerer** for every existing peer.

```ts
socket.connect();

socket.on('connect', async () => {
  const idToken = await getIdToken();
  socket.emit('join-room', { roomId: '<room-uuid>', idToken });
});

// Fetch ICE config BEFORE connecting — do this once per session
const idToken = await getIdToken();
await fetchIceConfig(idToken);

socket.connect();

socket.on('room:joined', async ({ roomId, socketId: mySocketId, participants }) => {
  console.log('Joined room', roomId, '| my socketId:', mySocketId);

  // Render existing participants in the grid (video/avatar cards)
  for (const peer of participants) {
    addParticipantCard(peer.socketId, peer.username, peer.audioEnabled, peer.videoEnabled);
  }

  // Initiate a P2P offer to each existing participant
  for (const peer of participants) {
    const pc = createPeerConnection(peer.socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const token = await getIdToken();
    socket.emit('webrtc:offer', {
      targetSocketId: peer.socketId,
      sdp: offer,
      idToken: token,
    });
  }
});
```

#### 7. Handle a new participant joining

When someone else joins, they will send you an offer. Add their card to the grid now — the stream will arrive via `ontrack` once ICE completes.

```ts
socket.on('room:user-joined', ({ socketId, username }) => {
  addParticipantCard(socketId, username, true, true);
  // Don't create a PeerConnection here — wait for their offer (they are the offerer)
});
```

#### 8. Handle incoming offer → send answer

```ts
socket.on('webrtc:offer', async ({ fromSocketId, sdp }) => {
  const pc = createPeerConnection(fromSocketId);

  // Use applyRemoteDescription — flushes any ICE candidates that arrived early
  await applyRemoteDescription(fromSocketId, sdp);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  const idToken = await getIdToken();
  socket.emit('webrtc:answer', {
    targetSocketId: fromSocketId,
    sdp: answer,
    idToken,
  });
});
```

#### 9. Handle incoming answer

```ts
socket.on('webrtc:answer', async ({ fromSocketId, sdp }) => {
  // Use applyRemoteDescription — flushes any ICE candidates that arrived early
  await applyRemoteDescription(fromSocketId, sdp);
});
```

#### 10. Handle incoming ICE candidates

```ts
socket.on('webrtc:ice-candidate', async ({ fromSocketId, candidate }) => {
  const pc = peers.get(fromSocketId);
  if (!pc) return;

  if (!pc.remoteDescription) {
    // SDP not set yet — queue the candidate to avoid "No remoteDescription" error
    const q = pendingCandidates.get(fromSocketId) ?? [];
    q.push(candidate);
    pendingCandidates.set(fromSocketId, q);
    return;
  }

  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});
```

#### 11. Handle a peer leaving

Close the connection and remove their card from the grid.

```ts
socket.on('room:user-left', ({ socketId, username }) => {
  const pc = peers.get(socketId);
  if (pc) {
    pc.close();
    peers.delete(socketId);
  }
  removeParticipantCard(socketId);
  console.log(username, 'left');
});
```

#### 12. Toggle mute / camera

```ts
async function setAudioEnabled(enabled: boolean) {
  localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  const idToken = await getIdToken();
  socket.emit('webrtc:media-state', {
    idToken,
    audioEnabled: enabled,
    videoEnabled: localStream?.getVideoTracks()[0]?.enabled ?? false,
  });
}

async function setVideoEnabled(enabled: boolean) {
  localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  const idToken = await getIdToken();
  socket.emit('webrtc:media-state', {
    idToken,
    audioEnabled: localStream?.getAudioTracks()[0]?.enabled ?? false,
    videoEnabled: enabled,
  });
}

// Update other participants' UI when they toggle
socket.on('webrtc:media-state', ({ socketId, username, audioEnabled, videoEnabled }) => {
  updateParticipantCard(socketId, audioEnabled, videoEnabled);
});
```

#### 13. Screen sharing

The frontend uses `getDisplayMedia()` + `sender.replaceTrack()` to swap the video track in the existing `RTCPeerConnection` — no renegotiation needed. The backend only needs to know about the state change to update other participants' UI.

```ts
let screenStream: MediaStream | null = null;

async function startScreenShare() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  } catch {
    // User cancelled the picker or permission denied — do nothing, current stream is untouched
    return;
  }

  const screenTrack = screenStream.getVideoTracks()[0];

  // Replace the video track in every active peer connection
  peers.forEach((pc) => {
    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) sender.replaceTrack(screenTrack);
  });

  // Notify others via signaling server
  const idToken = await getIdToken();
  socket.emit('webrtc:screen-share', { idToken, isSharing: true });

  // Auto-stop when the user clicks "Stop sharing" in the browser UI
  screenTrack.onended = () => stopScreenShare();
}

async function stopScreenShare() {
  screenStream?.getTracks().forEach((t) => t.stop());
  screenStream = null;

  // Restore the original camera track in every peer connection
  const cameraTrack = localStream?.getVideoTracks()[0] ?? null;
  peers.forEach((pc) => {
    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) sender.replaceTrack(cameraTrack);
  });

  const idToken = await getIdToken();
  socket.emit('webrtc:screen-share', { idToken, isSharing: false });
}

// Update other participants' UI when someone starts/stops sharing
socket.on('webrtc:screen-share', ({ socketId, username, isSharing }) => {
  updateParticipantCard(socketId, { isScreenSharing: isSharing });
  console.log(username, isSharing ? 'started' : 'stopped', 'screen sharing');
});
```

#### 14. Send and receive chat messages

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

#### 14. Leave and clean up

```ts
function leaveRoom() {
  // Close all peer connections
  peers.forEach((pc) => pc.close());
  peers.clear();

  // Stop local tracks
  localStream?.getTracks().forEach((t) => t.stop());

  socket.emit('leave-room');
  socket.disconnect();
}
```

---

### Notes

- **Token expiry:** Firebase ID tokens expire after 1 hour. If the user has been idle, refresh before emitting: `await user.getIdToken(true)`
- **Chat-only mode:** If `getUserMedia` throws (permissions denied), `localStream` will be `null`. The socket still connects and the user can send chat messages — `createPeerConnection` safely skips `addTrack` when `localStream` is null.
- **Single room per socket:** A socket can only be in one room at a time. Call `leaveRoom()` before joining a different one.
- **ICE servers:** Always call `GET /api/rooms/ice-config` before creating any `RTCPeerConnection` — never hardcode ICE servers. 5+ servers trigger a browser warning and slow discovery. Add TURN credentials via `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` env vars on Render; the endpoint returns them automatically.
- **TURN in production:** STUN alone fails when both peers are behind different symmetric NATs (common in mobile/corporate networks). If ICE fails in production, add a TURN server. Free options: [Metered.ca](https://www.metered.ca/turn-server) free tier. Add its URL and credentials to Render env vars.
- **"No remoteDescription" error:** ICE candidates can arrive before the offer/answer SDP. Always use `applyRemoteDescription()` (which queues early candidates) instead of calling `pc.setRemoteDescription()` directly. See step 10 above.
- **Render cold starts:** The free-tier backend sleeps after 15 min of inactivity and takes ~30 s to wake up. Do NOT use `transports: ['websocket']` — that fails immediately during cold start. Omit `transports` so Socket.io uses polling first (which tolerates the delay) and then auto-upgrades to WebSocket.
- **CORS:** The backend only accepts WebSocket connections from origins listed in the `ALLOWED_ORIGINS` environment variable on Render. Make sure the deployed frontend URL is in that list.
