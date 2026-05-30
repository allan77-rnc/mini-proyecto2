import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import { UsernameField } from '../components/UsernameField';
import { PasswordStrength } from '../components/PasswordStrength';
import { useUsername } from '../hooks/useUsername';
import {
  IconGraduationCap,
  IconUser,
  IconMail,
  IconLock,
  IconLockConfirm,
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconAlertCircle,
  IconCamera,
  IconArrowRight,
  IconGoogle,
} from '../components/icons';

const ALLOWED_DOMAIN = import.meta.env.VITE_INSTITUTIONAL_DOMAIN as string | undefined;

function validateEmail(email: string): string | null {
  if (!email) return 'El correo es requerido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Ingresa un correo válido (ej: nombre@correo.com)';
  if (ALLOWED_DOMAIN) {
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    if (domain !== ALLOWED_DOMAIN.toLowerCase())
      return `Debes usar tu correo institucional (@${ALLOWED_DOMAIN}).`;
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida.';
  if (password.length < 8) return 'Mínimo 8 caracteres.';
  return null;
}

export function RegisterPage() {
  const { user, firebaseUid, initialized, signUp, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const { isValid: usernameValid, isChecking: usernameChecking } = useUsername(username);

  useEffect(() => {
    if (initialized && firebaseUid && user) navigate('/dashboard', { replace: true });
  }, [initialized, firebaseUid, user, navigate]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const newErrors: Record<string, string | null> = {
      firstName: !firstName.trim()
        ? 'El nombre es requerido.'
        : firstName.trim().length < 2
        ? 'Mínimo 2 caracteres.'
        : null,
      lastName: !lastName.trim()
        ? 'Los apellidos son requeridos.'
        : lastName.trim().length < 2
        ? 'Mínimo 2 caracteres.'
        : null,
      username: !username
        ? 'El nombre de usuario es requerido.'
        : !usernameValid && !usernameChecking
        ? 'Elige un nombre de usuario válido y disponible.'
        : null,
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: confirmPassword !== password ? 'Las contraseñas no coinciden.' : null,
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(v => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || usernameChecking) return;

    setIsLoading(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username,
        email,
        password,
        avatarUrl: avatarPreview ?? undefined,
      });
      showToast('success', 'Cuenta creada', '¡Bienvenido a StudySphere!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado.' }));
        showToast('error', 'Este correo ya está en uso.', undefined, {
          label: '¿Quieres iniciar sesión?',
          href: '/login',
        });
      } else if (code === 'auth/weak-password') {
        setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres.' }));
      } else {
        showToast('error', 'Error al registrarte', 'Ocurrió un error. Inténtalo de nuevo.');
      }
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
        showToast('error', 'Error', 'No se pudo continuar con Google. Inténtalo de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const inputCls = (field: string) =>
    `flex items-center border rounded-xl bg-white transition-colors ${
      errors[field]
        ? 'border-red-500 ring-1 ring-red-500'
        : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
    }`;

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-8">
      <ToastContainer />

      {/* Back button */}
      <div className="w-full max-w-md mb-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Volver al inicio
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#1e3252] rounded-2xl flex items-center justify-center shadow-md">
              <IconGraduationCap size={24} className="text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Sign up</h1>
            <p className="text-gray-500 text-xs leading-relaxed">
              Connect, collaborate, and conquer your coursework together.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-1.5 mb-1">
              <div
                className="relative w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <IconUser size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <IconCamera size={14} className="text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-[#1e3252] hover:underline"
              >
                Foto de perfil (opcional)
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <div className={inputCls('firstName')}>
                  <span className="pl-3 flex-shrink-0 text-gray-400"><IconUser size={15} /></span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: null })); }}
                    placeholder="Ana"
                    autoComplete="given-name"
                    className="flex-1 min-w-0 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                  />
                  {errors.firstName && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
                </div>
                {errors.firstName && <p className="mt-1 text-xs text-red-600 leading-tight">{errors.firstName}</p>}
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellidos</label>
                <div className={inputCls('lastName')}>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: null })); }}
                    placeholder="García"
                    autoComplete="family-name"
                    className="flex-1 min-w-0 py-2.5 px-3 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                  />
                  {errors.lastName && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
                </div>
                {errors.lastName && <p className="mt-1 text-xs text-red-600 leading-tight">{errors.lastName}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <UsernameField
                value={username}
                onChange={v => { setUsername(v); setErrors(p => ({ ...p, username: null })); }}
              />
              {errors.username && !username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
              <div className={inputCls('email')}>
                <span className="pl-3 flex-shrink-0 text-gray-400"><IconMail size={15} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })); }}
                  placeholder="ana.garcia@universidad.edu"
                  autoComplete="email"
                  className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                {errors.email && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className={inputCls('password')}>
                <span className="pl-3 flex-shrink-0 text-gray-400"><IconLock size={15} /></span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null })); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                <span className="pr-3 flex items-center gap-1">
                  {errors.password && <IconAlertCircle size={15} className="text-red-500" />}
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600" aria-label="toggle password">
                    {showPwd ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </span>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar Contraseña</label>
              <div className={inputCls('confirmPassword')}>
                <span className="pl-3 flex-shrink-0 text-gray-400"><IconLockConfirm size={15} /></span>
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: null })); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
                />
                <span className="pr-3 flex items-center gap-1">
                  {errors.confirmPassword && <IconAlertCircle size={15} className="text-red-500" />}
                  <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="text-gray-400 hover:text-gray-600" aria-label="toggle confirm password">
                    {showConfirmPwd ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </span>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || usernameChecking}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ backgroundColor: isLoading || usernameChecking ? '#9ca3af' : '#1e3252' }}
            >
              {isLoading ? (
                <><IconSpinner size={17} />Creando cuenta...</>
              ) : (
                <>Registrarse <IconArrowRight size={17} /></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {googleLoading ? <IconSpinner size={17} className="text-gray-500" /> : <IconGoogle size={17} />}
              Registrarse con Google
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed pt-1">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-[#1e3252] underline">Términos de Servicio</a>
              {' '}y{' '}
              <a href="#" className="text-[#1e3252] underline">Política de Privacidad</a>.
            </p>
          </form>
        </div>
      </div>

      {/* Already have account */}
      <p className="mt-4 text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => navigate('/login')} className="text-slate-200 font-semibold hover:underline">
          Inicia sesión
        </button>
      </p>
    </div>
  );
}
