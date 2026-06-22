import { useState, useEffect } from 'react';

/**
 * Returns a 0–1 value representing the current RMS volume of a MediaStream.
 * Updates every animation frame (~60fps). Returns 0 when disabled or no stream.
 */
export function useAudioLevel(stream: MediaStream | null, active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || !active || stream.getAudioTracks().length === 0) {
      setLevel(0);
      return;
    }

    let cancelled = false;
    let ctx: AudioContext | null = null;
    let rafId = 0;

    (async () => {
      try {
        ctx = new AudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;

        const src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const s = (buf[i] - 128) / 128;
            sum += s * s;
          }
          setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 8));
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch {
        setLevel(0);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ctx?.close().catch(() => {});
      setLevel(0);
    };
  }, [stream, active]);

  return level;
}
