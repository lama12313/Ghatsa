import { Countdown } from '../components/Countdown';
import { useOceanDepth } from '../hooks/useOcean';
import { dayIndex, toArabicDigits } from '../lib/date';
import { loadDaily } from '../lib/progress';
import { totalDepth } from '../lib/scoring';

export function Home() {
  useOceanDepth(0);
  const day = dayIndex();
  const today = loadDaily(day);
  const done = today?.finished ?? false;
  const inProgress = !done && (today?.results.length ?? 0) > 0;
  const before = day < 0;

  return (
    <div className="flex flex-col items-center gap-6 pt-6 text-center">
      <div>
        <h1 className="font-display text-6xl text-white drop-shadow">غطسة</h1>
        <p className="mt-2 text-lg text-abyss-200">٧ أسئلة كل يوم. كل ما كان جوابك أندر، غطست أعمق.</p>
      </div>
      <div className="text-6xl motion-safe:animate-pulse" aria-hidden>
        🤿
      </div>
      <nav className="flex w-full max-w-sm flex-col gap-3" aria-label="أوضاع اللعب">
        {before ? (
          <p className="card">أول غطسة تبدأ قريب، جرّب الغطس الحر لين ذاك الوقت</p>
        ) : (
          <a href="#daily" className="btn-primary text-xl">
            {done
              ? `نتيجتك اليوم: ${toArabicDigits(totalDepth(today!.results.map((r) => r.tier)))}م`
              : inProgress
                ? 'كمّل غطسة اليوم'
                : `غطسة اليوم #${toArabicDigits(day + 1)}`}
          </a>
        )}
        <a href="#free" className="btn-ghost">
          الغطس الحر 🌊
        </a>
        <a href="#practice" className="btn-ghost">
          تدريب حسب التصنيف 🎯
        </a>
        <a href="#stats" className="btn-ghost">
          إحصائياتي 📊
        </a>
        <a href="#how" className="btn-ghost">
          طريقة اللعب ❓
        </a>
      </nav>
      <Countdown />
    </div>
  );
}
