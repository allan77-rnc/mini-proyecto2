import { useState, useEffect, useRef, useCallback } from 'react';

export type MediaPermissionError =
  | { type: 'denied' }
  | { type: 'notfound' }
  | { type: 'other'; message: string };

export interface LocalMedia {
  stream: MediaStream | null;
  error: MediaPermissionError | null;
  loading: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  retry: () => void;
}

export function useLocalMedia(enabled = true): LocalMedia {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaPermissionError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      const raf = requestAnimationFrame(() => {
        setStream(null);
        setError(null);
        setLoading(false);
      });
      return () => cancelAnimationFrame(raf);
    }

    let cancelled = false;

    async function acquire() {
      setLoading(true);
      setError(null);

      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (!cancelled) {
          streamRef.current = s;
          setStream(s);
          setAudioEnabled(true);
          setVideoEnabled(true);
        } else {
          s.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setError({ type: 'denied' });
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              setError({ type: 'notfound' });
            } else {
              setError({ type: 'other', message: err.message });
            }
          } else {
            setError({ type: 'other', message: String(err) });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    acquire();
    return () => { cancelled = true; };
  }, [attempt, enabled]);

  // Stop all tracks on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const toggleAudio = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  }, []);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return { stream, error, loading, audioEnabled, videoEnabled, toggleAudio, toggleVideo, retry };
}
