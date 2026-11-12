import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HomeResult, MediaItem } from '../../../server/src/types';
import { home } from '../api';
import { Hero } from '../components/Hero';
import { Link } from '../components/Link';
import { Row, SkeletonRow } from '../components/Row';
import { useContinue, useMyList } from '../hooks';
import { useI18n } from '../i18n';

type State = { status: 'loading' } | { status: 'error' } | { status: 'done'; data: HomeResult };

export interface Actions {
  onInfo: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

/** Accueil : la séance du jour, la promesse en trois points, puis les parcours du catalogue. */
export function Home({ onInfo, onPlay }: Actions) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const resume = useContinue();
  const list = useMyList();

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    home(lang, ctrl.signal)
      .then((data) => setState({ status: 'done', data }))
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [lang, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const progress = useMemo(() => new Map(resume.map((p) => [p.item.uid, p])), [resume]);
  const data = state.status === 'done' ? state.data : undefined;

  return (
    <>
      {data && <Hero item={data.featured} onInfo={onInfo} onPlay={onPlay} />}

      <div className={`rows ${data ? 'with-hero' : ''}`}>
        {data && (
          <section className="promise" aria-label={t('app.tagline')}>
            <h2>{t('app.tagline')}</h2>
            <ul>
              <li>
                <strong>{t('uvp.1.t')}</strong>
                <span>{t('uvp.1.d')}</span>
              </li>
              <li>
                <strong>{t('uvp.2.t')}</strong>
                <span>{t('uvp.2.d')}</span>
              </li>
              <li>
                <strong>{t('uvp.3.t')}</strong>
                <span>{t('uvp.3.d', { n: data.total })}</span>
              </li>
            </ul>
          </section>
        )}

        {resume.length > 0 && (
          <Row id="continue" title={t('row.continue')} items={resume.map((p) => p.item)} progress={progress} onInfo={onInfo} onPlay={onPlay} />
        )}
        {list.length > 0 && <Row id="list" title={t('row.list')} items={list} onInfo={onInfo} onPlay={onPlay} />}

        {state.status === 'loading' && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {data?.rows.map((r) => <Row key={r.id} id={r.id} title={r.title} intro={r.intro} items={r.items} onInfo={onInfo} onPlay={onPlay} />)}

        {data && (
          <div className="more">
            <Link className="btn ghost" to="/catalogue">
              {t('home.allCatalogue', { n: data.total })}
            </Link>
          </div>
        )}

        {state.status === 'error' && (
          <div className="empty">
            <p>{t('home.loadError')}</p>
            <p className="meta">{t('home.loadErrorHint')}</p>
            <div className="empty-actions">
              <button type="button" className="btn primary" onClick={retry}>
                {t('home.retry')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
