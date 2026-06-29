import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff, IconMessageSquare, IconMonitor, IconAlertTriangle } from '../../../components/icons';
import type { MediaPermissionError } from '../hooks/useLocalMedia';

interface AudioWaveProps {
  level: number;
}

function AudioWave({ level }: AudioWaveProps) {
  const speaking = level > 0.04;
  const multipliers = [0.7, 1.1, 0.85, 1.0, 0.6];
  return (
    <div className="flex items-center gap-[2.5px] ml-1.5 h-4" aria-hidden>
      {multipliers.map((m, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full flex-shrink-0"
          style={{
            height: speaking ? `${Math.max(18, Math.min(100, m * level * 100 + 14))}%` : '20%',
            backgroundColor: speaking ? '#34d399' : '#4b5563',
            transition: 'height 55ms ease-out, background-color 180ms',
          }}
        />
      ))}
    </div>
  );
}

interface MediaControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  chatOpen: boolean;
  audioLevel: number;
  isScreenSharing: boolean;
  permissionError: MediaPermissionError | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onToggleScreenShare: () => void;
  onRetry: () => void;
  onLeave: () => void;
}

export function MediaControls({
  audioEnabled,
  videoEnabled,
  chatOpen,
  audioLevel,
  isScreenSharing,
  permissionError,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleScreenShare,
  onRetry,
  onLeave,
}: MediaControlsProps) {
  const permBanner = permissionError ? (
    <div className="flex items-center justify-center gap-2 py-1.5 px-4 bg-amber-500/15 border-t border-amber-500/20 flex-shrink-0">
      <IconAlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
      <span className="text-amber-300 text-xs">
        {permissionError.type === 'denied'
          ? 'Permisos bloqueados — permite el acceso en el ícono del navegador.'
          : permissionError.type === 'notfound'
          ? 'No se encontraron dispositivos de audio/video.'
          : 'No se pudo acceder a los dispositivos.'}
      </span>
      {permissionError.type !== 'denied' && (
        <button onClick={onRetry} className="text-amber-300 text-xs underline underline-offset-2 ml-1">
          Reintentar
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="flex flex-col flex-shrink-0 bg-gray-900">
      {permBanner}
      <div className="flex items-center justify-center py-3.5">
        <div className="flex items-center gap-1 bg-[#1c2030] rounded-full px-3 py-2 shadow-2xl border border-white/10">

          {/* Mic + wave */}
          <div className="flex items-center pr-1.5">
            <div className="relative">
              <button
                onClick={permissionError ? onRetry : onToggleAudio}
                title={
                  permissionError
                    ? 'Sin acceso al micrófono — clic para reintentar'
                    : audioEnabled ? 'Silenciar' : 'Activar micrófono'
                }
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  permissionError
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                    : audioEnabled
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {audioEnabled && !permissionError ? <IconMic size={18} /> : <IconMicOff size={18} />}
              </button>
              {permissionError && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center pointer-events-none">
                  <IconAlertTriangle size={9} className="text-white" />
                </span>
              )}
            </div>
            {audioEnabled && !permissionError && <AudioWave level={audioLevel} />}
          </div>

          {/* Camera */}
          <div className="relative">
            <button
              onClick={permissionError ? onRetry : onToggleVideo}
              title={
                permissionError
                  ? 'Sin acceso a la cámara — clic para reintentar'
                  : videoEnabled ? 'Apagar cámara' : 'Activar cámara'
              }
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                permissionError
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                  : videoEnabled
                  ? 'bg-teal-500 hover:bg-teal-400 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {videoEnabled && !permissionError ? <IconVideo size={18} /> : <IconVideoOff size={18} />}
            </button>
            {permissionError && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center pointer-events-none">
                <IconAlertTriangle size={9} className="text-white" />
              </span>
            )}
          </div>

          {/* Screen share */}
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Dejar de compartir' : 'Compartir pantalla'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-teal-500 hover:bg-teal-400 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <IconMonitor size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />

          {/* Chat toggle */}
          <button
            onClick={onToggleChat}
            title={chatOpen ? 'Cerrar chat' : 'Abrir chat'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              chatOpen
                ? 'bg-teal-500 hover:bg-teal-400 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <IconMessageSquare size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />

          {/* Leave */}
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-4 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all"
          >
            <IconPhoneOff size={16} />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
