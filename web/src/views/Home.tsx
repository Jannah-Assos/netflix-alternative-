import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HomeResult, MediaItem } from '../../../server/src/types';
import { home } from '../api';
import { Hero, pickHero } from '../components/Hero';
import { Row, SkeletonRow } from '../components/Row';
import { useContinue, useMyList } from '../hooks';
import { useI18n } from '../i18n';
import type { MessageKey } from '../messages';

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; data: HomeResult };

export interface Actions {
  onInfo: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

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
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => ctrl.abort();
  }, [lang, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const progress = useMemo(() => new Map(resume.map((p) => [p.item.uid, p])), [resume]);

  const rows = state.status === 'done' ? state.data.rows : [];
  const hero = useMemo(() => pickHero(rows[0]?.items ?? []), [rows]);
  // Aucune rangée alors qu'au moins une source a échoué : on explique la panne plutôt que « catalogue vide ».
  const sourcesDown = state.status === 'done' && state.data.partial && rows.length === 0;
  const empty = state.status === 'done' && !sourcesDown && rows.length === 0 && resume.length === 0 && list.length === 0;

  return (
    <>
      {hero && <Hero item={hero} onInfo={onInfo} onPlay={onPlay} />}

      <div className={`rows ${hero ? 'with-hero' : ''}`}>
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

        {rows.map((r) => (
          <Row key={r.id} id={r.id} title={t(`row.${r.id}` as MessageKey)} items={r.items} onInfo={onInfo} onPlay={onPlay} />
        ))}

        {(state.status === 'error' || sourcesDown) && (
          <div className="empty">
            <p>{t('home.loadError')}</p>
            <p className="meta">{t('home.loadErrorHint')}</p>
            <div className="empty-actions">
              <button type="button" className="btn primary" onClick={retry}>
                {t('home.retry')}
              </button>
              <a className="btn ghost" href="#/explore">
                {t('home.toExplore')}
              </a>
            </div>
          </div>
        )}

        {empty && (
          <div className="empty">
            <p>{t('home.empty')}</p>
            <div className="empty-actions">
              <button type="button" className="btn primary" onClick={retry}>
                {t('home.retry')}
              </button>
              <a className="btn ghost" href="#/explore">
                {t('home.toExplore')}
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
