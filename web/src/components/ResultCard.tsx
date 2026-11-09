import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { MediaItem } from '../../../server/src/types';
import { KIND_SINGULAR, LICENSE_LABEL, SOURCE_COLOR, SOURCE_NAME, formatDuration } from '../labels';
import { KindIcon } from './icons';

export function ResultCard({ item, onOpen }: { item: MediaItem; onOpen: (item: MediaItem) => void }) {
  const [imgOk, setImgOk] = useState(true);
  const meta = [item.year, item.creator, formatDuration(item.durationSec)].filter(Boolean).join(' · ');

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
        <span className="kind-chip">{KIND_SINGULAR[item.kind]}</span>
      </div>
      <div className="card-body">
        <h3 title={item.title}>{item.title}</h3>
        {meta && <p className="meta">{meta}</p>}
        <div className="badges">
          <span className="badge source" style={{ '--c': SOURCE_COLOR[item.source] } as CSSProperties}>
            {SOURCE_NAME[item.source]}
          </span>
          <span className={`badge lic lic-${item.license.category}`} title={item.license.label}>
            {item.license.verified ? item.license.label : LICENSE_LABEL[item.license.category]}
          </span>
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
