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

/**
 * Statut ESTIMÉ d'une œuvre en France (règles dans rights.ts et docs/DROITS-CATALOGUE.md ; pas un avis juridique).
 * free      : licence Creative Commons de l'ayant droit, ou tous les auteurs morts depuis plus de 80 ans.
 * likely    : probablement libre. Soit tous les auteurs sont morts depuis plus de 70 ans, soit c'est une œuvre
 *             américaine tombée dans le domaine public aux États-Unis dont les auteurs ne sont pas européens.
 * unclear   : données manquantes ou cas non tranché (œuvres du gouvernement américain).
 * protected : encore protégée en France.
 */
export type RightsStatus = 'free' | 'likely' | 'unclear' | 'protected';

export interface RightsInfo {
  fr: RightsStatus;
  basis: 'cc' | 'authors' | 'us-term' | 'government';
  /** Année de décès du dernier auteur principal (pour l'explication affichée). */
  lastDeath?: number;
  /** Une donnée n'est pas vérifiée : le statut n'est qu'une première estimation. */
  uncertain?: boolean;
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
  /** Présent seulement si l'œuvre figure dans notre table de droits (server/src/rights.ts). */
  rights?: RightsInfo;
  /** Œuvre du catalogue : identifiant de sa page (/film/<slug>) et phrase « pourquoi le voir ». */
  slug?: string;
  why?: string;
  /** Série : nombre d'épisodes. */
  episodes?: number;
  /** Langue parlée (code ISO 639-1) quand la source la renseigne. */
  language?: string;
  /** Documentaire d'époque pouvant contenir des images de guerre difficiles. */
  sensitive?: boolean;
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
  /** Identifiants précis (sélection éditoriale) : contourne la liste blanche de collections. */
  identifiers?: string[];
}

export type SortKey = 'popular' | 'recent' | 'oldest' | 'title';
export const SORT_KEYS: readonly SortKey[] = ['popular', 'recent', 'oldest', 'title'];

/** Genres proposés dans Explorer (liste blanche : jamais de valeur libre dans les requêtes vers les sources). */
export const GENRE_IDS = ['film', 'animation', 'comedy', 'noir', 'scifi', 'silent', 'shorts', 'war', 'newsreels'] as const;
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

/** Piste de sous-titres trouvée chez la source (fichier .vtt ou .srt). */
export interface SubtitleTrack {
  url: string;
  /** Code ISO 639-1 quand on le connaît (sinon : la langue parlée, non précisée). */
  lang?: string;
  /** true : sous-titres générés par reconnaissance vocale, donc imparfaits. */
  auto: boolean;
}

export interface SourceResolve {
  links: MediaLink[];
  subtitles?: SubtitleTrack[];
  license?: LicenseInfo;
  durationSec?: number;
}

export interface ResolveResult extends SourceResolve {
  best?: MediaLink;
  check?: LinkCheck;
}

export interface HomeRow {
  id: string;
  title: string;
  intro: string;
  items: MediaItem[];
}

export interface HomeResult {
  lang: Lang;
  /** La « séance du jour » : change chaque jour, la même pour tout le monde. */
  featured: MediaItem;
  rows: HomeRow[];
  /** Nombre d'œuvres du catalogue. */
  total: number;
}

export interface WorkAuthor {
  name: string;
  died: number | null;
}

export interface WorkEpisode {
  n: number;
  item: MediaItem;
}

/** Page d'une œuvre du catalogue. */
export interface WorkDetail {
  item: MediaItem;
  directors: string[];
  country: string;
  tags: string[];
  authors: WorkAuthor[];
  /** Licence Creative Commons accordée par l'ayant droit. */
  cc?: { holder: string; license: string; nc?: boolean };
  episodes: WorkEpisode[];
  shelf?: { id: string; title: string };
  related: MediaItem[];
}

export interface CatalogueResult {
  items: MediaItem[];
  total: number;
}

export interface AppConfig {
  /** L'archive élargie (non vérifiée) est-elle ouverte ? */
  archive: boolean;
  /** Adresse de contact pour les signalements, si elle est configurée. */
  contact?: string;
}
