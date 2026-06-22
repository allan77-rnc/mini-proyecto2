import { useState, useEffect, useRef, useCallback } from 'react';

export interface RemoteParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface SignalMessage {
  roomId: string;
  from: string;
  to: string;
  username: string;
  avatarUrl?: string;
  type: 'announce' | 'leave' | 'offer' | 'answer' | 'ice' | 'media-state';
  payload?: unknown;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * P2P video/audio via WebRTC, signaled through BroadcastChannel.
 * Works across same-origin browser tabs/windows with no backend changes.
 */
export function useWebRTC(
  roomId: string,
  userId: string,
  username: string,
  localStream: MediaStream | null,
  avatarUrl?: string,
) {
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const broadcastMediaState = useCallback((audioEnabled: boolean, videoEnabled: boolean) => {
    channelRef.current?.postMessage({
      roomId,
      from: userId,
      to: 'broadcast',
      username,
      avatarUrl,
      type: 'media-state',
      payload: { audioEnabled, videoEnabled },
    } satisfies SignalMessage);
  }, [roomId, userId, username, avatarUrl]);

  useEffect(() => {
    if (!localStream) return;

    const channel = new BroadcastChannel(`studysphere:video:${roomId}`);
    channelRef.current = channel;

    const stream = localStream; // non-null (effect guard ensures this)
    const peers = new Map<string, RTCPeerConnection>();
    const pendingIce = new Map<string, RTCIceCandidateInit[]>();

    function send(msg: Omit<SignalMessage, 'roomId' | 'from' | 'username' | 'avatarUrl'>) {
      channel.postMessage({ ...msg, roomId, from: userId, username, avatarUrl } satisfies SignalMessage);
    }

    function upsertParticipant(update: Partial<RemoteParticipant> & { userId: string }) {
      setParticipants(prev => {
        const i = prev.findIndex(p => p.userId === update.userId);
        if (i === -1) {
          return [...prev, { stream: null, audioEnabled: true, videoEnabled: true, username: '', ...update }];
        }
        return prev.map((p, j) => (j === i ? { ...p, ...update } : p));
      });
    }

    function createPeer(peerId: string, peerUsername: string, isInitiator: boolean): RTCPeerConnection {
      const existing = peers.get(peerId);
      if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing?.close();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peers.set(peerId, pc);

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach(t => {
          const old = remoteStream.getTracks().find(x => x.kind === t.kind);
          if (old) remoteStream.removeTrack(old);
          remoteStream.addTrack(t);
        });
        upsertParticipant({ userId: peerId, username: peerUsername, stream: remoteStream });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) send({ type: 'ice', to: peerId, payload: e.candidate.toJSON() });
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          peers.delete(peerId);
          setParticipants(prev => prev.filter(p => p.userId !== peerId));
        }
      };

      upsertParticipant({ userId: peerId, username: peerUsername, stream: null });

      if (isInitiator) {
        pc.createOffer()
          .then(o => pc.setLocalDescription(o))
          .then(() => send({ type: 'offer', to: peerId, payload: pc.localDescription!.toJSON() }))
          .catch(() => {});
      }

      // Flush any queued ICE candidates
      (pendingIce.get(peerId) ?? []).forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
      pendingIce.delete(peerId);

      return pc;
    }

    channel.onmessage = async (event: MessageEvent<SignalMessage>) => {
      const msg = event.data;
      if (msg.from === userId || msg.roomId !== roomId) return;
      if (msg.to !== 'broadcast' && msg.to !== userId) return;

      switch (msg.type) {
        case 'announce': {
          // Always store avatar/username even if peer already exists
          upsertParticipant({ userId: msg.from, username: msg.username, avatarUrl: msg.avatarUrl });
          if (!peers.has(msg.from)) {
            createPeer(msg.from, msg.username, userId > msg.from);
          }
          if (msg.to === 'broadcast') {
            send({ type: 'announce', to: msg.from });
          }
          break;
        }
        case 'offer': {
          const pc = createPeer(msg.from, msg.username, false);
          if (pc.signalingState !== 'stable') break; // ignore glare
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: 'answer', to: msg.from, payload: pc.localDescription!.toJSON() });
          break;
        }
        case 'answer': {
          const pc = peers.get(msg.from);
          if (pc?.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
          }
          break;
        }
        case 'ice': {
          const pc = peers.get(msg.from);
          const c = msg.payload as RTCIceCandidateInit;
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } else {
            const arr = pendingIce.get(msg.from) ?? [];
            arr.push(c);
            pendingIce.set(msg.from, arr);
          }
          break;
        }
        case 'leave': {
          peers.get(msg.from)?.close();
          peers.delete(msg.from);
          setParticipants(prev => prev.filter(p => p.userId !== msg.from));
          break;
        }
        case 'media-state': {
          const s = msg.payload as { audioEnabled: boolean; videoEnabled: boolean };
          upsertParticipant({ userId: msg.from, ...s });
          break;
        }
      }
    };

    send({ type: 'announce', to: 'broadcast' });

    return () => {
      send({ type: 'leave', to: 'broadcast' });
      channel.close();
      channelRef.current = null;
      peers.forEach(pc => pc.close());
      setParticipants([]);
    };
  }, [roomId, userId, username, avatarUrl, localStream]);

  return { participants, broadcastMediaState };
}
