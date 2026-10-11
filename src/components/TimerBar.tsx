import { toArabicDigits } from '../lib/date';

interface Props {
  remainingMs: number;
  totalMs: number;
  label?: string;
}

export function TimerBar({ remainingMs, totalMs, label = 'الوقت' }: Props) {
  const frac = Math.max(0, Math.min(1, remainingMs / totalMs));
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000);
  const low = secs <= 5;
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${low ? 'bg-krill' : 'bg-abyss-200'}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
      <span
        className={`w-10 text-center font-display text-lg tabular-nums ${low ? 'text-krill' : 'text-abyss-50'}`}
        aria-live={secs <= 5 ? 'polite' : 'off'}
      >
        {toArabicDigits(secs)}
      </span>
    </div>
  );
}
