import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Room } from '../types/room';
import {
  IconGraduationCap, IconBell, IconSettings, IconMessageSquare,
  IconSearch, IconClock, IconPlus, IconCalendar, IconBookOpen,
  IconPencil, IconTrash, IconLogIn, IconSpinner, IconMoreVertical,
  IconAlertTriangle,
} from '../components/icons';

/* ─── Helpers ─────────────────────────────────────────────────────── */
const GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-[#1e3252] to-[#0f1e33]',
  'from-teal-600 to-emerald-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-600',
  'from-slate-600 to-slate-800',
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Mock sidebar data ───────────────────────────────────────────── */
const SESSIONS = [
  { month: 'OCT', day: '24', title: 'Physics 101 Study Group', time: '4:00 PM - 5:30 PM' },
  { month: 'OCT', day: '25', title: 'History Essay Peer Review', time: '10:00 AM - 11:00 AM' },
];
const ACTIVITY = [
  { icon: 'file', text: 'Sarah shared Calculus_Notes.pdf in', link: 'Calculus II', when: '2 hours ago' },
  { icon: 'msg', text: '5 new messages in', link: 'Literature Group Project', when: 'Yesterday' },
];

/* ─── Modal overlay wrapper ───────────────────────────────────────── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── CreateRoomModal ─────────────────────────────────────────────── */
function CreateRoomModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (room: Room) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) { setError('El nombre no puede estar vacío.'); return; }
    setLoading(true);
    try {
      const room = await api.post<Room>('/api/rooms', { name: trimmed });
      onCreate(room);
      navigate(`/room/${room.id}`);
    } catch {
      setError('No se pudo crear la sala. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Nueva sala de estudio</h2>
        <p className="text-sm text-gray-500 mb-4">Elige un nombre para tu sala.</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Ej: Cálculo II — Parciales"
          maxLength={80}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e3252] focus:ring-1 focus:ring-[#1e3252] transition-colors"
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3252] hover:bg-[#16263f] text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? <IconSpinner size={15} /> : <IconPlus size={15} />}
          Crear sala
        </button>
      </div>
    </Modal>
  );
}

