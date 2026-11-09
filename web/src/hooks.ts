import { useEffect, useMemo, useState } from 'react';
import type { MediaItem } from '../../server/src/types';
import { getContinue, getList, subscribe, type Progress } from './storage';

function useVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => subscribe(() => setV((x) => x + 1)), []);
  return v;
}

export function useMyList(): MediaItem[] {
  const v = useVersion();
  return useMemo(() => getList(), [v]);
}

export function useContinue(): Progress[] {
  const v = useVersion();
  return useMemo(() => getContinue(), [v]);
}

export type View = 'home' | 'explore' | 'list';

export interface Route {
  view: View;
  query: URLSearchParams;
  /** Change à chaque navigation (pas quand l'écran Explorer met à jour son propre état). */
  key: string;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [path = '', qs = ''] = raw.split('?');
  const seg = path.replace(/^\/+/, '').split('/')[0];
  const view: View = seg === 'explore' ? 'explore' : seg === 'list' ? 'list' : 'home';
  return { view, query: new URLSearchParams(qs), key: hash };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return useMemo(() => parseHash(hash), [hash]);
}

export function navigate(view: View, params?: Record<string, string>): void {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
  window.location.hash = view === 'home' ? '#/' : `#/${view}${qs}`;
}
