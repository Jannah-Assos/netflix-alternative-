import { useState } from 'react';
import type { MediaItem } from '../../../server/src/types';
import { formatDuration } from '../format';
import { useI18n } from '../i18n';
import { LicenseBadge, RightsBadge, SourceBadge } from './Badges';
import { KindIcon } from './icons';

export function ResultCard({ item, onOpen }: { item: MediaItem; onOpen: (item: MediaItem) => void }) {
  const { t, lang } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  const meta = [item.year, item.creator, formatDuration(item.durationSec, lang)].filter(Boolean).join(' · ');

  return (
    <button type="button" className="card" onClick={() => onOpen(item)}>
      <div className="thumb">
        {item.thumbnail && imgOk ? (
          <img src={item.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
        ) : (
          <div className="thumb-fallback">
            <KindIcon kind={item.kind} />
          </div>
        )}
      </div>
      <div className="card-body">
        <h3 title={item.title}>{item.title}</h3>
        {meta && <p className="meta">{meta}</p>}
        <div className="badges">
          <SourceBadge source={item.source} />
          <LicenseBadge license={item.license} />
          {item.rights && <RightsBadge rights={item.rights} />}
        </div>
      </div>
    </button>
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="thumb" />
      <div className="card-body">
        <div className="sk-line" />
        <div className="sk-line short" />
      </div>
    </div>
  );
}
