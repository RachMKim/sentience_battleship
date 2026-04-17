import { useCallback } from 'react';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq: number, duration: number, vol = 0.06, type: OscillatorType = 'sine') {
  const c = getCtx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function useSoundEffects() {
  const playHit = useCallback(() => beep(200, 0.15, 0.07), []);
  const playMiss = useCallback(() => beep(600, 0.1, 0.04), []);
  const playSunk = useCallback(() => {
    beep(160, 0.2, 0.08);
    setTimeout(() => beep(110, 0.25, 0.06), 150);
  }, []);
  const playPlace = useCallback(() => beep(500, 0.06, 0.04, 'triangle'), []);
  const playVictory = useCallback(() => {
    // C E G C (major chord arpeggio)
    beep(523, 0.2, 0.06, 'triangle');
    setTimeout(() => beep(659, 0.2, 0.06, 'triangle'), 150);
    setTimeout(() => beep(784, 0.2, 0.06, 'triangle'), 300);
    setTimeout(() => beep(1047, 0.3, 0.07, 'triangle'), 450);
  }, []);
  const playTargetPing = useCallback(() => beep(900, 0.03, 0.03), []);

  return { playHit, playMiss, playSunk, playPlace, playVictory, playTargetPing };
}
