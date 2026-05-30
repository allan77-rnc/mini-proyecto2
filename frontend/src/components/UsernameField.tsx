import { useUsername } from '../hooks/useUsername';
import { IconAlertCircle, IconCheckCircle, IconSpinner } from './icons';

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Exclude this uid from the taken-check (used when editing an existing profile) */
  excludeUid?: string;
}

/**
 * Reusable username input with real-time Firestore availability check (500ms debounce).
 * Handles format validation and duplicate detection inline.
 *
 * @example
 * <UsernameField value={username} onChange={setUsername} />
 */
export function UsernameField({ value, onChange, label = 'Nombre de usuario' }: UsernameFieldProps) {
  const { status, error, isChecking, isValid } = useUsername(value);

  const hasError = status === 'taken' || status === 'invalid';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div
        className={`flex items-center border rounded-xl bg-white transition-colors ${
          hasError
            ? 'border-red-500 ring-1 ring-red-500'
            : isValid
            ? 'border-green-500'
            : 'border-gray-200 focus-within:border-[#1e3252] focus-within:ring-1 focus-within:ring-[#1e3252]'
        }`}
      >
        <span className="pl-4 text-gray-400 font-medium select-none">@</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\s/g, '').toLowerCase())}
          placeholder="mi_usuario"
          autoComplete="username"
          className="flex-1 py-3 px-2 outline-none text-gray-900 placeholder-gray-400 text-sm bg-transparent"
        />
        <span className="pr-3 flex-shrink-0">
          {isChecking && <IconSpinner size={16} className="text-gray-400" />}
          {hasError && <IconAlertCircle size={18} className="text-red-500" />}
          {isValid && <IconCheckCircle size={18} className="text-green-500" />}
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
