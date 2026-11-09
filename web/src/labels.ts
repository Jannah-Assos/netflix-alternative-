import type { LicenseCategory, MediaKind, SourceId } from '../../server/src/types';

export const KINDS: MediaKind[] = ['video', 'audio', 'software', 'text'];

export const KIND_LABEL: Record<MediaKind, string> = {
  video: 'Vidéos',
  audio: 'Audio',
  software: 'Logiciels & jeux',
  text: 'Livres & textes',
};

export const KIND_SINGULAR: Record<MediaKind, string> = {
  video: 'Vidéo',
  audio: 'Audio',
  software: 'Logiciel',
  text: 'Texte',
};

export const LICENSE_LABEL: Record<LicenseCategory, string> = {
  'public-domain': 'Domaine public',
  cc: 'Creative Commons',
  'cc-nc': 'CC non commercial',
  restricted: 'Droits réservés',
  unknown: 'Licence à vérifier',
};

export const SOURCE_NAME: Record<SourceId, string> = {
  'internet-archive': 'Internet Archive',
  'wikimedia-commons': 'Wikimedia Commons',
  nasa: 'NASA',
  peertube: 'PeerTube',
};

export const SOURCE_COLOR: Record<SourceId, string> = {
  'internet-archive': '#6ea8fe',
  'wikimedia-commons': '#75d6a0',
  nasa: '#ff8a7a',
  peertube: '#f4b860',
};

export const SUGGESTIONS = ['Nosferatu', 'Charlie Chaplin', 'Apollo 11', 'Big Buck Bunny', 'Jazz 1950', 'Doom shareware'];

export function formatDuration(sec?: number): string | undefined {
  if (!sec || sec <= 0) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : m ? `${m} min` : `${s} s`;
}

export function formatBytes(n?: number): string | undefined {
  if (!n || n <= 0) return undefined;
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
