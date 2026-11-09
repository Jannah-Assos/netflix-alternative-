import type { CSSProperties } from 'react';
import type { LicenseInfo, SourceId } from '../../../server/src/types';
import { licenseText } from '../format';
import { useI18n } from '../i18n';
import { SOURCE_COLOR, SOURCE_NAME } from '../labels';

export function SourceBadge({ source }: { source: SourceId }) {
  return (
    <span className="badge source" style={{ '--c': SOURCE_COLOR[source] } as CSSProperties}>
      {SOURCE_NAME[source]}
    </span>
  );
}

export function LicenseBadge({ license }: { license: LicenseInfo }) {
  const { t } = useI18n();
  return (
    <span className={`badge lic lic-${license.category}`} title={license.label}>
      {licenseText(license, t)}
    </span>
  );
}
