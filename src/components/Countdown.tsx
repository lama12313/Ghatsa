import { useNow } from '../hooks/useNow';
import { formatCountdown, nextResetAt } from '../lib/date';

export function Countdown() {
  const now = useNow(1000);
  return (
    <p className="text-sm text-abyss-200">
      الغطسة الجاية بعد{' '}
      <time dir="ltr" className="font-display text-base text-abyss-50 tabular-nums">
        {formatCountdown(nextResetAt(now) - now)}
      </time>
    </p>
  );
}
