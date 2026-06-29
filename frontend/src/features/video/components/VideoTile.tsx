import { useEffect, useRef } from 'react';
import { IconMicOff, IconVideoOff, IconMonitor } from '../../../components/icons';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  avatarUrl?: string | null;
  isLocal?: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
}

export function VideoTile({
  stream,
  username,
  avatarUrl,
  isLocal = false,
  audioEnabled,
  videoEnabled,
  isScreenSharing = false,
  isSpeaking = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream ?? null;
  }, [stream]);

  const initials = username.slice(0, 2).toUpperCase();
  const showVideo = !!stream && videoEnabled;

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center transition-shadow duration-200"
      style={isSpeaking ? { boxShadow: '0 0 0 2.5px #2dd4bf, 0 0 12px 2px rgba(45,212,191,0.25)' } : undefined}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-200 ${showVideo ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />

      {/* Avatar fallback */}
      {!showVideo && (
        <div className="flex flex-col items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1e3252] flex items-center justify-center text-white text-xl font-bold select-none">
              {initials}
            </div>
          )}
          {!videoEnabled && stream && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <IconVideoOff size={12} /> Cámara apagada
            </span>
          )}
        </div>
      )}

      {/* Name + screen share indicator + mute badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm leading-none flex items-center gap-1.5">
          {isScreenSharing && <IconMonitor size={11} className="flex-shrink-0 text-teal-400" />}
          {username}{isLocal ? ' (Tú)' : ''}
        </span>
        {!audioEnabled && (
          <span className="bg-red-500/80 text-white p-1.5 rounded-lg backdrop-blur-sm">
            <IconMicOff size={11} />
          </span>
        )}
      </div>
    </div>
  );
}
