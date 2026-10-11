import { CONFIG, TIERS } from '../config';
import type { AnswerSet, ContentAnswer, Tier } from '../types';

export function tierForRarity(rarity: number): Exclude<Tier, 0 | 4> {
  const t = CONFIG.rarityThresholds;
  if (rarity >= t.plankton) return 1;
  if (rarity >= t.reef) return 2;
  return 3;
}

export function tierOf(set: AnswerSet, index: number): Tier {
  if (index === set.secretIndex) return 4;
  return tierForRarity(set.answers[index].baseRarity);
}

export function pointsOf(tier: Tier): number {
  return TIERS[tier].points;
}

export function depthOf(tier: Tier): number {
  return TIERS[tier].depth;
}

export function totalDepth(tiers: readonly Tier[]): number {
  return tiers.reduce<number>((sum, t) => sum + depthOf(t), 0);
}

export function totalPoints(tiers: readonly Tier[]): number {
  return tiers.reduce<number>((sum, t) => sum + pointsOf(t), 0);
}

/** أندر ٣ أجوبة (غير السري وغير جواب اللاعب) عشان نعرضها في شاشة النتيجة */
export function rareAlternatives(set: AnswerSet, exclude: number | null, count = 3): ContentAnswer[] {
  return set.answers
    .map((a, i) => ({ a, i }))
    .filter(({ i }) => i !== set.secretIndex && i !== exclude)
    .sort((x, y) => x.a.baseRarity - y.a.baseRarity || x.i - y.i)
    .slice(0, count)
    .map(({ a }) => a);
}
