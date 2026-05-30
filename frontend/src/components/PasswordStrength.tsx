import { useTranslation } from 'react-i18next';

interface PasswordStrengthProps {
  password: string;
}

function score(password: string): number {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  return s;
}

const BAR = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-500'];
const TXT = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600', 'text-emerald-600'];
const KEY = ['', 'strength.veryWeak', 'strength.weak', 'strength.fair', 'strength.strong', 'strength.veryStrong'];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation();
  const s = score(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${i <= s ? BAR[s] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${TXT[s]}`}>{t(KEY[s])}</p>
    </div>
  );
}
