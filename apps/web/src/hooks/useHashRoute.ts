import { useEffect, useState } from 'react';
import { parseHashRoute, type RouteId } from '../router';

export function useHashRoute() {
  const [route, setRoute] = useState<RouteId | null>(() =>
    typeof window === 'undefined' ? null : parseHashRoute(window.location.hash),
  );

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHashRoute(window.location.hash));
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

