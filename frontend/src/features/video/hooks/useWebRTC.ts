import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { auth } from '../../../lib/firebase';

export interface RemoteParticipant {
  userId: string; // socketId of the remote peer
  username: string;
  avatarUrl?: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface PeerInfo {
  socketId: string;
  username: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * P2P video/audio via WebRTC, signaled through the backend Socket.io gateway.
 * socket and currentPeers come from RoomPage (shared socket — no duplicate join-room).
 */
export function useWebRTC(
  socket: Socket | null,
  currentPeers: PeerInfo[],
  localStream: MediaStream | null,
): {
  participants: RemoteParticipant[];
  broadcastMediaState: (audioEnabled: boolean, videoEnabled: boolean) => Promise<void>;
} {
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const currentPeersRef = useRef<PeerInfo[]>(currentPeers);

  useEffect(() => { currentPeersRef.current = currentPeers; }, [currentPeers]);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  const broadcastMediaState = useCallback(async (audioEnabled: boolean, videoEnabled: boolean) => {
    if (!socketRef.current) return;
    const idToken = await auth.currentUser?.getIdToken();
    socketRef.current.emit('webrtc:media-state', { idToken, audioEnabled, videoEnabled });
  }, []);

  useEffect(() => {
    if (!socket || !localStream) {
      const raf = requestAnimationFrame(() => setParticipants([]));
      return () => cancelAnimationFrame(raf);
    }

    const stream = localStream;
    const peers = new Map<string, RTCPeerConnection>();
    const pendingIce = new Map<string, RTCIceCandidateInit[]>();

    function upsertParticipant(update: Partial<RemoteParticipant> & { userId: string }) {
      setParticipants(prev => {
        const i = prev.findIndex(p => p.userId === update.userId);
        if (i === -1) {
          return [...prev, { stream: null, audioEnabled: true, videoEnabled: true, username: '', ...update }];
        }
        return prev.map((p, j) => (j === i ? { ...p, ...update } : p));
      });
    }

    async function getIdToken() {
      return (await auth.currentUser?.getIdToken()) ?? '';
    }

    function createPeer(socketId: string, peerUsername: string): RTCPeerConnection {
      const existing = peers.get(socketId);
      if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing?.close();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peers.set(socketId, pc);

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach(t => {
          const old = remoteStream.getTracks().find(x => x.kind === t.kind);
          if (old) remoteStream.removeTrack(old);
          remoteStream.addTrack(t);
        });
        upsertParticipant({ userId: socketId, username: peerUsername, stream: remoteStream });
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          const idToken = await getIdToken();
          socket.emit('webrtc:ice-candidate', {
            targetSocketId: socketId,
            candidate: e.candidate.toJSON(),
            idToken,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          peers.delete(socketId);
          setParticipants(prev => prev.filter(p => p.userId !== socketId));
        }
      };

      // Flush any ICE candidates that arrived before the peer connection was ready
      (pendingIce.get(socketId) ?? []).forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
      pendingIce.delete(socketId);

      return pc;
    }

    async function sendOffer(socketId: string, peerUsername: string) {
      upsertParticipant({ userId: socketId, username: peerUsername });
      const pc = createPeer(socketId, peerUsername);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const idToken = await getIdToken();
        socket.emit('webrtc:offer', {
          targetSocketId: socketId,
          sdp: pc.localDescription!.toJSON(),
          idToken,
        });
      } catch {
        // peer may have disconnected before offer completed
      }
    }

    function onUserJoined({ socketId, username }: { socketId: string; username: string }) {
      // They will send us an offer; just add them to the list so the grid shows them
      upsertParticipant({ userId: socketId, username });
    }

    function onUserLeft({ socketId }: { socketId: string }) {
      peers.get(socketId)?.close();
      peers.delete(socketId);
      setParticipants(prev => prev.filter(p => p.userId !== socketId));
    }

    async function onOffer({ fromSocketId, sdp }: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) {
      const pc = createPeer(fromSocketId, participants.find(p => p.userId === fromSocketId)?.username ?? '');
      if (pc.signalingState !== 'stable') return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const idToken = await getIdToken();
      socket.emit('webrtc:answer', {
        targetSocketId: fromSocketId,
        sdp: pc.localDescription!.toJSON(),
        idToken,
      });
    }

    async function onAnswer({ fromSocketId, sdp }: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) {
      const pc = peers.get(fromSocketId);
      if (pc?.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    }

    async function onIce({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) {
      const pc = peers.get(fromSocketId);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        const arr = pendingIce.get(fromSocketId) ?? [];
        arr.push(candidate);
        pendingIce.set(fromSocketId, arr);
      }
    }

    function onMediaState({ socketId, username, audioEnabled, videoEnabled }: {
      socketId: string; username: string; audioEnabled: boolean; videoEnabled: boolean;
    }) {
      upsertParticipant({ userId: socketId, username, audioEnabled, videoEnabled });
    }

    socket.on('room:user-joined', onUserJoined);
    socket.on('room:user-left', onUserLeft);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIce);
    socket.on('webrtc:media-state', onMediaState);

    // Send offers to all participants who were already in the room
    for (const peer of currentPeersRef.current) {
      sendOffer(peer.socketId, peer.username);
    }

    return () => {
      socket.off('room:user-joined', onUserJoined);
      socket.off('room:user-left', onUserLeft);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIce);
      socket.off('webrtc:media-state', onMediaState);
      peers.forEach(pc => pc.close());
      setParticipants([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, localStream]);

  return { participants, broadcastMediaState };
}
