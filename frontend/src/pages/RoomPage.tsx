import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import type { Room, ChatMessage } from '../types/room';
import {
  IconGraduationCap, IconArrowLeft, IconPencil, IconTrash,
  IconSend, IconSpinner, IconAlertTriangle, IconHash, IconUsers,
  IconCopy, IconX, IconCheckCircle,
} from '../components/icons';

const WS_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

/* ─── Helpers ─────────────────────────────────────────────────────── */
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

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [showShareBanner, setShowShareBanner] = useState(
    !!(location.state as { justCreated?: boolean } | null)?.justCreated
  );
  const [copied, setCopied] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isHost = !!room && !!user && room.hostUid === user.uid;

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

    socket.on('room:joined', () => setConnected(true));

    socket.on('room:message', (msg: ChatMessage) => addMessage(msg));

    socket.on('room:user-joined', () => setOnlineCount(c => c + 1));
    socket.on('room:user-left', () => setOnlineCount(c => Math.max(1, c - 1)));

    socket.connect();

    return () => {
      socket.emit('leave-room');
      socket.disconnect();
      socketRef.current = null;
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

  /* ── Copy room ID ── */
  async function handleCopyId() {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /* ── Loading / error states ── */
  if (loadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <IconSpinner size={32} className="text-[#1e3252]" />
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
    <div className="h-screen flex flex-col bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo + back */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-[#1e3252] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={14} className="text-white" />
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <IconArrowLeft size={15} /> Dashboard
          </button>

          <span className="text-gray-300">/</span>

          {/* Room name */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <IconHash size={15} className="text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 text-sm truncate">{room.name}</span>
            {isHost && (
              <span className="flex-shrink-0 text-xs font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                Anfitrión
              </span>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Online count */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              <IconUsers size={13} />
              <span>{onlineCount}</span>
            </div>

            {/* Host controls */}
            {isHost && (
              <>
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <IconPencil size={13} /> Editar
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <IconTrash size={13} /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Share banner (host, recién creada) ── */}
      {isHost && showShareBanner && (
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-3 flex-shrink-0">
          <div className="max-w-screen-xl mx-auto flex items-start gap-3">
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

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && connected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <IconHash size={22} className="text-gray-400" />
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

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${sameAuthor ? 'mt-0.5' : 'mt-3'}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${sameAuthor ? 'opacity-0' : ''} ${isOwn ? 'bg-teal-500' : 'bg-[#1e3252]'}`}>
                {initial}
              </div>

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
                    : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm'
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

      {/* ── Input ── */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto flex items-center gap-2">
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
