import { classifyLicense } from '../licenses.js';
import { extensionOf, rankCandidates, type Candidate } from '../linkPicker.js';
import type { LicenseInfo, MediaItem, MediaKind, MediaLink, SearchParams, SourceResolve } from '../types.js';
import { str, stripHtml, toHttps, truncate, yearOf } from '../util.js';
import type { MediaSource } from './types.js';

const BASE = 'https://images-api.nasa.gov';

interface NasaItem {
  data?: {
    nasa_id?: string;
    title?: string;
    description?: string;
    date_created?: string;
    media_type?: string;
    center?: string;
    secondary_creator?: string;
  }[];
  links?: { href?: string; rel?: string }[];
}

interface NasaSearch {
  collection?: { items?: NasaItem[] };
}

interface NasaAsset {
  collection?: { items?: { href?: string }[] };
}

/** Le contenu NASA est en règle générale non soumis au droit d'auteur (hors mentions contraires). */
const NASA_LICENSE: LicenseInfo = {
  ...classifyLicense('Public domain'),
  label: 'Domaine public (NASA)',
  url: 'https://www.nasa.gov/nasa-brand-center/images-and-media/',
};

/** Les déclinaisons NASA : `~large.mp4`, `~medium.mp4`… On préfère large/medium à l'original, souvent énorme. */
const VARIANT_BONUS: [RegExp, number][] = [
  [/~large\./i, 12],
  [/~medium\./i, 8],
  [/~orig\./i, 4],
  [/~small\./i, 0],
  [/~mobile\./i, -8],
];

export function assetCandidates(urls: string[]): Candidate[] {
  return urls
    .map((u) => toHttps(u) as string)
    .filter((u) => !/~(preview|thumb)\./i.test(u))
    .map((url) => {
      const name = decodeURIComponent(url.split('/').pop() ?? url);
      const bonus = VARIANT_BONUS.find(([re]) => re.test(name))?.[1] ?? 0;
      return { url, name, bonus } satisfies Candidate;
    })
    .filter((c) => extensionOf(c.name) !== '');
}

export function toItem(it: NasaItem): MediaItem | null {
  const d = it.data?.[0];
  const id = d?.nasa_id;
  const kind: MediaKind | undefined = d?.media_type === 'video' ? 'video' : d?.media_type === 'audio' ? 'audio' : undefined;
  if (!d || !id || !kind) return null;
  const description = truncate(stripHtml(d.description), 400);
  const creator = d.secondary_creator ?? d.center;
  const year = yearOf(d.date_created);
  const thumbnail = toHttps(it.links?.find((l) => l.rel === 'preview')?.href);
  return {
    uid: `nasa:${id}`,
    source: 'nasa',
    sourceId: id,
    title: str(d.title) ?? id,
    ...(description ? { description } : {}),
    kind,
    ...(year ? { year } : {}),
    ...(creator ? { creator } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    pageUrl: `https://images.nasa.gov/details/${encodeURIComponent(id)}`,
    license: NASA_LICENSE,
  };
}

export const nasa: MediaSource = {
  id: 'nasa',
  name: 'NASA Image and Video Library',
  homepage: 'https://images.nasa.gov',
  kinds: ['video', 'audio'],
  supportsBrowse: false,

  async search(params: SearchParams, http) {
    const types = [...new Set(params.kinds.filter((k) => k === 'video' || k === 'audio'))];
    if (types.length === 0 || !params.q.trim()) return [];
    const url = new URL(`${BASE}/search`);
    url.searchParams.set('q', params.q);
    url.searchParams.set('media_type', types.join(','));
    url.searchParams.set('page', String(params.page));
    url.searchParams.set('page_size', String(params.limit));
    const data = await http.json<NasaSearch>(url.href);
    return (data.collection?.items ?? []).map(toItem).filter((i): i is MediaItem => i !== null);
  },

  async resolve(id, kind, http): Promise<SourceResolve> {
    const data = await http.json<NasaAsset>(`${BASE}/asset/${encodeURIComponent(id)}`);
    const urls = (data.collection?.items ?? []).map((i) => i.href).filter((h): h is string => !!h);
    const ranked = rankCandidates(assetCandidates(urls), kind);
    const links: MediaLink[] = [
      ...ranked,
      {
        url: `https://images.nasa.gov/details/${encodeURIComponent(id)}`,
        type: 'page',
        label: 'Page sur images.nasa.gov',
        score: 1,
        playable: false,
      },
    ];
    return { links, license: NASA_LICENSE };
  },
};
