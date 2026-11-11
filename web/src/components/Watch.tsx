import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem, MediaLink, SubtitleTrack } from '../../../server/src/types';
import { resolve, subtitleUrl } from '../api';
import { canFullscreen, toggleFullscreen as toggleFs } from '../fullscreen';
import { formatClock, qualityText } from '../format';
import { useI18n } from '../i18n';
import type { MessageKey } from '../messages';
import { clearProgress, getProgress, getSubsPref, isResumable, saveProgress, setSubsPref } from '../storage';
import { useDialog } from '../useDialog';

type State =
  | { s: 'loading' }
  | { s: 'error'; msg: string }
  | { s: 'ready'; playable: MediaLink[]; subtitles: SubtitleTrack[]; embed?: MediaLink; download?: MediaLink };

const SAVE_EVERY_MS = 5000;
const IDLE_MS = 3000;

const isHttps = (u: string): boolean => {
  try {
    return new URL(u).protocol === 'https:';
  } catch {
    return false;
  }
};

/** « Anglais (auto) », « Français », « Sous-titres (auto) » quand la langue n'est pas précisée. */
function subtitleLabel(tr: SubtitleTrack, uiLang: string, t: (k: MessageKey) => string): string {
  let name = '';
  try {
    name = tr.lang ? (new Intl.DisplayNames([uiLang], { type: 'language' }).of(tr.lang) ?? '') : '';
  } catch {
    name = tr.lang ?? '';
  }
  const base = name ? name.charAt(0).toUpperCase() + name.slice(1) : t('watch.subtitles');
  return tr.auto ? `${base} (${t('watch.subsAuto')})` : base;
}

