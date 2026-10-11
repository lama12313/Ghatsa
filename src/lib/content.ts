import type { AnswerSet, ContentIndex, QuestionMeta } from '../types';
import { decodeAnswerSet } from './obfuscate';

const BASE = import.meta.env.BASE_URL;
let indexPromise: Promise<ContentIndex> | null = null;
const answerCache = new Map<string, Promise<AnswerSet>>();

export function loadIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE}q/index.json`).then((r) => {
      if (!r.ok) throw new Error('ما قدرنا نحمّل الأسئلة');
      return r.json() as Promise<ContentIndex>;
    });
    indexPromise.catch(() => (indexPromise = null));
  }
  return indexPromise;
}

/** يحمّل أجوبة سؤال واحد بس وقت ما ينعرض */
export function loadAnswers(meta: QuestionMeta): Promise<AnswerSet> {
  let p = answerCache.get(meta.id);
  if (!p) {
    p = fetch(`${BASE}q/${meta.file}`)
      .then((r) => {
        if (!r.ok) throw new Error('ما قدرنا نحمّل السؤال');
        return r.text();
      })
      .then((t) => decodeAnswerSet(meta.id, t));
    p.catch(() => answerCache.delete(meta.id));
    answerCache.set(meta.id, p);
  }
  return p;
}
