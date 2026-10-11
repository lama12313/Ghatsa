import { useEffect, useMemo, useState } from 'react';
import { MAX_DAILY_DEPTH } from '../config';
import { Countdown } from '../components/Countdown';
import { TierBadge } from '../components/TierBadge';
import { useOceanDepth } from '../hooks/useOcean';
import { loadAnswers } from '../lib/content';
import { toArabicDigits } from '../lib/date';
import type { DailyState } from '../lib/progress';
import { rareAlternatives, totalDepth, totalPoints } from '../lib/scoring';
import { shareText } from '../lib/share';
import type { AnswerSet, ContentIndex } from '../types';

export function DailyResults({ state, index }: { state: DailyState; index: ContentIndex }) {
  const tiers = state.results.map((r) => r.tier);
  const depth = totalDepth(tiers);
  const metaById = useMemo(() => new Map(index.questions.map((q) => [q.id, q])), [index]);
  const [sets, setSets] = useState<Record<string, AnswerSet>>({});
  const [copied, setCopied] = useState('');
  useOceanDepth(depth / MAX_DAILY_DEPTH);

  useEffect(() => {
    let alive = true;
    Promise.all(
      state.ids.map((id) => {
        const m = metaById.get(id);
        return m ? loadAnswers(m) : Promise.reject(new Error('missing'));
      }),
    )
      .then((all) => alive && setSets(Object.fromEntries(all.map((s) => [s.id, s]))))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state.ids, metaById]);

  const text = shareText(state.day + 1, depth, tiers);

  async function share() {
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied('انسخت! الصقها لربعك');
    } catch {
      setCopied('ما قدرنا ننسخ، انسخها يدوي من فوق');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-2 text-center">
        <p className="font-display text-abyss-200">غطسة #{toArabicDigits(state.day + 1)}</p>
        <h1 className="font-display text-5xl text-krill">{toArabicDigits(depth)}م</h1>
        <p className="text-abyss-200">{toArabicDigits(totalPoints(tiers))} نقطة</p>
        <p className="text-2xl tracking-widest" aria-label="ملخص المستويات">
          {tiers.map((t) => ['⚫', '🫧', '🐠', '🦑', '💎'][t]).join('')}
        </p>
        <pre className="sr-only">{text}</pre>
        <button className="btn-primary mt-2 w-full" onClick={share}>
          شارك نتيجتك 📋
        </button>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-abyss-200">
          {copied}
        </p>
        <Countdown />
      </section>

      <h2 className="font-display text-xl">أجوبتك</h2>
      <ol className="flex flex-col gap-3">
        {state.results.map((r, i) => {
          const meta = metaById.get(r.qid);
          const set = sets[r.qid];
          const secret = set ? set.answers[set.secretIndex].text : '…';
          const alts = set ? rareAlternatives(set, r.index) : [];
          return (
            <li key={r.qid} className="card flex flex-col gap-2">
              <p className="text-sm text-abyss-200">
                {toArabicDigits(i + 1)}. {meta?.category}
              </p>
              <p className="font-display text-lg">{meta?.prompt}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/80">جوابك:</span>
                <strong>{r.input ?? '—'}</strong>
                <TierBadge tier={r.tier} size="sm" />
              </div>
              <p>
                <span className="text-krill">💎 الجواب السري:</span> {secret}
              </p>
              {alts.length > 0 && (
                <p className="text-sm text-abyss-200">
                  🦑 أجوبة نادرة ثانية: {alts.map((a) => a.text).join('، ')}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <a href="#free" className="btn-ghost">
        ما شبعت؟ جرّب الغطس الحر 🌊
      </a>
    </div>
  );
}
