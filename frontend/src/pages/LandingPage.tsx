import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
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
  const { t } = useTranslation();
  const { user, firebaseUid, initialized, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (initialized && firebaseUid && user) navigate('/dashboard', { replace: true });
  }, [initialized, firebaseUid, user, navigate]);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { needsProfile } = await signInWithGoogle();
      navigate(needsProfile ? '/complete-profile' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        showToast('error', 'Error', t('authErrors.googleError'));
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0f1f35] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">StudySphere</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {t('nav.features')}
            </a>
            <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {t('nav.about')}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
              {t('nav.signIn')}
            </button>
            <button onClick={() => navigate('/register')} className="bg-[#0f1f35] hover:bg-[#1a2f4e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-1.5 mb-7">
              <IconGraduationCap size={13} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
                {t('landing.badge')}
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              <span className="text-[#0f1f35]">{t('landing.title1')}</span>
              <br />
              <span className="text-teal-600">{t('landing.title2')}</span>
            </h1>

            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              {t('landing.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 bg-[#0f1f35] hover:bg-[#1a2f4e] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {t('landing.ctaPrimary')}
                <IconArrowRight size={17} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <IconMonitor size={17} />
                {t('landing.ctaSecondary')}
              </button>
            </div>

            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex items-center gap-3 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
            >
              {googleLoading ? <IconSpinner size={16} className="text-gray-400" /> : <IconGoogle size={16} />}
              {t('landing.googleCta')}
            </button>
          </div>

          {/* Hero card */}
          <div className="relative">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#0d4a5e] via-[#0a3448] to-[#081e2f] rounded-2xl overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-5 w-full h-full">
                  <div className="col-span-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-teal-500/60 flex items-center justify-center text-white text-sm font-bold">JS</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 bg-white/30 rounded-full w-3/4" />
                      <div className="h-2 bg-white/15 rounded-full w-1/2" />
                    </div>
                    <div className="w-20 h-12 bg-teal-600/40 rounded-lg border border-teal-400/20" />
                  </div>
                  <div className="bg-white/8 rounded-xl border border-white/10 flex flex-col gap-2 p-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-400/50 flex items-center justify-center text-white text-xs font-bold">AK</div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-white/20 rounded-full w-full" />
                      <div className="h-1.5 bg-white/10 rounded-full w-3/4" />
                      <div className="h-1.5 bg-white/15 rounded-full w-2/4" />
                    </div>
                  </div>
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
                    <div key={i} className="w-7 h-7 bg-teal-500 rounded-full border-2 border-teal-900 flex items-center justify-center text-xs font-bold text-white">{i}</div>
                  ))}
                  <div className="w-7 h-7 bg-slate-500 rounded-full border-2 border-teal-900 flex items-center justify-center text-xs font-bold text-white">+2</div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-teal-500/10 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* ── FEATURES: Video + Chat ── */}
      <section id="features" className="bg-[#eef0f8] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f1f35] mb-3">{t('landing.features.heading')}</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              {t('landing.features.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-52 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2">
                  <div className="bg-gradient-to-b from-gray-50 to-gray-150" />
                  <div className="bg-gradient-to-b from-gray-200 to-gray-300" />
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-teal-400/60" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="w-11 h-11 bg-[#1e3252] rounded-xl flex items-center justify-center mb-4">
                  <IconCamera size={20} className="text-white" />
                </div>
                <h3 className="text-[#0f1f35] font-bold text-lg mb-2">{t('landing.features.video.title')}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t('landing.features.video.description')}</p>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
              <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center mb-4">
                <IconMessageSquare size={20} className="text-white" />
              </div>
              <h3 className="text-[#0f1f35] font-bold text-lg mb-2">{t('landing.features.chat.title')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{t('landing.features.chat.description')}</p>
              <div className="mt-auto bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-150 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREEN SHARING BANNER ── */}
      <section className="bg-[#eef0f8] pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1e3252] rounded-2xl px-10 py-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center overflow-hidden">
            <div>
              <div className="w-11 h-11 border-2 border-white/25 rounded-xl flex items-center justify-center mb-6">
                <IconMonitor size={22} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 leading-snug">
                {t('landing.features.screen.title')}
              </h3>
              <p className="text-blue-200/75 text-sm leading-relaxed mb-8">
                {t('landing.features.screen.description')}
              </p>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 bg-white text-[#1e3252] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                {t('landing.features.screen.cta')}
                <IconArrowRight size={15} />
              </button>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xs lg:max-w-sm" style={{ transform: 'perspective(900px) rotateY(-10deg) rotateX(3deg)' }}>
                <div className="bg-[#d9dce6] rounded-t-xl px-4 py-3 flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="bg-white rounded-b-xl p-5 space-y-3.5 shadow-2xl">
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                  <div className="h-24 bg-gray-50 rounded-lg border border-gray-200" />
                  <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                </div>
              </div>
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
            <a href="#" className="hover:text-gray-700 transition-colors">{t('landing.footer.privacy')}</a>
            <a href="#" className="hover:text-gray-700 transition-colors">{t('landing.footer.terms')}</a>
            <a href="#" className="hover:text-gray-700 transition-colors">{t('landing.footer.accessibility')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
