import { toArabicDigits } from '../lib/date';

interface Props {
  depth: number;
  max: number;
}

/** مؤشر العمق العمودي على جنب الشاشة */
export function DepthGauge({ depth, max }: Props) {
  const frac = Math.max(0, Math.min(1, depth / max));
  return (
    <div
      className="fixed bottom-6 left-2 top-20 z-10 flex w-10 flex-col items-center sm:left-4"
      role="meter"
      aria-label="العمق"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={depth}
      aria-valuetext={`${toArabicDigits(depth)} متر`}
    >
      <div className="relative w-1.5 flex-1 rounded-full bg-white/10">
        <div
          className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-abyss-200 to-krill transition-[height] duration-1000 ease-out motion-reduce:transition-none"
          style={{ height: `${frac * 100}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-1000 ease-out motion-reduce:transition-none"
          style={{ top: `${frac * 100}%` }}
        >
          <span className="block h-4 w-4 rounded-full border-2 border-abyss-900 bg-krill shadow-[0_0_12px_rgba(255,122,138,.8)]" />
        </div>
      </div>
      <span className="mt-2 font-display text-xs text-abyss-200">{toArabicDigits(depth)}م</span>
    </div>
  );
}
