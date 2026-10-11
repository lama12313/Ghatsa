import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG, MAX_DAILY_DEPTH } from '../config';
import { DepthGauge } from '../components/DepthGauge';
import { QuestionPlay } from '../components/QuestionPlay';
import { Reveal } from '../components/Reveal';
import { TimerBar } from '../components/TimerBar';
import { useAnswers } from '../hooks/useContent';
import { useNow } from '../hooks/useNow';
import { useOceanDepth } from '../hooks/useOcean';
import { DailyScheduler } from '../lib/daily';
import { dayIndex, toArabicDigits } from '../lib/date';
import { loadDaily, recordHistory, saveDaily, type DailyState, type QuestionResult } from '../lib/progress';
import { depthOf, tierOf, totalDepth } from '../lib/scoring';
import { playCorrect, playTimeout, vibrate } from '../lib/sound';
import type { ContentIndex } from '../types';
import { DailyResults } from './DailyResults';

const QUESTION_MS = CONFIG.secondsPerQuestion * 1000;

interface Pending {
  result: QuestionResult;
  reason?: 'timeout' | 'skip';
  answerText: string | null;
}

export function DailyDive({ index }: { index: ContentIndex }) {
  const [day] = useState(() => dayIndex());
  const metaById = useMemo(() => new Map(index.questions.map((q) => [q.id, q])), [index]);

  const [state, setState] = useState<DailyState>(() => {
    const saved = loadDaily(day);
    if (saved && saved.ids.every((id) => metaById.has(id))) return saved;
    const ids = new DailyScheduler(index.questions).forDay(day);
    return { day, ids, current: 0, startedAt: null, results: [], finished: false };
  });
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => saveDaily(state), [state]);

  const meta = state.finished ? null : (metaById.get(state.ids[state.current]) ?? null);
  const set = useAnswers(meta);
  const active = !state.finished && state.startedAt !== null && !pending;
  const now = useNow(200, active);
  const remaining = state.startedAt !== null ? state.startedAt + QUESTION_MS - now : QUESTION_MS;

  const depth = totalDepth(state.results.map((r) => r.tier));
  useOceanDepth(depth / MAX_DAILY_DEPTH);

  const commit = useCallback(
    (result: QuestionResult, reason?: 'timeout' | 'skip', answerText: string | null = null) => {
      setPending({ result, reason, answerText });
      setState((s) => {
        if (s.results.length > s.current) return s; // سبق وانحسب
        const results = [...s.results, result];
        const finished = results.length >= s.ids.length;
        if (finished)
          recordHistory(s.day, {
            depth: totalDepth(results.map((r) => r.tier)),
            tiers: results.map((r) => r.tier),
          });
        return { ...s, results, current: s.current + 1, startedAt: null, finished };
      });
    },
    [],
  );

  // انتهاء الوقت (يشتغل حتى لو اللاعب طلع ورجع بعد ما خلص وقته)
  useEffect(() => {
    if (!meta || state.startedAt === null || pending) return;
    if (Date.now() >= state.startedAt + QUESTION_MS) {
      playTimeout();
      commit({ qid: meta.id, input: null, index: null, tier: 0 }, 'timeout');
    }
  }, [now, meta, state.startedAt, pending, commit]);

  const start = () => setState((s) => ({ ...s, startedAt: Date.now() }));

  const next = () => {
    setPending(null);
    if (!state.finished) start();
  };

  if (state.finished && !pending) {
    return <DailyResults state={state} index={index} />;
  }

  const number = Math.min(state.current + (pending ? 0 : 1), state.ids.length);

  return (
    <div className="flex flex-col gap-4">
      <DepthGauge depth={depth} max={MAX_DAILY_DEPTH} />
      <ProgressDots results={state.results} total={state.ids.length} current={state.current} />

      {pending ? (
        <Reveal
          tier={pending.result.tier}
          input={pending.result.input}
          answerText={pending.answerText}
          reason={pending.reason}
          onNext={next}
          nextLabel={state.finished ? 'شوف نتيجتك' : `السؤال ${toArabicDigits(state.current + 1)} ↓`}
        />
      ) : state.startedAt === null && meta ? (
        <section className="card flex flex-col items-center gap-4 text-center">
          <p className="font-display text-abyss-200">
            السؤال {toArabicDigits(number)} من {toArabicDigits(state.ids.length)}
          </p>
          <p className="text-lg">
            عندك {toArabicDigits(CONFIG.secondsPerQuestion)} ثانية وجواب واحد. كل ما كان جوابك أندر، غطست
            أعمق.
          </p>
          <button className="btn-primary w-full" onClick={start} autoFocus>
            {state.current === 0 ? 'ابدأ الغطسة 🤿' : 'كمّل الغطسة 🤿'}
          </button>
        </section>
      ) : meta ? (
        <QuestionPlay
          meta={meta}
          set={set}
          timer={<TimerBar remainingMs={remaining} totalMs={QUESTION_MS} />}
          onCorrect={(i, input) => {
            if (!set) return;
            const tier = tierOf(set, i);
            playCorrect(tier);
            vibrate(tier);
            commit({ qid: meta.id, input, index: i, tier }, undefined, set.answers[i].text);
          }}
          onSkip={() => commit({ qid: meta.id, input: null, index: null, tier: 0 }, 'skip')}
        />
      ) : null}
      <p className="sr-only" aria-live="polite">
        العمق الحالي {toArabicDigits(depth)} متر
      </p>
      <p className="text-center text-sm text-abyss-200">
        العمق: <span className="font-display">{toArabicDigits(depth)}م</span>
        {pending && pending.result.tier > 0 && ` (+${toArabicDigits(depthOf(pending.result.tier))})`}
      </p>
    </div>
  );
}

function ProgressDots({
  results,
  total,
  current,
}: {
  results: QuestionResult[];
  total: number;
  current: number;
}) {
  return (
    <ol className="flex justify-center gap-2" aria-label="تقدّم الأسئلة">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        const label = r ? ['⚫', '🫧', '🐠', '🦑', '💎'][r.tier] : i === current ? '◉' : '○';
        return (
          <li
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${i === current && !r ? 'bg-krill/20 text-krill' : 'bg-white/5 text-white/50'}`}
            aria-label={`سؤال ${i + 1}`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}
