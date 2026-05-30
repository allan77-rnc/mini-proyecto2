import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { IconGraduationCap, IconGoogle, IconSpinner } from '../components/icons';

export function LandingPage() {
  const { user, firebaseUid, initialized, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (initialized && firebaseUid && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, firebaseUid, user, navigate]);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { needsProfile } = await signInWithGoogle();
      navigate(needsProfile ? '/complete-profile' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        showToast('error', 'Error', 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#1e3252] rounded-2xl flex items-center justify-center shadow-lg">
            <IconGraduationCap size={40} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to<br />StudySphere
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Connect, collaborate, and conquer your<br />coursework together.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-[#1e3252] hover:bg-[#162843] text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            Create account
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-3.5 rounded-xl transition-colors bg-white"
          >
            Sign in
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-70"
        >
          {googleLoading ? <IconSpinner size={18} className="text-gray-500" /> : <IconGoogle size={18} />}
          Continue with Google
        </button>

        {/* Legal */}
        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          By continuing, you agree to StudySphere's{' '}
          <a href="#" className="text-[#1e3252] underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#1e3252] underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
