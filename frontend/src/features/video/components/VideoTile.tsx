import { useEffect, useRef } from 'react';
import { IconMicOff, IconVideoOff } from '../../../components/icons';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export function VideoTile({ stream, username, isLocal = false, audioEnabled, videoEnabled }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const initials = username.slice(0, 2).toUpperCase();
  const showVideo = !!stream && videoEnabled;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-200 ${showVideo ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {/* Avatar fallback when no video */}
      {!showVideo && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-[#1e3252] flex items-center justify-center text-white text-xl font-bold select-none">
            {initials}
          </div>
          {!videoEnabled && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <IconVideoOff size={12} /> Cámara apagada
            </span>
          )}
        </div>
      )}

      {/* Name + mute indicator */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium backdrop-blur-sm">
          {username}{isLocal ? ' (Tú)' : ''}
        </span>
        {!audioEnabled && (
          <span className="bg-red-500/80 text-white p-1 rounded-md backdrop-blur-sm">
            <IconMicOff size={11} />
          </span>
        )}
      </div>
    </div>
  );
}
