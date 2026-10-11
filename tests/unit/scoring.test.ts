import { describe, expect, it } from 'vitest';
import { CONFIG, TIERS } from '../../src/config';
import { rareAlternatives, tierForRarity, tierOf, totalDepth, totalPoints } from '../../src/lib/scoring';
import type { AnswerSet } from '../../src/types';

const set: AnswerSet = {
  id: 't',
  secretIndex: 4,
  answers: [
    { text: 'أ', baseRarity: 0.5 },
    { text: 'ب', baseRarity: 0.3 },
    { text: 'ج', baseRarity: 0.01 },
    { text: 'د', baseRarity: 0.001 },
    { text: 'هـ', baseRarity: 0.0005 },
    { text: 'و', baseRarity: 0.002 },
  ],
};

describe('scoring', () => {
  it('العتبات', () => {
    expect(tierForRarity(CONFIG.rarityThresholds.plankton)).toBe(1);
    expect(tierForRarity(0.5)).toBe(1);
    expect(tierForRarity(CONFIG.rarityThresholds.reef)).toBe(2);
    expect(tierForRarity(CONFIG.rarityThresholds.reef - 0.0001)).toBe(3);
  });

  it('الجواب السري دايماً كريليون', () => {
    expect(tierOf(set, 4)).toBe(4);
    expect(tierOf(set, 0)).toBe(1);
    expect(tierOf(set, 2)).toBe(2);
    expect(tierOf(set, 3)).toBe(3);
  });

  it('النقاط والعمق حسب الجدول', () => {
    expect([1, 2, 3, 4].map((t) => TIERS[t as 1].points)).toEqual([10, 30, 60, 100]);
    expect(totalDepth([1, 2, 3, 4, 2, 0, 3])).toBe(40 + 120 + 250 + 400 + 120 + 0 + 250);
    expect(totalPoints([4, 4, 0])).toBe(200);
  });

  it('الأجوبة النادرة البديلة ما تشمل السري ولا جواب اللاعب', () => {
    const alts = rareAlternatives(set, 3).map((a) => a.text);
    expect(alts).toEqual(['و', 'ج', 'ب']);
  });
});
