import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff, IconMessageSquare, IconMonitor } from '../../../components/icons';

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
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

export function MediaControls({
  audioEnabled,
  videoEnabled,
  chatOpen,
  audioLevel,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onLeave,
}: MediaControlsProps) {
  return (
    <div className="flex items-center justify-center py-3.5 flex-shrink-0 bg-gray-900">
      <div className="flex items-center gap-1 bg-[#1c2030] rounded-full px-3 py-2 shadow-2xl border border-white/10">

        {/* Mic + wave */}
        <div className="flex items-center pr-1.5">
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? 'Silenciar' : 'Activar micrófono'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              audioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {audioEnabled ? <IconMic size={18} /> : <IconMicOff size={18} />}
          </button>
          {audioEnabled && <AudioWave level={audioLevel} />}
        </div>

        {/* Camera */}
        <button
          onClick={onToggleVideo}
          title={videoEnabled ? 'Apagar cámara' : 'Activar cámara'}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            videoEnabled
              ? 'bg-teal-500 hover:bg-teal-400 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {videoEnabled ? <IconVideo size={18} /> : <IconVideoOff size={18} />}
        </button>

        {/* Screen share — disabled */}
        <button
          disabled
          title="Compartir pantalla (próximamente)"
          className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-700 text-gray-500 cursor-not-allowed"
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
  );
}
