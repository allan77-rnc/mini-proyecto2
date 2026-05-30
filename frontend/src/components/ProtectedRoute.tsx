import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconSpinner } from './icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Guards a route by verifying Firebase authentication state before rendering.
 *
 * - While Firebase resolves the session: shows a full-screen loading spinner.
 * - If the user is not signed in: redirects to `/login`.
 * - If the user is signed in but has no Firestore profile: redirects to `/complete-profile`.
 * - Otherwise: renders `children`.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, firebaseUid, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <IconSpinner size={36} className="text-white" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUid) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
