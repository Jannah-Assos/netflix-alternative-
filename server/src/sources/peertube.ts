import { classifyLicense } from '../licenses.js';
import { rankCandidates, type Candidate } from '../linkPicker.js';
import type { LicenseInfo, MediaItem, MediaLink, SearchParams, SourceResolve } from '../types.js';
import { num, stripHtml, toHttps, truncate, yearOf } from '../util.js';
import type { MediaSource } from './types.js';

/**
 * PeerTube via SepiaSearch (moteur de recherche fédéré). On ne garde que les vidéos
 * qui déclarent une licence libre (Creative Commons / domaine public).
 */
const SEARCH = 'https://sepiasearch.org/api/v1/search/videos';

/** Identifiants de licence PeerTube. */
const LICENCES: Record<number, LicenseInfo> = {
  1: classifyLicense('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
  2: classifyLicense('CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
  3: classifyLicense('CC BY-ND 4.0', 'https://creativecommons.org/licenses/by-nd/4.0/'),
  4: classifyLicense('CC BY-NC 4.0', 'https://creativecommons.org/licenses/by-nc/4.0/'),
  5: classifyLicense('CC BY-NC-SA 4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'),
  6: classifyLicense('CC BY-NC-ND 4.0', 'https://creativecommons.org/licenses/by-nc-nd/4.0/'),
  7: classifyLicense('CC0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
};

interface PtVideo {
  uuid?: string;
  name?: string;
  description?: string | null;
  duration?: number;
  thumbnailUrl?: string;
  url?: string;
  publishedAt?: string;
  views?: number;
  licence?: { id?: number };
  account?: { displayName?: string; name?: string };
}

interface PtDetail {
  files?: { fileUrl?: string; fileDownloadUrl?: string; size?: number; resolution?: { id?: number } }[];
  streamingPlaylists?: { playlistUrl?: string }[];
}

/** `uid` = `peertube:<hôte>|<uuid>` — l'hôte est revalidé à chaque requête (voir http.ts). */
export function encodeId(host: string, uuid: string): string {
  return `${host}|${uuid}`;
}

export function decodeId(sourceId: string): { host: string; uuid: string } | null {
  const [host, uuid, ...rest] = sourceId.split('|');
  if (!host || !uuid || rest.length > 0) return null;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9-]{8,64}$/i.test(uuid)) return null;
  return { host, uuid };
}

export function toItem(v: PtVideo): MediaItem | null {
  if (!v.uuid || !v.url) return null;
  let host: string;
  try {
    host = new URL(v.url).hostname;
  } catch {
    return null;
  }
  const license = v.licence?.id ? LICENCES[v.licence.id] : undefined;
  if (!license) return null; // pas de licence déclarée : on ne l'expose pas
  const description = truncate(stripHtml(v.description ?? undefined), 400);
  const creator = v.account?.displayName ?? v.account?.name;
  const year = yearOf(v.publishedAt);
  const thumbnail = toHttps(v.thumbnailUrl);
  const duration = num(v.duration);
  const views = num(v.views);
  const id = encodeId(host, v.uuid);
  return {
    uid: `peertube:${id}`,
    source: 'peertube',
    sourceId: id,
    title: v.name ?? v.uuid,
    ...(description ? { description } : {}),
    kind: 'video',
    ...(year ? { year } : {}),
    ...(creator ? { creator } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    pageUrl: v.url,
    license,
    ...(views !== undefined ? { popularity: views } : {}),
    ...(duration ? { durationSec: duration } : {}),
  };
}

export const peertube: MediaSource = {
  id: 'peertube',
  name: 'PeerTube (licences libres)',
  homepage: 'https://sepiasearch.org',
  kinds: ['video'],
  supportsBrowse: false,

  async search(params: SearchParams, http) {
    if (!params.kinds.includes('video') || !params.q.trim()) return [];
    const url = new URL(SEARCH);
    url.searchParams.set('search', params.q);
    url.searchParams.set('start', String((params.page - 1) * params.limit));
    url.searchParams.set('count', String(params.limit));
    url.searchParams.set('sort', '-match');
    url.searchParams.set('nsfw', 'false');
    for (const id of Object.keys(LICENCES)) url.searchParams.append('licenceOneOf', id);
    const data = await http.json<{ data?: PtVideo[] }>(url.href);
    return (data.data ?? []).map(toItem).filter((i): i is MediaItem => i !== null);
  },

  async resolve(sourceId, _kind, http): Promise<SourceResolve> {
    const ref = decodeId(sourceId);
    if (!ref) return { links: [] };
    const base = `https://${ref.host}`;
    const detail = await http.json<PtDetail>(`${base}/api/v1/videos/${encodeURIComponent(ref.uuid)}`);

    const candidates: Candidate[] = (detail.files ?? [])
      .filter((f) => f.fileUrl)
      .map((f) => ({
        url: f.fileUrl as string,
        // PeerTube sert des MP4 ; le nom n'a pas toujours d'extension.
        name: /\.[a-z0-9]{2,4}$/i.test(f.fileUrl as string) ? (f.fileUrl as string) : `${f.fileUrl}.mp4`,
        ...(f.size ? { sizeBytes: f.size } : {}),
        ...(f.resolution?.id ? { height: f.resolution.id } : {}),
      }));
    const links: MediaLink[] = rankCandidates(candidates, 'video');

    const playlist = detail.streamingPlaylists?.[0]?.playlistUrl;
    if (playlist) {
      links.push({
        url: playlist,
        type: 'download',
        label: 'Flux HLS (VLC, mpv…)',
        format: 'm3u8',
        score: 20,
        playable: false,
      });
    }
    links.push(
      {
        url: `${base}/videos/embed/${encodeURIComponent(ref.uuid)}`,
        type: 'embed',
        label: 'Lecteur intégré PeerTube',
        score: 10,
        playable: false,
      },
      {
        url: `${base}/w/${encodeURIComponent(ref.uuid)}`,
        type: 'page',
        label: `Page sur ${ref.host}`,
        score: 1,
        playable: false,
      },
    );
    return { links };
  },
};
