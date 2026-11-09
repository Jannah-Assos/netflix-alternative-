import type { CSSProperties } from 'react';
import type { MediaKind, SourceId, SourceInfo, SourceStatus } from '../../../server/src/types';
import { KINDS, KIND_LABEL, SOURCE_COLOR, SOURCE_NAME } from '../labels';

interface Props {
  kinds: MediaKind[];
  onKinds: (k: MediaKind[]) => void;
  sources: SourceInfo[];
  /** null = toutes les sources. */
  enabled: SourceId[] | null;
  onEnabled: (s: SourceId[] | null) => void;
  statuses: SourceStatus[];
  freeOnly: boolean;
  onFreeOnly: (v: boolean) => void;
}

export function Filters({ kinds, onKinds, sources, enabled, onEnabled, statuses, freeOnly, onFreeOnly }: Props) {
  const toggleKind = (k: MediaKind) => {
    const next = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k];
    if (next.length > 0) onKinds(KINDS.filter((x) => next.includes(x)));
  };

  const active = (id: SourceId) => enabled === null || enabled.includes(id);
  const toggleSource = (id: SourceId) => {
    const all = sources.map((s) => s.id);
    const current = enabled ?? all;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    if (next.length === 0) return;
    onEnabled(next.length === all.length ? null : next);
  };

  return (
    <div className="filters">
      <div className="chip-row" role="group" aria-label="Types de contenu">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip ${kinds.includes(k) ? 'on' : ''}`}
            aria-pressed={kinds.includes(k)}
            onClick={() => toggleKind(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="chip-row" role="group" aria-label="Sources">
        {sources.map((s) => {
          const st = statuses.find((x) => x.source === s.id);
          const state = !active(s.id) ? 'off' : st && !st.ok ? 'error' : st?.skipped ? 'idle' : st ? 'ok' : 'idle';
          return (
            <button
              key={s.id}
              type="button"
              className={`chip source-chip ${active(s.id) ? 'on' : ''}`}
              style={{ '--c': SOURCE_COLOR[s.id] } as CSSProperties}
              aria-pressed={active(s.id)}
              title={st?.error ?? (st?.skipped ? `Ignorée : ${st.skipped}` : s.name)}
              onClick={() => toggleSource(s.id)}
            >
              <span className={`dot ${state}`} />
              {SOURCE_NAME[s.id]}
              {st && active(s.id) && st.ok && !st.skipped && <span className="count">{st.count}</span>}
            </button>
          );
        })}
      </div>

      <label className="switch">
        <input type="checkbox" checked={freeOnly} onChange={(e) => onFreeOnly(e.target.checked)} />
        <span className="track" aria-hidden="true" />
        <span>Licences libres vérifiées seulement</span>
      </label>
    </div>
  );
}
