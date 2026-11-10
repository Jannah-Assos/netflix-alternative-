import { HttpError, type Http } from './http.js';
import { isFreeLicense } from './licenses.js';
import { isFamilySafe, safeSearchEnabled } from './safety.js';
import type { MediaSource } from './sources/types.js';
import type { ErrorCode, MediaItem, ScanResult, SearchParams, SourceId, SourceStatus } from './types.js';

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
    timer = setTimeout(() => reject(new HttpError(`${label}: timed out after ${ms} ms`, undefined, 'timeout')), ms);
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
        statuses.push({ ...base, ok: true, skipped: 'unsupported-kind' });
        return;
      }
      if (!params.q.trim() && !source.supportsBrowse) {
        statuses.push({ ...base, ok: true, skipped: 'query-required' });
        return;
      }
      const started = Date.now();
      try {
        // « Libres vérifiées » est aussi poussé dans la requête quand la source sait le faire : la pagination reste juste.
        const filters = opts.freeOnly ? { ...params.filters, licensed: true } : params.filters;
        const found = await withTimeout(source.search({ ...params, kinds, ...(filters ? { filters } : {}) }, http), timeoutMs, source.name);
        if (found.length >= params.limit) hasMore = true;
        // Défense en profondeur : toutes les sources passent le filtre « grand public » sur titre et description.
        const safe = safeSearchEnabled() ? found.filter((i) => isFamilySafe({ title: i.title, ...(i.description ? { description: i.description } : {}) })) : found;
        const items = opts.freeOnly ? safe.filter((i) => isFreeLicense(i.license)) : safe;
        statuses.push({ source: source.id, ok: true, count: items.length, tookMs: Date.now() - started });
        lists[selected.indexOf(source)] = items;
      } catch (err) {
        statuses.push({
          source: source.id,
          ok: false,
          count: 0,
          tookMs: Date.now() - started,
          error: err instanceof Error ? err.message : String(err),
          errorCode: (err instanceof HttpError ? err.code : 'unknown') satisfies ErrorCode,
        });
      }
    }),
  );

  const seen = new Set<string>();
  const items = interleave(lists.filter(Boolean)).filter((i) => !seen.has(i.uid) && !!seen.add(i.uid));
  statuses.sort((a, b) => selected.findIndex((s) => s.id === a.source) - selected.findIndex((s) => s.id === b.source));
  return { items, sources: statuses, page: params.page, hasMore };
}
