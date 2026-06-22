import { IconShieldAlert, IconVideo, IconMic } from '../../../components/icons';
import type { MediaPermissionError } from '../hooks/useLocalMedia';

interface PermissionBannerProps {
  error: MediaPermissionError;
  onRetry: () => void;
}

export function PermissionBanner({ error, onRetry }: PermissionBannerProps) {
  const isDenied = error.type === 'denied';
  const isNotFound = error.type === 'notfound';

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
        <div className="bg-red-50 px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <IconShieldAlert size={22} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              {isDenied && 'Acceso denegado a la cámara y micrófono'}
              {isNotFound && 'No se encontraron dispositivos de audio/video'}
              {error.type === 'other' && 'No se pudo acceder a la cámara o micrófono'}
            </h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {isDenied &&
                'Bloqueaste el acceso a tu cámara y/o micrófono. Para participar con video y audio necesitas activarlos en la configuración de tu navegador.'}
              {isNotFound &&
                'No detectamos una cámara o micrófono conectado. Verifica que tus dispositivos estén correctamente conectados e inténtalo de nuevo.'}
              {error.type === 'other' &&
                `Ocurrió un error al acceder al hardware: ${error.message}`}
            </p>
          </div>
        </div>

        {isDenied && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-2">¿Cómo activar los permisos?</p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Haz clic en el ícono de candado o cámara junto a la barra de dirección</li>
              <li>Busca los permisos de <strong>Cámara</strong> y <strong>Micrófono</strong></li>
              <li>Cámbialos de "Bloqueado" a "Permitir"</li>
              <li>Recarga la página o pulsa "Reintentar" abajo</li>
            </ol>
          </div>
        )}

        <div className="px-6 py-4 flex items-center gap-3 border-t border-gray-100">
          <div className="flex items-center gap-4 flex-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><IconVideo size={13} /> Cámara</span>
            <span className="flex items-center gap-1"><IconMic size={13} /> Micrófono</span>
          </div>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-[#1e3252] hover:bg-[#16263f] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
