import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';
import { UsernameField } from '../components/UsernameField';
import { useUsername } from '../hooks/useUsername';
import { IconUserPlus, IconSpinner, IconArrowRight } from '../components/icons';

export function CompleteProfilePage() {
  const { user, firebaseUid, initialized, completeProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isValid: usernameValid, isChecking } = useUsername(username);

  useEffect(() => {
    if (!initialized) return;
    if (!firebaseUid) {
      navigate('/login', { replace: true });
      return;
    }
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, firebaseUid, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      setFieldError('El nombre de usuario es requerido.');
      return;
    }
    if (!usernameValid) {
      setFieldError('Elige un nombre de usuario válido y disponible.');
      return;
    }

    setIsLoading(true);
    try {
      await completeProfile({ username });
      showToast('success', '¡Listo!', 'Tu perfil ha sido completado.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'permission-denied') {
        showToast('error', 'Error', 'No tienes permiso para realizar esta acción.');
      } else {
        showToast('error', 'Error', 'No se pudo guardar tu perfil. Inténtalo de nuevo.');
      }
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

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl px-8 py-10">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <IconUserPlus size={36} className="text-slate-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Casi listo</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Elige un nombre de usuario para completar tu perfil académico.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <UsernameField
            value={username}
            onChange={v => { setUsername(v); setFieldError(null); }}
          />
          {fieldError && (
            <p className="-mt-3 text-xs text-red-600">{fieldError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || isChecking || (!usernameValid && !!username)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                isLoading || isChecking || (!usernameValid && !!username)
                  ? '#9ca3af'
                  : '#1e3252',
            }}
          >
            {isLoading ? (
              <>
                <IconSpinner size={18} />
                Guardando...
              </>
            ) : (
              <>
                Finalizar registro
                <IconArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Al finalizar, aceptas nuestros{' '}
            <a href="#" className="text-[#1e3252] underline">Términos de servicio</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
