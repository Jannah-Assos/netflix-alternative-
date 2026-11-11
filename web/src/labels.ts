import type { SourceId } from '../../server/src/types';

/** Constantes d'affichage non traduisibles (noms propres, couleurs). Les textes sont dans messages.ts. */

/** Identifiants des filtres : ils doivent rester identiques à ceux du serveur (vérifié par un test). */
export const GENRES = ['film', 'animation', 'comedy', 'noir', 'scifi', 'silent', 'shorts', 'war', 'newsreels'] as const;
export const PERIODS = ['before1930', 'y1930', 'y1950', 'y1970', 'y2000'] as const;
export const SORTS = ['popular', 'recent', 'oldest', 'title'] as const;
export const CONTENT_LANGS = ['fr', 'en'] as const;

export type Genre = (typeof GENRES)[number];
export type Period = (typeof PERIODS)[number];
export type Sort = (typeof SORTS)[number];
export type ContentLang = (typeof CONTENT_LANGS)[number];

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
