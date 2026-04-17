import { useCallback, useRef } from 'react';

function createOscillator(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  duration: number,
  gain: number
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playHit = useCallback(() => {
    const ctx = getCtx();
    createOscillator(ctx, 'sawtooth', 200, 0.3, 0.15);
    createOscillator(ctx, 'square', 100, 0.4, 0.1);
    setTimeout(() => createOscillator(ctx, 'sawtooth', 80, 0.2, 0.12), 100);
  }, [getCtx]);

  const playMiss = useCallback(() => {
    const ctx = getCtx();
    createOscillator(ctx, 'sine', 400, 0.15, 0.08);
    setTimeout(() => createOscillator(ctx, 'sine', 300, 0.15, 0.05), 80);
  }, [getCtx]);

  const playSunk = useCallback(() => {
    const ctx = getCtx();
    createOscillator(ctx, 'sawtooth', 150, 0.5, 0.2);
    createOscillator(ctx, 'square', 75, 0.6, 0.15);
    setTimeout(() => {
      createOscillator(ctx, 'sawtooth', 100, 0.4, 0.15);
      createOscillator(ctx, 'square', 50, 0.5, 0.1);
    }, 200);
  }, [getCtx]);

  const playPlace = useCallback(() => {
    const ctx = getCtx();
    createOscillator(ctx, 'sine', 600, 0.1, 0.06);
    setTimeout(() => createOscillator(ctx, 'sine', 800, 0.1, 0.06), 60);
  }, [getCtx]);

  const playVictory = useCallback(() => {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => createOscillator(ctx, 'sine', freq, 0.3, 0.1), i * 150);
    });
  }, [getCtx]);

  return { playHit, playMiss, playSunk, playPlace, playVictory };
}
