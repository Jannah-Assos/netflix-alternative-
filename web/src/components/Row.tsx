import { useRef, useState } from 'react';
import type { MediaItem } from '../../../server/src/types';
import { formatDuration, languageName } from '../format';
import { useI18n } from '../i18n';
import type { Progress } from '../storage';
import { LicenseBadge, RightsBadge } from './Badges';
import { KindIcon } from './icons';
import { ListButton } from './ListButton';

interface Actions {
  onInfo: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

const PLAYABLE = new Set(['video', 'audio']);

export function PosterCard({ item, progress, onInfo, onPlay }: Actions & { item: MediaItem; progress?: Progress }) {
  const { t, lang } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  const pct = progress && progress.duration > 0 ? Math.min(100, (progress.position / progress.duration) * 100) : 0;
  const meta = [item.year, formatDuration(item.durationSec, lang), item.language ? languageName(item.language, lang) : undefined].filter(Boolean).join(' · ');

  return (
    <div className="poster">
      <div className="poster-art">
      <button type="button" className="poster-thumb" onClick={() => onInfo(item)} aria-label={`${t('hero.info')} : ${item.title}`}>
        {item.thumbnail && imgOk ? (
          <img src={item.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
        ) : (
          <span className="thumb-fallback">
            <KindIcon kind={item.kind} />
          </span>
        )}
        {pct > 0 && (
          <span className="poster-progress" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
        )}
      </button>
      {PLAYABLE.has(item.kind) && (
        <button type="button" className="poster-play" onClick={() => onPlay(item)} aria-label={`${t('hero.watch')} : ${item.title}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
      </div>
      <div className="poster-meta">
        <div className="poster-title" title={item.title}>
          {item.title}
        </div>
        <div className="poster-sub">
          {meta && <span>{meta}</span>}
          <LicenseBadge license={item.license} />
          {item.rights && <RightsBadge rights={item.rights} />}
          <span className="poster-list">
            <ListButton item={item} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function Row({
  id,
  title,
  items,
  progress,
  onInfo,
  onPlay,
}: Actions & { id: string; title: string; items: MediaItem[]; progress?: Map<string, Progress> }) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const slide = (dir: -1 | 1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="row" aria-labelledby={`row-${id}`}>
      <h2 id={`row-${id}`}>{title}</h2>
      <div className="row-wrap">
        <button type="button" className="row-arrow left" onClick={() => slide(-1)} aria-label={t('row.prev')}>
          ‹
        </button>
        <div className="row-scroller" ref={scroller}>
          {items.map((item) => (
            <PosterCard key={item.uid} item={item} {...(progress?.get(item.uid) ? { progress: progress.get(item.uid) as Progress } : {})} onInfo={onInfo} onPlay={onPlay} />
          ))}
        </div>
        <button type="button" className="row-arrow right" onClick={() => slide(1)} aria-label={t('row.next')}>
          ›
        </button>
      </div>
    </section>
  );
}

export function SkeletonRow() {
  return (
    <div className="row" aria-hidden="true">
      <div className="sk-line title" />
      <div className="row-scroller">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="poster skeleton">
            <div className="poster-thumb" />
            <div className="sk-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
