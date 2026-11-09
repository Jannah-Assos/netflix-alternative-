import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem, MediaLink } from '../../../server/src/types';
import { resolve } from '../api';
import { formatClock } from '../format';
import { useI18n } from '../i18n';
import { clearProgress, getProgress, isResumable, saveProgress } from '../storage';

type State =
  | { s: 'loading' }
  | { s: 'error'; msg: string }
  | { s: 'ready'; playable: MediaLink[]; embed?: MediaLink; download?: MediaLink };

const SAVE_EVERY_MS = 5000;

const isHttps = (u: string): boolean => {
  try {
    return new URL(u).protocol === 'https:';
  } catch {
    return false;
  }
};

export function Watch({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ s: 'loading' });
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  // Position de départ (reprise) puis position courante, conservées hors rendu.
  const startRef = useRef(0);
  const posRef = useRef({ pos: 0, dur: 0, ended: false });
  const lastSave = useRef(0);

  useMemo(() => {
    const p = getProgress(item.uid);
    startRef.current = p && isResumable(p) ? p.position : 0;
  }, [item.uid]);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ s: 'loading' });
    setIdx(0);
    setFailed(false);
    resolve(item.uid, item.kind, ctrl.signal, false)
      .then((data) => {
        const playable = data.links.filter((l) => l.type === 'stream' && l.playable);
        const embed = data.links.find((l) => l.type === 'embed' && isHttps(l.url));
        const download = data.links.find((l) => l.type === 'download');
        setState({ s: 'ready', playable, ...(embed ? { embed } : {}), ...(download ? { download } : {}) });
        if (startRef.current > 0 && playable.length > 0) {
          setToast(t('watch.resume', { time: formatClock(startRef.current) }));
          setTimeout(() => setToast(null), 4000);
        }
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setState({ s: 'error', msg: err instanceof Error ? err.message : String(err) });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` ne change que si la langue change : on ne relance pas la résolution pour ça
  }, [item.uid, item.kind]);

  useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      // Dernière position, au cas où la fermeture tombe entre deux sauvegardes.
      const { pos, dur, ended } = posRef.current;
      if (!ended && pos > 0) saveProgress(item, pos, dur);
    };
  }, [onClose, item]);

  const playable = state.s === 'ready' ? state.playable : [];
  const current = playable[idx];
  const useEmbed = state.s === 'ready' && (failed || !current) && !!state.embed;

  const onMeta = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    if (startRef.current > 0 && startRef.current < (el.duration || Infinity)) el.currentTime = startRef.current;
    startRef.current = 0;
  };
  const onTime = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    posRef.current = { pos: el.currentTime, dur: el.duration, ended: false };
    const now = Date.now();
    if (now - lastSave.current >= SAVE_EVERY_MS) {
      lastSave.current = now;
      saveProgress(item, el.currentTime, el.duration);
    }
  };
  const onEnded = () => {
    posRef.current.ended = true;
    clearProgress(item.uid);
  };
  const onError = () => {
    startRef.current = posRef.current.pos;
    if (idx + 1 < playable.length) setIdx(idx + 1);
    else setFailed(true);
  };
  const changeQuality = (next: number) => {
    startRef.current = posRef.current.pos;
    setFailed(false);
    setIdx(next);
  };

  const mediaProps = {
    src: current?.url,
    controls: true,
    autoPlay: true,
    playsInline: true,
    preload: 'metadata' as const,
    onLoadedMetadata: onMeta,
    onTimeUpdate: onTime,
    onPause: (e: React.SyntheticEvent<HTMLMediaElement>) => saveProgress(item, e.currentTarget.currentTime, e.currentTarget.duration),
    onEnded,
    onError,
  };

  return (
    <div className="watch" role="dialog" aria-modal="true" aria-label={item.title}>
      <div className="watch-bar">
        <button ref={backRef} type="button" className="back" onClick={onClose}>
          <span aria-hidden="true">‹</span> {t('watch.back')}
        </button>
        <span className="watch-title">{item.title}</span>
        {playable.length > 1 && (
          <label className="quality">
            <span className="sr-only">{t('watch.quality')}</span>
            <select value={idx} onChange={(e) => changeQuality(Number(e.target.value))}>
              {playable.map((l, i) => (
                <option key={l.url} value={i}>
                  {[l.height ? `${l.height}p` : undefined, l.format?.toUpperCase()].filter(Boolean).join(' · ') || `#${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="watch-stage">
        {state.s === 'loading' && (
          <div className="spinner" role="status">
            <span className="sr-only">{t('watch.loading')}</span>
          </div>
        )}

        {state.s === 'error' && (
          <div className="watch-msg">
            <p>{t('watch.error', { error: state.msg })}</p>
          </div>
        )}

        {state.s === 'ready' && current && !failed && item.kind === 'video' && <video key={current.url} {...mediaProps} />}

        {state.s === 'ready' && current && !failed && item.kind === 'audio' && (
          <div className="audio-stage">
            {item.thumbnail && <img src={item.thumbnail} alt="" referrerPolicy="no-referrer" />}
            <audio key={current.url} {...mediaProps} />
          </div>
        )}

        {useEmbed && state.s === 'ready' && state.embed && (
          <>
            <iframe
              key={state.embed.url}
              className="embed"
              src={state.embed.url}
              title={item.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
            <p className="watch-note">{t('watch.embedFallback')}</p>
          </>
        )}

        {state.s === 'ready' && (failed || !current) && !state.embed && (
          <div className="watch-msg">
            <p>{t(failed ? 'watch.playError' : 'watch.noPlayable')}</p>
            <div className="watch-actions">
              {state.download && (
                <a className="btn light" href={state.download.url} target="_blank" rel="noopener noreferrer">
                  {t('detail.open')}
                </a>
              )}
              <a className="btn glass" href={item.pageUrl} target="_blank" rel="noopener noreferrer">
                {t('watch.openSource')}
              </a>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
