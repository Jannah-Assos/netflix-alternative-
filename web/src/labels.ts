import type { MediaKind, SourceId } from '../../server/src/types';

/** Constantes d'affichage non traduisibles (noms propres, couleurs). Les textes sont dans messages.ts. */

export const KINDS: MediaKind[] = ['video', 'audio', 'software', 'text'];

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
