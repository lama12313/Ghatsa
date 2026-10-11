import { useEffect, useState } from 'react';
import { loadAnswers, loadIndex } from '../lib/content';
import type { AnswerSet, ContentIndex, QuestionMeta } from '../types';

export function useContentIndex(): { index: ContentIndex | null; error: string | null } {
  const [index, setIndex] = useState<ContentIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadIndex()
      .then((i) => alive && setIndex(i))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'خطأ غير معروف'));
    return () => {
      alive = false;
    };
  }, []);
  return { index, error };
}

/** يحمّل أجوبة سؤال واحد (أو null لين تخلص) */
export function useAnswers(meta: QuestionMeta | null): AnswerSet | null {
  const [set, setSet] = useState<AnswerSet | null>(null);
  useEffect(() => {
    setSet(null);
    if (!meta) return;
    let alive = true;
    loadAnswers(meta)
      .then((s) => alive && setSet(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [meta]);
  return set && meta && set.id === meta.id ? set : null;
}
