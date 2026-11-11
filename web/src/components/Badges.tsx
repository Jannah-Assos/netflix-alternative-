import type { CSSProperties } from 'react';
import type { LicenseInfo, RightsInfo, SourceId } from '../../../server/src/types';
import { licenseText } from '../format';
import { useI18n } from '../i18n';
import { SOURCE_COLOR, SOURCE_NAME } from '../labels';
import type { MessageKey } from '../messages';

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

/** Phrase d'explication du statut des droits en France (infobulle et fiche détaillée). */
export function useRightsNote(rights: RightsInfo): string {
  const { t } = useI18n();
  if (rights.basis === 'cc') return t('rights.note.cc');
  if (rights.uncertain) return t('rights.note.unsure');
  return t(`rights.note.${rights.fr}` as MessageKey, { year: rights.lastDeath ?? '' });
}

export function RightsBadge({ rights }: { rights: RightsInfo }) {
  const { t } = useI18n();
  const note = useRightsNote(rights);
  return (
    <span className={`badge rights rights-${rights.fr}`} title={note}>
      {t(`rights.${rights.fr}` as MessageKey)}
    </span>
  );
}

export function RightsNote({ rights }: { rights: RightsInfo }) {
  const note = useRightsNote(rights);
  return <p className={`notice rights-note rights-${rights.fr}`}>{note}</p>;
}
