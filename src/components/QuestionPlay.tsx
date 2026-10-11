import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnswerMatcher } from '../lib/match';
import { addRejected } from '../lib/progress';
import { playWrong } from '../lib/sound';
import type { AnswerSet, QuestionMeta } from '../types';

interface Props {
  meta: QuestionMeta;
  set: AnswerSet | null;
  header?: ReactNode;
  timer: ReactNode;
  onCorrect: (index: number, input: string) => void;
  onSkip: () => void;
  skipLabel?: string;
}

const WRONG_MESSAGES = [
  'مو موجود عندنا، جرّب غيره',
  'لا، فكّر بجواب ثاني',
  'ما لقيناه بالقائمة',
  'قريب؟ يمكن. بس لا',
];

/** عرض السؤال مع حقل الجواب: المطابقة والاهتزاز والرسائل */
export function QuestionPlay({ meta, set, header, timer, onCorrect, onSkip, skipLabel = 'تخطّي' }: Props) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const matcher = useMemo(() => (set ? new AnswerMatcher(set.answers) : null), [set]);
  const tries = useRef(0);

  useEffect(() => {
    setValue('');
    setMessage('');
    tries.current = 0;
    inputRef.current?.focus({ preventScroll: true });
  }, [meta.id]);

  useEffect(() => {
    if (set) inputRef.current?.focus({ preventScroll: true });
  }, [set]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = value.trim();
    if (!input || !matcher) return;
    const hit = matcher.match(input);
    if (hit) {
      onCorrect(hit.index, input);
      return;
    }
    addRejected({ qid: meta.id, prompt: meta.prompt, input, at: new Date().toISOString() });
    playWrong();
    setMessage(`«${input}»: ${WRONG_MESSAGES[tries.current % WRONG_MESSAGES.length]}`);
    tries.current++;
    setShake((s) => s + 1);
    setValue('');
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="q-prompt">
      {header}
      <div className="card animate-pop">
        <p className="mb-1 text-sm text-abyss-200">{meta.category}</p>
        <h2 id="q-prompt" className="font-display text-2xl leading-relaxed sm:text-3xl">
          {meta.prompt}
        </h2>
      </div>
      {timer}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="answer" className="sr-only">
          جوابك
        </label>
        <input
          key={shake}
          ref={inputRef}
          id="answer"
          name="answer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`w-full rounded-2xl border-2 border-white/20 bg-abyss-900/60 px-4 py-4 text-xl text-white placeholder:text-white/40 focus:border-krill focus:outline-none ${shake ? 'motion-safe:animate-shake' : ''}`}
          placeholder={set ? 'اكتب جواب واحد…' : 'لحظة نجهّز السؤال…'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
          disabled={!set}
          aria-describedby="answer-msg"
          aria-invalid={message ? true : undefined}
          dir="rtl"
        />
        <p
          id="answer-msg"
          role="status"
          aria-live="assertive"
          className="min-h-6 text-center text-krill-soft"
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={!set || !value.trim()}>
            غطّس
          </button>
          <button type="button" className="btn-ghost" onClick={onSkip}>
            {skipLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
