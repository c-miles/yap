import { useEffect, useRef, useState } from "react";

// Meter tunables: dBFS scale + attack/release ballistics.
const FFT_SIZE = 1024;   // ~21ms window at 48kHz — responsive
const MIN_DB = -60;      // dBFS floor  -> level 0
const MAX_DB = 0;        // dBFS ceil   -> level 1
const ATTACK = 0.5;      // fast rise
const RELEASE = 0.12;    // slow fall
const EPSILON = 0.005;   // skip re-render below this delta

// Smoothed microphone input level (0-1) from a stream's audio track, perceptually
// scaled (RMS -> dBFS) with attack/release smoothing. Resumes the AudioContext,
// which starts "suspended" under the autoplay policy; closes it on unmount/stream change.
export function useMicLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);
  const smoothedRef = useRef(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevel(0);
      smoothedRef.current = 0;
      return;
    }
    const AudioCtx: typeof AudioContext | undefined =
      typeof AudioContext !== "undefined" ? AudioContext : (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    // Rapid device switching spins up a fresh AudioContext each time and can hit the browser's ~6-context cap and throw — must not crash the (decorative) meter.
    const setUpGraph = (): {
      ctx: AudioContext;
      source: MediaStreamAudioSourceNode;
      analyser: AnalyserNode;
    } | null => {
      let ctx: AudioContext | undefined;
      try {
        ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        source.connect(analyser); // not connected to destination -> no echo
        return { ctx, source, analyser };
      } catch (error) {
        console.error("Error initializing mic level meter:", error);
        ctx?.close().catch(() => {});
        return null;
      }
    };

    const graph = setUpGraph();
    if (!graph) {
      setLevel(0);
      return;
    }
    const { ctx, source, analyser } = graph;

    const buffer = new Float32Array(analyser.fftSize);
    let rafId = 0;
    let cancelled = false;

    // Suspended until a user gesture; the green room is reached via a click, so resume usually works — pointerdown listener is the fallback.
    const resume = () => {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    resume();
    window.addEventListener("pointerdown", resume, { once: true });

    const tick = () => {
      if (cancelled) return;
      analyser.getFloatTimeDomainData(buffer);

      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i++) {
        const s = buffer[i];
        sumSquares += s * s;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      const db = 20 * Math.log10(rms || 1e-8); // guard log10(0)
      const norm = Math.max(0, Math.min(1, (db - MIN_DB) / (MAX_DB - MIN_DB)));

      const prev = smoothedRef.current;
      const coeff = norm > prev ? ATTACK : RELEASE;
      const next = prev + (norm - prev) * coeff;
      smoothedRef.current = next;
      if (Math.abs(next - prev) > EPSILON) setLevel(next);

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointerdown", resume);
      try {
        source.disconnect();
      } catch {
        /* already disconnected */
      }
      ctx.close().catch(() => {});
    };
  }, [stream]);

  return level;
}
