import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { MediaItem, MediaKind, SourceId, SourceInfo, SourceStatus } from '../../../server/src/types';
import { listSources, search } from '../api';
import { Filters } from '../components/Filters';
import { SearchIcon } from '../components/icons';
import { ResultCard, SkeletonCard } from '../components/ResultCard';
import { StatusBar } from '../components/StatusBar';
import { useI18n } from '../i18n';
import { KINDS } from '../labels';
import { SUGGESTIONS } from '../messages';

function readQuery(p: URLSearchParams) {
  const kinds = (p.get('kinds')?.split(',') ?? []).filter((k): k is MediaKind => (KINDS as string[]).includes(k));
  const sources = p.get('sources')?.split(',').filter(Boolean) as SourceId[] | undefined;
  return {
    q: p.get('q') ?? '',
    kinds: kinds.length ? kinds : [...KINDS],
    sources: sources?.length ? sources : null,
    freeOnly: p.get('free') === '1',
  };
}

/** Écran « Explorer » : le scanner multi-sources, avec filtres et état de chaque source. */
export function Explore({ query, onInfo }: { query: URLSearchParams; onInfo: (item: MediaItem) => void }) {
  const { t, lang } = useI18n();
  const initial = useRef(readQuery(query)).current;
  const [input, setInput] = useState(initial.q);
  const [q, setQ] = useState(initial.q);
  const [kinds, setKinds] = useState<MediaKind[]>(initial.kinds);
  const [enabled, setEnabled] = useState<SourceId[] | null>(initial.sources);
  const [freeOnly, setFreeOnly] = useState(initial.freeOnly);

  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    listSources().then(setSources).catch(() => undefined);
  }, []);

  // Raccourci « / » pour chercher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // État partageable dans l'URL (replaceState : ne déclenche pas de navigation).
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (kinds.length !== KINDS.length) p.set('kinds', kinds.join(','));
    if (enabled) p.set('sources', enabled.join(','));
    if (freeOnly) p.set('free', '1');
    const qs = p.toString();
    window.history.replaceState(null, '', `#/explore${qs ? `?${qs}` : ''}`);
  }, [q, kinds, enabled, freeOnly]);

  const run = useCallback(
    async (nextPage: number) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const res = await search({ q, kinds, sources: enabled, freeOnly, page: nextPage }, ctrl.signal);
        setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items.filter((i) => !prev.some((p) => p.uid === i.uid))]));
        setStatuses(res.sources);
        setPage(res.page);
        setHasMore(res.hasMore);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        if (nextPage === 1) setItems([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [q, kinds, enabled, freeOnly],
  );

  useEffect(() => {
    void run(1);
    return () => abortRef.current?.abort();
  }, [run]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQ(input.trim());
  };
  const pick = (s: string) => {
    setInput(s);
    setQ(s);
  };

  const firstLoad = loading && items.length === 0;
  const allFailed = statuses.length > 0 && statuses.every((s) => !s.ok);

  return (
    <div className="page">
      <form className="search" role="search" onSubmit={submit}>
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('explore.placeholder')}
          aria-label={t('nav.search')}
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" className="btn primary">
          {t('explore.scan')}
        </button>
      </form>

      <div className="suggest">
        {SUGGESTIONS[lang].map((s) => (
          <button key={s} type="button" className="link-chip" onClick={() => pick(s)}>
            {s}
          </button>
        ))}
      </div>

      <Filters
        kinds={kinds}
        onKinds={setKinds}
        sources={sources}
        enabled={enabled}
        onEnabled={setEnabled}
        statuses={statuses}
        freeOnly={freeOnly}
        onFreeOnly={setFreeOnly}
      />

      <StatusBar statuses={statuses} />
      {error && <p className="notice bad">{t('explore.serverError', { error })}</p>}

      {!firstLoad && !error && !allFailed && (
        <h1 className="results-title">
          {q ? t(items.length === 1 ? 'explore.results.one' : 'explore.results.other', { n: items.length, q }) : t('explore.popular')}
        </h1>
      )}

      <div className="grid" aria-busy={loading}>
        {items.map((item) => (
          <ResultCard key={item.uid} item={item} onOpen={onInfo} />
        ))}
        {firstLoad && Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
      </div>

      {!loading && !error && !allFailed && items.length === 0 && (
        <div className="empty">
          <p>{t('explore.empty')}</p>
          <p className="meta">{t('explore.emptyHint')}</p>
        </div>
      )}

      {hasMore && items.length > 0 && (
        <div className="more">
          <button type="button" className="btn ghost" disabled={loading} onClick={() => void run(page + 1)}>
            {loading ? t('explore.loading') : t('explore.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
