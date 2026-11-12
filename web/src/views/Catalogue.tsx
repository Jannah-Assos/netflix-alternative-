import { useEffect, useRef, useState } from 'react';
import type { MediaItem } from '../../../server/src/types';
import { catalogue } from '../api';
import { SearchIcon } from '../components/icons';
import { Link } from '../components/Link';
import { ResultCard, SkeletonCard } from '../components/ResultCard';
import { useI18n } from '../i18n';
import type { MessageKey } from '../messages';

export const TAGS = ['comedy', 'horror', 'adventure', 'drama', 'fantasy', 'scifi', 'animation', 'series', 'documentary', 'crime', 'experimental'] as const;
type Tag = (typeof TAGS)[number];

/** Le catalogue : toutes les œuvres vérifiées, avec une recherche instantanée (titre, réalisateur, année). */
export function Catalogue({ query, archive, onInfo }: { query: URLSearchParams; archive: boolean; onInfo: (item: MediaItem) => void }) {
  const { t, lang } = useI18n();
  const initialTag = (TAGS as readonly string[]).includes(query.get('tag') ?? '') ? (query.get('tag') as Tag) : null;
  const [input, setInput] = useState(query.get('q') ?? '');
  const [q, setQ] = useState(input.trim());
  const [tag, setTag] = useState<Tag | null>(initialTag);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recherche au fil de la frappe : la réponse vient de notre serveur, sans appel extérieur.
  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), 180);
    return () => clearTimeout(id);
  }, [input]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (tag) p.set('tag', tag);
    const qs = p.toString();
    window.history.replaceState(null, '', `/catalogue${qs ? `?${qs}` : ''}`);
    const ctrl = new AbortController();
    setFailed(false);
    catalogue(q, tag, lang, ctrl.signal)
      .then((r) => setItems(r.items))
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [q, tag, lang]);

  return (
    <div className="page">
      <h1 className="page-title">{t('cat.title')}</h1>
      <form className="search" role="search" onSubmit={(e) => (e.preventDefault(), inputRef.current?.blur())}>
        <SearchIcon />
        <input
          ref={inputRef}
          id="catalogue-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('cat.placeholder')}
          aria-label={t('nav.search')}
          autoComplete="off"
          maxLength={200}
        />
      </form>

      <div className="genres" role="group" aria-label={t('filters.genre')}>
        <button type="button" className={`chip ${tag === null ? 'on' : ''}`} aria-pressed={tag === null} onClick={() => setTag(null)}>
          {t('cat.all')}
        </button>
        {TAGS.map((g) => (
          <button key={g} type="button" className={`chip ${tag === g ? 'on' : ''}`} aria-pressed={tag === g} onClick={() => setTag(tag === g ? null : g)}>
            {t(`tag.${g}` as MessageKey)}
          </button>
        ))}
      </div>

      {items && (
        <p className="results-title" role="status">
          {t(items.length === 1 ? 'cat.count.one' : 'cat.count.other', { n: items.length })}
        </p>
      )}
      {failed && <p className="notice bad">{t('home.loadError')}</p>}

      <div className="grid" aria-busy={items === null}>
        {items?.map((item) => <ResultCard key={item.uid} item={item} onOpen={onInfo} />)}
        {items === null && !failed && Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
      </div>

      {items?.length === 0 && (
        <div className="empty">
          <p>{t('cat.empty')}</p>
          {archive && q && (
            <div className="empty-actions">
              <Link className="btn primary" to={`/archive?q=${encodeURIComponent(q)}`}>
                {t('cat.toArchive', { q })}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
