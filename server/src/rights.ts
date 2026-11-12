import type { MediaItem, RightsInfo, RightsStatus } from './types.js';
import { WORKS, type Author, type Work } from './works.js';

/**
 * Droits en France : statut ESTIMÉ, calculé à partir de données vérifiables (auteurs, décès, nationalité,
 * pays d'origine, année de publication). Ce n'est pas un avis juridique : à faire valider (jalon J5).
 *
 * Les trois règles appliquées (détail et sources dans docs/DROITS-CATALOGUE.md) :
 *  1. Licence Creative Commons accordée par l'ayant droit → libre.
 *  2. Droit commun : une œuvre est protégée 70 ans après la mort du dernier de ses auteurs (réalisateur,
 *     scénariste, auteur de l'œuvre adaptée, compositeur). Les prorogations de guerre ne s'ajoutent plus
 *     aux 70 ans (Cour de cassation, 27 février 2007), mais on garde une marge : « libre » seulement
 *     au-delà de 80 ans, « probablement libre » entre 70 et 80.
 *  3. Œuvre d'origine américaine dont les auteurs ne sont pas européens : la France n'accorde pas plus
 *     que la durée américaine (art. L.123-12 du code de la propriété intellectuelle). Une œuvre publiée
 *     il y a plus de 95 ans est dans le domaine public aux États-Unis, donc probablement libre en France.
 *
 * La licence affichée par Internet Archive ne sert à rien ici : la même œuvre y porte des licences
 * différentes selon l'internaute qui l'a déposée.
 */

/** Années écoulées depuis le décès pour que l'œuvre entre dans le domaine public (70 ans pleins). */
const TERM = 71;
/** Marge de prudence : « libre » sans réserve seulement dix ans plus tard. */
const WIDE = 81;
/** États-Unis : domaine public le 1er janvier qui suit 95 ans après la publication. */
const US_TERM = 96;

const thisYear = (): number => new Date().getFullYear();

type RightsInput = Pick<Work, 'authors' | 'cc' | 'country' | 'year'>;

/** Statut d'une œuvre dont on connaît les auteurs. `now` : année de référence (pour les tests). */
export function evaluate(work: RightsInput, now = thisYear()): RightsInfo {
  if (work.cc) return { fr: 'free', basis: 'cc' };
  if (work.authors.length === 0) return { fr: 'unclear', basis: 'authors', uncertain: true };

  const elapsed = (a: Author): boolean => a.died !== null && a.died <= now - TERM;
  const known = work.authors.map((a) => a.died).filter((d): d is number => d !== null);
  const lastDeath = known.length ? Math.max(...known) : undefined;
  const withDeath = lastDeath !== undefined ? { lastDeath } : {};

  if (work.authors.every(elapsed)) {
    const wide = work.authors.every((a) => a.died !== null && a.died <= now - WIDE);
    return { fr: wide ? 'free' : 'likely', basis: 'authors', ...withDeath };
  }

  // Règle 3 : les auteurs encore « dans les 70 ans » doivent tous être non européens, et l'œuvre
  // américaine doit être dans le domaine public aux États-Unis.
  const usPublicDomain = work.country === 'US' && work.year <= now - US_TERM;
  if (usPublicDomain && work.authors.filter((a) => !elapsed(a)).every((a) => !a.eu)) {
    return { fr: 'likely', basis: 'us-term', ...withDeath };
  }
  return { fr: 'protected', basis: 'authors', ...withDeath };
}

export function frStatus(work: RightsInput, now = thisYear()): RightsStatus {
  return evaluate(work, now).fr;
}

/** Une œuvre peut-elle figurer au catalogue ? */
export const isCatalogueStatus = (s: RightsStatus): boolean => s === 'free' || s === 'likely';

// ───────── Reconnaître une copie dans l'archive ─────────

const fold = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Titre ou nom réduit à des mots séparés par un espace, sans ponctuation (ni parenthèses, sauf demande). */
export function normalize(s: string, keepParentheses = false): string {
  const text = keepParentheses ? fold(s) : fold(s).replace(/[([{][^)\]}]*[)\]}]/g, ' ');
  return text.replace(/[^a-z0-9]+/g, ' ').trim();
}

const hasPhrase = (text: string, phrase: string): boolean => ` ${text} `.includes(` ${phrase} `);

/** Œuvres connues comme PROTÉGÉES en France (décès vérifiés sur Wikidata) : jamais affichées. */
export const PROTECTED_WORKS: { aliases: string[]; year: number; lastDeath: number; who: string }[] = [
  { aliases: ['the golem', 'der golem', 'the golem how he came into the world', 'der golem wie er in die welt kam'], year: 1920, lastDeath: 1958, who: 'Carl Boese' },
  { aliases: ['battleship potemkin', 'bronenosets potyomkin', 'le cuirasse potemkine'], year: 1925, lastDeath: 1974, who: 'Nina Agadjanova' },
  { aliases: ['haxan', 'witchcraft through the ages'], year: 1922, lastDeath: 1959, who: 'Benjamin Christensen' },
  { aliases: ['faust'], year: 1926, lastDeath: 1960, who: 'Hans Kyser' },
  { aliases: ['metropolis'], year: 1927, lastDeath: 1976, who: 'Fritz Lang' },
];

