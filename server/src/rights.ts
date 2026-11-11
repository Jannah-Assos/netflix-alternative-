import type { MediaItem, RightsInfo, RightsStatus } from './types.js';

/**
 * Table de droits : statut estimé de chaque œuvre EN FRANCE.
 *
 * ⚠ Base de travail, pas un avis juridique : les dates de décès n'ont pas été revérifiées sur une
 * source officielle, et les prolongations de guerre ne sont pas calculées. À faire valider (jalon J5).
 * Explications et liste complète : docs/DROITS-CATALOGUE.md.
 *
 * Pourquoi la licence affichée par Internet Archive ne suffit pas : la même œuvre y porte des licences
 * différentes selon l'utilisateur qui l'a déposée (« domaine public » ici, « CC BY-NC-ND » là).
 */

/** Auteurs principaux morts AVANT cette année : libres en France avec une marge de sécurité. */
export const FREE_BEFORE = 1946;
/** Auteur principal mort à partir de cette année : protégé en France (aucune prolongation ne le sauve). */
export const PROTECTED_FROM = 1956;

export interface Author {
  name: string;
  died: number;
  /** false : date de décès incertaine ; l'œuvre ne peut alors être ni « libre » ni « protégée » avec certitude. */
  sure?: boolean;
}

export interface Work {
  id: string;
  /** Titres connus (sans accents ni ponctuation, minuscules). */
  aliases: string[];
  year: number;
  /** Absent pour une œuvre sous licence Creative Commons de l'ayant droit. */
  authors: Author[];
  cc?: { holder: string; license: string };
  /** Identifiants Internet Archive dont on a vérifié qu'il s'agit de cette œuvre. */
  archiveIds?: string[];
}

