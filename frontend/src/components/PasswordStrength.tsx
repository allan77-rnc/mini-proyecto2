interface PasswordStrengthProps {
  password: string;
}

interface Strength {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
}

function assess(password: string): Strength {
  if (!password) return { score: 0, label: '', barColor: '', textColor: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Muy débil', barColor: 'bg-red-500', textColor: 'text-red-600' };
  if (score === 2) return { score, label: 'Débil', barColor: 'bg-orange-400', textColor: 'text-orange-600' };
  if (score === 3) return { score, label: 'Regular', barColor: 'bg-yellow-400', textColor: 'text-yellow-600' };
  if (score === 4) return { score, label: 'Fuerte', barColor: 'bg-green-500', textColor: 'text-green-600' };
  return { score, label: 'Muy fuerte', barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

/**
 * Displays a five-segment password strength bar with a label.
 * Renders nothing when `password` is empty.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, barColor, textColor } = assess(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              i <= score ? barColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColor}`}>{label}</p>
    </div>
  );
}
