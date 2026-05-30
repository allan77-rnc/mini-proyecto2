import { Link } from 'react-router-dom';
import { type Toast, useToast } from '../contexts/ToastContext';
import { IconAlertCircle, IconCheckCircle } from './icons';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        isError
          ? 'bg-red-50 border-red-200'
          : isSuccess
          ? 'bg-green-50 border-green-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <span
        className={`mt-0.5 flex-shrink-0 ${
          isError ? 'text-red-500' : isSuccess ? 'text-green-600' : 'text-blue-500'
        }`}
      >
        {isError ? (
          <IconAlertCircle size={20} />
        ) : (
          <IconCheckCircle size={20} />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            isError ? 'text-red-900' : isSuccess ? 'text-green-900' : 'text-blue-900'
          }`}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p
            className={`text-sm mt-0.5 ${
              isError ? 'text-red-700' : isSuccess ? 'text-green-700' : 'text-blue-700'
            }`}
          >
            {toast.message}
          </p>
        )}
        {toast.action && (
          <span className="text-sm mt-0.5">
            {toast.action.href ? (
              <Link
                to={toast.action.href}
                className={`underline font-medium ${
                  isError ? 'text-red-700' : 'text-blue-700'
                }`}
              >
                {toast.action.label}
              </Link>
            ) : (
              <button
                onClick={toast.action.onClick}
                className={`underline font-medium ${
                  isError ? 'text-red-700' : 'text-blue-700'
                }`}
              >
                {toast.action.label}
              </button>
            )}
          </span>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 text-lg leading-none opacity-50 hover:opacity-100 ${
          isError ? 'text-red-900' : isSuccess ? 'text-green-900' : 'text-blue-900'
        }`}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}
