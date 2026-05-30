import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import {
  IconGraduationCap,
  IconGoogle,
  IconSpinner,
  IconArrowRight,
  IconMonitor,
  IconCamera,
  IconMessageSquare,
  IconUsers,
} from '../components/icons';

export function LandingPage() {
  const { user, firebaseUid, initialized, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (initialized && firebaseUid && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, firebaseUid, user, navigate]);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { needsProfile } = await signInWithGoogle();
      navigate(needsProfile ? '/complete-profile' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        showToast('error', 'Error', 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0f1f35] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">StudySphere</span>
          </div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</a>
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#0f1f35] hover:bg-[#1a2f4e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-1.5 mb-7">
              <IconGraduationCap size={13} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
                A new standard for academia
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              <span className="text-[#0f1f35]">Synchronous Study,</span>
              <br />
              <span className="text-teal-600">Reimagined.</span>
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              Experience a collaborative digital workspace engineered to reduce cognitive
              load and enhance focus. High-fidelity audio, dynamic video grids, and
              persistent scholarly tools—all in one seamless, accessible platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 bg-[#0f1f35] hover:bg-[#1a2f4e] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get Started
                <IconArrowRight size={17} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <IconMonitor size={17} />
                Join a Room
              </button>
            </div>

            {/* Google option */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex items-center gap-3 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
            >
              {googleLoading ? (
                <IconSpinner size={16} className="text-gray-400" />
              ) : (
                <IconGoogle size={16} />
              )}
              Continue with Google
            </button>
          </div>

          {/* Right: hero illustration */}
          <div className="relative">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#0d4a5e] via-[#0a3448] to-[#081e2f] rounded-2xl overflow-hidden relative shadow-2xl">

              {/* Abstract study group illustration */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-5 w-full h-full">
                  {/* Desk 1 — main presenter */}
                  <div className="col-span-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-teal-500/60 flex items-center justify-center text-white text-sm font-bold">JS</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 bg-white/30 rounded-full w-3/4" />
                      <div className="h-2 bg-white/15 rounded-full w-1/2" />
                    </div>
                    <div className="w-20 h-12 bg-teal-600/40 rounded-lg border border-teal-400/20" />
                  </div>

                  {/* Desk 2 */}
                  <div className="bg-white/8 rounded-xl border border-white/10 flex flex-col gap-2 p-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-400/50 flex items-center justify-center text-white text-xs font-bold">AK</div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-white/20 rounded-full w-full" />
                      <div className="h-1.5 bg-white/10 rounded-full w-3/4" />
                      <div className="h-1.5 bg-white/15 rounded-full w-2/4" />
                    </div>
                  </div>

                  {/* Desk 3 */}
                  <div className="bg-white/8 rounded-xl border border-white/10 flex flex-col gap-2 p-3">
                    <div className="w-8 h-8 rounded-full bg-amber-400/50 flex items-center justify-center text-white text-xs font-bold">MR</div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-white/20 rounded-full w-full" />
                      <div className="h-1.5 bg-white/10 rounded-full w-2/3" />
                      <div className="h-1.5 bg-white/15 rounded-full w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active session card — bottom overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md rounded-xl px-4 py-3 flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-500/30 rounded-lg flex items-center justify-center">
                    <IconUsers size={14} className="text-teal-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">Advanced Calculus Group</p>
                    <p className="text-white/50 text-xs">4 Participants Active</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {['JS', 'AK'].map(i => (
                    <div key={i} className="w-7 h-7 bg-teal-500 rounded-full border-2 border-teal-900 flex items-center justify-center text-xs font-bold text-white">
                      {i}
                    </div>
                  ))}
                  <div className="w-7 h-7 bg-slate-500 rounded-full border-2 border-teal-900 flex items-center justify-center text-xs font-bold text-white">
                    +2
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-teal-500/10 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-[#0f1f35] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Precision Tools for Serious Scholars
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
              Our platform integrates seamlessly into your academic workflow, providing
              high-contrast clarity and structured environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 — Video */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Preview area */}
              <div className="h-36 bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-2 gap-2 p-4 w-full">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/10 rounded-lg h-12 border border-white/5 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-teal-400/50" />
                    </div>
                  ))}
                </div>
                {/* Active speaker highlight */}
                <div className="absolute inset-0 border-2 border-teal-400/30 rounded-none pointer-events-none" />
              </div>
              <div className="p-5">
                <div className="w-9 h-9 bg-teal-500/20 rounded-xl flex items-center justify-center mb-3">
                  <IconCamera size={18} className="text-teal-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Real-Time Video & Audio</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Dynamic fluid grid layouts that automatically reflow. Active speaker
                  highlighting utilizing high-contrast Teal borders ensures you never miss
                  a cue during complex discussions.
                </p>
              </div>
            </div>

            {/* Card 2 — Chat */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="w-9 h-9 bg-teal-500/20 rounded-xl flex items-center justify-center mb-3">
                <IconMessageSquare size={18} className="text-teal-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Persistent Chat</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Threaded conversations, file attachments, and searchable histories mapped
                perfectly to the fixed sidebar grid.
              </p>

              {/* Chat preview */}
              <div className="bg-black/30 rounded-xl p-3 space-y-3 border border-white/5">
                {[
                  { init: 'JS', w1: 'w-3/4', w2: 'w-1/2' },
                  { init: 'AK', w1: 'w-2/3', w2: 'w-3/4' },
                ].map(({ init, w1, w2 }) => (
                  <div key={init} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      {init}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-2 bg-white/25 rounded-full ${w1}`} />
                      <div className={`h-2 bg-white/12 rounded-full ${w2}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Screen sharing (dark accent) */}
            <div className="bg-[#1e3252] border border-[#2a4470] rounded-2xl p-5 flex flex-col">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <IconMonitor size={18} className="text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Flawless Screen Sharing</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Share presentations, code IDEs, or digital whiteboards with minimal
                latency. Our focus-first layout minimizes the UI chrome to prioritize
                your canvas.
              </p>

              {/* Window preview */}
              <div className="flex-1 bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="p-3 space-y-2">
                  <div className="h-2 bg-white/20 rounded w-3/4" />
                  <div className="h-10 bg-white/5 rounded border border-white/10" />
                  <div className="h-2 bg-white/15 rounded w-1/2" />
                </div>
              </div>

              <button
                onClick={() => navigate('/register')}
                className="mt-4 flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                See it in action
                <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0f1f35] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">StudySphere</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
