import type { Tier } from '../types';
import { load, remove, save } from './storage';

export interface QuestionResult {
  qid: string;
  /** اللي كتبه اللاعب وانقبل، أو null لو فاته */
  input: string | null;
  /** رقم الجواب المطابق في القائمة */
  index: number | null;
  tier: Tier;
}

export interface DailyState {
  day: number;
  ids: string[];
  /** رقم السؤال الحالي */
  current: number;
  /** متى بدأ السؤال الحالي (ms)، أو null لو اللاعب لسى ما فتحه */
  startedAt: number | null;
  results: QuestionResult[];
  finished: boolean;
}

export interface HistoryEntry {
  depth: number;
  tiers: Tier[];
}

export type History = Record<string, HistoryEntry>;

export interface RejectedEntry {
  qid: string;
  prompt: string;
  input: string;
  at: string;
}

const dailyKey = (day: number) => `daily:${day}`;

export function loadDaily(day: number): DailyState | null {
  const s = load<DailyState | null>(dailyKey(day), null);
  return s && s.day === day ? s : null;
}

export function saveDaily(state: DailyState): void {
  save(dailyKey(state.day), state);
  // ننظف الأيام القديمة عشان التخزين ما يكبر
  remove(dailyKey(state.day - 3));
}

export function loadHistory(): History {
  return load<History>('history', {});
}

export function recordHistory(day: number, entry: HistoryEntry): void {
  const h = loadHistory();
  h[String(day)] = entry;
  save('history', h);
}

export function loadRejected(): RejectedEntry[] {
  return load<RejectedEntry[]>('rejected', []);
}

export function addRejected(entry: RejectedEntry): void {
  const list = loadRejected();
  const dup = list.some((e) => e.qid === entry.qid && e.input.trim() === entry.input.trim());
  if (dup) return;
  list.push(entry);
  save('rejected', list.slice(-1000));
}

export function clearRejected(): void {
  save('rejected', []);
}

export interface FreeDiveBest {
  depth: number;
  answers: number;
}

export function loadFreeBest(): FreeDiveBest {
  return load<FreeDiveBest>('free-best', { depth: 0, answers: 0 });
}

export function saveFreeBest(best: FreeDiveBest): void {
  save('free-best', best);
}

export function loadMuted(): boolean {
  return load<boolean>('muted', false);
}

export function saveMuted(m: boolean): void {
  save('muted', m);
}
