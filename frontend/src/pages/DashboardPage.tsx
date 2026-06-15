import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { IconGraduationCap } from '../components/icons';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="w-16 h-16 bg-[#1e3252] rounded-2xl flex items-center justify-center">
            <IconGraduationCap size={32} className="text-white" />
          </div>
          <div className="flex-1 flex justify-end">
            <LanguageSwitcher variant="light" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.firstName ? `, ${user.firstName}` : '' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1">@{user?.username}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {t('dashboard.profileSection')}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{t('dashboard.nameField')}:</span>{' '}
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{t('dashboard.emailField')}:</span>{' '}
            {user?.email}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{t('dashboard.providerField')}:</span>{' '}
            {user?.provider}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 rounded-xl bg-[#1e3252] text-white font-semibold hover:bg-[#16263f] transition-colors text-sm"
          >
            {t('dashboard.editProfile')}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            {t('dashboard.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
