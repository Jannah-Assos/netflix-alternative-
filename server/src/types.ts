/** Types partagés entre le serveur et l'interface web (import type uniquement). */

export type MediaKind = 'video' | 'audio' | 'software' | 'text';
export const MEDIA_KINDS: readonly MediaKind[] = ['video', 'audio', 'software', 'text'];

export type SourceId = 'internet-archive' | 'wikimedia-commons' | 'nasa' | 'peertube';

export type LicenseCategory = 'public-domain' | 'cc' | 'cc-nc' | 'restricted' | 'unknown';

export interface LicenseInfo {
  category: LicenseCategory;
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
  label: string;
  format?: string;
  sizeBytes?: number;
  height?: number;
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

export interface SearchParams {
  q: string;
  kinds: MediaKind[];
  page: number;
  limit: number;
}

export interface SourceInfo {
  id: SourceId;
  name: string;
  homepage: string;
  kinds: MediaKind[];
  /** La source sait lister du contenu sans mot-clé. */
  supportsBrowse: boolean;
}

export interface SourceStatus {
  source: SourceId;
  ok: boolean;
  count: number;
  tookMs: number;
  error?: string;
  skipped?: string;
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
