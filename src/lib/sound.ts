import type { Tier } from '../types';

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playCorrect(tier: Tier): void {
  const notes: Record<Tier, number[]> = {
    0: [],
    1: [523],
    2: [523, 659],
    3: [440, 554, 659],
    4: [523, 659, 784, 1047],
  };
  notes[tier].forEach((f, i) => tone(f, i * 0.09, 0.35));
}

export function playWrong(): void {
  tone(180, 0, 0.18, 'triangle', 0.06);
}

export function playTimeout(): void {
  tone(300, 0, 0.2, 'sine', 0.06);
  tone(200, 0.15, 0.3, 'sine', 0.06);
}

export function vibrate(tier: Tier): void {
  if (tier < 3) return;
  try {
    navigator.vibrate?.(tier === 4 ? [60, 40, 60, 40, 120] : [50, 30, 50]);
  } catch {
    /* تجاهل */
  }
}
