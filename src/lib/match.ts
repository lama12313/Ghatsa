import type { ContentAnswer } from '../types';
import { normalize } from './normalize';

/** مسافة ليفنشتاين مع قطع مبكر لما تتجاوز الحد */
export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let cur = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

/** كم خطأ إملائي نسمح فيه حسب طول الجواب الصحيح (بعد التطبيع) */
export function tolerance(len: number): number {
  if (len < 5) return 0;
  if (len <= 8) return 1;
  return 2;
}

export interface MatchResult {
  /** رقم الجواب في القائمة */
  index: number;
  /** هل كان فيه تصحيح إملائي */
  fuzzy: boolean;
}

interface Key {
  key: string;
  index: number;
}

export class AnswerMatcher {
  private exact = new Map<string, number>();
  private keys: Key[] = [];

  private readonly exactOnly: boolean;

  constructor(answers: readonly ContentAnswer[], opts: { exact?: boolean } = {}) {
    this.exactOnly = opts.exact ?? false;
    answers.forEach((a, index) => {
      for (const form of [a.text, ...(a.aliases ?? [])]) {
        const key = normalize(form);
        if (!key) continue;
        if (!this.exact.has(key)) this.exact.set(key, index);
        this.keys.push({ key, index });
      }
    });
  }

  match(input: string): MatchResult | null {
    const n = normalize(input);
    if (!n) return null;
    const hit = this.exact.get(n);
    if (hit !== undefined) return { index: hit, fuzzy: false };
    if (this.exactOnly) return null;

    // أقرب جواب لكل رقم جواب
    let best: { index: number; dist: number } | null = null;
    let runnerUp = Infinity; // أقرب مسافة لجواب مختلف
    for (const { key, index } of this.keys) {
      // الأرقام لازم تكون مضبوطة (١٠٠٠١ ≠ ١٠٠٠٠)
      const tol = /^\d+$/.test(key) ? 0 : tolerance(key.length);
      if (tol === 0) continue;
      const d = levenshtein(n, key, tol);
      if (d > tol) continue;
      if (!best || d < best.dist) {
        if (best && best.index !== index) runnerUp = Math.min(runnerUp, best.dist);
        best = { index, dist: d };
      } else if (index !== best.index) {
        runnerUp = Math.min(runnerUp, d);
      }
    }
    if (!best) return null;
    // لو فيه جواب ثاني بنفس القرب، الإدخال غامض فنرفضه
    if (runnerUp <= best.dist) return null;
    return { index: best.index, fuzzy: true };
  }
}
