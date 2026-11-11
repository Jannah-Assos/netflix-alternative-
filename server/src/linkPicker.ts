import type { LinkType, MediaKind, MediaLink } from './types.js';

interface ExtInfo {
  score: number;
  playable: boolean;
}

const VIDEO: Record<string, ExtInfo> = {
  mp4: { score: 100, playable: true },
  m4v: { score: 95, playable: true },
  webm: { score: 85, playable: true },
  ogv: { score: 70, playable: true },
  mkv: { score: 40, playable: false },
  mov: { score: 30, playable: false },
  avi: { score: 25, playable: false },
  mpg: { score: 25, playable: false },
  mpeg: { score: 25, playable: false },
  wmv: { score: 20, playable: false },
  flv: { score: 20, playable: false },
};

const AUDIO: Record<string, ExtInfo> = {
  mp3: { score: 100, playable: true },
  m4a: { score: 90, playable: true },
  aac: { score: 80, playable: true },
  ogg: { score: 80, playable: true },
  oga: { score: 80, playable: true },
  opus: { score: 80, playable: true },
  flac: { score: 60, playable: true },
  wav: { score: 45, playable: true },
  aiff: { score: 30, playable: false },
};

const SOFTWARE: Record<string, ExtInfo> = {
  zip: { score: 100, playable: false },
  '7z': { score: 70, playable: false },
  iso: { score: 60, playable: false },
  img: { score: 40, playable: false },
  exe: { score: 30, playable: false },
};

const TEXT: Record<string, ExtInfo> = {
  pdf: { score: 100, playable: false },
  epub: { score: 90, playable: false },
  txt: { score: 50, playable: false },
  djvu: { score: 40, playable: false },
  mobi: { score: 35, playable: false },
};

const TABLES: Record<MediaKind, Record<string, ExtInfo>> = {
  video: VIDEO,
  audio: AUDIO,
  software: SOFTWARE,
  text: TEXT,
};

/** Un fichier candidat avant classement. */
export interface Candidate {
  url: string;
  name: string;
  format?: string;
  sizeBytes?: number;
  height?: number;
  durationSec?: number;
  /** Fichier dérivé (transcodé) par la source plutôt que l'original déposé. */
  derivative?: boolean;
  /** Ajustement propre à la source. */
  bonus?: number;
  variant?: string;
}

export function extensionOf(name: string): string {
  const clean = name.split('?')[0] ?? name;
  const m = /\.([a-z0-9]+)$/i.exec(clean);
  return m?.[1]?.toLowerCase() ?? '';
}

export function scoreCandidate(c: Candidate, kind: MediaKind): { score: number; playable: boolean } | null {
  const info = TABLES[kind][extensionOf(c.name)];
  if (!info) return null;
  if (c.sizeBytes === 0) return null; // fichier vide

  let score = info.score;
  if (c.height) score += (Math.min(c.height, 1080) / 1080) * 30;
  const fmt = (c.format ?? '').toLowerCase();
  if (kind === 'video' && c.derivative && fmt.includes('h.264')) score += 15;
  if (fmt.includes('512kb')) score -= 15;
  // Un original de plusieurs Go est un mauvais choix pour regarder : on préfère une version plus légère.
  if (c.sizeBytes && c.sizeBytes > 4e9) score -= 20;
  else if (c.sizeBytes && c.sizeBytes > 1.5e9) score -= 10;
  score += c.bonus ?? 0;
  return { score, playable: info.playable };
}

/** Classe les fichiers d'un item : meilleurs liens en premier, doublons retirés. */
export function rankCandidates(candidates: Candidate[], kind: MediaKind, max = 8): MediaLink[] {
  const seen = new Set<string>();
  const links: MediaLink[] = [];
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    const s = scoreCandidate(c, kind);
    if (!s) continue;
    seen.add(c.url);
    const type: LinkType = s.playable ? 'stream' : 'download';
    links.push({
      url: c.url,
      type,
      format: extensionOf(c.name),
      ...(c.sizeBytes ? { sizeBytes: c.sizeBytes } : {}),
      ...(c.height ? { height: c.height } : {}),
      ...(c.variant ? { variant: c.variant } : {}),
      ...(c.durationSec ? { durationSec: c.durationSec } : {}),
      score: Math.round(s.score * 10) / 10,
      playable: s.playable,
    });
  }
  links.sort((a, b) => b.score - a.score || Number(b.playable) - Number(a.playable));
  return links.slice(0, max);
}

/** Meilleur lien direct : une lecture directe d'abord, sinon un téléchargement. */
export function pickBest(links: MediaLink[]): MediaLink | undefined {
  return links.find((l) => l.type === 'stream') ?? links.find((l) => l.type === 'download');
}
