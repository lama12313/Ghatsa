import { useEffect, useRef, type ReactNode } from 'react';
import { TIERS } from '../config';
import { toArabicDigits } from '../lib/date';
import type { Tier } from '../types';
import { TierBadge } from './TierBadge';

interface Props {
  tier: Tier;
  input: string | null;
  answerText: string | null;
  reason?: 'timeout' | 'skip';
  onNext: () => void;
  nextLabel: string;
  children?: ReactNode;
}

/** بطاقة نتيجة السؤال بعد الجواب */
export function Reveal({ tier, input, answerText, reason, onNext, nextLabel, children }: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus({ preventScroll: true }), []);
  const info = TIERS[tier];
  return (
    <section
      className={`card flex animate-pop flex-col items-center gap-3 text-center ${tier === 4 ? 'motion-safe:animate-glow border-krill' : ''}`}
      aria-live="polite"
    >
      {tier > 0 ? (
        <>
          <p className="text-5xl" aria-hidden>
            {info.emoji}
          </p>
          <TierBadge tier={tier} size="lg" />
          <p className="text-lg">
            «{input}»{answerText && input && answerText !== input ? ` (${answerText})` : ''}
          </p>
          <p className="font-display text-abyss-200">
            +{toArabicDigits(info.points)} نقطة · نزلت {toArabicDigits(info.depth)}م
          </p>
          {tier === 4 && (
            <p className="font-display text-xl text-krill">لقيت الجواب السري! واحد في الكريليون 💎</p>
          )}
        </>
      ) : (
        <>
          <p className="text-5xl" aria-hidden>
            ⚫
          </p>
          <p className="font-display text-xl">{reason === 'timeout' ? 'خلص الوقت' : 'تخطّيت السؤال'}</p>
          <p className="text-abyss-200">ولا متر هالمرة</p>
        </>
      )}
      {children}
      <button ref={btn} className="btn-primary mt-2 w-full" onClick={onNext}>
        {nextLabel}
      </button>
    </section>
  );
}
