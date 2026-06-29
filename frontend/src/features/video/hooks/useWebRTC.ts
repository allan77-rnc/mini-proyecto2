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
  isScreenSharing: boolean;
}

export interface PeerInfo {
  socketId: string;
  username: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
}

const TURN_URL = (import.meta.env.VITE_TURN_URL as string | undefined) ?? 'openrelay.metered.ca';
const TURN_USER = (import.meta.env.VITE_TURN_USERNAME as string | undefined) ?? 'openrelayproject';
const TURN_CRED = (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined) ?? 'openrelayproject';

// 3 URLs total — browser warns at 5+
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [`turn:${TURN_URL}:443`, `turns:${TURN_URL}:443`],
    username: TURN_USER,
    credential: TURN_CRED,
  },
];

export function useWebRTC(
  socket: Socket | null,
  currentPeers: PeerInfo[],
  localStream: MediaStream | null,
): {
  participants: RemoteParticipant[];
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  broadcastMediaState: (audioEnabled: boolean, videoEnabled: boolean) => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
} {
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const currentPeersRef = useRef<PeerInfo[]>(currentPeers);
  const localStreamRef = useRef<MediaStream | null>(localStream);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef(false);

  useEffect(() => { currentPeersRef.current = currentPeers; }, [currentPeers]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  const broadcastMediaState = useCallback(async (audioEnabled: boolean, videoEnabled: boolean) => {
    if (!socketRef.current) return;
    const idToken = await auth.currentUser?.getIdToken();
    socketRef.current.emit('webrtc:media-state', { idToken, audioEnabled, videoEnabled });
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    isScreenSharingRef.current = false;

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    peersRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(cameraTrack);
    });

    setIsScreenSharing(false);
    setScreenStream(null);

    const s = socketRef.current;
    if (s) {
      const idToken = await auth.currentUser?.getIdToken();
      s.emit('webrtc:screen-share', { idToken, isSharing: false });
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    let captureStream: MediaStream;
    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch {
      return;
    }

    screenStreamRef.current = captureStream;
    isScreenSharingRef.current = true;
    const screenTrack = captureStream.getVideoTracks()[0];

    peersRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
    });

    setIsScreenSharing(true);
    setScreenStream(captureStream);

    const s = socketRef.current;
    if (s) {
      const idToken = await auth.currentUser?.getIdToken();
      s.emit('webrtc:screen-share', { idToken, isSharing: true });
    }

    screenTrack.onended = () => { stopScreenShare(); };
  }, [stopScreenShare]);

  useEffect(() => {
    if (!socket || !localStream) {
      const raf = requestAnimationFrame(() => setParticipants([]));
      return () => cancelAnimationFrame(raf);
    }

    const s = socket;
    const stream = localStream;
    const peers = peersRef.current;

    // candidatos ICE que llegan antes de que haya remoteDescription
    const pendingIce = new Map<string, RTCIceCandidateInit[]>();

    peers.forEach(pc => pc.close());
    peers.clear();

    function upsertParticipant(update: Partial<RemoteParticipant> & { userId: string }) {
      setParticipants(prev => {
        const i = prev.findIndex(p => p.userId === update.userId);
        if (i === -1) {
          return [...prev, { stream: null, audioEnabled: true, videoEnabled: true, username: '', isScreenSharing: false, ...update }];
        }
        return prev.map((p, j) => (j === i ? { ...p, ...update } : p));
      });
    }

    async function getIdToken() {
      return (await auth.currentUser?.getIdToken()) ?? '';
    }

    // Vaciar candidatos pendientes DESPUÉS de setRemoteDescription
    async function flushPendingIce(socketId: string, pc: RTCPeerConnection) {
      const pending = pendingIce.get(socketId);
      if (!pending?.length) return;
      pendingIce.delete(socketId);
      await Promise.allSettled(pending.map(c => pc.addIceCandidate(new RTCIceCandidate(c))));
    }

    function createPeer(socketId: string, peerUsername: string): RTCPeerConnection {
      const existing = peers.get(socketId);
      if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing?.close();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peers.set(socketId, pc);

      // Si estamos compartiendo pantalla, el nuevo peer recibe esa pista en lugar de la cámara
      stream.getTracks().forEach(t => {
        if (t.kind === 'video' && screenStreamRef.current) {
          const screenTrack = screenStreamRef.current.getVideoTracks()[0];
          pc.addTrack(screenTrack ?? t, stream);
        } else {
          pc.addTrack(t, stream);
        }
      });

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
          s.emit('webrtc:ice-candidate', {
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

      // NO vaciamos pendingIce aquí — se hace tras setRemoteDescription
      return pc;
    }

    async function sendOffer(socketId: string, peerUsername: string) {
      upsertParticipant({ userId: socketId, username: peerUsername });
      const pc = createPeer(socketId, peerUsername);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const idToken = await getIdToken();
        s.emit('webrtc:offer', {
          targetSocketId: socketId,
          sdp: pc.localDescription!.toJSON(),
          idToken,
        });
      } catch {
        // el peer se desconectó antes de terminar el offer
      }
    }

    function onUserJoined({ socketId, username }: { socketId: string; username: string }) {
      upsertParticipant({ userId: socketId, username });
      // Si estamos compartiendo pantalla, avisar al recién llegado
      if (isScreenSharingRef.current) {
        getIdToken().then(idToken => {
          s.emit('webrtc:screen-share', { idToken, isSharing: true });
        });
      }
    }

    function onUserLeft({ socketId }: { socketId: string }) {
      peers.get(socketId)?.close();
      peers.delete(socketId);
      setParticipants(prev => prev.filter(p => p.userId !== socketId));
    }

    async function onOffer({ fromSocketId, sdp }: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) {
      const pc = createPeer(fromSocketId, '');
      if (pc.signalingState !== 'stable') return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      // Vaciar candidatos que llegaron mientras no había remoteDescription
      await flushPendingIce(fromSocketId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const idToken = await getIdToken();
      s.emit('webrtc:answer', {
        targetSocketId: fromSocketId,
        sdp: pc.localDescription!.toJSON(),
        idToken,
      });
    }

    async function onAnswer({ fromSocketId, sdp }: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) {
      const pc = peers.get(fromSocketId);
      if (pc?.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(fromSocketId, pc);
      }
    }

    async function onIce({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) {
      const pc = peers.get(fromSocketId);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Todavía no hay remoteDescription — guardar para después
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

    function onScreenShare({ socketId, isSharing }: { socketId: string; username: string; isSharing: boolean }) {
      upsertParticipant({ userId: socketId, isScreenSharing: isSharing });
    }

    s.on('room:user-joined', onUserJoined);
    s.on('room:user-left', onUserLeft);
    s.on('webrtc:offer', onOffer);
    s.on('webrtc:answer', onAnswer);
    s.on('webrtc:ice-candidate', onIce);
    s.on('webrtc:media-state', onMediaState);
    s.on('webrtc:screen-share', onScreenShare);

    for (const peer of currentPeersRef.current) {
      sendOffer(peer.socketId, peer.username);
    }

    return () => {
      s.off('room:user-joined', onUserJoined);
      s.off('room:user-left', onUserLeft);
      s.off('webrtc:offer', onOffer);
      s.off('webrtc:answer', onAnswer);
      s.off('webrtc:ice-candidate', onIce);
      s.off('webrtc:media-state', onMediaState);
      s.off('webrtc:screen-share', onScreenShare);
      peers.forEach(pc => pc.close());
      peers.clear();
      setParticipants([]);
    };
  }, [socket, localStream]);

  return { participants, isScreenSharing, screenStream, broadcastMediaState, startScreenShare, stopScreenShare };
}
