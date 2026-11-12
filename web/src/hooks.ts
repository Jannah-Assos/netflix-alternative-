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

export type View = 'home' | 'film' | 'catalogue' | 'archive' | 'list' | 'about';

export interface Route {
  view: View;
  /** Identifiant de l'œuvre pour /film/<slug>. */
  slug?: string;
  query: URLSearchParams;
  /** Change à chaque navigation (pas quand un écran met à jour ses propres paramètres). */
  key: string;
}

/** De vraies adresses (/film/nosferatu) : elles se partagent et s'affichent avec un aperçu. */
export function parsePath(pathname: string, search = ''): Route {
  const [first = '', second = ''] = pathname.replace(/^\/+|\/+$/g, '').split('/');
  const query = new URLSearchParams(search);
  const key = `${pathname}${search}`;
  if (first === 'film' && /^[a-z0-9-]{1,80}$/.test(second)) return { view: 'film', slug: second, query, key };
  if (first === 'catalogue') return { view: 'catalogue', query, key };
  if (first === 'archive') return { view: 'archive', query, key };
  if (first === 'liste') return { view: 'list', query, key };
  if (first === 'a-propos') return { view: 'about', query, key };
  return { view: 'home', query, key };
}

/** Anciennes adresses « #/explore?q=… » (liens déjà partagés, raccourcis installés). */
export function legacyHashToPath(hash: string): string | null {
  if (!hash.startsWith('#/')) return null;
  const [path = '', qs = ''] = hash.slice(2).split('?');
  const seg = path.split('/')[0];
  const target = seg === 'explore' ? '/archive' : seg === 'list' ? '/liste' : '/';
  return qs && target === '/archive' ? `${target}?${qs}` : target;
}

const NAV_EVENT = 'openflix:navigate';

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}): void {
  const current = `${window.location.pathname}${window.location.search}`;
  if (to !== current) {
    if (opts.replace) window.history.replaceState(null, '', to);
    else window.history.pushState(null, '', to);
  }
  window.dispatchEvent(new Event(NAV_EVENT));
  if (!opts.keepScroll) window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const read = () => `${window.location.pathname}\n${window.location.search}`;
  const [loc, setLoc] = useState(() => {
    const legacy = legacyHashToPath(window.location.hash);
    if (legacy) window.history.replaceState(null, '', legacy);
    return read();
  });
  useEffect(() => {
    const on = () => setLoc(read());
    window.addEventListener('popstate', on);
    window.addEventListener(NAV_EVENT, on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener(NAV_EVENT, on);
    };
  }, []);
  return useMemo(() => {
    const [pathname = '/', search = ''] = loc.split('\n');
    return parsePath(pathname, search);
  }, [loc]);
}
