import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import {
  IconGraduationCap,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconAlertCircle,
  IconMail2,
  IconCheckCircle,
} from '../components/icons';

const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/wrong-password': 'Credenciales incorrectas. Verifica e intenta de nuevo.',
  'auth/user-not-found': 'Credenciales incorrectas. Verifica e intenta de nuevo.',
  'auth/invalid-credential': 'Credenciales incorrectas. Verifica e intenta de nuevo.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/network-request-failed': 'Sin conexión. Verifica tu red e inténtalo de nuevo.',
};

function getAuthError(code: string): string {
  return AUTH_ERROR_MAP[code] ?? 'Ocurrió un error. Inténtalo de nuevo.';
}

function validateEmail(email: string): string | null {
  if (!email) return 'El correo es requerido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un correo válido.';
  return null;
}

type Mode = 'login' | 'forgot' | 'forgot-sent';

export function LoginPage() {
  const { user, firebaseUid, initialized, signIn, sendResetEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && firebaseUid && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, firebaseUid, user, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = !password ? 'La contraseña es requerida.' : null;
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      showToast('error', 'Acceso Denegado', getAuthError(code));
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
      showToast('error', 'Error', 'No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-10">
      <ToastContainer />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-[#1e3252] rounded-2xl flex items-center justify-center shadow-md">
            <IconGraduationCap size={32} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome to<br />StudySphere
          </h1>
          <p className="text-gray-500 text-xs leading-relaxed">
            Connect, collaborate, and conquer your coursework together.
          </p>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo Electrónico Institucional
              </label>
              <div
                className={`flex items-center border rounded-xl bg-white transition-colors ${
                  emailError
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
                }`}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="student@university.edu"
                  autoComplete="email"
                  className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                <span className="pr-3 flex-shrink-0">
                  {emailError ? (
                    <IconAlertCircle size={18} className="text-red-500" />
                  ) : (
                    <IconMail size={18} className="text-gray-400" />
                  )}
                </span>
              </div>
              {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setResetEmail(email); }}
                  className="text-xs text-gray-500 hover:text-[#1e3252] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div
                className={`flex items-center border rounded-xl bg-white transition-colors ${
                  passwordError
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
                }`}
              >
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(null); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                <span className="pr-3 flex items-center gap-1.5">
                  {passwordError && passwordError.trim() && (
                    <IconAlertCircle size={18} className="text-red-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </span>
              </div>
              {passwordError && passwordError.trim() && (
                <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: isLoading ? '#9ca3af' : '#1e3252' }}
            >
              {isLoading ? (
                <>
                  <IconSpinner size={18} />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-2">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-[#1e3252] hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleReset} noValidate className="space-y-4">
            <p className="text-sm text-gray-600 text-center mb-2">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo Electrónico
              </label>
              <div
                className={`flex items-center border rounded-xl bg-white transition-colors ${
                  resetEmailError
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
                }`}
              >
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); setResetEmailError(null); }}
                  placeholder="student@university.edu"
                  autoComplete="email"
                  className="flex-1 py-3 px-4 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                <span className="pr-3 flex-shrink-0">
                  {resetEmailError ? (
                    <IconAlertCircle size={18} className="text-red-500" />
                  ) : (
                    <IconMail size={18} className="text-gray-400" />
                  )}
                </span>
              </div>
              {resetEmailError && <p className="mt-1.5 text-xs text-red-600">{resetEmailError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ backgroundColor: isLoading ? '#9ca3af' : '#1e3252' }}
            >
              {isLoading ? <><IconSpinner size={18} />Enviando...</> : 'Enviar enlace'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* ── RESET EMAIL SENT ── */}
        {mode === 'forgot-sent' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <IconMail2 size={28} className="text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Correo enviado</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Revisa tu bandeja de entrada en{' '}
                <span className="font-medium text-gray-700">{resetEmail}</span>{' '}
                y sigue las instrucciones para restablecer tu contraseña.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <IconCheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700 text-left">
                Si no lo ves en unos minutos, revisa la carpeta de spam.
              </p>
            </div>
            <button
              onClick={() => { setMode('login'); setResetEmail(''); }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-[#1e3252] border border-[#1e3252] hover:bg-[#1e3252] hover:text-white transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
