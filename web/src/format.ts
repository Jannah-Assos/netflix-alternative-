import type { LicenseInfo, MediaLink } from '../../server/src/types';
import type { Lang } from '../../server/src/types';
import { messages, type MessageKey } from './messages';

const UNITS: Record<Lang, string[]> = {
  fr: ['o', 'Ko', 'Mo', 'Go', 'To'],
  en: ['B', 'KB', 'MB', 'GB', 'TB'],
};

export function formatBytes(n: number | undefined, lang: Lang): string | undefined {
  if (!n || n <= 0) return undefined;
  const units = UNITS[lang];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  const num = v >= 100 || i === 0 ? String(Math.round(v)) : v.toFixed(1);
  return `${lang === 'fr' ? num.replace('.', ',') : num} ${units[i]}`;
}

/** « 1 h 34 » / « 1h 34m » · « 12 min » · « 45 s ». */
export function formatDuration(sec: number | undefined, lang: Lang): string | undefined {
  if (!sec || sec <= 0) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h) return lang === 'fr' ? `${h} h ${String(m).padStart(2, '0')}` : `${h}h ${String(m).padStart(2, '0')}m`;
  return m ? `${m} min` : `${s} s`;
}

/** Horodatage de lecture : 83 → « 1:23 », 3725 → « 1:02:05 ». */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Texte de licence affiché : libellé CC tel quel, le reste est traduit. */
export function licenseText(license: LicenseInfo, t: T): string {
  if (license.category === 'cc' || license.category === 'cc-nc') return license.label;
  if (license.category === 'public-domain') return license.label === 'CC0' ? 'CC0' : t('lic.public-domain');
  return t(license.category === 'restricted' ? 'lic.restricted' : 'lic.unknown');
}

/** « 1080p », ou la déclinaison nommée par la source (« petite », « originale »…) quand la hauteur est inconnue. */
export function qualityText(link: Pick<MediaLink, 'height' | 'variant'>, t: T): string | undefined {
  if (link.height) return `${link.height}p`;
  if (!link.variant) return undefined;
  const key = `variant.${link.variant}`;
  return key in messages.fr ? t(key as MessageKey) : link.variant;
}

/** Libellé d'un lien, construit côté interface pour être traduit : « Lecture directe · MP4 · 480p · 612 Mo ». */
export function linkText(link: MediaLink, t: T, lang: Lang): string {
  if (link.format === 'm3u8') return t('link.hls');
  if (link.type === 'embed') return t('link.embed');
  if (link.type === 'page') {
    let host = '';
    try {
      host = new URL(link.url).hostname.replace(/^www\./, '');
    } catch {
      /* URL invalide : on affiche sans hôte */
    }
    return t('link.page', { host });
  }
  const details = [link.format?.toUpperCase(), qualityText(link, t), formatBytes(link.sizeBytes, lang)].filter(Boolean);
  return [t(link.type === 'stream' ? 'link.stream' : 'link.download'), ...details].join(' · ');
}
