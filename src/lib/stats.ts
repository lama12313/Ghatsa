import type { Tier } from '../types';
import type { History } from './progress';

export interface PlayerStats {
  played: number;
  currentStreak: number;
  maxStreak: number;
  averageDepth: number;
  bestDepth: number;
  tierCounts: Record<Tier, number>;
}

export function computeStats(history: History, today: number): PlayerStats {
  const days = Object.keys(history)
    .map(Number)
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => a - b);
  const tierCounts: Record<Tier, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  let total = 0;
  let best = 0;
  let maxStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const e = history[String(d)];
    total += e.depth;
    best = Math.max(best, e.depth);
    for (const t of e.tiers) tierCounts[t]++;
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
    prev = d;
  }
  // السلسلة الحالية تبقى حية لو لعب اليوم أو أمس
  let currentStreak = 0;
  if (prev !== null && (prev === today || prev === today - 1)) currentStreak = run;
  return {
    played: days.length,
    currentStreak,
    maxStreak,
    averageDepth: days.length ? Math.round(total / days.length) : 0,
    bestDepth: best,
    tierCounts,
  };
}
