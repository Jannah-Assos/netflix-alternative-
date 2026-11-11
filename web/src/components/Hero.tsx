import { useState } from 'react';
import type { MediaItem } from '../../../server/src/types';
import { formatDuration } from '../format';
import { useI18n } from '../i18n';
import { LicenseBadge, SourceBadge } from './Badges';
import { ListButton } from './ListButton';

/** Choisit un titre « à l'affiche » : de préférence avec image et description. */
export function pickHero(candidates: MediaItem[]): MediaItem | undefined {
  return (
    candidates.find((i) => i.thumbnail && (i.description?.length ?? 0) >= 60) ??
    candidates.find((i) => i.thumbnail) ??
    candidates[0]
  );
}

export function Hero({ item, onInfo, onPlay }: { item: MediaItem; onInfo: (i: MediaItem) => void; onPlay: (i: MediaItem) => void }) {
  const { t, lang } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  const meta = [item.year, item.creator, formatDuration(item.durationSec, lang)].filter(Boolean).join(' · ');

  return (
    <section className="hero" aria-label={t('hero.featured')}>
      {item.thumbnail && imgOk && (
        <>
          <img className="hero-bg" src={item.thumbnail} alt="" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
          <img className="hero-poster" src={item.thumbnail} alt="" referrerPolicy="no-referrer" />
        </>
      )}
      <div className="hero-shade" />
      <div className="hero-body">
        <p className="eyebrow">{t('hero.featured')}</p>
        <h1>{item.title}</h1>
        <div className="badges">
          <SourceBadge source={item.source} />
          <LicenseBadge license={item.license} />
          {meta && <span className="hero-meta">{meta}</span>}
        </div>
        {item.description && <p className="hero-desc">{item.description}</p>}
        <div className="hero-actions">
          <button type="button" className="btn light" onClick={() => onPlay(item)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('hero.watch')}
          </button>
          <button type="button" className="btn glass" onClick={() => onInfo(item)}>
            {t('hero.info')}
          </button>
          <ListButton item={item} label />
        </div>
      </div>
    </section>
  );
}
