import { CONFIG } from '../config';

const DAY_MS = 86_400_000;

function riyadhMidnightUtc(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - CONFIG.riyadhOffsetMinutes * 60_000;
}

/** رقم اليوم منذ أول يوم للعبة (٠ = غطسة #١) حسب توقيت الرياض */
export function dayIndex(now: number = Date.now()): number {
  return Math.floor((now - riyadhMidnightUtc(CONFIG.epoch)) / DAY_MS);
}

/** وقت بداية الغطسة الجاية (منتصف الليل بتوقيت الرياض) */
export function nextResetAt(now: number = Date.now()): number {
  return riyadhMidnightUtc(CONFIG.epoch) + (dayIndex(now) + 1) * DAY_MS;
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return toArabicDigits([h, m, s].map((x) => String(x).padStart(2, '0')).join(':'));
}
