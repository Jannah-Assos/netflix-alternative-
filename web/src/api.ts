import type { ContentLang, Genre, Period, Sort } from './labels';
import type {
  HomeResult,
  Lang,
  MediaKind,
  ResolveResult,
  ScanResult,
  SourceId,
  SourceInfo,
} from '../../server/src/types';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error ?? `Erreur ${res.status}`);
  return data as T;
}

export interface SearchArgs {
  q: string;
  sources: SourceId[] | null;
  freeOnly: boolean;
  page: number;
  genre: Genre | null;
  period: Period | null;
  lang: ContentLang | null;
  sort: Sort;
}

export function search(args: SearchArgs, signal?: AbortSignal): Promise<ScanResult> {
  const p = new URLSearchParams();
  p.set('q', args.q);
  p.set('kinds', 'video');
  if (args.sources) p.set('sources', args.sources.join(','));
  if (args.freeOnly) p.set('freeOnly', '1');
  if (args.genre) p.set('genre', args.genre);
  if (args.period) p.set('period', args.period);
  if (args.lang) p.set('lang', args.lang);
  if (args.sort !== 'popular') p.set('sort', args.sort);
  p.set('page', String(args.page));
  return get<ScanResult>(`/api/search?${p}`, signal);
}

/** `check: false` saute la vérification HEAD du lien (plus rapide, pour la lecture). */
export function resolve(uid: string, kind: MediaKind, signal?: AbortSignal, check = true): Promise<ResolveResult> {
  return get<ResolveResult>(`/api/resolve?uid=${encodeURIComponent(uid)}&kind=${kind}${check ? '' : '&check=0'}`, signal);
}

export function home(lang: Lang, signal?: AbortSignal): Promise<HomeResult> {
  return get<HomeResult>(`/api/home?lang=${lang}`, signal);
}

export function listSources(signal?: AbortSignal): Promise<SourceInfo[]> {
  return get<SourceInfo[]>('/api/sources', signal);
}
