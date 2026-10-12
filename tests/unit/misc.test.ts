import { beforeEach, describe, expect, it } from 'vitest';
import { decodeAnswerSet, encodeAnswerSet, fileNameFor } from '../../src/lib/obfuscate';
import { addRejected, loadRejected, recordHistory, loadHistory } from '../../src/lib/progress';
import { shareText } from '../../src/lib/share';
import { computeStats } from '../../src/lib/stats';
import type { AnswerSet } from '../../src/types';

describe('obfuscate', () => {
  const set: AnswerSet = {
    id: 'geo-x',
    secretIndex: 1,
    answers: [
      { text: 'مصر', aliases: ['جمهورية مصر'], baseRarity: 0.3 },
      { text: 'إريتريا', aliases: [], baseRarity: 0.01 },
    ],
  };
  it('يرجع نفس البيانات بعد فك التشفير', () => {
    expect(decodeAnswerSet('geo-x', encodeAnswerSet(set))).toEqual(set);
  });
  it('النص المشفر ما يحتوي الأجوبة', () => {
    const enc = encodeAnswerSet(set);
    expect(atob(enc)).not.toContain(new TextDecoder().decode(new TextEncoder().encode('مصر')));
    expect(enc).not.toContain('baseRarity');
  });
  it('يحفظ علامة المطابقة الحرفية', () => {
    expect(decodeAnswerSet('geo-x', encodeAnswerSet({ ...set, exact: true })).exact).toBe(true);
  });
  it('اسم الملف ما يكشف id', () => {
    expect(fileNameFor('geo-x')).not.toContain('geo');
    expect(fileNameFor('geo-x')).toBe(fileNameFor('geo-x'));
  });
});

describe('share', () => {
  it('ما يكشف الأجوبة', () => {
    expect(shareText(42, 1650, [1, 2, 3, 4, 2, 0, 3])).toBe('غطسة #42 🌊\n١٦٥٠م\n🫧🐠🦑💎🐠⚫🦑');
  });
});

describe('stats', () => {
  it('يحسب السلسلة والمتوسط والتوزيع', () => {
    const s = computeStats(
      {
        '1': { depth: 100, tiers: [1, 1] },
        '2': { depth: 300, tiers: [2, 3] },
        '3': { depth: 200, tiers: [0, 4] },
        '7': { depth: 400, tiers: [4] },
        '8': { depth: 0, tiers: [0] },
      },
      8,
    );
    expect(s.played).toBe(5);
    expect(s.maxStreak).toBe(3);
    expect(s.currentStreak).toBe(2);
    expect(s.averageDepth).toBe(200);
    expect(s.bestDepth).toBe(400);
    expect(s.tierCounts).toEqual({ 0: 2, 1: 2, 2: 1, 3: 1, 4: 2 });
  });
  it('السلسلة تنقطع لو فات يوم', () => {
    expect(computeStats({ '1': { depth: 1, tiers: [] } }, 5).currentStreak).toBe(0);
  });
});

describe('progress storage', () => {
  beforeEach(() => localStorage.clear());
  it('سجل الأجوبة المرفوضة بدون تكرار', () => {
    addRejected({ qid: 'a', prompt: 'p', input: 'x', at: '1' });
    addRejected({ qid: 'a', prompt: 'p', input: 'x ', at: '2' });
    addRejected({ qid: 'a', prompt: 'p', input: 'y', at: '3' });
    expect(loadRejected().map((r) => r.input)).toEqual(['x', 'y']);
  });
  it('التاريخ', () => {
    recordHistory(3, { depth: 10, tiers: [1] });
    expect(loadHistory()['3'].depth).toBe(10);
  });
});
