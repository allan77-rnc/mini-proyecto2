import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff } from '../../../components/icons';

interface MediaControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

export function MediaControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
}: MediaControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 border-t border-gray-100 bg-white flex-shrink-0">
      <ControlButton
        active={audioEnabled}
        activeIcon={<IconMic size={18} />}
        inactiveIcon={<IconMicOff size={18} />}
        activeLabel="Silenciar"
        inactiveLabel="Activar micro"
        onClick={onToggleAudio}
        inactiveClass="bg-red-500 hover:bg-red-600 text-white"
        activeClass="bg-gray-100 hover:bg-gray-200 text-gray-700"
      />
      <ControlButton
        active={videoEnabled}
        activeIcon={<IconVideo size={18} />}
        inactiveIcon={<IconVideoOff size={18} />}
        activeLabel="Apagar cámara"
        inactiveLabel="Activar cámara"
        onClick={onToggleVideo}
        inactiveClass="bg-red-500 hover:bg-red-600 text-white"
        activeClass="bg-gray-100 hover:bg-gray-200 text-gray-700"
      />
      <button
        onClick={onLeave}
        title="Salir"
        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
      >
        <IconPhoneOff size={18} />
      </button>
    </div>
  );
}

interface ControlButtonProps {
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  activeLabel: string;
  inactiveLabel: string;
  activeClass: string;
  inactiveClass: string;
  onClick: () => void;
}

function ControlButton({
  active,
  activeIcon,
  inactiveIcon,
  activeLabel,
  inactiveLabel,
  activeClass,
  inactiveClass,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={active ? activeLabel : inactiveLabel}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${active ? activeClass : inactiveClass}`}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