/* ─── JoinRoomModal ───────────────────────────────────────────────── */
function JoinRoomModal({ onClose }: { onClose: () => void }) {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin() {
    const trimmed = roomId.trim();
    if (!trimmed) { setError('Ingresa un ID de sala.'); return; }
    setLoading(true);
    try {
      await api.get<Room>(`/api/rooms/${trimmed}`);
      navigate(`/room/${trimmed}`);
    } catch (err: unknown) {
      const e = err as { status?: number };
      setError(e.status === 404 ? 'Sala no encontrada. Verifica el ID.' : 'Error al buscar la sala.');
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Unirse a una sala</h2>
        <p className="text-sm text-gray-500 mb-4">Pega el ID de sala que te compartieron.</p>
        <input
          autoFocus
          type="text"
          value={roomId}
          onChange={e => { setRoomId(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="ID de la sala"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-[#1e3252] focus:ring-1 focus:ring-[#1e3252] transition-colors"
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleJoin}
          disabled={loading || !roomId.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3252] hover:bg-[#16263f] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <IconSpinner size={15} /> : <IconLogIn size={15} />}
          Unirse
        </button>
      </div>
    </Modal>
  );
}

/* ─── EditRoomModal ───────────────────────────────────────────────── */
function EditRoomModal({ room, onClose, onSave }: {
  room: Room;
  onClose: () => void;
  onSave: (updated: Room) => void;
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
      onSave(updated);
    } catch {
      setError('No se pudo actualizar el nombre.');
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Editar nombre de sala</h2>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          maxLength={80}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e3252] focus:ring-1 focus:ring-[#1e3252] transition-colors mt-3"
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3252] text-white font-semibold text-sm transition-colors disabled:opacity-50">
          {loading ? <IconSpinner size={15} /> : null}
          Guardar
        </button>
      </div>
    </Modal>
  );
}

/* ─── DeleteRoomModal ─────────────────────────────────────────────── */
function DeleteRoomModal({ room, onClose, onDeleted }: {
  room: Room;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    try {
      await api.del(`/api/rooms/${room.id}`);
      onDeleted(room.id);
    } catch {
      setError('No se pudo eliminar la sala.');
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <IconAlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eliminar sala</h2>
            <p className="text-sm text-gray-600 mt-1">
              ¿Eliminar <span className="font-semibold">"{room.name}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={handleDelete} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:bg-red-300">
          {loading ? <IconSpinner size={15} /> : <IconTrash size={15} />}
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

/* ─── RoomCard ────────────────────────────────────────────────────── */
function RoomCard({
  room, gradient, onEdit, onDelete,
}: {
  room: Room;
  gradient: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Gradient header */}
      <div
        className={`relative h-24 bg-gradient-to-br ${gradient} flex items-center justify-center cursor-pointer`}
        onClick={() => navigate(`/room/${room.id}`)}
      >
        <span className="text-white text-base font-bold text-center px-4 drop-shadow line-clamp-2">
          {room.name}
        </span>
      </div>

      <div className="p-4 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">{fmtDate(room.createdAt)}</p>

        <div className="flex items-center gap-1.5">
          {/* Kebab menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <IconMoreVertical size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-8 z-20 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <IconPencil size={14} /> Editar nombre
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <IconTrash size={14} /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Enter button */}
          <button
            onClick={() => navigate(`/room/${room.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3252] hover:bg-[#16263f] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DashboardPage ────────────────────────────────────────────────── */
export function DashboardPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || '?';

  useEffect(() => {
    api.get<Room[]>('/api/rooms')
      .then(setRooms)
      .catch(() => setRoomsError(true))
      .finally(() => setLoadingRooms(false));
  }, []);

  async function handleSignOut() {
    setShowAvatarMenu(false);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Nav ── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1e3252] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">StudySphere</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm font-semibold text-[#1e3252] border-b-2 border-[#2dd4bf] pb-0.5">
              Dashboard
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Library</button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Schedule</button>
          </nav>

          <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 ml-auto">
            <IconSearch size={14} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search public rooms..." className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <IconBell size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <IconSettings size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(v => !v)}
                className="w-8 h-8 rounded-full bg-[#1e3252] flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1e3252]"
              >
                {user?.avatarUrl && !avatarError
                  ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                  : <span className="text-white text-xs font-bold">{initials}</span>
                }
              </button>
              {showAvatarMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAvatarMenu(false)} />
                  <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-800 truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => { setShowAvatarMenu(false); navigate('/profile'); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {t('dashboard.editProfile')}
                    </button>
                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                      {t('dashboard.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-6">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Welcome card */}
            <div className="bg-gray-100 rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.firstName ?? 'there'}.
                </h1>
                <p className="text-gray-500 text-sm mt-1">Gestiona tus salas de estudio.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJoin(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Unirse a sala
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1e3252] hover:bg-[#16263f] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <IconPlus size={15} />
                  Create New Room
                </button>
              </div>
            </div>

            {/* My Study Rooms */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">My Study Rooms</h2>
                <span className="text-sm text-gray-400">{rooms.length} sala{rooms.length !== 1 ? 's' : ''}</span>
              </div>

              {loadingRooms ? (
                <div className="flex items-center justify-center py-16">
                  <IconSpinner size={28} className="text-gray-400" />
                </div>
              ) : roomsError ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-sm">Error al cargar las salas.</p>
                  <button
                    onClick={() => { setRoomsError(false); setLoadingRooms(true); api.get<Room[]>('/api/rooms').then(setRooms).catch(() => setRoomsError(true)).finally(() => setLoadingRooms(false)); }}
                    className="mt-2 text-sm text-[#1e3252] font-semibold hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <IconGraduationCap size={28} className="text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700">Aún no tienes salas</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Crea una sala para empezar a estudiar.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3252] text-white text-sm font-semibold rounded-xl hover:bg-[#16263f] transition-colors"
                  >
                    <IconPlus size={15} /> Crear primera sala
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room, i) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      gradient={GRADIENTS[i % GRADIENTS.length]}
                      onEdit={() => setEditRoom(room)}
                      onDelete={() => setDeleteRoom(room)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-72 flex-shrink-0 hidden lg:flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Upcoming Sessions</h3>
              <div className="space-y-4">
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 flex-shrink-0 bg-[#1e3252] rounded-lg text-center py-1 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.month}</p>
                      <p className="text-base font-bold leading-none">{s.day}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{s.title}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <IconClock size={11} />{s.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm font-semibold text-[#2dd4bf] hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5">
                <IconCalendar size={14} /> View Calendar
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                      {a.icon === 'file'
                        ? <IconBookOpen size={14} className="text-teal-600" />
                        : <IconMessageSquare size={14} className="text-teal-600" />
                      }
                    </div>
                    <div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {a.text}{' '}
                        <span className="font-semibold text-[#2dd4bf]">{a.link}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.when}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreate={room => setRooms(prev => [room, ...prev])}
        />
      )}
      {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} />}
      {editRoom && (
        <EditRoomModal
          room={editRoom}
          onClose={() => setEditRoom(null)}
          onSave={updated => {
            setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditRoom(null);
          }}
        />
      )}
      {deleteRoom && (
        <DeleteRoomModal
          room={deleteRoom}
          onClose={() => setDeleteRoom(null)}
          onDeleted={id => {
            setRooms(prev => prev.filter(r => r.id !== id));
            setDeleteRoom(null);
          }}
        />
      )}
    </div>
  );
}
