import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import type { Room, ChatMessage } from '../types/room';
import {
  IconBookOpen, IconUsers, IconMessageSquare, IconUserPlus,
  IconPencil, IconTrash, IconSend, IconSpinner, IconAlertTriangle,
  IconMoreVertical, IconCopy, IconX, IconCheckCircle,
  IconFolder, IconNote, IconHelp, IconLogOut, IconVideo,
  IconChevronLeft, IconChevronRight, IconClock, IconMonitor,
} from '../components/icons';
import {
  useLocalMedia, useWebRTC, useAudioLevel,
  VideoGrid, VideoTile, PermissionBanner, MediaControls,
  type PeerInfo,
} from '../features/video';

const WS_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

/* ─── EditNameModal ───────────────────────────────────────────────── */
function EditNameModal({ room, onClose, onSave }: {
  room: Room;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(room.name);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setError('El nombre no puede estar vacío.'); return; }
    if (trimmed === room.name) { onClose(); return; }
    setLoading(true);
    try {
      const updated = await api.patch<Room>(`/api/rooms/${room.id}`, { name: trimmed });
      onSave(updated.name);
    } catch {
      setError('No se pudo actualizar el nombre.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Editar nombre de sala</h2>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={80}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e3252] focus:ring-1 focus:ring-[#1e3252] transition-colors"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3252] text-white font-semibold text-sm disabled:opacity-50 transition-colors">
            {loading && <IconSpinner size={14} />}Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DeleteRoomModal ─────────────────────────────────────────────── */
function DeleteRoomModal({ room, onClose, onDeleted }: {
  room: Room;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    try {
      await api.del(`/api/rooms/${room.id}`);
      onDeleted();
    } catch {
      setError('No se pudo eliminar la sala.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <IconAlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Eliminar sala</h2>
              <p className="text-sm text-gray-600 mt-1">
                ¿Eliminar <span className="font-semibold">"{room.name}"</span>? Esto eliminará todos los mensajes permanentemente.
              </p>
            </div>
          </div>
          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:bg-red-300 transition-colors">
            {loading ? <IconSpinner size={14} /> : <IconTrash size={14} />}Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PresentationArea ───────────────────────────────────────────── */
function PresentationArea({ stream, presenterName }: { stream: MediaStream | null; presenterName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0d1117]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain transition-opacity duration-200 ${stream ? 'opacity-100' : 'opacity-0'}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#1e2535] flex items-center justify-center">
            <IconMonitor size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-300 font-semibold text-base">{presenterName} está compartiendo pantalla</p>
          <p className="text-gray-500 text-sm">Esperando que cargue la presentación...</p>
        </div>
      )}
      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1.5 bg-teal-500/90 text-white text-xs px-2.5 py-1.5 rounded-xl font-semibold backdrop-blur-sm">
          <IconMonitor size={12} /> {presenterName} — Compartiendo pantalla
        </span>
      </div>
    </div>
  );
}

/* ─── RoomPage ────────────────────────────────────────────────────── */
export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHostMenu, setShowHostMenu] = useState(false);

  const [showShareBanner, setShowShareBanner] = useState(
    !!(location.state as { justCreated?: boolean } | null)?.justCreated
  );
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [rtcSocket, setRtcSocket] = useState<Socket | null>(null);
  const [rtcPeers, setRtcPeers] = useState<PeerInfo[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isHost = !!room && !!user && room.hostUid === user.uid;

  /* ── Local media (camera + mic) — only acquired while on Video tab ── */
  const localMedia = useLocalMedia(activeTab === 'video');

  /* ── WebRTC P2P (shared socket — no duplicate join-room) ── */
  const { participants, isScreenSharing, screenStream, broadcastMediaState, startScreenShare, stopScreenShare } = useWebRTC(
    rtcSocket,
    rtcPeers,
    activeTab === 'video' ? localMedia.stream : null,
  );

  /* ── Propagate local mute/cam state to peers ── */
  const prevAudioRef = useRef(localMedia.audioEnabled);
  const prevVideoRef = useRef(localMedia.videoEnabled);
  useEffect(() => {
    if (activeTab !== 'video') return;
    if (
      prevAudioRef.current !== localMedia.audioEnabled ||
      prevVideoRef.current !== localMedia.videoEnabled
    ) {
      prevAudioRef.current = localMedia.audioEnabled;
      prevVideoRef.current = localMedia.videoEnabled;
      broadcastMediaState(localMedia.audioEnabled, localMedia.videoEnabled);
    }
  }, [activeTab, localMedia.audioEnabled, localMedia.videoEnabled, broadcastMediaState]);

  /* ── Audio level for speaking indicator ── */
  const audioLevel = useAudioLevel(
    activeTab === 'video' ? localMedia.stream : null,
    localMedia.audioEnabled,
  );

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Load room + history ── */
  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Room>(`/api/rooms/${id}`),
      api.get<ChatMessage[]>(`/api/rooms/${id}/messages`),
    ])
      .then(([r, msgs]) => {
        setRoom(r);
        setMessages(msgs);
      })
      .catch((err: { status?: number }) => {
        if (err.status === 404) setNotFound(true);
      })
      .finally(() => setLoadingRoom(false));
  }, [id]);

  /* ── WebSocket ── */
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (!id) return;

    const socket = io(`${WS_URL}/rooms`, {
      transports: ['websocket'],
      autoConnect: false,
    });
    socketRef.current = socket;

    socket.on('connect', async () => {
      const idToken = await auth.currentUser?.getIdToken();
      socket.emit('join-room', { roomId: id, idToken });
    });

    socket.on('room:joined', ({ participants: peers }: {
      socketId: string;
      participants: PeerInfo[];
    }) => {
      setConnected(true);
      setRtcSocket(socket);
      setRtcPeers(peers.map(p => ({
        socketId: p.socketId,
        username: p.username,
        audioEnabled: p.audioEnabled ?? true,
        videoEnabled: p.videoEnabled ?? true,
        isScreenSharing: p.isScreenSharing ?? false,
      })));
    });

    socket.on('room:message', (msg: ChatMessage) => addMessage(msg));
    socket.on('room:user-joined', ({ socketId, username }: { socketId: string; username: string }) => {
      setOnlineCount(c => c + 1);
      setRtcPeers(prev => [...prev, { socketId, username, audioEnabled: true, videoEnabled: true, isScreenSharing: false }]);
    });
    socket.on('room:user-left', ({ socketId }: { socketId: string }) => {
      setOnlineCount(c => Math.max(1, c - 1));
      setRtcPeers(prev => prev.filter(p => p.socketId !== socketId));
    });

    socket.connect();

    return () => {
      socket.emit('leave-room');
      socket.disconnect();
      socketRef.current = null;
      setRtcSocket(null);
      setRtcPeers([]);
    };
  }, [id, addMessage]);

  /* ── Send message ── */
  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      socketRef.current?.emit('send-message', { roomId: id, text, idToken });
      setInput('');
    } finally {
      setSending(false);
    }
  }

  /* ── Copy room ID (share banner) ── */
  async function handleCopyId() {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /* ── Invite Member (sidebar button) ── */
  async function handleInvite() {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  }

  /* ── Loading / error states ── */
  if (loadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef0f3]">
        <IconSpinner size={32} className="text-[#1e3252]" />
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef0f3] px-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">Sala no encontrada</p>
          <p className="text-sm text-gray-500 mt-1">El ID ingresado no corresponde a ninguna sala.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-[#1e3252] text-white text-sm font-semibold rounded-xl hover:bg-[#16263f] transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#eef0f3] overflow-hidden">

      {/* ── Sidebar collapsed strip ── */}
      {!sidebarVisible && (
        <div className="flex flex-col items-center py-4 px-1 flex-shrink-0">
          <button
            onClick={() => setSidebarVisible(true)}
            className="w-7 h-7 rounded-full bg-white/60 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center shadow transition-all"
            title="Mostrar barra lateral"
          >
            <IconChevronRight size={13} />
          </button>
        </div>
      )}

      {/* ── Left Sidebar ── */}
      {sidebarVisible && (
      <aside className="w-48 flex flex-col py-5 px-3 flex-shrink-0">

        {/* Logo + Room Info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <IconBookOpen size={26} className="text-[#1e3252]" />
          </div>
          <div className="flex items-center gap-1 justify-center w-full px-1">
            <span className="font-bold text-gray-900 text-sm text-center truncate max-w-[120px]">
              {room.name}
            </span>
            {isHost && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowHostMenu(v => !v)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IconMoreVertical size={14} />
                </button>
                {showHostMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowHostMenu(false)} />
                    <div className="absolute left-0 top-6 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                      <button
                        onClick={() => { setShowHostMenu(false); setShowEdit(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <IconPencil size={13} /> Editar nombre
                      </button>
                      <button
                        onClick={() => { setShowHostMenu(false); setShowDelete(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <IconTrash size={13} /> Eliminar sala
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500">Active Session</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {/* Participants — disabled */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed select-none">
            <div className="flex items-center gap-2.5">
              <IconUsers size={15} />
              <span>Participants</span>
            </div>
            <span className="bg-gray-200 text-gray-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {onlineCount}
            </span>
          </div>

          {/* Video — active tab */}
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${
              activeTab === 'video'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <IconVideo size={15} />
            Video
          </button>

          {/* Chat — active tab */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${
              activeTab === 'chat'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <IconMessageSquare size={15} />
            Chat
          </button>

          {/* Resources — disabled */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed select-none">
            <IconFolder size={15} />
            <span>Resources</span>
          </div>

          {/* Notes — disabled */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed select-none">
            <IconNote size={15} />
            <span>Notes</span>
          </div>
        </nav>

        <div className="flex-1" />

        {/* Invite Member */}
        <button
          onClick={handleInvite}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1e3252] hover:bg-[#16263f] text-white text-sm font-semibold rounded-xl transition-colors mb-3"
        >
          {inviteCopied
            ? <><IconCheckCircle size={15} /> ¡Copiado!</>
            : <><IconUserPlus size={15} /> Invite Member</>
          }
        </button>

        {/* Help + Leave */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 cursor-not-allowed select-none rounded-xl">
            <IconHelp size={15} />
            Help
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            <IconLogOut size={15} />
            Leave
          </button>
          <button
            onClick={() => setSidebarVisible(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
            title="Ocultar barra lateral"
          >
            <IconChevronLeft size={15} />
            Ocultar
          </button>
        </div>
      </aside>
      )}  {/* end sidebar conditional */}

      {/* ── Main Area ── */}
      <main className={[
        'flex-1 flex flex-col overflow-hidden my-3 mr-3 shadow-sm',
        sidebarVisible ? 'rounded-l-3xl' : 'ml-3 rounded-3xl',
        activeTab === 'video' ? 'bg-gray-900' : 'bg-white',
      ].join(' ')}>

        {/* ─ Video Tab ─ */}
        {activeTab === 'video' && (
          <>
            {/* Permission error */}
            {localMedia.error ? (
              <PermissionBanner error={localMedia.error} onRetry={localMedia.retry} />
            ) : localMedia.loading ? (
              <div className="flex-1 flex items-center justify-center">
                <IconSpinner size={28} className="text-gray-400" />
              </div>
            ) : (
              /* Video area + optional chat panel */
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Video section ── */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                  {(() => {
                    const localName = user?.username ?? user?.firstName ?? 'Tú';
                    const sharingPeer = participants.find(p => p.isScreenSharing);
                    const presentationMode = isScreenSharing || !!sharingPeer;
                    const presentationStream = isScreenSharing ? screenStream : (sharingPeer?.stream ?? null);
                    const presenterName = isScreenSharing ? localName : (sharingPeer?.username ?? '');

                    const localTile = (
                      <VideoTile
                        stream={localMedia.stream}
                        username={localName}
                        avatarUrl={user?.avatarUrl}
                        isLocal
                        audioEnabled={localMedia.audioEnabled}
                        videoEnabled={localMedia.videoEnabled}
                        isScreenSharing={isScreenSharing}
                        isSpeaking={audioLevel > 0.05}
                      />
                    );

                    if (presentationMode) {
                      /* ── Presentation layout ── */
                      const thumbTiles = [
                        { id: user?.uid ?? 'local', node: localTile },
                        ...participants.map(p => ({
                          id: p.userId,
                          node: (
                            <VideoTile
                              stream={p.stream}
                              username={p.username}
                              avatarUrl={p.avatarUrl}
                              audioEnabled={p.audioEnabled}
                              videoEnabled={p.videoEnabled}
                              isScreenSharing={p.isScreenSharing}
                            />
                          ),
                        })),
                      ];
                      return (
                        <div className="flex-1 min-h-0 flex flex-col">
                          {/* Thumbnail strip */}
                          <div className="flex gap-2 px-2 pt-2 flex-shrink-0 h-32 overflow-x-auto">
                            {thumbTiles.map(t => (
                              <div key={t.id} className="w-44 flex-shrink-0 h-full">{t.node}</div>
                            ))}
                          </div>
                          {/* Large screen share area */}
                          <div className="flex-1 min-h-0 p-2">
                            <PresentationArea stream={presentationStream} presenterName={presenterName} />
                          </div>
                        </div>
                      );
                    }

                    if (participants.length === 0) {
                      /* ── Solo: local tile + waiting placeholder ── */
                      return (
                        <div className="flex flex-1 min-h-0 gap-2 p-2">
                          <div className="w-52 flex-shrink-0">{localTile}</div>
                          <div className="flex-1 rounded-2xl bg-[#131720] flex flex-col items-center justify-center gap-4 select-none">
                            <div className="w-14 h-14 rounded-2xl bg-[#1e2535] flex items-center justify-center">
                              <IconClock size={26} className="text-gray-500" />
                            </div>
                            <div className="text-center px-6">
                              <p className="font-semibold text-gray-300">Esperando participantes...</p>
                              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                Comparte el ID de la sala{' '}
                                <span className="font-bold text-gray-300">{id}</span>{' '}
                                para que otros se unan a la sesión de estudio.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    /* ── Adaptive grid (max 3 tiles) ── */
                    return (
                      <div className="flex-1 min-h-0">
                        <VideoGrid
                          tiles={[
                            { id: user?.uid ?? 'local', node: localTile },
                            ...participants.slice(0, 2).map(p => ({
                              id: p.userId,
                              node: (
                                <VideoTile
                                  stream={p.stream}
                                  username={p.username}
                                  avatarUrl={p.avatarUrl}
                                  audioEnabled={p.audioEnabled}
                                  videoEnabled={p.videoEnabled}
                                  isScreenSharing={p.isScreenSharing}
                                />
                              ),
                            })),
                          ]}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* ── Chat panel ── */}
                {chatPanelOpen && (
                  <div className="w-72 flex flex-col border-l border-white/10 bg-gray-950 flex-shrink-0 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                      <span className="text-sm font-semibold text-white">Chat de la sala</span>
                      <button
                        onClick={() => setChatPanelOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <IconX size={15} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
                      {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500 text-sm text-center">Sin mensajes todavía.</p>
                        </div>
                      )}
                      {messages.map((msg, idx) => {
                        const isOwn = msg.senderUid === user?.uid;
                        const sameAuthor = messages[idx - 1]?.senderUid === msg.senderUid;
                        const initial = msg.senderUsername?.[0]?.toUpperCase() ?? '?';
                        const msgAvatar = isOwn
                          ? user?.avatarUrl
                          : participants.find(p => p.userId === msg.senderUid)?.avatarUrl;
                        return (
                          <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${sameAuthor ? 'mt-0.5' : 'mt-3'}`}>
                            {msgAvatar ? (
                              <img src={msgAvatar} alt={msg.senderUsername} className={`w-6 h-6 rounded-full object-cover flex-shrink-0 ${sameAuthor ? 'opacity-0' : ''}`} />
                            ) : (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white ${sameAuthor ? 'opacity-0' : ''} ${isOwn ? 'bg-teal-500' : 'bg-gray-600'}`}>
                                {initial}
                              </div>
                            )}
                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]`}>
                              {!sameAuthor && (
                                <span className="text-[10px] font-medium text-gray-400 mb-0.5">
                                  {msg.senderUsername}
                                </span>
                              )}
                              <div className={`px-2.5 py-1.5 rounded-xl text-xs leading-relaxed break-words ${
                                isOwn ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-100'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                    <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder="Escribe un mensaje..."
                          maxLength={2000}
                          className="flex-1 px-3 py-2 bg-gray-800 rounded-xl text-xs text-gray-100 placeholder-gray-500 outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() || sending}
                          className="w-8 h-8 flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {sending ? <IconSpinner size={13} /> : <IconSend size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark pill control bar */}
            {!localMedia.error && (
              <MediaControls
                audioEnabled={localMedia.audioEnabled}
                videoEnabled={localMedia.videoEnabled}
                chatOpen={chatPanelOpen}
                audioLevel={audioLevel}
                isScreenSharing={isScreenSharing}
                onToggleAudio={localMedia.toggleAudio}
                onToggleVideo={localMedia.toggleVideo}
                onToggleChat={() => setChatPanelOpen(v => !v)}
                onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
                onLeave={() => navigate('/dashboard')}
              />
            )}
          </>
        )}

        {/* ─ Chat Tab ─ */}
        {activeTab === 'chat' && (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
              <IconMessageSquare size={16} className="text-teal-500" />
              <span className="text-sm font-semibold text-gray-800">Chat</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
                <IconUsers size={12} />
                <span>{onlineCount} en línea</span>
              </div>
            </div>

            {/* Share banner */}
            {isHost && showShareBanner && (
              <div className="bg-teal-50 border-b border-teal-100 px-5 py-3 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-teal-800">
                      ¡Sala creada! Comparte este código con tus compañeros para que puedan unirse:
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <code className="bg-white border border-teal-200 text-teal-700 font-mono text-sm px-3 py-1 rounded-lg">
                        {id}
                      </code>
                      <button
                        onClick={handleCopyId}
                        className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
                      >
                        {copied
                          ? <><IconCheckCircle size={13} /> ¡Copiado!</>
                          : <><IconCopy size={13} /> Copiar código</>
                        }
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShareBanner(false)}
                    className="text-teal-400 hover:text-teal-600 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {messages.length === 0 && connected && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <IconMessageSquare size={22} className="text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700">Inicio del chat</p>
                  <p className="text-sm text-gray-400 mt-1">Sé el primero en escribir.</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isOwn = msg.senderUid === user?.uid;
                const prevMsg = messages[idx - 1];
                const sameAuthor = prevMsg?.senderUid === msg.senderUid;
                const initial = msg.senderUsername?.[0]?.toUpperCase() ?? '?';
                const msgAvatar = isOwn
                  ? user?.avatarUrl
                  : participants.find(p => p.userId === msg.senderUid)?.avatarUrl;

                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${sameAuthor ? 'mt-0.5' : 'mt-3'}`}>
                    {msgAvatar ? (
                      <img src={msgAvatar} alt={msg.senderUsername} className={`w-7 h-7 rounded-full object-cover flex-shrink-0 ${sameAuthor ? 'opacity-0' : ''}`} />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${sameAuthor ? 'opacity-0' : ''} ${isOwn ? 'bg-teal-500' : 'bg-[#1e3252]'}`}>
                        {initial}
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!sameAuthor && (
                        <div className={`flex items-baseline gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-gray-700">{msg.senderUsername}</span>
                          <span className="text-[10px] text-gray-400">{fmtTime(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? 'bg-[#1e3252] text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      {sameAuthor && (
                        <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{fmtTime(msg.createdAt)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-5 py-3.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Mensaje en #${room.name}`}
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#1e3252]/20 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 flex items-center justify-center bg-[#1e3252] hover:bg-[#16263f] text-white rounded-xl transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? <IconSpinner size={16} /> : <IconSend size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {showEdit && (
        <EditNameModal
          room={room}
          onClose={() => setShowEdit(false)}
          onSave={name => { setRoom(r => r ? { ...r, name } : r); setShowEdit(false); }}
        />
      )}
      {showDelete && (
        <DeleteRoomModal
          room={room}
          onClose={() => setShowDelete(false)}
          onDeleted={() => navigate('/dashboard', { replace: true })}
        />
      )}
    </div>
  );
}
