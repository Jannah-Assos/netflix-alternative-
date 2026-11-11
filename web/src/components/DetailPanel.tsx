import { useEffect, useRef, useState } from 'react';
import type { LinkCheck, MediaItem, MediaLink, ResolveResult } from '../../../server/src/types';
import { resolve } from '../api';
import { formatDuration, linkText } from '../format';
import { useI18n } from '../i18n';
import { useDialog } from '../useDialog';
import { LicenseBadge, RightsBadge, RightsNote, SourceBadge } from './Badges';
import { ListButton } from './ListButton';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: ResolveResult };

function CheckPill({ check }: { check?: LinkCheck }) {
  const { t } = useI18n();
  if (!check) return null;
  if (check.alive === true) return <span className="pill ok">{t('detail.online')}</span>;
  if (check.alive === false) return <span className="pill bad">{t('detail.offline')}{check.status ? ` (${check.status})` : ''}</span>;
  return <span className="pill idle">{t('detail.unchecked')}</span>;
}

function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button type="button" className="btn ghost" onClick={copy}>
      {done ? t('detail.copied') : t('detail.copy')}
    </button>
  );
}

function LinkRow({ link, best, check }: { link: MediaLink; best: boolean; check?: LinkCheck }) {
  const { t, lang } = useI18n();
  return (
    <li className={`link-row ${best ? 'best' : ''}`}>
      <div className="link-main">
        <div className="link-title">
          {best && <span className="pill best">{t('detail.best')}</span>}
          <span>{linkText(link, t, lang)}</span>
          {best && <CheckPill {...(check ? { check } : {})} />}
        </div>
        <div className="link-url" title={link.url}>
          {link.url}
        </div>
      </div>
      <div className="link-actions">
        <a className="btn ghost" href={link.url} target="_blank" rel="noopener noreferrer">
          {t('detail.open')}
        </a>
        <CopyButton text={link.url} />
      </div>
    </li>
  );
}

export function DetailPanel({
  item,
  onClose,
  onPlay,
}: {
  item: MediaItem;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
}) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>({ status: 'loading' });
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useDialog(panelRef, onClose, closeRef);

  useEffect(() => {
    setState({ status: 'loading' });
    const ctrl = new AbortController();
    resolve(item.uid, item.kind, ctrl.signal)
      .then((data) => setState({ status: 'done', data }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => ctrl.abort();
  }, [item.uid, item.kind]);

  const data = state.status === 'done' ? state.data : undefined;
  const best = data?.best;
  const license = data?.license ?? item.license;
  const direct = data?.links.filter((l) => l.type === 'stream' || l.type === 'download') ?? [];
  const others = data?.links.filter((l) => l.type === 'embed' || l.type === 'page') ?? [];
  const watchable = item.kind === 'video' || item.kind === 'audio';
  const meta = [t(`kind1.${item.kind}`), item.year, item.creator, formatDuration(data?.durationSec ?? item.durationSec, lang)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="overlay" onClick={onClose}>
      <aside ref={panelRef} className="panel" role="dialog" aria-modal="true" aria-label={item.title} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="close" onClick={onClose} aria-label={t('detail.close')}>
          ×
        </button>

        {item.thumbnail && (
          <img className="hero-small" src={item.thumbnail} alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}

        <div className="panel-body">
          <h2>{item.title}</h2>
          <p className="meta">{meta}</p>
          <div className="badges">
            <SourceBadge source={item.source} />
            <LicenseBadge license={license} />
            {item.rights && <RightsBadge rights={item.rights} />}
            {license.url && (
              <a className="small-link" href={license.url} target="_blank" rel="noopener noreferrer">
                {t('lic.view')}
              </a>
            )}
          </div>
          {!license.verified && <p className="notice warn">{t('lic.warning')}</p>}
          {item.rights && <RightsNote rights={item.rights} />}

          <div className="panel-actions">
            {watchable && (
              <button type="button" className="btn primary" onClick={() => onPlay(item)}>
                ▶ {t('hero.watch')}
              </button>
            )}
            <ListButton item={item} label />
          </div>

          {item.description && <p className="desc">{item.description}</p>}

          <h3 className="section">{t('detail.links')}</h3>
          {state.status === 'loading' && (
            <div className="loading-links" role="status">
              <div className="sk-line" />
              <div className="sk-line" />
              <span className="sr-only">{t('detail.loading')}</span>
            </div>
          )}
          {state.status === 'error' && <p className="notice bad">{t('detail.error', { error: state.message })}</p>}
          {data && direct.length === 0 && <p className="notice">{t('detail.none')}</p>}

          {direct.length > 0 && (
            <ul className="links">
              {direct.map((l) => (
                <LinkRow key={l.url} link={l} best={l.url === best?.url} {...(l.url === best?.url && data?.check ? { check: data.check } : {})} />
              ))}
            </ul>
          )}

          {others.length > 0 && (
            <>
              <h3 className="section">{t('detail.otherLinks')}</h3>
              <ul className="links">
                {others.map((l) => (
                  <LinkRow key={l.url} link={l} best={false} />
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
