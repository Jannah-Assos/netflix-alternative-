import type { SourceStatus } from '../../../server/src/types';
import { SOURCE_NAME } from '../labels';

export function StatusBar({ statuses }: { statuses: SourceStatus[] }) {
  const failed = statuses.filter((s) => !s.ok);
  if (failed.length === 0) return null;
  return (
    <div className="status-bar" role="status">
      <strong>{failed.length === statuses.length ? 'Aucune source n’a répondu.' : 'Certaines sources n’ont pas répondu.'}</strong>
      <ul>
        {failed.map((s) => (
          <li key={s.source}>
            <span>{SOURCE_NAME[s.source]}</span> — {s.error}
          </li>
        ))}
      </ul>
    </div>
  );
}
