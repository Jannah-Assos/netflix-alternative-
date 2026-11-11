import { classifyLicense } from '../licenses.js';
import { rankCandidates, type Candidate } from '../linkPicker.js';
import type { MediaItem, MediaKind, MediaLink, SearchFilters, SearchParams, SortKey, SourceResolve } from '../types.js';
import { BLOCKED_COLLECTIONS, isFamilySafe, safeSearchEnabled } from '../safety.js';
import { EXCLUDED_COLLECTIONS, SCOPE_COLLECTIONS } from '../scope.js';
import { languageCode, pickSubtitles } from '../subtitles.js';
import { num, parseDuration, str, stripHtml, truncate, yearOf } from '../util.js';
import type { MediaSource } from './types.js';

const BASE = 'https://archive.org';

/** Collections dont les films montrent souvent des images de guerre : l'interface prévient le visiteur. */
const SENSITIVE_COLLECTIONS = ['wwIIarchive', 'universal_newsreels'];

/**
 * Langue de collections dont la fiche ne la renseigne presque jamais (5 % mesuré). Les actualités
 * Universal sont toutes commentées en anglais : vérifié sur leurs sous-titres automatiques.
 */
const COLLECTION_LANGUAGE: Record<string, string> = { universal_newsreels: 'en' };
const collectionLanguage = (collections: string[]): string | undefined => collections.map((c) => COLLECTION_LANGUAGE[c]).find(Boolean);

/** Valeurs de `sort[]` d'advancedsearch (vérifiées sur la vraie API). */
const SORT: Record<SortKey, string> = {
  popular: 'downloads desc',
  recent: 'date desc',
  oldest: 'date asc',
  title: 'titleSorter asc',
};

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
  subject?: unknown;
  language?: unknown;
  collection?: unknown;
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
  metadata?: { mediatype?: unknown; licenseurl?: unknown; collection?: unknown; language?: unknown };
}

function sanitizeQuery(q: string): string {
  return q
    .replace(/[\[\](){}:^~*?\\/!|&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Requête Lucene d'advancedsearch : mots-clés, types de média, hors prêt numérique restreint. */
const SAFE_TOKEN = /^[A-Za-z0-9_-]+$/;
const orGroup = (field: string, values: string[] | undefined): string | undefined => {
  const safe = (values ?? []).filter((v) => SAFE_TOKEN.test(v));
  return safe.length ? `${field}:(${safe.join(' OR ')})` : undefined;
};

export function buildQuery(
  q: string,
  kinds: MediaKind[],
  filters: SearchFilters = {},
  safe = safeSearchEnabled(),
  scoped = true,
): string {
  const text = sanitizeQuery(q);
  const types = [...new Set(kinds.flatMap((k) => KIND_TO_MEDIATYPE[k]))];
  const clauses: string[] = [];
  if (text) clauses.push(`(${text})`);
  clauses.push(`mediatype:(${types.join(' OR ')})`);
  for (const c of [orGroup('collection', filters.collections), orGroup('language', filters.languages), orGroup('subject', filters.subjects)]) {
    if (c) clauses.push(c);
  }
  // Sélection éditoriale : identifiants vérifiés à la main (caractères strictement limités, entre guillemets).
  const ids = (filters.identifiers ?? []).filter((v) => /^[A-Za-z0-9._-]+$/.test(v));
  if (ids.length) clauses.push(`identifier:(${ids.map((v) => `"${v}"`).join(' OR ')})`);
  if (filters.licensed) clauses.push('licenseurl:*');
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    clauses.push(`year:[${Math.trunc(filters.yearFrom ?? 1850)} TO ${Math.trunc(filters.yearTo ?? 2100)}]`);
  }
  clauses.push('-access-restricted-item:true');
  // Liste blanche : seuls les films et l'animation des collections retenues (voir scope.ts).
  // Une sélection par identifiant est plus stricte que la liste de collections : elle s'en affranchit.
  if (scoped && ids.length === 0) {
    clauses.push(`collection:(${SCOPE_COLLECTIONS.join(' OR ')})`);
    clauses.push(`-collection:(${EXCLUDED_COLLECTIONS.join(' OR ')})`);
  }
  if (safe) clauses.push(`-collection:(${BLOCKED_COLLECTIONS.join(' OR ')})`);
  return clauses.join(' AND ');
}

export function toItem(doc: IaDoc, safe = safeSearchEnabled()): MediaItem | null {
  const id = doc.identifier;
  const mediatype = str(doc.mediatype);
  const kind = mediatype ? MEDIATYPE_TO_KIND[mediatype] : undefined;
  if (!id || !kind) return null;
  if (safe) {
    const subjects = (Array.isArray(doc.subject) ? doc.subject : [doc.subject]).filter((s): s is string => typeof s === 'string');
    const title = str(doc.title);
    const description = str(doc.description);
    if (!isFamilySafe({ ...(title ? { title } : {}), ...(description ? { description } : {}), subjects })) return null;
  }
  const creator = str(doc.creator);
  const year = yearOf(doc.year ?? doc.date);
  const downloads = num(doc.downloads);
  const description = truncate(stripHtml(str(doc.description)), 400);
  const collections = (Array.isArray(doc.collection) ? doc.collection : [doc.collection]).filter((c): c is string => typeof c === 'string');
  const language = languageCode(doc.language) ?? collectionLanguage(collections);
  const sensitive = collections.some((c) => SENSITIVE_COLLECTIONS.includes(c));
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
    ...(language ? { language } : {}),
    ...(sensitive ? { sensitive: true } : {}),
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

const metaCollections = (raw: unknown): string[] => (Array.isArray(raw) ? raw : [raw]).filter((c): c is string => typeof c === 'string');

export const internetArchive: MediaSource = {
  id: 'internet-archive',
  name: 'Internet Archive',
  homepage: 'https://archive.org',
  kinds: ['video', 'audio', 'software', 'text'],
  supportsBrowse: true,
  supports: { genre: true, lang: true },

  async search(params: SearchParams, http) {
    const url = new URL(`${BASE}/advancedsearch.php`);
    url.searchParams.set('q', buildQuery(params.q, params.kinds, params.filters));
    for (const f of ['identifier', 'title', 'description', 'mediatype', 'year', 'date', 'downloads', 'licenseurl', 'creator', 'subject', 'language', 'collection']) {
      url.searchParams.append('fl[]', f);
    }
    url.searchParams.append('sort[]', SORT[params.sort ?? 'popular']);
    url.searchParams.set('rows', String(params.limit));
    url.searchParams.set('page', String(params.page));
    url.searchParams.set('output', 'json');

    const data = await http.json<{ response?: { docs?: IaDoc[] } }>(url.href);
    return (data.response?.docs ?? []).map((d) => toItem(d)).filter((i): i is MediaItem => i !== null);
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
        score: 10,
        playable: false,
      });
    }
    links.push({
      url: `${BASE}/details/${encodeURIComponent(id)}`,
      type: 'page',
      score: 1,
      playable: false,
    });

    const licenseUrl = str(meta.metadata?.licenseurl);
    const duration = ranked.find((l) => l.durationSec)?.durationSec;
    const subtitles = metaKind === 'video' ? pickSubtitles(meta.files ?? [], (name) => downloadUrl(id, name), languageCode(meta.metadata?.language) ?? collectionLanguage(metaCollections(meta.metadata?.collection))) : [];
    return {
      links,
      ...(subtitles.length ? { subtitles } : {}),
      ...(licenseUrl ? { license: classifyLicense(null, licenseUrl) } : {}),
      ...(duration ? { durationSec: duration } : {}),
    };
  },
};
