import type { Tier } from './types';

export interface TierInfo {
  tier: Tier;
  name: string;
  emoji: string;
  points: number;
  depth: number;
  /** ثواني هواء إضافية في الغطس الحر */
  air: number;
}

/** كل إعدادات اللعبة القابلة للتعديل في مكان واحد */
export const CONFIG = {
  questionsPerDay: 7,
  secondsPerQuestion: 25,
  /** ما يتكرر السؤال في الغطسة اليومية قبل هالعدد من الأيام (انظر DECISIONS.md) */
  noRepeatDays: 40,
  /** أول يوم للعبة (غطسة #1) بتوقيت الرياض */
  epoch: '2026-10-12',
  /** فرق توقيت الرياض عن UTC بالدقائق (السعودية ما فيها توقيت صيفي) */
  riyadhOffsetMinutes: 180,

  /**
   * عتبات الندرة: الجواب اللي baseRarity حقه >= plankton يعتبر عوالق،
   * و >= reef يعتبر شعاب، وغير كذا أعماق. الجواب السري دايماً كريليون.
   */
  rarityThresholds: { plankton: 0.02, reef: 0.006 },

  /** حدود المحتوى */
  minAnswers: 40,
  targetAnswers: 80,

  freeDive: { startAir: 45, maxAir: 90 },
} as const;

export const TIERS: Record<Tier, TierInfo> = {
  0: { tier: 0, name: 'فاتتك', emoji: '⚫', points: 0, depth: 0, air: 0 },
  1: { tier: 1, name: 'عوالق', emoji: '🫧', points: 10, depth: 40, air: 8 },
  2: { tier: 2, name: 'شعاب', emoji: '🐠', points: 30, depth: 120, air: 10 },
  3: { tier: 3, name: 'أعماق', emoji: '🦑', points: 60, depth: 250, air: 12 },
  4: { tier: 4, name: 'واحد في الكريليون', emoji: '💎', points: 100, depth: 400, air: 16 },
};

export const MAX_DAILY_DEPTH = CONFIG.questionsPerDay * TIERS[4].depth;