/**
 * Créateurs et personnages repérés dans le titre ou le nom du créateur, quelle que soit la copie.
 * `american` : auteurs américains ; leurs œuvres publiées il y a plus de 95 ans relèvent de la règle 3
 * et ne sont donc plus écartées (elles restent sans tampon tant qu'elles ne sont pas au catalogue).
 */
export const PROTECTED_NAMES: { names: string[]; died: number; american: boolean }[] = [
  { names: ['charlie chaplin', 'charles chaplin'], died: 1977, american: false },
  { names: ['fritz lang'], died: 1976, american: false },
  { names: ['buster keaton'], died: 1966, american: true },
  { names: ['harold lloyd'], died: 1971, american: true },
  { names: ['max fleischer', 'dave fleischer', 'fleischer studios', 'popeye', 'betty boop'], died: 1979, american: true },
  { names: ['walt disney'], died: 1966, american: true },
  { names: ['felix the cat', 'otto messmer'], died: 1983, american: true },
  { names: ['hugh harman', 'rudy ising', 'bosko'], died: 1982, american: true },
  { names: ['merrie melodies', 'looney tunes', 'bugs bunny', 'daffy duck', 'porky pig', 'elmer fudd'], died: 2002, american: true },
  { names: ['tom and jerry'], died: 2001, american: true },
];

/** Œuvres du gouvernement fédéral américain : sans droit d'auteur aux États-Unis ; cas non tranché ici. */
export const GOVERNMENT_CREATORS = [
  'united states army',
  'united states navy',
  'united states marine corps',
  'united states army air forces',
  'united states office of war information',
  'united states war department',
  'us army',
  'us navy',
  'us army signal corps',
  'signal corps',
  'office of war information',
  'national archives and records administration',
];

const ARCHIVE_IDS = new Map<string, Work>();
for (const w of WORKS) {
  ARCHIVE_IDS.set(w.archiveId, w);
  for (const e of w.episodes ?? []) ARCHIVE_IDS.set(e.archiveId, w);
}

const matchesTitle = (title: string, year: number | undefined, aliases: string[], workYear: number): boolean =>
  aliases.some((alias) => (year === undefined ? title === alias : Math.abs(year - workYear) <= 1 && hasPhrase(title, alias)));

/**
 * Œuvre du catalogue correspondant à un document de l'archive. Prudent : on préfère ne rien dire
 * qu'une erreur. 1. identifiant vérifié ; 2. titre connu ET année à ±1 près ; 3. sans année : titre identique.
 */
export function findWork(item: Pick<MediaItem, 'sourceId' | 'title' | 'year'>): Work | undefined {
  const byId = ARCHIVE_IDS.get(item.sourceId.split('#')[0] ?? item.sourceId);
  if (byId) return byId;
  const title = normalize(item.title);
  if (!title) return undefined;
  return WORKS.find((w) => matchesTitle(title, item.year, w.aliases ?? [], w.year));
}

export function rightsOf(item: Pick<MediaItem, 'sourceId' | 'title' | 'year' | 'creator'>, now = thisYear()): RightsInfo | undefined {
  const work = findWork(item);
  if (work) return evaluate(work, now);

  const title = normalize(item.title);
  const known = PROTECTED_WORKS.find((w) => matchesTitle(title, item.year, w.aliases, w.year));
  if (known) return { fr: 'protected', basis: 'authors', lastDeath: known.lastDeath };

  // Pour les noms, on garde le contenu des parenthèses : « CUKESIM's New Job! ( Charles Chaplin ) ».
  const parts = [normalize(item.title, true), normalize(item.creator ?? '', true)];
  const name = PROTECTED_NAMES.find((p) => p.names.some((n) => parts.some((part) => hasPhrase(part, n))));
  if (name) {
    const usPublicDomain = name.american && item.year !== undefined && item.year <= now - US_TERM;
    if (!usPublicDomain) return { fr: 'protected', basis: 'authors', lastDeath: name.died };
    return { fr: 'unclear', basis: 'us-term', uncertain: true };
  }
  if (parts[1] && GOVERNMENT_CREATORS.some((g) => hasPhrase(parts[1] as string, g))) {
    return { fr: 'unclear', basis: 'government', uncertain: true };
  }
  return undefined;
}

/** `RIGHTS_FILTER=off` garde les œuvres protégées dans l'archive (elles restent signalées). */
export function rightsFilterEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.RIGHTS_FILTER ?? 'on').toLowerCase() !== 'off';
}

/** Archive : ajoute `rights` aux documents connus et écarte les œuvres protégées en France. */
export function applyRights(items: MediaItem[], filter = rightsFilterEnabled(), now = thisYear()): MediaItem[] {
  const out: MediaItem[] = [];
  for (const it of items) {
    const rights = rightsOf(it, now);
    if (rights?.fr === 'protected' && filter) continue;
    const work = rights ? findWork(it) : undefined;
    out.push(rights ? { ...it, rights, ...(work && isCatalogueStatus(rights.fr) ? { slug: work.slug } : {}) } : it);
  }
  return out;
}