export const WORKS: Work[] = [
  // ─── Libres en France (catégorie A) ───
  { id: 'voyage-lune', aliases: ['le voyage dans la lune', 'a trip to the moon', 'voyage dans la lune'], year: 1902, authors: [{ name: 'Georges Méliès', died: 1938 }], archiveIds: ['Levoyagedanslalune'] },
  { id: 'wandering-jew', aliases: ['the wandering jew', 'le juif errant'], year: 1905, authors: [{ name: 'Georges Méliès', died: 1938 }], archiveIds: ['The_Wandering_Jew'] },
  { id: 'excursion-lune', aliases: ['excursion dans la lune', 'excursion to the moon'], year: 1908, authors: [{ name: 'Segundo de Chomón', died: 1929 }], archiveIds: ['ExcursionDanLaLune', 'TripToTheMoon'] },
  { id: 'fantasmagorie', aliases: ['fantasmagorie'], year: 1908, authors: [{ name: 'Émile Cohl', died: 1938 }], archiveIds: ['Fantasmagorie'] },
  { id: 'little-nemo', aliases: ['little nemo'], year: 1911, authors: [{ name: 'Winsor McCay', died: 1934 }], archiveIds: ['LittleNemo_548'] },
  { id: 'les-vampires', aliases: ['les vampires'], year: 1915, authors: [{ name: 'Louis Feuillade', died: 1925 }], archiveIds: ['LesVampires1915DirectedByLouisFeuillade', 'les-vampires-1915'] },
  {
    id: 'sunrise',
    aliases: ['sunrise a song of two humans'],
    year: 1927,
    authors: [
      { name: 'F. W. Murnau', died: 1931 },
      { name: 'Carl Mayer', died: 1944 },
      { name: 'Hugo Riesenfeld', died: 1939 },
    ],
    archiveIds: ['sunrise.-a.-song.-of.-two.-humans.-1927.720p.-blu-ray.x-264-hdclub-public-hd'],
  },
  // Films Blender : licence CC BY 3.0 donnée par l'ayant droit lui-même (à contrôler sur le site de la fondation).
  { id: 'big-buck-bunny', aliases: ['big buck bunny'], year: 2008, authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY 3.0' }, archiveIds: ['BigBuckBunny_328'] },
  { id: 'sintel', aliases: ['sintel'], year: 2010, authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY 3.0' }, archiveIds: ['Sintel'] },
  { id: 'elephants-dream', aliases: ['elephants dream'], year: 2006, authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY 3.0' }, archiveIds: ['ElephantsDream', 'elephants_dream_voscastellano'] },

  // ─── Libres aux États-Unis, doute en France (catégorie B) ───
  {
    id: 'nosferatu',
    aliases: ['nosferatu', 'nosferatu eine symphonie des grauens', 'nosferatu a symphony of horror'],
    year: 1922,
    authors: [
      { name: 'F. W. Murnau', died: 1931 },
      { name: 'Henrik Galeen', died: 1949 },
      { name: 'Hans Erdmann', died: 1944 },
    ],
  },
  {
    id: 'caligari',
    aliases: ['das kabinett des doktor caligari', 'the cabinet of dr caligari', 'cabinet of dr caligari', 'le cabinet du docteur caligari'],
    year: 1920,
    authors: [
      { name: 'Robert Wiene', died: 1938 },
      { name: 'Carl Mayer', died: 1944 },
      { name: 'Hans Janowitz', died: 1954 },
    ],
  },
  {
    id: 'golem',
    aliases: ['the golem how he came into the world', 'der golem wie er in die welt kam', 'the golem'],
    year: 1920,
    authors: [
      { name: 'Paul Wegener', died: 1948 },
      { name: 'Henrik Galeen', died: 1949 },
    ],
  },
  {
    id: 'phantom-opera',
    aliases: ['the phantom of the opera'],
    year: 1925,
    authors: [
      { name: 'Rupert Julian', died: 1943 },
      { name: 'Raymond Schrock', died: 1950 },
      { name: 'Elliott Clawson', died: 1957, sure: false },
    ],
  },
  { id: 'intolerance', aliases: ['intolerance'], year: 1916, authors: [{ name: 'D. W. Griffith', died: 1948 }] },
  {
    id: 'potemkin',
    aliases: ['battleship potemkin', 'bronenosets potyomkin', 'le cuirasse potemkine', 'cuirasse potemkine'],
    year: 1925,
    authors: [
      { name: 'Sergueï Eisenstein', died: 1948 },
      { name: 'Nina Agadzhanova', died: 1974, sure: false },
    ],
  },

  // ─── Protégées en France (catégorie C) ───
  {
    id: 'haxan',
    aliases: ['haxan', 'la sorcellerie a travers les ages', 'witchcraft through the ages'],
    year: 1922,
    authors: [{ name: 'Benjamin Christensen', died: 1959 }],
  },
  {
    id: 'faust-1926',
    aliases: ['faust'],
    year: 1926,
    authors: [
      { name: 'F. W. Murnau', died: 1931 },
      { name: 'Hans Kyser', died: 1960 },
    ],
  },
  { id: 'metropolis-1927', aliases: ['metropolis'], year: 1927, authors: [{ name: 'Fritz Lang', died: 1976 }] },
];

/**
 * Créateurs et personnages dont l'œuvre est protégée en France, repérés dans le titre ou le créateur
 * (quelle que soit la copie). Liste de départ, à étendre au fil de la revue juridique.
 */
export const PROTECTED_NAMES: { names: string[]; died: number; who: string }[] = [
  { names: ['charlie chaplin', 'charles chaplin'], died: 1977, who: 'Charlie Chaplin' },
  { names: ['buster keaton'], died: 1966, who: 'Buster Keaton' },
  { names: ['harold lloyd'], died: 1971, who: 'Harold Lloyd' },
  { names: ['fritz lang'], died: 1976, who: 'Fritz Lang' },
  { names: ['max fleischer', 'dave fleischer', 'fleischer studios', 'popeye', 'betty boop'], died: 1979, who: 'Fleischer Studios' },
  { names: ['walt disney'], died: 1966, who: 'Walt Disney' },
  { names: ['felix the cat', 'otto messmer'], died: 1983, who: 'Otto Messmer' },
  { names: ['hugh harman', 'rudy ising', 'bosko'], died: 1982, who: 'Harman-Ising' },
  { names: ['merrie melodies', 'looney tunes', 'bugs bunny', 'daffy duck', 'porky pig', 'elmer fudd'], died: 2002, who: 'Warner Bros. (Chuck Jones, Tex Avery…)' },
  { names: ['tom and jerry'], died: 2001, who: 'Hanna-Barbera' },
];

/**
 * Œuvres produites par le gouvernement fédéral américain (armée, marine, archives…) : sans droit
 * d'auteur aux États-Unis. Leur statut en France n'est pas tranché (règle de comparaison des durées
 * de la convention de Berne) : on les signale « doute », jamais « libre », en attendant le juriste.
 */
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

/** Sélection éditoriale de l'accueil : uniquement des œuvres « libres », dont l'identifiant a été vérifié. */
export const PANTHEON_IDS: string[] = WORKS.filter((w) => frStatus(w) === 'free').flatMap((w) => w.archiveIds ?? []);

export function frStatus(work: Pick<Work, 'authors' | 'cc'>): RightsStatus {
  if (work.cc) return 'free';
  if (work.authors.length === 0) return 'unclear';
  const last = Math.max(...work.authors.map((a) => a.died));
  const uncertain = work.authors.some((a) => a.sure === false);
  const status: RightsStatus = last < FREE_BEFORE ? 'free' : last >= PROTECTED_FROM ? 'protected' : 'unclear';
  return uncertain ? 'unclear' : status;
}

const fold = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Titre ou nom réduit à des mots séparés par un espace, sans parenthèses ni ponctuation. */
export function normalize(s: string, keepParentheses = false): string {
  const text = keepParentheses ? fold(s) : fold(s).replace(/[([{][^)\]}]*[)\]}]/g, ' ');
  return text.replace(/[^a-z0-9]+/g, ' ').trim();
}

