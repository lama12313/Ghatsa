import { TIERS } from '../config';
import type { Tier } from '../types';
import { toArabicDigits } from './date';

/** نص المشاركة: ما يكشف أي جواب */
export function shareText(dayNumber: number, depth: number, tiers: readonly Tier[]): string {
  return [
    `غطسة #${dayNumber} 🌊`,
    `${toArabicDigits(depth)}م`,
    tiers.map((t) => TIERS[t].emoji).join(''),
  ].join('\n');
}
