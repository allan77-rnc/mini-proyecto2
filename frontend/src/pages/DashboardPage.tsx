import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconGraduationCap } from '../components/icons';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#1e3252] rounded-2xl flex items-center justify-center">
            <IconGraduationCap size={32} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">@{user?.username}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tu perfil</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Nombre:</span> {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Correo:</span> {user?.email}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Proveedor:</span> {user?.provider}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
