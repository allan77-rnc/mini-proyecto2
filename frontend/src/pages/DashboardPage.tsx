import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import {
  IconGraduationCap, IconBell, IconSettings, IconMessageSquare,
  IconSearch, IconClock, IconPlus, IconCalendar, IconBookOpen,
} from '../components/icons';

/* ─── Mock data ───────────────────────────────────────────────────── */
const ROOMS = [
  {
    id: 1,
    tags: ['Calculus II', 'Midterm Prep'],
    title: 'Advanced Integration Techniques',
    desc: 'Reviewing partial fractions, trigonometric substitution, and improper integrals before...',
    badge: { type: 'active' as const, label: '12 Active' },
    avatars: ['#4f7cac', '#6ab187', '#e07b54'],
    extra: 9,
    action: 'Join',
    actionStyle: 'primary',
    bg: 'from-slate-600 to-slate-800',
  },
  {
    id: 2,
    tags: ['Literature', 'Group Project'],
    title: 'Modernist Poetry Analysis',
    desc: "Discussing T.S. Eliot's \"The Waste Land\" and finalizing our presentation slides.",
    badge: { type: 'time' as const, label: 'Starts 2:00 PM' },
    avatars: ['#4f7cac', '#c96868'],
    extra: 0,
    action: 'Details',
    actionStyle: 'outline',
    bg: 'from-[#1e3252] to-[#0f1e33]',
  },
];

const SESSIONS = [
  { month: 'OCT', day: '24', title: 'Physics 101 Study Group', time: '4:00 PM - 5:30 PM' },
  { month: 'OCT', day: '25', title: 'History Essay Peer Review', time: '10:00 AM - 11:00 AM' },
];

const ACTIVITY = [
  {
    icon: 'file',
    text: 'Sarah shared Calculus_Notes.pdf in',
    link: 'Calculus II',
    when: '2 hours ago',
  },
  {
    icon: 'msg',
    text: '5 new messages in',
    link: 'Literature Group Project',
    when: 'Yesterday',
  },
];

/* ─── DashboardPage ────────────────────────────────────────────────── */
export function DashboardPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const initials = (
    (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')
  ).toUpperCase() || '?';

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

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1e3252] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">StudySphere</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-sm font-semibold text-[#1e3252] border-b-2 border-[#2dd4bf] pb-0.5">
              Dashboard
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Library
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Schedule
            </button>
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 ml-auto">
            <IconSearch size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search public rooms..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <IconBell size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <IconSettings size={18} />
            </button>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(v => !v)}
                className="w-8 h-8 rounded-full bg-[#1e3252] flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1e3252]"
                title={user?.firstName}
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
                    <button
                      onClick={() => { setShowAvatarMenu(false); navigate('/profile'); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('dashboard.editProfile')}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
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
            <div className="bg-gray-100 rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.firstName ?? 'there'}.
                </h1>
                <p className="text-gray-500 text-sm mt-1">You have 2 scheduled sessions today.</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1e3252] hover:bg-[#16263f] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0">
                <IconPlus size={15} />
                Create New Room
              </button>
            </div>

            {/* My Study Rooms */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">My Study Rooms</h2>
                <button className="text-sm font-semibold text-[#2dd4bf] hover:text-teal-600 transition-colors">View All</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROOMS.map(room => (
                  <div key={room.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Image area */}
                    <div className={`relative h-36 bg-gradient-to-br ${room.bg}`}>
                      {/* Badge */}
                      {room.badge.type === 'active' ? (
                        <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          {room.badge.label}
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          <IconClock size={12} className="text-gray-600" />
                          {room.badge.label}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {room.tags.map(tag => (
                          <span key={tag} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{room.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{room.desc}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Avatar stack */}
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {room.avatars.map((color, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {room.extra > 0 && (
                            <span className="ml-2 text-xs text-gray-500 font-medium">+{room.extra}</span>
                          )}
                        </div>

                        {/* Action button */}
                        {room.actionStyle === 'primary' ? (
                          <button className="px-4 py-1.5 bg-[#1e3252] hover:bg-[#16263f] text-white text-sm font-semibold rounded-lg transition-colors">
                            {room.action}
                          </button>
                        ) : (
                          <button className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            {room.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="w-72 flex-shrink-0 hidden lg:flex flex-col gap-4">

            {/* Upcoming Sessions */}
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
                        <IconClock size={11} />
                        {s.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm font-semibold text-[#2dd4bf] hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5">
                <IconCalendar size={14} />
                View Calendar
              </button>
            </div>

            {/* Recent Activity */}
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
                        <span className="font-semibold text-[#2dd4bf] cursor-pointer hover:text-teal-600">{a.link}</span>
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
    </div>
  );
}