/** `phrase` apparaît dans `text` comme suite de mots entiers. */
const hasPhrase = (text: string, phrase: string): boolean => ` ${text} `.includes(` ${phrase} `);

function describe(work: Work): RightsInfo {
  const status = frStatus(work);
  if (work.cc) return { fr: status, basis: 'cc' };
  const uncertain = work.authors.some((a) => a.sure === false);
  return { fr: status, basis: 'authors', lastDeath: Math.max(...work.authors.map((a) => a.died)), ...(uncertain ? { uncertain: true } : {}) };
}

/**
 * Cherche l'œuvre correspondant à un item. Prudent : on préfère ne rien dire qu'une erreur.
 *   1. identifiant Internet Archive vérifié ;
 *   2. titre contenant un titre connu ET année à ±1 près ;
 *   3. sans année : titre strictement identique.
 */
export function findWork(item: Pick<MediaItem, 'sourceId' | 'title' | 'year'>): Work | undefined {
  const byId = WORKS.find((w) => w.archiveIds?.includes(item.sourceId));
  if (byId) return byId;
  const title = normalize(item.title);
  if (!title) return undefined;
  return WORKS.find((w) =>
    w.aliases.some((alias) =>
      item.year === undefined ? title === alias : Math.abs(item.year - w.year) <= 1 && hasPhrase(title, alias),
    ),
  );
}

export function rightsOf(item: Pick<MediaItem, 'sourceId' | 'title' | 'year' | 'creator'>): RightsInfo | undefined {
  const work = findWork(item);
  if (work) return describe(work);
  // Pour les noms, on garde le contenu des parenthèses : « CUKESIM's New Job! ( Charles Chaplin ) ».
  const parts = [normalize(item.title, true), normalize(item.creator ?? '', true)];
  const names = PROTECTED_NAMES.find((p) => p.names.some((n) => parts.some((part) => hasPhrase(part, n))));
  if (names) return { fr: 'protected', basis: 'authors', lastDeath: names.died };
  if (parts[1] && GOVERNMENT_CREATORS.some((g) => hasPhrase(parts[1] as string, g))) {
    return { fr: 'unclear', basis: 'government', uncertain: true };
  }
  return undefined;
}

/** `RIGHTS_FILTER=off` garde les œuvres protégées dans le catalogue (elles restent signalées). */
export function rightsFilterEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.RIGHTS_FILTER ?? 'on').toLowerCase() !== 'off';
}

/** Ajoute `rights` aux items connus et écarte les œuvres protégées en France (sauf `RIGHTS_FILTER=off`). */
export function applyRights(items: MediaItem[], filter = rightsFilterEnabled()): MediaItem[] {
  const out: MediaItem[] = [];
  for (const it of items) {
    const rights = rightsOf(it);
    if (rights?.fr === 'protected' && filter) continue;
    out.push(rights ? { ...it, rights } : it);
  }
  return out;
}

/** Une seule copie par œuvre connue (Internet Archive en a souvent plusieurs) ; les autres items sont conservés. */
export function uniqueByWork<T extends Pick<MediaItem, 'sourceId' | 'title' | 'year'>>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const id = findWork(it)?.id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
