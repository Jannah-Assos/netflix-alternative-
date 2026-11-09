import type { Http } from '../http.js';
import type { MediaItem, MediaKind, SearchParams, SourceInfo, SourceResolve } from '../types.js';

export interface MediaSource extends SourceInfo {
  search(params: SearchParams, http: Http): Promise<MediaItem[]>;
  /** Trouve les meilleurs liens directs d'un item (appel réseau supplémentaire possible). */
  resolve(sourceId: string, kind: MediaKind, http: Http): Promise<SourceResolve>;
}
