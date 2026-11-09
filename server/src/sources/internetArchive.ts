import { classifyLicense } from '../licenses.js';
import { rankCandidates, type Candidate } from '../linkPicker.js';
import type { MediaItem, MediaKind, MediaLink, SearchParams, SourceResolve } from '../types.js';
import { num, parseDuration, str, stripHtml, truncate, yearOf } from '../util.js';
import type { MediaSource } from './types.js';

const BASE = 'https://archive.org';

const KIND_TO_MEDIATYPE: Record<MediaKind, string[]> = {
  video: ['movies'],
  audio: ['audio', 'etree'],
  software: ['software'],
  text: ['texts'],
};

const MEDIATYPE_TO_KIND: Record<string, MediaKind> = {
  movies: 'video',
  audio: 'audio',
  etree: 'audio',
  software: 'software',
  texts: 'text',
};

interface IaDoc {
  identifier?: string;
  title?: unknown;
  description?: unknown;
  mediatype?: unknown;
  year?: unknown;
  date?: unknown;
  downloads?: unknown;
  licenseurl?: unknown;
  creator?: unknown;
}

interface IaFile {
  name?: string;
  format?: string;
  size?: string | number;
  source?: string;
  length?: string | number;
  height?: string | number;
  private?: string | boolean;
}

interface IaMetadata {
  is_dark?: boolean;
  files?: IaFile[];
  metadata?: { mediatype?: unknown; licenseurl?: unknown; collection?: unknown };
}

function sanitizeQuery(q: string): string {
  return q
    .replace(/[\[\](){}:^~*?\\/!|&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Requête Lucene d'advancedsearch : mots-clés, types de média, hors prêt numérique restreint. */
export function buildQuery(q: string, kinds: MediaKind[]): string {
  const text = sanitizeQuery(q);
  const types = [...new Set(kinds.flatMap((k) => KIND_TO_MEDIATYPE[k]))];
  const clauses: string[] = [];
  if (text) clauses.push(`(${text})`);
  clauses.push(`mediatype:(${types.join(' OR ')})`);
  clauses.push('-access-restricted-item:true');
  return clauses.join(' AND ');
}

export function toItem(doc: IaDoc): MediaItem | null {
  const id = doc.identifier;
  const mediatype = str(doc.mediatype);
  const kind = mediatype ? MEDIATYPE_TO_KIND[mediatype] : undefined;
  if (!id || !kind) return null;
  const creator = str(doc.creator);
  const year = yearOf(doc.year ?? doc.date);
  const downloads = num(doc.downloads);
  const description = truncate(stripHtml(str(doc.description)), 400);
  return {
    uid: `internet-archive:${id}`,
    source: 'internet-archive',
    sourceId: id,
    title: str(doc.title) ?? id,
    ...(description ? { description } : {}),
    kind,
    ...(year ? { year } : {}),
    ...(creator ? { creator } : {}),
    thumbnail: `${BASE}/services/img/${encodeURIComponent(id)}`,
    pageUrl: `${BASE}/details/${encodeURIComponent(id)}`,
    license: classifyLicense(null, str(doc.licenseurl)),
    ...(downloads !== undefined ? { popularity: downloads } : {}),
  };
}

export function downloadUrl(id: string, name: string): string {
  return `${BASE}/download/${encodeURIComponent(id)}/${name.split('/').map(encodeURIComponent).join('/')}`;
}

export function filesToCandidates(id: string, files: IaFile[]): Candidate[] {
  return files
    .filter((f) => f.name && f.private !== true && f.private !== 'true')
    .map((f): Candidate => {
      const sizeBytes = num(f.size);
      const height = num(f.height);
      const durationSec = parseDuration(f.length);
      return {
        url: downloadUrl(id, f.name as string),
        name: f.name as string,
        ...(f.format ? { format: f.format } : {}),
        ...(sizeBytes !== undefined ? { sizeBytes } : {}),
        ...(height ? { height } : {}),
        ...(durationSec ? { durationSec } : {}),
        derivative: f.source === 'derivative',
      };
    });
}

export const internetArchive: MediaSource = {
  id: 'internet-archive',
  name: 'Internet Archive',
  homepage: 'https://archive.org',
  kinds: ['video', 'audio', 'software', 'text'],
  supportsBrowse: true,

  async search(params: SearchParams, http) {
    const url = new URL(`${BASE}/advancedsearch.php`);
    url.searchParams.set('q', buildQuery(params.q, params.kinds));
    for (const f of ['identifier', 'title', 'description', 'mediatype', 'year', 'date', 'downloads', 'licenseurl', 'creator']) {
      url.searchParams.append('fl[]', f);
    }
    url.searchParams.append('sort[]', 'downloads desc');
    url.searchParams.set('rows', String(params.limit));
    url.searchParams.set('page', String(params.page));
    url.searchParams.set('output', 'json');

    const data = await http.json<{ response?: { docs?: IaDoc[] } }>(url.href);
    return (data.response?.docs ?? []).map(toItem).filter((i): i is MediaItem => i !== null);
  },

  async resolve(id, kind, http): Promise<SourceResolve> {
    const meta = await http.json<IaMetadata>(`${BASE}/metadata/${encodeURIComponent(id)}`);
    if (meta.is_dark) return { links: [] };

    const metaKind = MEDIATYPE_TO_KIND[str(meta.metadata?.mediatype) ?? ''] ?? kind;
    const ranked = rankCandidates(filesToCandidates(id, meta.files ?? []), metaKind);
    const links: MediaLink[] = [...ranked];

    if (metaKind === 'video' || metaKind === 'audio' || metaKind === 'software') {
      links.push({
        url: `${BASE}/embed/${encodeURIComponent(id)}`,
        type: 'embed',
        label: 'Lecteur intégré archive.org',
        score: 10,
        playable: false,
      });
    }
    links.push({
      url: `${BASE}/details/${encodeURIComponent(id)}`,
      type: 'page',
      label: 'Page sur archive.org',
      score: 1,
      playable: false,
    });

    const licenseUrl = str(meta.metadata?.licenseurl);
    const duration = ranked.find((l) => l.durationSec)?.durationSec;
    return {
      links,
      ...(licenseUrl ? { license: classifyLicense(null, licenseUrl) } : {}),
      ...(duration ? { durationSec: duration } : {}),
    };
  },
};
