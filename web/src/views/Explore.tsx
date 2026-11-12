import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { MediaItem, SourceId, SourceInfo, SourceStatus } from '../../../server/src/types';
import { listSources, search } from '../api';
import { Filters } from '../components/Filters';
import { SearchIcon } from '../components/icons';
import { ResultCard, SkeletonCard } from '../components/ResultCard';
import { StatusBar } from '../components/StatusBar';
import { useI18n } from '../i18n';
import { CONTENT_LANGS, GENRES, PERIODS, SORTS, type ContentLang, type Genre, type Period, type Sort } from '../labels';
import { SUGGESTIONS } from '../messages';

function readQuery(p: URLSearchParams) {
  const sources = p.get('sources')?.split(',').filter(Boolean) as SourceId[] | undefined;
  return {
    q: p.get('q') ?? '',
    sources: sources?.length ? sources : null,
    // Par défaut : seulement les licences libres déclarées (free=0 pour tout voir).
    freeOnly: p.get('free') !== '0',
    genre: (GENRES as readonly string[]).includes(p.get('genre') ?? '') ? (p.get('genre') as Genre) : null,
    period: (PERIODS as readonly string[]).includes(p.get('period') ?? '') ? (p.get('period') as Period) : null,
    lang: (CONTENT_LANGS as readonly string[]).includes(p.get('lang') ?? '') ? (p.get('lang') as ContentLang) : null,
    sort: (SORTS as readonly string[]).includes(p.get('sort') ?? '') ? (p.get('sort') as Sort) : ('popular' as Sort),
  };
}

/** Écran « Explorer » : le scanner multi-sources, avec filtres et état de chaque source. */
export function Explore({ query, onInfo }: { query: URLSearchParams; onInfo: (item: MediaItem) => void }) {
  const { t, lang } = useI18n();
  const initial = useRef(readQuery(query)).current;
  const [input, setInput] = useState(initial.q);
  const [q, setQ] = useState(initial.q);
  const [enabled, setEnabled] = useState<SourceId[] | null>(initial.sources);
  const [freeOnly, setFreeOnly] = useState(initial.freeOnly);
  const [genre, setGenre] = useState<Genre | null>(initial.genre);
  const [period, setPeriod] = useState<Period | null>(initial.period);
  const [contentLang, setContentLang] = useState<ContentLang | null>(initial.lang);
  const [sort, setSort] = useState<Sort>(initial.sort);

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
    if (enabled) p.set('sources', enabled.join(','));
    if (!freeOnly) p.set('free', '0');
    if (genre) p.set('genre', genre);
    if (period) p.set('period', period);
    if (contentLang) p.set('lang', contentLang);
    if (sort !== 'popular') p.set('sort', sort);
    const qs = p.toString();
    window.history.replaceState(null, '', `/archive${qs ? `?${qs}` : ''}`);
  }, [q, enabled, freeOnly, genre, period, contentLang, sort]);

  const run = useCallback(
    async (nextPage: number) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const res = await search({ q, sources: enabled, freeOnly, page: nextPage, genre, period, lang: contentLang, sort }, ctrl.signal);
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
    [q, enabled, freeOnly, genre, period, contentLang, sort],
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

  const dirty = genre !== null || period !== null || contentLang !== null || sort !== 'popular' || !freeOnly || enabled !== null;
  const reset = () => {
    setGenre(null);
    setPeriod(null);
    setContentLang(null);
    setSort('popular');
    setFreeOnly(true);
    setEnabled(null);
  };

  const firstLoad = loading && items.length === 0;
  const allFailed = statuses.length > 0 && statuses.every((s) => !s.ok);

  return (
    <div className="page">
      <h1 className="page-title">{t('archive.title')}</h1>
      <p className="notice archive-banner">{t('archive.banner')}</p>
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
        sources={sources}
        enabled={enabled}
        onEnabled={setEnabled}
        statuses={statuses}
        freeOnly={freeOnly}
        onFreeOnly={setFreeOnly}
        genre={genre}
        onGenre={setGenre}
        period={period}
        onPeriod={setPeriod}
        lang={contentLang}
        onLang={setContentLang}
        sort={sort}
        onSort={setSort}
        dirty={dirty}
        onReset={reset}
      />

      <StatusBar statuses={statuses} />
      {error && <p className="notice bad">{t('explore.serverError', { error })}</p>}

      {!firstLoad && !error && !allFailed && (
        <h2 className="results-title">
          {q
            ? t(items.length === 1 ? 'explore.results.one' : 'explore.results.other', { n: items.length, q })
            : genre || period || contentLang || sort !== 'popular'
              ? t(items.length === 1 ? 'explore.count.one' : 'explore.count.other', { n: items.length })
              : t('explore.popular')}
        </h2>
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
