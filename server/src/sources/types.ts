import type { Http } from '../http.js';
import type { MediaItem, MediaKind, SearchParams, SourceInfo, SourceResolve } from '../types.js';

/** Filtres que la source applique elle-même ; une source qui ne les gère pas est ignorée quand ils sont actifs. */
export interface SourceSupport {
  genre?: boolean;
  lang?: boolean;
}

export interface MediaSource extends SourceInfo {
  supports?: SourceSupport;
  search(params: SearchParams, http: Http): Promise<MediaItem[]>;
  /** Trouve les meilleurs liens directs d'un item (appel réseau supplémentaire possible). */
  resolve(sourceId: string, kind: MediaKind, http: Http): Promise<SourceResolve>;
}
