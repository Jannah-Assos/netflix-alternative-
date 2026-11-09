import type { SourceStatus } from '../../../server/src/types';
import { useI18n } from '../i18n';
import { SOURCE_NAME } from '../labels';

export function StatusBar({ statuses }: { statuses: SourceStatus[] }) {
  const { t } = useI18n();
  const failed = statuses.filter((s) => !s.ok);
  if (failed.length === 0) return null;
  return (
    <div className="status-bar" role="status">
      <strong>{failed.length === statuses.length ? t('status.allFailed') : t('status.someFailed')}</strong>
      <ul>
        {failed.map((s) => (
          <li key={s.source} title={s.error}>
            <span>{SOURCE_NAME[s.source]}</span> — {t(`err.${s.errorCode ?? 'unknown'}`)}
            {s.errorCode === 'http' && s.error ? ` (${s.error})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
