import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/useToast';
import { ToastContainer } from '../components/Toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { UsernameField } from '../components/UsernameField';
import { useUsername } from '../hooks/useUsername';
import { IconUserPlus, IconSpinner, IconArrowRight } from '../components/icons';

export function CompleteProfilePage() {
  const { t } = useTranslation();
  const { user, firebaseUid, initialized, completeProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isValid: usernameValid, isChecking } = useUsername(username);

  useEffect(() => {
    if (!initialized) return;
    if (!firebaseUid) { navigate('/login', { replace: true }); return; }
    if (user) navigate('/dashboard', { replace: true });
  }, [initialized, firebaseUid, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setFieldError(t('validation.usernameRequired')); return; }
    if (!usernameValid) { setFieldError(t('validation.usernameUnavailable')); return; }

    setIsLoading(true);
    try {
      await completeProfile({ username });
      showToast('success', t('authErrors.profileSavedTitle'), t('authErrors.profileSavedMsg'));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      showToast('error', 'Error', code === 'permission-denied' ? t('authErrors.generic') : t('authErrors.profileError'));
    } finally {
      setIsLoading(false);
    }
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <IconSpinner size={36} className="text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-10">
      <ToastContainer />

      <div className="w-full max-w-sm mb-3 flex justify-end">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl px-8 py-10">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <IconUserPlus size={36} className="text-slate-500" />
          </div>
        </div>
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('completeProfile.title')}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{t('completeProfile.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <UsernameField
            value={username}
            onChange={v => { setUsername(v); setFieldError(null); }}
            label={t('completeProfile.usernameLabel')}
          />
          {fieldError && <p className="-mt-3 text-xs text-red-600">{fieldError}</p>}

          <button type="submit" disabled={isLoading || isChecking || (!usernameValid && !!username)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
            style={{ backgroundColor: isLoading || isChecking || (!usernameValid && !!username) ? '#9ca3af' : '#1e3252' }}>
            {isLoading
              ? <><IconSpinner size={18} />{t('completeProfile.submitting')}</>
              : <>{t('completeProfile.submitButton')}<IconArrowRight size={18} /></>}
          </button>

          <p className="text-center text-xs text-gray-400">
            {t('completeProfile.termsPrefix')}{' '}
            <a href="#" className="text-[#1e3252] underline">{t('common.terms')}</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