export function Watch({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>({ s: 'loading' });
  // Piste de sous-titres choisie (null : aucune). Mémorisée d'un film à l'autre.
  const [subIdx, setSubIdx] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLMediaElement>(null);
  useDialog(rootRef, onClose, backRef);

  // Barre du haut : se masque pendant la lecture, revient au moindre geste.
  const [idle, setIdle] = useState(false);
  const playing = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    if (playing.current) idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

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
        const subtitles = item.kind === 'video' ? (data.subtitles ?? []) : [];
        setState({ s: 'ready', playable, subtitles, ...(embed ? { embed } : {}), ...(download ? { download } : {}) });
        // Si le visiteur avait activé les sous-titres, on reprend : sa langue d'abord, sinon la première piste.
        if (subtitles.length > 0 && getSubsPref()) {
          const mine = subtitles.findIndex((x) => x.lang === lang);
          setSubIdx(mine >= 0 ? mine : 0);
        } else {
          setSubIdx(null);
        }
        if (playable.length > 0) {
          // Rappel des gestes de sortie : on ne doit jamais être bloqué dans le lecteur.
          const resume = startRef.current > 0 ? `${t('watch.resume', { time: formatClock(startRef.current) })} · ` : '';
          setToast(resume + t('watch.hint'));
          setTimeout(() => setToast(null), 5000);
        }
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setState({ s: 'error', msg: err instanceof Error ? err.message : String(err) });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` ne change que si la langue change : on ne relance pas la résolution pour ça
  }, [item.uid, item.kind]);

  // Dernière position à la fermeture, au cas où elle tombe entre deux sauvegardes.
  useEffect(
    () => () => {
      const { pos, dur, ended } = posRef.current;
      if (!ended && pos > 0) saveProgress(item, pos, dur);
    },
    [item],
  );

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

  // Le focus passe à la vidéo dès qu'elle est là : Espace fait pause, au lieu d'activer « Retour ».
  useEffect(() => {
    mediaRef.current?.focus({ preventScroll: true });
  }, [current?.url, failed]);

  const toggleFullscreen = () => {
    toggleFs(document, rootRef.current, mediaRef.current);
  };

  // Le bouton « plein écran » doit exister aussi sur iPhone (voir fullscreen.ts). On le réévalue quand la vidéo apparaît.
  const subtitles = state.s === 'ready' ? state.subtitles : [];
  const showFullscreen =
    typeof document !== 'undefined' &&
    item.kind === 'video' &&
    canFullscreen(document, typeof HTMLVideoElement !== 'undefined' ? HTMLVideoElement.prototype : undefined);

  // Affiche la piste choisie, masque les autres (un seul changement de mode pour tout le monde).
  const applySubtitles = useCallback(() => {
    const tracks = mediaRef.current?.textTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      if (tr) tr.mode = i === subIdx ? 'showing' : 'disabled';
    }
  }, [subIdx]);
  useEffect(applySubtitles, [applySubtitles, current?.url, subtitles.length]);
  const changeSubtitles = (value: string) => {
    const next = value === '' ? null : Number(value);
    setSubIdx(next);
    setSubsPref(next !== null);
  };

  const onKeys = (e: React.KeyboardEvent) => {
    wake();
    const el = mediaRef.current;
    const target = e.target as HTMLElement;
    if (!el || e.ctrlKey || e.metaKey || e.altKey || target.tagName === 'SELECT') return;
    const onVideo = target === el; // la vidéo gère elle-même Espace et les flèches (±5 s)
    const onControl = target.tagName === 'BUTTON' || target.tagName === 'A';
    switch (e.key.toLowerCase()) {
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        el.muted = !el.muted;
        break;
      case ' ':
      case 'k':
        if (!onVideo && !onControl) {
          e.preventDefault();
          if (el.paused) void el.play();
          else el.pause();
        }
        break;
      case 'arrowleft':
      case 'j':
        if (!onVideo) {
          e.preventDefault();
          el.currentTime = Math.max(0, el.currentTime - 10);
        }
        break;
      case 'arrowright':
      case 'l':
        if (!onVideo) {
          e.preventDefault();
          el.currentTime += 10;
        }
        break;
    }
  };

  const mediaProps = {
    ref: mediaRef as React.RefObject<never>,
    onPlay: () => {
      playing.current = true;
      wake();
    },
    src: current?.url,
    controls: true,
    autoPlay: true,
    playsInline: true,
    preload: 'metadata' as const,
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) => {
      onMeta(e);
      applySubtitles();
    },
    onTimeUpdate: onTime,
    onPause: (e: React.SyntheticEvent<HTMLMediaElement>) => {
      playing.current = false;
      wake();
      saveProgress(item, e.currentTarget.currentTime, e.currentTarget.duration);
    },
    onEnded,
    onError,
  };

  return (
    <div
      ref={rootRef}
      className={`watch ${idle ? 'idle' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onMouseMove={wake}
      onTouchStart={wake}
      onKeyDown={onKeys}
    >
      <div className="watch-bar">
        <button ref={backRef} type="button" className="back" onClick={onClose}>
          <span aria-hidden="true">‹</span> {t('watch.back')}
        </button>
        <span className="watch-title">{item.title}</span>
        {showFullscreen && (
          <button type="button" className="back" onClick={toggleFullscreen} aria-label={t('watch.fullscreen')} title={`${t('watch.fullscreen')} (F)`}>
            ⛶
          </button>
        )}
        {subtitles.length > 0 && (
          <label className="quality subs">
            <span className="sr-only">{t('watch.subtitles')}</span>
            <select value={subIdx ?? ''} onChange={(e) => changeSubtitles(e.target.value)}>
              <option value="">{t('watch.subsOff')}</option>
              {subtitles.map((tr, i) => (
                <option key={tr.url} value={i}>
                  {subtitleLabel(tr, lang, t)}
                </option>
              ))}
            </select>
          </label>
        )}
        {playable.length > 1 && (
          <label className="quality">
            <span className="sr-only">{t('watch.quality')}</span>
            <select value={idx} onChange={(e) => changeQuality(Number(e.target.value))}>
              {playable.map((l, i) => (
                <option key={l.url} value={i}>
                  {[qualityText(l, t), l.format?.toUpperCase()].filter(Boolean).join(' · ') || `#${i + 1}`}
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

        {state.s === 'ready' && current && !failed && item.kind === 'video' && (
          <video key={current.url} {...mediaProps}>
            {subtitles.map((tr, i) => (
              <track key={tr.url} kind="subtitles" src={subtitleUrl(tr.url)} srcLang={tr.lang ?? lang} label={subtitleLabel(tr, lang, t)} default={i === subIdx} />
            ))}
          </video>
        )}

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
