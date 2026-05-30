import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  IconGraduationCap, IconMail, IconLock, IconEye, IconEyeOff,
  IconSpinner, IconAlertCircle, IconMail2, IconCheckCircle, IconGoogle,
} from '../components/icons';

const AUTH_ERROR_KEYS: Record<string, string> = {
  'auth/wrong-password': 'authErrors.invalidCredentials',
  'auth/user-not-found': 'authErrors.invalidCredentials',
  'auth/invalid-credential': 'authErrors.invalidCredentials',
  'auth/too-many-requests': 'authErrors.tooManyRequests',
  'auth/user-disabled': 'authErrors.userDisabled',
  'auth/invalid-email': 'authErrors.invalidEmail',
  'auth/network-request-failed': 'authErrors.networkError',
};

type Mode = 'login' | 'forgot' | 'forgot-sent';

export function LoginPage() {
  const { t } = useTranslation();
  const { user, firebaseUid, initialized, signIn, sendResetEmail, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && firebaseUid && user) navigate('/dashboard', { replace: true });
  }, [initialized, firebaseUid, user, navigate]);

  function validateEmail(value: string): string | null {
    if (!value) return t('validation.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('validation.emailInvalid');
    return null;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = !password ? t('validation.passwordRequired') : null;
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msgKey = AUTH_ERROR_KEYS[code] ?? 'authErrors.generic';
      showToast('error', t('authErrors.accessDenied'), t(msgKey));
      setPasswordError(' ');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(resetEmail);
    setResetEmailError(err);
    if (err) return;

    setIsLoading(true);
    try {
      await sendResetEmail(resetEmail);
      setMode('forgot-sent');
    } catch {
      showToast('error', 'Error', t('authErrors.resetError'));
    } finally {
      setIsLoading(false);
    }
  }

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
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-8">
      <ToastContainer />

      {/* Top bar */}
      <div className="w-full max-w-sm mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          {t('common.backToHome')}
        </button>
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-10">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-[#1e3252] rounded-2xl flex items-center justify-center shadow-md">
              <IconGraduationCap size={28} className="text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 whitespace-pre-line">
              {t('login.title')}
            </h1>
            <p className="text-gray-500 text-xs leading-relaxed">{t('login.subtitle')}</p>
          </div>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.emailLabel')}</label>
                  <div className={`flex items-center border rounded-xl bg-white transition-colors ${emailError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'}`}>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError(null); }}
                      placeholder={t('login.emailPlaceholder')} autoComplete="email"
                      className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent" />
                    <span className="pr-3 flex-shrink-0">
                      {emailError ? <IconAlertCircle size={18} className="text-red-500" /> : <IconMail size={18} className="text-gray-400" />}
                    </span>
                  </div>
                  {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">{t('login.passwordLabel')}</label>
                    <button type="button" onClick={() => { setMode('forgot'); setResetEmail(email); }}
                      className="text-xs text-gray-500 hover:text-[#1e3252] transition-colors">
                      {t('login.forgotPassword')}
                    </button>
                  </div>
                  <div className={`flex items-center border rounded-xl bg-white transition-colors ${passwordError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'}`}>
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setPasswordError(null); }}
                      placeholder="••••••••" autoComplete="current-password"
                      className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent" />
                    <span className="pr-3 flex items-center gap-1.5">
                      {passwordError?.trim() && <IconAlertCircle size={18} className="text-red-500" />}
                      <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label={showPwd ? 'Hide password' : 'Show password'}>
                        {showPwd ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </span>
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  style={{ backgroundColor: isLoading ? '#9ca3af' : '#1e3252' }}>
                  {isLoading ? <><IconSpinner size={18} />{t('login.submitting')}</> : t('login.submitButton')}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{t('common.or')}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button onClick={handleGoogle} disabled={googleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors disabled:opacity-60">
                {googleLoading ? <IconSpinner size={18} className="text-gray-500" /> : <IconGoogle size={18} />}
                {t('login.googleButton')}
              </button>
            </div>
          )}

          {/* ── FORGOT ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleReset} noValidate className="space-y-4">
              <p className="text-sm text-gray-600 text-center">{t('login.forgotSubtitle')}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.forgotEmailLabel')}</label>
                <div className={`flex items-center border rounded-xl bg-white transition-colors ${resetEmailError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'}`}>
                  <input type="email" value={resetEmail} onChange={e => { setResetEmail(e.target.value); setResetEmailError(null); }}
                    placeholder={t('login.emailPlaceholder')} autoComplete="email"
                    className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent" />
                  <span className="pr-3 flex-shrink-0">
                    {resetEmailError ? <IconAlertCircle size={18} className="text-red-500" /> : <IconMail size={18} className="text-gray-400" />}
                  </span>
                </div>
                {resetEmailError && <p className="mt-1.5 text-xs text-red-600">{resetEmailError}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:cursor-not-allowed"
                style={{ backgroundColor: isLoading ? '#9ca3af' : '#1e3252' }}>
                {isLoading ? <><IconSpinner size={18} />{t('login.sending')}</> : t('login.sendLink')}
              </button>
              <button type="button" onClick={() => setMode('login')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-1">
                {t('login.backToLogin')}
              </button>
            </form>
          )}

          {/* ── SENT ── */}
          {mode === 'forgot-sent' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                  <IconMail2 size={28} className="text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">{t('login.sentTitle')}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('login.sentDesc', { email: resetEmail })}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <IconCheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-700 text-left">{t('login.sentNote')}</p>
              </div>
              <button onClick={() => { setMode('login'); setResetEmail(''); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-[#1e3252] border border-[#1e3252] hover:bg-[#1e3252] hover:text-white transition-colors">
                {t('login.backToSignIn')}
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'login' && (
        <p className="mt-4 text-sm text-slate-400">
          {t('login.noAccount')}{' '}
          <button onClick={() => navigate('/register')} className="text-slate-200 font-semibold hover:underline">
            {t('login.createAccount')}
          </button>
        </p>
      )}
    </div>
  );
}
