import { useEffect, useState } from 'react';
import type { MediaItem, WorkDetail } from '../../../server/src/types';
import { work } from '../api';
import { RightsBadge, useRightsNote } from '../components/Badges';
import { Link } from '../components/Link';
import { ListButton } from '../components/ListButton';
import { Row } from '../components/Row';
import { formatDuration, languageName } from '../format';
import { useContinue } from '../hooks';
import { useI18n } from '../i18n';
import type { MessageKey } from '../messages';
import type { Actions } from './Home';

type State = { status: 'loading' } | { status: 'missing' } | { status: 'done'; data: WorkDetail };

function RightsBox({ data }: { data: WorkDetail }) {
  const { t } = useI18n();
  const rights = data.item.rights;
  const note = useRightsNote(rights ?? { fr: 'unclear', basis: 'authors' });
  if (!rights) return null;
  return (
    <section className={`rights-box rights-${rights.fr}`} aria-labelledby="film-rights">
      <h2 id="film-rights">{t('film.rights')}</h2>
      <p>{note}</p>
      {data.cc && (
        <p className="meta">
          {data.cc.license} · {data.cc.holder}
        </p>
      )}
      {data.authors.length > 0 && (
        <>
          <p className="meta">{t('film.authors')}</p>
          <ul className="authors">
            {data.authors.map((a) => (
              <li key={a.name}>
                {a.name} <span>{a.died ? `† ${a.died}` : t('film.unknownDeath')}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="meta">
        <Link to="/a-propos">{t('film.howWeCheck')}</Link>
      </p>
    </section>
  );
}

/** Page d'une œuvre : une adresse à partager, la raison de la voir, la preuve qu'elle est libre. */
export function Film({ slug, onInfo, onPlay }: Actions & { slug: string }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [shared, setShared] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const resume = useContinue();

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    work(slug, lang, ctrl.signal)
      .then((data) => {
        setState({ status: 'done', data });
        document.title = `${data.item.title} (${data.item.year}) · Openflix`;
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: 'missing' });
      });
    return () => ctrl.abort();
  }, [slug, lang]);

  if (state.status === 'loading') {
    return (
      <div className="page film-loading" role="status">
        <div className="spinner">
          <span className="sr-only">{t('watch.loading')}</span>
        </div>
      </div>
    );
  }
  if (state.status === 'missing') {
    return (
      <div className="page">
        <div className="empty">
          <p>{t('film.notFound')}</p>
          <div className="empty-actions">
            <Link className="btn primary" to="/catalogue">
              {t('nav.catalogue')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data } = state;
  const { item } = data;
  const isSeries = data.episodes.length > 0;
  const started = new Map(resume.map((p) => [p.item.uid, p]));
  // Série : on reprend l'épisode commencé le plus récemment, sinon le premier.
  const nextEpisode: MediaItem | undefined = isSeries ? (data.episodes.find((e) => started.has(e.item.uid))?.item ?? data.episodes[0]?.item) : undefined;
  const toPlay = nextEpisode ?? item;
  const meta = [
    item.year,
    data.directors.join(', '),
    isSeries ? t('film.episodesCount', { n: data.episodes.length }) : formatDuration(item.durationSec, lang),
    item.language ? languageName(item.language, lang) : t('film.silent'),
  ]
    .filter(Boolean)
    .join(' · ');

  const share = async () => {
    const url = `${window.location.origin}/film/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.why ?? '', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* partage annulé par la personne : rien à dire */
    }
  };

  return (
    <article className="film">
      <header className="film-hero">
        {item.thumbnail && imgOk && <img className="film-bg" src={item.thumbnail} alt="" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />}
        <div className="film-shade" />
        <div className="film-head">
          {item.thumbnail && imgOk && <img className="film-poster" src={item.thumbnail} alt="" referrerPolicy="no-referrer" />}
          <div className="film-title">
            {data.shelf && <p className="eyebrow">{data.shelf.title}</p>}
            <h1>{item.title}</h1>
            <p className="film-meta">{meta}</p>
            <div className="badges">
              {item.rights && <RightsBadge rights={item.rights} />}
              {data.tags.slice(0, 3).map((g) => (
                <Link key={g} className="tag" to={`/catalogue?tag=${g}`}>
                  {t(`tag.${g}` as MessageKey)}
                </Link>
              ))}
            </div>
            <div className="film-actions">
              <button type="button" className="btn light" onClick={() => onPlay(toPlay)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isSeries && nextEpisode ? t('film.playEpisode', { n: data.episodes.find((e) => e.item.uid === nextEpisode.uid)?.n ?? 1 }) : t('hero.watch')}
              </button>
              <ListButton item={item} label />
              <button type="button" className="btn glass" onClick={() => void share()}>
                {shared ? t('film.shared') : t('film.share')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="film-body">
        <div className="film-main">
          <section aria-labelledby="film-why">
            <h2 id="film-why">{t('film.why')}</h2>
            <p className="why">{item.why}</p>
          </section>

          {isSeries && (
            <section aria-labelledby="film-episodes">
              <h2 id="film-episodes">{t('film.episodes')}</h2>
              <ol className="episodes">
                {data.episodes.map((e) => {
                  const p = started.get(e.item.uid);
                  const pct = p && p.duration > 0 ? Math.min(100, (p.position / p.duration) * 100) : 0;
                  return (
                    <li key={e.item.uid}>
                      <button type="button" onClick={() => onPlay(e.item)}>
                        <span className="ep-n">{e.n}</span>
                        <span className="ep-title">{e.item.title.split(' · ').slice(1).join(' · ').replace(/^\d+\.\s*/, '')}</span>
                        <span className="ep-time">{formatDuration(e.item.durationSec, lang)}</span>
                        {pct > 0 && (
                          <span className="ep-progress" aria-hidden="true">
                            <span style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        <aside className="film-side">
          <RightsBox data={data} />
          <p className="meta">
            {t('film.source')}{' '}
            <a href={item.pageUrl} target="_blank" rel="noopener noreferrer">
              archive.org
            </a>
          </p>
        </aside>
      </div>

      {data.related.length > 0 && data.shelf && (
        <div className="rows">
          <Row id="related" title={t('film.related', { shelf: data.shelf.title })} items={data.related} onInfo={onInfo} onPlay={onPlay} />
        </div>
      )}
    </article>
  );
}
