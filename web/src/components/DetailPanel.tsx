import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LinkCheck, MediaItem, MediaLink, ResolveResult } from '../../../server/src/types';
import { resolve } from '../api';
import { KIND_SINGULAR, LICENSE_LABEL, SOURCE_COLOR, SOURCE_NAME, formatBytes, formatDuration } from '../labels';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: ResolveResult };

function CheckPill({ check }: { check?: LinkCheck }) {
  if (!check) return null;
  if (check.alive === true) return <span className="pill ok">En ligne</span>;
  if (check.alive === false) return <span className="pill bad">Hors ligne{check.status ? ` (${check.status})` : ''}</span>;
  return <span className="pill idle">Non vérifié</span>;
}

function CopyButton({ text }: { text: string }) {
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
      {done ? 'Copié ✓' : 'Copier le lien'}
    </button>
  );
}

function LinkRow({ link, best, check }: { link: MediaLink; best: boolean; check?: LinkCheck }) {
  const size = formatBytes(link.sizeBytes);
  return (
    <li className={`link-row ${best ? 'best' : ''}`}>
      <div className="link-main">
        <div className="link-title">
          {best && <span className="pill best">Meilleur lien</span>}
          <span>{link.label}</span>
          {best && <CheckPill check={check} />}
        </div>
        <div className="link-url" title={link.url}>
          {link.url}
        </div>
        {size && !link.label.includes(size) && <div className="link-sub">{size}</div>}
      </div>
      <div className="link-actions">
        <a className="btn ghost" href={link.url} target="_blank" rel="noopener noreferrer">
          Ouvrir
        </a>
        <CopyButton text={link.url} />
      </div>
    </li>
  );
}

export function DetailPanel({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setState({ status: 'loading' });
    setPlaying(false);
    setPlayError(false);
    const ctrl = new AbortController();
    resolve(item.uid, item.kind, ctrl.signal)
      .then((data) => setState({ status: 'done', data }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' });
      });
    return () => ctrl.abort();
  }, [item.uid, item.kind]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const data = state.status === 'done' ? state.data : undefined;
  const best = data?.best;
  const license = data?.license ?? item.license;
  const duration = formatDuration(data?.durationSec ?? item.durationSec);
  const direct = data?.links.filter((l) => l.type === 'stream' || l.type === 'download') ?? [];
  const others = data?.links.filter((l) => l.type === 'embed' || l.type === 'page') ?? [];
  const canPlay = !!best?.playable && (item.kind === 'video' || item.kind === 'audio');
  const meta = [KIND_SINGULAR[item.kind], item.year, item.creator, duration].filter(Boolean).join(' · ');

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="panel" role="dialog" aria-modal="true" aria-label={item.title} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {playing && canPlay && best ? (
          <div className="player">
            {item.kind === 'video' ? (
              <video src={best.url} controls autoPlay playsInline preload="metadata" onError={() => setPlayError(true)} />
            ) : (
              <audio src={best.url} controls autoPlay onError={() => setPlayError(true)} />
            )}
            {playError && (
              <p className="notice">
                Ce navigateur ne peut pas lire ce fichier. Utilisez « Ouvrir » ou collez le lien dans VLC / mpv.
              </p>
            )}
          </div>
        ) : (
          item.thumbnail && <img className="hero" src={item.thumbnail} alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}

        <div className="panel-body">
          <h2>{item.title}</h2>
          <p className="meta">{meta}</p>
          <div className="badges">
            <span className="badge source" style={{ '--c': SOURCE_COLOR[item.source] } as CSSProperties}>
              {SOURCE_NAME[item.source]}
            </span>
            <span className={`badge lic lic-${license.category}`}>
              {license.verified ? license.label : LICENSE_LABEL[license.category]}
            </span>
            {license.url && (
              <a className="small-link" href={license.url} target="_blank" rel="noopener noreferrer">
                voir la licence
              </a>
            )}
          </div>
          {!license.verified && (
            <p className="notice warn">Licence non déclarée par la source : vérifiez les droits avant de réutiliser ce contenu.</p>
          )}
          {item.description && <p className="desc">{item.description}</p>}

          <h3 className="section">Liens</h3>
          {state.status === 'loading' && (
            <div className="loading-links" role="status">
              <div className="sk-line" />
              <div className="sk-line" />
              <span className="sr-only">Recherche des meilleurs liens…</span>
            </div>
          )}
          {state.status === 'error' && <p className="notice bad">Impossible de récupérer les liens : {state.message}</p>}
          {data && direct.length === 0 && <p className="notice">Aucun lien direct trouvé pour cet élément. Utilisez la page de la source.</p>}

          {canPlay && !playing && (
            <button type="button" className="btn primary" onClick={() => setPlaying(true)}>
              ▶ Lire ici
            </button>
          )}

          {direct.length > 0 && (
            <ul className="links">
              {direct.map((l) => (
                <LinkRow key={l.url} link={l} best={l.url === best?.url} {...(l.url === best?.url && data?.check ? { check: data.check } : {})} />
              ))}
            </ul>
          )}

          {others.length > 0 && (
            <>
              <h3 className="section">Autres liens</h3>
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
