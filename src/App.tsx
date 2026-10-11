import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bubbles } from './components/Bubbles';
import { useContentIndex } from './hooks/useContent';
import { useHashRoute } from './hooks/useHashRoute';
import { OceanContext, type OceanApi } from './hooks/useOcean';
import { loadMuted, saveMuted } from './lib/progress';
import { setMuted } from './lib/sound';
import { DailyDive } from './game/DailyDive';
import { FreeDive } from './game/FreeDive';
import { HowTo } from './game/HowTo';
import { Home } from './game/Home';
import { Practice } from './game/Practice';
import { Rejected } from './game/Rejected';
import { Stats } from './game/Stats';

export default function App() {
  const route = useHashRoute();
  const { index, error } = useContentIndex();
  const [muted, setMutedState] = useState(loadMuted);

  useEffect(() => {
    setMuted(muted);
    saveMuted(muted);
  }, [muted]);

  const setDepth = useCallback((f: number) => {
    document.documentElement.style.setProperty('--depth', String(f));
  }, []);
  const ocean = useMemo<OceanApi>(
    () => ({ setDepth, muted, toggleMute: () => setMutedState((m) => !m) }),
    [setDepth, muted],
  );

  const needsIndex = route === 'daily' || route === 'free' || route === 'practice';

  let body: React.ReactNode;
  if (needsIndex && error) body = <p className="card text-center">{error}. تأكد من الاتصال وحدّث الصفحة.</p>;
  else if (needsIndex && !index) body = <p className="card text-center">نجهّز المعدات… 🤿</p>;
  else if (route === 'daily' && index) body = <DailyDive key="daily" index={index} />;
  else if (route === 'free' && index) body = <FreeDive index={index} />;
  else if (route === 'practice' && index) body = <Practice index={index} />;
  else if (route === 'stats') body = <Stats />;
  else if (route === 'rejected') body = <Rejected />;
  else if (route === 'how') body = <HowTo />;
  else body = <Home />;

  return (
    <OceanContext.Provider value={ocean}>
      <div className="ocean fixed inset-0 -z-10" aria-hidden />
      <Bubbles />
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-10 ps-4 pe-14 sm:pe-16">
        <header className="flex items-center justify-between py-4">
          {route === 'home' ? (
            <span />
          ) : (
            <a href="#" className="font-display text-xl text-white" aria-label="الرئيسية">
              غطسة 🌊
            </a>
          )}
          <button
            className="rounded-full p-2 text-xl hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-krill"
            onClick={ocean.toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'شغّل الصوت' : 'اكتم الصوت'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </header>
        <main className="flex-1">{body}</main>
      </div>
    </OceanContext.Provider>
  );
}
