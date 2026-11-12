import { classifyLicense } from './licenses.js';
import { evaluate, isCatalogueStatus, normalize } from './rights.js';
import type { CatalogueResult, HomeResult, Lang, MediaItem, WorkDetail } from './types.js';
import { SHELVES, WORKS, type Episode, type Shelf, type Work } from './works.js';

/**
 * Le catalogue servi à l'interface : accueil, page d'une œuvre, recherche.
 * Tout vient de `works.ts` : aucun appel réseau, donc un accueil instantané même si Internet Archive
 * est lent ou en panne (seule la lecture en dépend).
 */

const ARCHIVE = 'https://archive.org';

/** Œuvres visibles : celles dont le statut calculé est « libre » ou « probablement libre ». */
export function catalogue(now = new Date().getFullYear()): Work[] {
  return WORKS.filter((w) => isCatalogueStatus(evaluate(w, now).fr));
}

const license = (w: Work) =>
  w.cc ? classifyLicense(w.cc.license) : classifyLicense('Public domain');

export function workItem(w: Work, lang: Lang, now = new Date().getFullYear()): MediaItem {
  return {
    uid: `internet-archive:${w.archiveId}`,
    source: 'internet-archive',
    sourceId: w.archiveId,
    title: w.title[lang],
    kind: 'video',
    year: w.year,
    creator: w.directors.join(', '),
    thumbnail: `${ARCHIVE}/services/img/${encodeURIComponent(w.archiveId)}`,
    pageUrl: `${ARCHIVE}/details/${encodeURIComponent(w.archiveId)}`,
    license: license(w),
    rights: evaluate(w, now),
    slug: w.slug,
    why: w.why[lang],
    durationSec: w.minutes * 60,
    ...(w.spoken ? { language: w.spoken } : {}),
    ...(w.episodes ? { episodes: w.episodes.length } : {}),
  };
}

/** Un épisode devient un titre lisible à part entière (reprise de lecture distincte par épisode). */
export function episodeItem(w: Work, e: Episode, lang: Lang, now = new Date().getFullYear()): MediaItem {
  const sourceId = e.file ? `${e.archiveId}#${e.file}` : e.archiveId;
  return {
    ...workItem(w, lang, now),
    uid: `internet-archive:${sourceId}`,
    sourceId,
    title: `${w.title[lang]} · ${e.n}. ${e.title[lang]}`,
    thumbnail: `${ARCHIVE}/services/img/${encodeURIComponent(e.archiveId)}`,
    pageUrl: `${ARCHIVE}/details/${encodeURIComponent(e.archiveId)}`,
    ...(e.minutes ? { durationSec: e.minutes * 60 } : {}),
  };
}

const bySlug = (slug: string): Work | undefined => WORKS.find((w) => w.slug === slug);

/** Séance du jour : un long métrage (ou une série), le même pour tout le monde, qui change à minuit UTC. */
export function featuredOf(date: Date, pool: Work[]): Work {
  const candidates = pool.filter((w) => w.minutes >= 40);
  const list = candidates.length ? candidates : pool;
  const day = Math.floor(date.getTime() / 86_400_000);
  // Pas de 7 (premier avec la taille de la liste dans la pratique) : deux jours voisins ne se ressemblent pas.
  return list[(day * 7) % list.length] as Work;
}

export function buildHome(lang: Lang, date = new Date()): HomeResult {
  const now = date.getFullYear();
  const visible = catalogue(now);
  const ok = new Set(visible.map((w) => w.slug));
  const rows = SHELVES.map((s: Shelf) => ({
    id: s.id,
    title: s.title[lang],
    intro: s.intro[lang],
    items: s.slugs.filter((slug) => ok.has(slug)).map((slug) => workItem(bySlug(slug) as Work, lang, now)),
  })).filter((r) => r.items.length > 0);
  return { lang, featured: workItem(featuredOf(date, visible), lang, now), rows, total: visible.length };
}

export function workDetail(slug: string, lang: Lang, date = new Date()): WorkDetail | undefined {
  const now = date.getFullYear();
  const w = bySlug(slug);
  if (!w || !isCatalogueStatus(evaluate(w, now).fr)) return undefined;
  const shelf = SHELVES.find((s) => s.slugs.includes(slug));
  const ok = new Set(catalogue(now).map((x) => x.slug));
  return {
    item: workItem(w, lang, now),
    directors: w.directors,
    country: w.country,
    tags: w.tags,
    authors: w.authors.map((a) => ({ name: a.name, died: a.died })),
    ...(w.cc ? { cc: w.cc } : {}),
    episodes: (w.episodes ?? []).map((e) => ({ n: e.n, item: episodeItem(w, e, lang, now) })),
    ...(shelf ? { shelf: { id: shelf.id, title: shelf.title[lang] } } : {}),
    related: (shelf?.slugs ?? [])
      .filter((s) => s !== slug && ok.has(s))
      .slice(0, 12)
      .map((s) => workItem(bySlug(s) as Work, lang, now)),
  };
}

/** Texte cherchable d'une œuvre : titres dans les deux langues, réalisateurs, auteurs, année. */
const haystack = (w: Work): { title: string; rest: string } => ({
  title: normalize(`${w.title.fr} ${w.title.en} ${(w.aliases ?? []).join(' ')}`, true),
  rest: normalize(`${w.directors.join(' ')} ${w.authors.map((a) => a.name).join(' ')} ${w.year} ${w.tags.join(' ')}`, true),
});

/**
 * Recherche maison dans le catalogue : tous les mots doivent être trouvés (début de mot accepté),
 * un mot trouvé dans le titre compte plus. Sans mot-clé : tout le catalogue, dans l'ordre des parcours.
 */
export function searchCatalogue(q: string, tag: string | undefined, lang: Lang, date = new Date()): CatalogueResult {
  const now = date.getFullYear();
  const order = new Map(SHELVES.flatMap((s) => s.slugs).map((slug, i) => [slug, i]));
  const words = normalize(q, true).split(' ').filter(Boolean);
  const scored = catalogue(now)
    .filter((w) => !tag || (w.tags as string[]).includes(tag) || w.kind === tag)
    .map((w) => {
      const h = haystack(w);
      let score = 0;
      for (const word of words) {
        const inTitle = ` ${h.title}`.includes(` ${word}`);
        const inRest = ` ${h.rest}`.includes(` ${word}`);
        if (!inTitle && !inRest) return null;
        score += inTitle ? 3 : 1;
      }
      return { w, score };
    })
    .filter((x): x is { w: Work; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || (order.get(a.w.slug) ?? 999) - (order.get(b.w.slug) ?? 999));
  return { items: scored.map((x) => workItem(x.w, lang, now)), total: scored.length };
}

const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/**
 * Page /film/<slug> : la même application, avec un titre, une description et une image propres à
 * l'œuvre, pour qu'un lien partagé (messagerie, réseau social) s'affiche avec un bel aperçu.
 */
export function shareHtml(indexHtml: string, slug: string, origin: string): string | undefined {
  const w = bySlug(slug);
  if (!w || !isCatalogueStatus(evaluate(w).fr)) return undefined;
  const title = escapeHtml(`${w.title.fr} (${w.year}) · Openflix`);
  const desc = escapeHtml(w.why.fr);
  const image = `${ARCHIVE}/services/img/${encodeURIComponent(w.archiveId)}`;
  const url = escapeHtml(`${origin}/film/${w.slug}`);
  const meta = [
    `<meta property="og:type" content="video.movie" />`,
    `<meta property="og:site_name" content="Openflix" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
  return indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>\n    ${meta}`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${desc}$2`);
}
