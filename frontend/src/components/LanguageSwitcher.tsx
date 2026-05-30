import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  /** 'light' for use on white/light backgrounds, 'dark' for dark backgrounds */
  variant?: 'light' | 'dark';
}

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'es';

  const activeClass =
    variant === 'light'
      ? 'bg-[#1e3252] text-white'
      : 'bg-white text-[#1e3252]';

  const inactiveClass =
    variant === 'light'
      ? 'text-gray-500 hover:text-gray-800'
      : 'text-slate-400 hover:text-slate-200';

  const borderClass =
    variant === 'light' ? 'border-gray-200' : 'border-slate-600';

  return (
    <div className={`flex items-center rounded-lg border overflow-hidden text-xs font-semibold ${borderClass}`}>
      {(['en', 'es'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={`px-2.5 py-1.5 transition-colors uppercase ${
            current === lang ? activeClass : inactiveClass
          }`}
          aria-pressed={current === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
