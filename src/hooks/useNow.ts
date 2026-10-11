import { useEffect, useState } from 'react';

/** يرجع الوقت الحالي ويتحدث كل interval ملي ثانية */
export function useNow(interval = 250, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [interval, active]);
  return now;
}
