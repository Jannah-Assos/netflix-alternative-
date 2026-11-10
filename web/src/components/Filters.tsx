import type { CSSProperties } from 'react';
import type { MediaKind, SourceId, SourceInfo, SourceStatus } from '../../../server/src/types';
import { useI18n } from '../i18n';
import {
  CONTENT_LANGS,
  GENRES,
  KINDS,
  PERIODS,
  SORTS,
  SOURCE_COLOR,
  SOURCE_NAME,
  type ContentLang,
  type Genre,
  type Period,
  type Sort,
} from '../labels';
import type { MessageKey } from '../messages';

interface Props {
  kinds: MediaKind[];
  onKinds: (k: MediaKind[]) => void;
  sources: SourceInfo[];
  /** null = toutes les sources. */
  enabled: SourceId[] | null;
  onEnabled: (s: SourceId[] | null) => void;
  statuses: SourceStatus[];
  freeOnly: boolean;
  onFreeOnly: (v: boolean) => void;
  genre: Genre | null;
  onGenre: (g: Genre | null) => void;
  period: Period | null;
  onPeriod: (p: Period | null) => void;
  lang: ContentLang | null;
  onLang: (l: ContentLang | null) => void;
  sort: Sort;
  onSort: (s: Sort) => void;
  /** Au moins un filtre diffère de sa valeur par défaut. */
  dirty: boolean;
  onReset: () => void;
}

export function Filters(p: Props) {
  const { t } = useI18n();
  const { kinds, sources, enabled, statuses } = p;

  const toggleKind = (k: MediaKind) => {
    const next = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k];
    if (next.length > 0) p.onKinds(KINDS.filter((x) => next.includes(x)));
  };

  const active = (id: SourceId) => enabled === null || enabled.includes(id);
  const toggleSource = (id: SourceId) => {
    const all = sources.map((s) => s.id);
    const current = enabled ?? all;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    if (next.length === 0) return;
    p.onEnabled(next.length === all.length ? null : next);
  };
  const activeCount = enabled === null ? sources.length : enabled.length;

  return (
    <div className="filters">
      <div className="filters-top">
        <div className="chip-row" role="group" aria-label={t('filters.kinds')}>
          {KINDS.map((k) => (
            <button key={k} type="button" className={`chip ${kinds.includes(k) ? 'on' : ''}`} aria-pressed={kinds.includes(k)} onClick={() => toggleKind(k)}>
              {t(`kind.${k}`)}
            </button>
          ))}
        </div>
        {p.dirty && (
          <button type="button" className="reset" onClick={p.onReset}>
            {t('filters.reset')}
          </button>
        )}
      </div>

      {kinds.includes('video') && (
        <div className="genres" role="group" aria-label={t('filters.genre')}>
          <button type="button" className={`chip ${p.genre === null ? 'on' : ''}`} aria-pressed={p.genre === null} onClick={() => p.onGenre(null)}>
            {t('genre.all')}
          </button>
          {GENRES.map((g) => (
            <button key={g} type="button" className={`chip ${p.genre === g ? 'on' : ''}`} aria-pressed={p.genre === g} onClick={() => p.onGenre(p.genre === g ? null : g)}>
              {t(`genre.${g}` as MessageKey)}
            </button>
          ))}
        </div>
      )}

      <div className="field-row">
        <label className="field">
          <span>{t('filters.period')}</span>
          <select value={p.period ?? ''} onChange={(e) => p.onPeriod((e.target.value || null) as Period | null)}>
            <option value="">{t('period.any')}</option>
            {PERIODS.map((x) => (
              <option key={x} value={x}>
                {t(`period.${x}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('filters.lang')}</span>
          <select value={p.lang ?? ''} onChange={(e) => p.onLang((e.target.value || null) as ContentLang | null)}>
            <option value="">{t('lang.any')}</option>
            {CONTENT_LANGS.map((x) => (
              <option key={x} value={x}>
                {t(`lang.${x}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('filters.sort')}</span>
          <select value={p.sort} onChange={(e) => p.onSort(e.target.value as Sort)}>
            {SORTS.map((x) => (
              <option key={x} value={x}>
                {t(`sort.${x}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="switch">
          <input type="checkbox" checked={p.freeOnly} onChange={(e) => p.onFreeOnly(e.target.checked)} />
          <span className="track" aria-hidden="true" />
          <span>{t('filters.freeOnly')}</span>
        </label>
      </div>

      {(p.genre || p.lang) && <p className="filters-note">{t('filters.note')}</p>}

      <details className="sources">
        <summary>{t('filters.sourcesSummary', { n: activeCount, total: sources.length })}</summary>
        <div className="chip-row" role="group" aria-label={t('filters.sources')}>
          {sources.map((s) => {
            const st = statuses.find((x) => x.source === s.id);
            const state = !active(s.id) ? 'off' : st && !st.ok ? 'error' : st?.skipped ? 'idle' : st ? 'ok' : 'idle';
            const title = st?.errorCode ? t(`err.${st.errorCode}`) : st?.skipped ? t(`skip.${st.skipped}`) : SOURCE_NAME[s.id];
            return (
              <button
                key={s.id}
                type="button"
                className={`chip source-chip ${active(s.id) ? 'on' : ''}`}
                style={{ '--c': SOURCE_COLOR[s.id] } as CSSProperties}
                aria-pressed={active(s.id)}
                title={title}
                onClick={() => toggleSource(s.id)}
              >
                <span className={`dot ${state}`} />
                {SOURCE_NAME[s.id]}
                {st && active(s.id) && st.ok && !st.skipped && <span className="count">{st.count}</span>}
                {st?.skipped === 'filter-unsupported' && active(s.id) && <span className="count" title={title}>—</span>}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
