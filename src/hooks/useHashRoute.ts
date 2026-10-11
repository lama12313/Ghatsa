import { useEffect, useState } from 'react';

export type Route = 'home' | 'daily' | 'free' | 'practice' | 'stats' | 'rejected' | 'how';

const ROUTES: Route[] = ['home', 'daily', 'free', 'practice', 'stats', 'rejected', 'how'];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'home';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(route: Route): void {
  window.location.hash = route === 'home' ? '' : route;
}
