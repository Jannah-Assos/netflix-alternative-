import type { LicenseInfo } from './types.js';

const PUBLIC_DOMAIN =
  /creativecommons\.org\/publicdomain|\bcc0\b|\bpdm\b|public[ -]?domain|domaine public|(^|[^a-z])pd([-_ ]|$)/i;
const CC_URL = /creativecommons\.org\/licenses\/([a-z-]+)\/?([0-9.]+)?/i;
const CC_LABEL = /\bcc[ -]by((?:[ -](?:nc|sa|nd))*)(?:[ -]([0-9]\.[0-9]))?/i;
const RESTRICTED = /all rights reserved|tous droits réservés|copyrighted|proprietary/i;

function ccLabel(parts: string, version?: string): { label: string; nc: boolean } {
  const flags = parts
    .toLowerCase()
    .split(/[-\s]+/)
    .filter((f) => f && f !== 'by')
    .map((f) => f.toUpperCase());
  const label = `CC BY${flags.map((f) => `-${f}`).join('')}`;
  return {
    label: version ? `${label} ${version}` : label,
    nc: flags.includes('NC'),
  };
}

/**
 * Classe une licence à partir d'un libellé et/ou d'une URL.
 * `verified` n'est vrai que si la source déclare explicitement une licence libre.
 */
export function classifyLicense(label?: string | null, url?: string | null): LicenseInfo {
  const l = (label ?? '').trim();
  const u = (url ?? '').trim();
  const text = `${u} ${l}`.trim();
  const out = (category: LicenseInfo['category'], displayLabel: string): LicenseInfo => ({
    category,
    label: displayLabel,
    ...(u ? { url: u } : {}),
    verified: category === 'public-domain' || category === 'cc' || category === 'cc-nc',
  });

  if (!text) return out('unknown', 'Unknown');

  if (PUBLIC_DOMAIN.test(text)) {
    return out('public-domain', /\bcc0\b/i.test(text) ? 'CC0' : 'Public domain');
  }

  const fromUrl = CC_URL.exec(u);
  if (fromUrl) {
    const { label: lab, nc } = ccLabel(fromUrl[1] ?? 'by', fromUrl[2]);
    return out(nc ? 'cc-nc' : 'cc', lab);
  }
  const fromLabel = CC_LABEL.exec(l);
  if (fromLabel) {
    const { label: lab, nc } = ccLabel(fromLabel[1] ?? '', fromLabel[2]);
    return out(nc ? 'cc-nc' : 'cc', lab);
  }

  if (RESTRICTED.test(text)) return out('restricted', 'All rights reserved');
  return out('unknown', l || 'Unknown');
}

/** Licence acceptée par le filtre « libres vérifiés seulement ». */
export function isFreeLicense(license: LicenseInfo): boolean {
  return license.verified;
}
