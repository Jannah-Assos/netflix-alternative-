/** Types partagés entre le serveur et l'interface web (import type uniquement). */

export type MediaKind = 'video' | 'audio' | 'software' | 'text';
export const MEDIA_KINDS: readonly MediaKind[] = ['video', 'audio', 'software', 'text'];

export type SourceId = 'internet-archive' | 'wikimedia-commons' | 'nasa' | 'peertube';

export type LicenseCategory = 'public-domain' | 'cc' | 'cc-nc' | 'restricted' | 'unknown';

export type Lang = 'fr' | 'en';
export const LANGS: readonly Lang[] = ['fr', 'en'];

export interface LicenseInfo {
  category: LicenseCategory;
  /** Libellé technique : « CC BY-SA 4.0 » pour les CC, sinon en anglais. L'interface le traduit. */
  label: string;
  url?: string;
  /** true si la licence est explicitement déclarée libre par la source. */
  verified: boolean;
}

/**
 * stream   : fichier lisible directement par un navigateur (mp4, webm, mp3…)
 * download : fichier à télécharger (mkv, zip, pdf…)
 * embed    : lecteur intégrable de la source
 * page     : page de la source
 */
export type LinkType = 'stream' | 'download' | 'embed' | 'page';

export interface MediaLink {
  url: string;
  type: LinkType;
  format?: string;
  sizeBytes?: number;
  height?: number;
  /** Déclinaison nommée par la source quand la hauteur est inconnue (NASA : large, small, mobile…). */
  variant?: string;
  durationSec?: number;
  /** Plus haut = meilleur. */
  score: number;
  /** Lisible telle quelle dans un <video>/<audio> de navigateur. */
  playable: boolean;
}

export interface MediaItem {
  /** `${source}:${sourceId}` */
  uid: string;
  source: SourceId;
  sourceId: string;
  title: string;
  description?: string;
  kind: MediaKind;
  year?: number;
  creator?: string;
  thumbnail?: string;
  pageUrl: string;
  license: LicenseInfo;
  popularity?: number;
  durationSec?: number;
}

/** Filtres de catalogue utilisés par les rangées de l'accueil (jamais exposés par l'API publique). */
export interface SearchFilters {
  collections?: string[];
  languages?: string[];
  subjects?: string[];
  yearFrom?: number;
  yearTo?: number;
  /** Ne garder que les items dont la source déclare une licence (Internet Archive : `licenseurl`). */
  licensed?: boolean;
  /** Langue du contenu en code ISO (PeerTube) ; `languages` porte les libellés équivalents d'Internet Archive. */
  langCode?: Lang;
}

export type SortKey = 'popular' | 'recent' | 'oldest' | 'title';
export const SORT_KEYS: readonly SortKey[] = ['popular', 'recent', 'oldest', 'title'];

/** Genres proposés dans Explorer (liste blanche : jamais de valeur libre dans les requêtes vers les sources). */
export const GENRE_IDS = ['film', 'tv', 'animation', 'docs', 'scifi', 'comedy', 'noir', 'silent', 'shorts'] as const;
export type GenreId = (typeof GENRE_IDS)[number];

export const PERIOD_IDS = ['before1930', 'y1930', 'y1950', 'y1970', 'y2000'] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

export interface SearchParams {
  q: string;
  kinds: MediaKind[];
  page: number;
  limit: number;
  filters?: SearchFilters;
  sort?: SortKey;
}

export interface SourceInfo {
  id: SourceId;
  name: string;
  homepage: string;
  kinds: MediaKind[];
  /** La source sait lister du contenu sans mot-clé. */
  supportsBrowse: boolean;
}

export type ErrorCode = 'network' | 'timeout' | 'http' | 'blocked' | 'unknown';
export type SkipReason = 'unsupported-kind' | 'query-required' | 'filter-unsupported';

export interface SourceStatus {
  source: SourceId;
  ok: boolean;
  count: number;
  tookMs: number;
  /** Détail technique (en anglais). L'interface affiche un message traduit d'après `errorCode`. */
  error?: string;
  errorCode?: ErrorCode;
  skipped?: SkipReason;
}

export interface ScanResult {
  items: MediaItem[];
  sources: SourceStatus[];
  page: number;
  hasMore: boolean;
}

export interface LinkCheck {
  /** true : répond; false : erreur HTTP; null : indéterminé (réseau). */
  alive: boolean | null;
  status?: number;
  contentType?: string;
  sizeBytes?: number;
}

export interface SourceResolve {
  links: MediaLink[];
  license?: LicenseInfo;
  durationSec?: number;
}

export interface ResolveResult extends SourceResolve {
  best?: MediaLink;
  check?: LinkCheck;
}

export interface HomeRow {
  /** Identifiant de rangée ; le titre est traduit par l'interface (`row.<id>`). */
  id: string;
  items: MediaItem[];
}

export interface HomeResult {
  lang: Lang;
  rows: HomeRow[];
  /** Au moins une rangée n'a pas pu être chargée. */
  partial: boolean;
}
