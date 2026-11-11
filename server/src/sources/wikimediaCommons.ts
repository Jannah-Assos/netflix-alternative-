import { classifyLicense } from '../licenses.js';
import { rankCandidates, type Candidate } from '../linkPicker.js';
import type { MediaItem, MediaKind, MediaLink, SearchParams, SourceResolve } from '../types.js';
import { num, stripHtml, toHttps, truncate, yearOf } from '../util.js';
import type { MediaSource } from './types.js';

const API = 'https://commons.wikimedia.org/w/api.php';

interface ExtValue {
  value?: string;
}

/** Version transcodée par Wikimedia (module TimedMediaHandler) : bien plus légère que l'original. */
interface Derivative {
  src?: string;
  type?: string;
  width?: number;
  height?: number;
}

interface ImageInfo {
  url?: string;
  descriptionurl?: string;
  thumburl?: string;
  size?: number;
  height?: number;
  duration?: number;
  mime?: string;
  derivatives?: Derivative[];
  extmetadata?: Record<string, ExtValue | undefined>;
}

interface CommonsPage {
  title?: string;
  index?: number;
  /** Fourni par `prop=videoinfo` (vidéo et audio) ; `imageinfo` sert de repli. */
  videoinfo?: ImageInfo[];
  imageinfo?: ImageInfo[];
}

const infoOf = (page: CommonsPage): ImageInfo | undefined => page.videoinfo?.[0] ?? page.imageinfo?.[0];

/** Dérivés lisibles dans un navigateur : WebM/Ogg. On écarte le DASH (.mpd) et le MPEG-4 en .mov. */
const PLAYABLE_DERIVATIVE = /^(video\/(webm|ogg)|audio\/)/i;

interface CommonsResponse {
  query?: { pages?: CommonsPage[] };
}

const FILETYPE: Partial<Record<MediaKind, string>> = { video: 'video', audio: 'audio' };

function baseParams(): URLSearchParams {
  const p = new URLSearchParams();
  p.set('action', 'query');
  p.set('format', 'json');
  p.set('formatversion', '2');
  p.set('prop', 'videoinfo');
  p.set('viprop', 'url|size|mime|extmetadata|derivatives');
  p.set('viextmetadatafilter', 'LicenseShortName|LicenseUrl|ImageDescription|Artist|DateTimeOriginal|DateTime');
  p.set('viurlwidth', '480');
  return p;
}

export function cleanTitle(fileTitle: string): string {
  return fileTitle
    .replace(/^(File|Fichier):/i, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/_/g, ' ')
    .trim();
}

export function toItem(page: CommonsPage, kind: MediaKind): MediaItem | null {
  const info = infoOf(page);
  if (!page.title || !info?.url) return null;
  const ext = info.extmetadata ?? {};
  const license = classifyLicense(ext.LicenseShortName?.value, ext.LicenseUrl?.value);
  const description = truncate(stripHtml(ext.ImageDescription?.value), 400);
  const creator = truncate(stripHtml(ext.Artist?.value), 120);
  const year = yearOf(ext.DateTimeOriginal?.value ?? ext.DateTime?.value);
  const thumbnail = toHttps(info.thumburl);
  const duration = num(info.duration);
  return {
    uid: `wikimedia-commons:${page.title}`,
    source: 'wikimedia-commons',
    sourceId: page.title,
    title: cleanTitle(page.title),
    ...(description ? { description } : {}),
    kind,
    ...(year ? { year } : {}),
    ...(creator ? { creator } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    license,
    ...(duration ? { durationSec: duration } : {}),
  };
}

export function linksFor(page: CommonsPage, kind: MediaKind): SourceResolve {
  const info = infoOf(page);
  if (!info?.url || !page.title) return { links: [] };
  const name = info.url.split('/').pop() ?? page.title;
  const candidates: Candidate[] = [
    {
      url: info.url,
      name,
      ...(info.size ? { sizeBytes: info.size } : {}),
      ...(info.height ? { height: info.height } : {}),
      ...(info.duration ? { durationSec: info.duration } : {}),
    },
  ];
  for (const d of info.derivatives ?? []) {
    const src = toHttps(d.src?.startsWith('//') ? `https:${d.src}` : d.src);
    if (!src || !d.type || !PLAYABLE_DERIVATIVE.test(d.type)) continue;
    candidates.push({ url: src, name: src, derivative: true, ...(d.height ? { height: d.height } : {}), ...(info.duration ? { durationSec: info.duration } : {}) });
  }
  const ranked = rankCandidates(candidates, kind);
  const links: MediaLink[] = [
    ...ranked,
    {
      url: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      type: 'page',
      score: 1,
      playable: false,
    },
  ];
  const ext = info.extmetadata ?? {};
  return {
    links,
    license: classifyLicense(ext.LicenseShortName?.value, ext.LicenseUrl?.value),
    ...(info.duration ? { durationSec: info.duration } : {}),
  };
}

async function searchOne(q: string, kind: MediaKind, params: SearchParams, limit: number, http: Parameters<MediaSource['search']>[1]) {
  const filetype = FILETYPE[kind];
  if (!filetype) return [];
  const p = baseParams();
  p.set('generator', 'search');
  p.set('gsrsearch', `${q} filetype:${filetype}`.trim());
  p.set('gsrnamespace', '6');
  p.set('gsrlimit', String(limit));
  p.set('gsroffset', String((params.page - 1) * limit));
  const data = await http.json<CommonsResponse>(`${API}?${p.toString()}`);
  const pages = [...(data.query?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages.map((pg) => toItem(pg, kind)).filter((i): i is MediaItem => i !== null);
}

export const wikimediaCommons: MediaSource = {
  id: 'wikimedia-commons',
  name: 'Wikimedia Commons',
  homepage: 'https://commons.wikimedia.org',
  kinds: ['video', 'audio'],
  supportsBrowse: true,

  async search(params, http) {
    const kinds = params.kinds.filter((k) => FILETYPE[k]);
    if (kinds.length === 0) return [];
    const per = Math.max(1, Math.floor(params.limit / kinds.length));
    const lists = await Promise.all(kinds.map((k) => searchOne(params.q, k, params, per, http)));
    return lists.flat();
  },

  async resolve(title, kind, http) {
    const p = baseParams();
    p.set('titles', title);
    const data = await http.json<CommonsResponse>(`${API}?${p.toString()}`);
    const page = data.query?.pages?.[0];
    return page ? linksFor(page, kind) : { links: [] };
  },
};
