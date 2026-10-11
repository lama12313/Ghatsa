import { TIERS } from '../config';
import type { Tier } from '../types';

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' | 'lg' }) {
  const info = TIERS[tier];
  const cls =
    size === 'lg' ? 'text-2xl px-5 py-2' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const color =
    tier === 4
      ? 'bg-krill text-abyss-900'
      : tier === 3
        ? 'bg-violet-400/20 text-violet-100 border border-violet-300/40'
        : tier === 2
          ? 'bg-amber-300/15 text-amber-100 border border-amber-200/40'
          : tier === 1
            ? 'bg-sky-300/15 text-sky-100 border border-sky-200/40'
            : 'bg-white/5 text-white/60 border border-white/15';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-display ${cls} ${color}`}>
      <span aria-hidden>{info.emoji}</span>
      {info.name}
    </span>
  );
}
