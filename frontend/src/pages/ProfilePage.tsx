import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/useToast';
import { useUsername } from '../hooks/useUsername';
import { ToastContainer } from '../components/Toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { UpdateProfilePayload } from '../types/auth';
import {
  IconGraduationCap, IconUser, IconMail, IconAlertCircle,
  IconCheckCircle, IconSpinner, IconBell, IconSettings, IconSave,
  IconSliders, IconShieldCheck, IconChevronRight, IconChevronDown,
  IconAlertTriangle, IconCamera,
} from '../components/icons';
import { IconGoogle } from '../components/icons';

/* ─── Helpers ─────────────────────────────────────────────────────── */
function conflictField(err: { code?: string; message?: string }): 'username' | 'email' | null {
  const s = ((err.code ?? '') + ' ' + (err.message ?? '')).toLowerCase();
  if (s.includes('username') || s.includes('usuario')) return 'username';
  if (s.includes('email') || s.includes('correo') || s.includes('mail')) return 'email';
  return null;
}

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? 'bg-teal-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ─── Field ─────────────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  disabled?: boolean;
  prefix?: React.ReactNode;
  hint?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
}

function Field({ label, value, onChange, error, type = 'text', disabled, prefix, hint, autoComplete, maxLength }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <div
        className={`flex items-center border rounded-lg bg-white transition-colors ${
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
        } ${disabled ? 'bg-gray-50' : ''}`}
      >
        {prefix && (
          <span className="pl-3 text-gray-400 text-sm select-none flex items-center">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="flex-1 py-2.5 px-3 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent disabled:cursor-not-allowed disabled:text-gray-400"
        />
        {error && (
          <span className="pr-3 flex-shrink-0">
            <IconAlertCircle size={16} className="text-red-400" />
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <div className="mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

/* ─── Delete Modal ───────────────────────────────────────────────── */
function DeleteAccountModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const confirmWord = t('profile.deleteConfirmWord');
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  async function handleConfirm() {
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch {
      setIsDeleting(false);
      showToast('error', t('profile.deleteErrorTitle'), t('profile.deleteError'));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={() => !isDeleting && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <IconAlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{t('profile.deleteTitle')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('profile.deleteWarning')}</p>
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-sm text-gray-700 mb-1.5">
              {t('profile.deleteConfirmLabel', { word: confirmWord })}
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={isDeleting}
              placeholder={t('profile.deleteConfirmPlaceholder')}
              autoFocus
              className="w-full py-2.5 px-4 border border-gray-200 rounded-xl outline-none text-gray-900 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {t('profile.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {isDeleting
              ? <><IconSpinner size={15} />{t('profile.deleting')}</>
              : t('profile.confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ProfilePage ────────────────────────────────────────────────── */
export function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile, deleteAccount, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  /* ── Form state ── */
  const [fullName, setFullName] = useState(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState('Computer Science major focusing on AI and Machine Learning. Always looking for study groups in Calculus and Data Structures.');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; username?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const usernameChanged = username.trim() !== (user?.username ?? '');
  const { status: usernameStatus, error: usernameApiError, isChecking } = useUsername(
    usernameChanged ? username.trim() : ''
  );

  // Guaranteed non-null by ProtectedRoute — guard is here after all hooks
  if (!user) return null;

  const initials = ((user.firstName[0] ?? '') + (user.lastName[0] ?? '')).toUpperCase() || '?';

  /* ── Validate ── */
  function validate() {
    const next: { fullName?: string; username?: string } = {};
    if (!fullName.trim()) next.fullName = t('validation.firstNameRequired');
    if (!username.trim()) next.username = t('validation.usernameRequired');
    else if (usernameChanged && usernameStatus !== 'available') {
      next.username = usernameApiError ?? t('validation.usernameUnavailable');
    }
    return next;
  }

  /* ── Save ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const parts = fullName.trim().split(/\s+/);
    const payload: UpdateProfilePayload = {};
    const newFirst = parts[0] ?? '';
    const newLast = parts.slice(1).join(' ');
    if (newFirst !== user!.firstName) payload.firstName = newFirst;
    if (newLast !== user!.lastName) payload.lastName = newLast;
    if (usernameChanged) payload.username = username.trim();

    if (Object.keys(payload).length === 0) {
      showToast('info', t('profile.noChanges'));
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(payload);
      showToast('success', t('profile.savedTitle'), t('profile.savedMsg'));
    } catch (err: unknown) {
      const e2 = err as { status?: number; code?: string; message?: string };
      if (e2.status === 409) {
        const field = conflictField(e2) ?? 'username';
        if (field === 'email') {
          showToast('error', t('profile.saveErrorTitle'), t('authErrors.emailInUse'));
        } else {
          setErrors(p => ({ ...p, username: t('validation.usernameTaken') }));
          showToast('error', t('profile.saveErrorTitle'), t('validation.usernameTaken'));
        }
      } else {
        showToast('error', t('profile.saveErrorTitle'), t('profile.saveError'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    await deleteAccount();
    navigate('/login', { replace: true });
  }

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const usernameHint = usernameChanged
    ? isChecking
      ? <span className="flex items-center gap-1 text-xs text-gray-400"><IconSpinner size={12} /> Verificando...</span>
      : usernameStatus === 'available'
        ? <span className="flex items-center gap-1 text-xs text-green-600"><IconCheckCircle size={12} /> @{username.trim()} disponible</span>
        : null
    : null;

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

      {/* ── Nav ── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3252] rounded-lg flex items-center justify-center">
              <IconGraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">StudySphere</span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-8">
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </button>
            <span className="text-sm font-medium text-gray-400 cursor-default">Library</span>
            <span className="text-sm font-medium text-gray-400 cursor-default">Schedule</span>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <IconBell size={18} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <IconSettings size={18} />
            </button>
            {/* Avatar */}
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full bg-[#1e3252] flex items-center justify-center overflow-hidden"
              title={t('dashboard.signOut')}
            >
              {user.avatarUrl && !avatarError
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                : <span className="text-white text-xs font-bold">{initials}</span>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSave}>
          {/* Title row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{t('profile.subtitle')}</p>
            </div>
            <button
              type="submit"
              disabled={isSaving || (usernameChanged && isChecking)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ backgroundColor: isSaving ? '#9ca3af' : '#1e3252' }}
            >
              {isSaving
                ? <><IconSpinner size={15} />{t('profile.saving')}</>
                : <><IconSave size={15} />{t('profile.saveChanges')}</>
              }
            </button>
          </div>

          {/* ── Main card (dashed border) ── */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl overflow-hidden bg-white">
            <div className="flex flex-col md:flex-row">

              {/* ── Left: avatar panel ── */}
              <div className="md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-dashed border-blue-200 p-8 flex flex-col items-center">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-[#1e3252] flex items-center justify-center overflow-hidden mb-4">
                  {user.avatarUrl && !avatarError
                    ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                    : <span className="text-white text-3xl font-bold">{initials}</span>
                  }
                </div>

                <p className="font-bold text-gray-900 text-lg">{fullName || `${user.firstName} ${user.lastName}`}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <IconMail size={13} className="text-gray-400" />
                  {user.email}
                </p>

                <div className="w-full mt-6 space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    <IconCamera size={15} className="text-gray-500" />
                    Change Avatar
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm text-red-500 hover:text-red-700 font-medium transition-colors py-1"
                  >
                    Remove Picture
                  </button>
                </div>
              </div>

              {/* ── Right: form ── */}
              <div className="flex-1 p-6 space-y-5">

                {/* Personal Information */}
                <section>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1e3252] mb-4">
                    <IconUser size={16} className="text-teal-600" />
                    {t('profile.personalInfo')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Full Name"
                      value={fullName}
                      onChange={(v) => { setFullName(v); setErrors(p => ({ ...p, fullName: undefined })); }}
                      error={errors.fullName}
                      autoComplete="name"
                    />
                    <Field
                      label={t('profile.usernameLabel')}
                      value={username}
                      onChange={(v) => { setUsername(v); setErrors(p => ({ ...p, username: undefined })); }}
                      error={errors.username}
                      prefix={<span className="text-gray-400 text-sm"><IconMail size={14} /></span>}
                      hint={usernameHint}
                      autoComplete="username"
                    />
                  </div>

                  {/* Bio */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-600">Bio &amp; Academic Interests</label>
                      <span className="text-xs text-gray-400">Max 250 chars</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={250}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg outline-none text-sm text-gray-900 resize-none focus:border-[#1e3252] focus:ring-1 focus:ring-[#1e3252] transition-colors"
                    />
                  </div>
                </section>

                {/* Preferences + Security */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Preferences */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1e3252] mb-4">
                      <IconSliders size={15} className="text-teal-600" />
                      Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                          <p className="text-xs text-gray-400 mt-0.5">Daily digest &amp; invites</p>
                        </div>
                        <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Push Notifications</p>
                          <p className="text-xs text-gray-400 mt-0.5">Real-time chat alerts</p>
                        </div>
                        <Toggle checked={pushNotifs} onChange={setPushNotifs} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Appearance</p>
                          <p className="text-xs text-gray-400 mt-0.5">Interface theme</p>
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Light Mode <IconChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1e3252] mb-4">
                      <IconShieldCheck size={15} className="text-teal-600" />
                      Security
                    </h3>
                    <div className="space-y-3">
                      {/* Change Password */}
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-xs">•••</span>
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">Change Password</p>
                          <p className="text-xs text-gray-400 mt-0.5">Last updated 3 months ago</p>
                        </div>
                        <IconChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                      </button>

                      {/* Connected Accounts */}
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2">Connected Accounts</p>
                        <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <IconGoogle size={18} />
                          </div>
                          <p className="flex-1 text-sm font-medium text-gray-800">Google Workspace</p>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ── Danger Zone ── */}
        <div className="mt-4 border-2 border-dashed border-orange-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-orange-500">
              <IconAlertTriangle size={16} />
              {t('profile.dangerZone')}
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-lg">{t('profile.dangerDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            {t('profile.deleteAccount')}
          </button>
        </div>
      </main>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
