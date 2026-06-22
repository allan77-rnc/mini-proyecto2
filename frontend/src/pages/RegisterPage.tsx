import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/useToast';
import { ToastContainer } from '../components/Toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { UsernameField } from '../components/UsernameField';
import { PasswordStrength } from '../components/PasswordStrength';
import { useUsername } from '../hooks/useUsername';
import {
  IconGraduationCap, IconUser, IconMail, IconLock, IconLockConfirm,
  IconEye, IconEyeOff, IconSpinner, IconAlertCircle, IconCamera, IconArrowRight, IconGoogle,
} from '../components/icons';

const ALLOWED_DOMAIN = import.meta.env.VITE_INSTITUTIONAL_DOMAIN as string | undefined;

export function RegisterPage() {
  const { t } = useTranslation();
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

  function validateEmail(value: string): string | null {
    if (!value) return t('validation.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('validation.emailInvalid');
    if (ALLOWED_DOMAIN) {
      const domain = value.split('@')[1]?.toLowerCase() ?? '';
      const allowedDomainLower = ALLOWED_DOMAIN.toLowerCase();
      // Build pattern: if domain spec starts with ".", use as-is (e.g. ".edu"); otherwise, add dot (e.g. "dominio.edu" → ".dominio.edu")
      const domainPattern = allowedDomainLower.startsWith('.') ? allowedDomainLower : '.' + allowedDomainLower;
      // Accept if domain ends with pattern OR is exactly the domain (without leading dot)
      if (!domain.endsWith(domainPattern) && domain !== allowedDomainLower)
        return t('validation.emailDomain', { domain: ALLOWED_DOMAIN });
    }
    return null;
  }

  function validate(): boolean {
    const newErrors: Record<string, string | null> = {
      firstName: !firstName.trim() ? t('validation.firstNameRequired') : firstName.trim().length < 2 ? t('validation.firstNameMin') : null,
      lastName:  !lastName.trim()  ? t('validation.lastNameRequired')  : lastName.trim().length  < 2 ? t('validation.lastNameMin')  : null,
      username: !username
        ? t('validation.usernameRequired')
        : !usernameValid && !usernameChecking
        ? t('validation.usernameUnavailable')
        : null,
      email: validateEmail(email),
      password: !password ? t('validation.passwordRequired') : password.length < 8 ? t('validation.passwordMin') : null,
      confirmPassword: confirmPassword !== password ? t('validation.confirmMismatch') : null,
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(v => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || usernameChecking) return;

    setIsLoading(true);
    try {
      await signUp({ firstName: firstName.trim(), lastName: lastName.trim(), username, email, password, avatarUrl: avatarPreview ?? undefined });
      showToast('success', t('authErrors.accountCreated'), t('authErrors.welcomeMsg'));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        setErrors(prev => ({ ...prev, email: t('authErrors.emailInUse') }));
        showToast('error', t('authErrors.emailInUse'), undefined, { label: t('authErrors.signInPrompt'), href: '/login' });
      } else if (code === 'auth/weak-password') {
        setErrors(prev => ({ ...prev, password: t('validation.passwordWeak') }));
      } else {
        showToast('error', 'Error', t('authErrors.generic'));
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
      if (code !== 'auth/popup-closed-by-user') showToast('error', 'Error', t('authErrors.googleError'));
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

      <div className="w-full max-w-md mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          {t('common.backToHome')}
        </button>
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#1e3252] rounded-2xl flex items-center justify-center shadow-md">
              <IconGraduationCap size={24} className="text-white" />
            </div>
          </div>
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t('register.title')}</h1>
            <p className="text-gray-500 text-xs leading-relaxed">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* fieldset bloquea nativamente todos sus controles y aplica opacidad uniforme */}
            <fieldset
              disabled={isLoading}
              className={`space-y-3.5 border-0 p-0 m-0 min-w-0 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-1.5 mb-1">
                <div className="relative w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden cursor-pointer group" onClick={() => fileRef.current?.click()}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400"><IconUser size={24} /></div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconCamera size={14} className="text-white" />
                  </div>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[#1e3252] hover:underline disabled:pointer-events-none">
                  {t('register.avatarLabel')}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Name grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.firstNameLabel')}</label>
                  <div className={inputCls('firstName')}>
                    <span className="pl-3 flex-shrink-0 text-gray-400"><IconUser size={15} /></span>
                    <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: null })); }}
                      placeholder={t('register.firstNamePlaceholder')} autoComplete="given-name"
                      className="flex-1 min-w-0 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed" />
                    {errors.firstName && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
                  </div>
                  {errors.firstName && <p className="mt-1 text-xs text-red-600 leading-tight">{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.lastNameLabel')}</label>
                  <div className={inputCls('lastName')}>
                    <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: null })); }}
                      placeholder={t('register.lastNamePlaceholder')} autoComplete="family-name"
                      className="flex-1 min-w-0 py-2.5 px-3 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed" />
                    {errors.lastName && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
                  </div>
                  {errors.lastName && <p className="mt-1 text-xs text-red-600 leading-tight">{errors.lastName}</p>}
                </div>
              </div>

              {/* Username */}
              <div>
                <UsernameField value={username} onChange={v => { setUsername(v); setErrors(p => ({ ...p, username: null })); }} label={t('register.usernameLabel')} />
                {errors.username && !username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ALLOWED_DOMAIN ? t('login.emailLabel') : t('register.emailLabel')}
                </label>
                {ALLOWED_DOMAIN && (
                  <p className="flex items-center gap-1 text-xs text-amber-600 mb-1.5">
                    <IconAlertCircle size={11} />
                    Solo se aceptan correos @{ALLOWED_DOMAIN}
                  </p>
                )}
                <div className={inputCls('email')}>
                  <span className="pl-3 flex-shrink-0 text-gray-400"><IconMail size={15} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })); }}
                    onBlur={e => {
                      const err = validateEmail(e.target.value);
                      if (err) setErrors(p => ({ ...p, email: err }));
                    }}
                    placeholder={t('register.emailPlaceholder')}
                    autoComplete="email"
                    className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed"
                  />
                  {errors.email && <IconAlertCircle size={15} className="text-red-500 mr-2 flex-shrink-0" />}
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.passwordLabel')}</label>
                <div className={inputCls('password')}>
                  <span className="pl-3 flex-shrink-0 text-gray-400"><IconLock size={15} /></span>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null })); }}
                    placeholder="••••••••" autoComplete="new-password"
                    className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed" />
                  <span className="pr-3 flex items-center gap-1">
                    {errors.password && <IconAlertCircle size={15} className="text-red-500" />}
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 disabled:pointer-events-none">
                      {showPwd ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                    </button>
                  </span>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.confirmPasswordLabel')}</label>
                <div className={inputCls('confirmPassword')}>
                  <span className="pl-3 flex-shrink-0 text-gray-400"><IconLockConfirm size={15} /></span>
                  <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: null })); }}
                    placeholder="••••••••" autoComplete="new-password"
                    className="flex-1 py-2.5 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed" />
                  <span className="pr-3 flex items-center gap-1">
                    {errors.confirmPassword && <IconAlertCircle size={15} className="text-red-500" />}
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="text-gray-400 hover:text-gray-600 disabled:pointer-events-none">
                      {showConfirmPwd ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                    </button>
                  </span>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>
            </fieldset>

            {/* Submit */}
            <button type="submit" disabled={isLoading || usernameChecking}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ backgroundColor: isLoading || usernameChecking ? '#9ca3af' : '#1e3252' }}>
              {isLoading ? <><IconSpinner size={17} />{t('register.submitting')}</> : <>{t('register.submitButton')}<IconArrowRight size={17} /></>}
            </button>

            <div className={`space-y-3.5 transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{t('common.or')}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button type="button" onClick={handleGoogle} disabled={googleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors disabled:opacity-60">
                {googleLoading ? <IconSpinner size={17} className="text-gray-500" /> : <IconGoogle size={17} />}
                {t('register.googleButton')}
              </button>

              <p className="text-center text-xs text-gray-400 leading-relaxed pt-1">
                {t('register.termsPrefix')}{' '}
                <a href="#" className="text-[#1e3252] underline">{t('common.terms')}</a>
                {' '}{t('register.termsAnd')}{' '}
                <a href="#" className="text-[#1e3252] underline">{t('common.privacy')}</a>.
              </p>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {t('register.alreadyAccount')}{' '}
        <button onClick={() => navigate('/login')} className="text-slate-200 font-semibold hover:underline">
          {t('register.signIn')}
        </button>
      </p>
    </div>
  );
}
