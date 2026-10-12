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

let bundlePromise: Promise<Record<string, string>> | null = null;

function fetchEncoded(file: string): Promise<string> {
  // نسخة الرابط: ملف واحد فيه كل الأجوبة (مشفرة برضو)
  if (import.meta.env.VITE_ARTIFACT) {
    bundlePromise ??= fetch(`${BASE}q/bundle.json`).then((r) => r.json() as Promise<Record<string, string>>);
    return bundlePromise.then((b) => {
      if (!(file in b)) throw new Error('ما قدرنا نحمّل السؤال');
      return b[file];
    });
  }
  return fetch(`${BASE}q/${file}`).then((r) => {
    if (!r.ok) throw new Error('ما قدرنا نحمّل السؤال');
    return r.text();
  });
}

/** يحمّل أجوبة سؤال واحد بس وقت ما ينعرض */
export function loadAnswers(meta: QuestionMeta): Promise<AnswerSet> {
  let p = answerCache.get(meta.id);
  if (!p) {
    p = fetchEncoded(meta.file).then((t) => decodeAnswerSet(meta.id, t));
    p.catch(() => answerCache.delete(meta.id));
    answerCache.set(meta.id, p);
  }
  return p;
}
