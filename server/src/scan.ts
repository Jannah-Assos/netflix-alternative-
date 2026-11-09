import type { Http } from './http.js';
import { isFreeLicense } from './licenses.js';
import type { MediaSource } from './sources/types.js';
import type { MediaItem, ScanResult, SearchParams, SourceId, SourceStatus } from './types.js';

export interface ScanOptions {
  /** Sources à interroger (toutes par défaut). */
  sources?: SourceId[];
  /** Ne garder que les licences explicitement libres. */
  freeOnly?: boolean;
  /** Délai max par source. */
  timeoutMs?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} : délai dépassé (${ms} ms)`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/** Entrelace les listes pour mélanger les sources (a1, b1, c1, a2, b2…). */
export function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i] as T);
  }
  return out;
}

/**
 * Interroge toutes les sources en parallèle. Une source en échec ou trop lente
 * n'empêche pas les autres de répondre : son état est renvoyé dans `sources`.
 */
export async function scan(
  all: MediaSource[],
  http: Http,
  params: SearchParams,
  opts: ScanOptions = {},
): Promise<ScanResult> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const selected = all.filter((s) => !opts.sources || opts.sources.includes(s.id));
  const statuses: SourceStatus[] = [];
  const lists: MediaItem[][] = [];
  let hasMore = false;

  await Promise.all(
    selected.map(async (source) => {
      const kinds = params.kinds.filter((k) => source.kinds.includes(k));
      const base = { source: source.id, count: 0, tookMs: 0 } as const;
      if (kinds.length === 0) {
        statuses.push({ ...base, ok: true, skipped: 'type de contenu non pris en charge' });
        return;
      }
      if (!params.q.trim() && !source.supportsBrowse) {
        statuses.push({ ...base, ok: true, skipped: 'mot-clé requis' });
        return;
      }
      const started = Date.now();
      try {
        const found = await withTimeout(source.search({ ...params, kinds }, http), timeoutMs, source.name);
        if (found.length >= params.limit) hasMore = true;
        const items = opts.freeOnly ? found.filter((i) => isFreeLicense(i.license)) : found;
        statuses.push({ source: source.id, ok: true, count: items.length, tookMs: Date.now() - started });
        lists[selected.indexOf(source)] = items;
      } catch (err) {
        statuses.push({
          source: source.id,
          ok: false,
          count: 0,
          tookMs: Date.now() - started,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  const seen = new Set<string>();
  const items = interleave(lists.filter(Boolean)).filter((i) => !seen.has(i.uid) && !!seen.add(i.uid));
  statuses.sort((a, b) => selected.findIndex((s) => s.id === a.source) - selected.findIndex((s) => s.id === b.source));
  return { items, sources: statuses, page: params.page, hasMore };
}
