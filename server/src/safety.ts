/**
 * Filtre « grand public », activé par défaut.
 *
 * Internet Archive héberge aussi du contenu pour adultes, y compris dans des collections
 * générales comme `feature_films` : seuls certains items sont signalés par une collection
 * (`adultvhs`, `no-preview`…), les autres ne le sont que par leurs mots-clés. On combine donc :
 *   1. l'exclusion des collections signalées, directement dans la requête ;
 *   2. un filtre sur le titre, la description et les mots-clés (accents ignorés).
 *
 * Il est volontairement strict (quelques faux positifs, comme un documentaire sur l'éducation
 * sexuelle, valent mieux que du contenu inapproprié dans un catalogue familial).
 * `SAFE_SEARCH=off` le désactive, pour un usage personnel assumé.
 */

export const BLOCKED_COLLECTIONS = ['adultvhs', 'adultcomics', 'no-preview', 'deemphasize', 'nsfw'];

/** Mots refusés tels quels (sans accents, minuscules) : « sex » ne doit pas bloquer « Essex » ou « Sussex ». */
const EXACT_TERMS = [
  'sex',
  'sexe',
  'sexes',
  'sexo',
  'sexy',
  'xxx',
  'x-rated',
  'porn',
  'porno',
  'pornos',
  'hentai',
  'fetish',
  'orgy',
  'orgie',
  'orgies',
  'nude',
  'nudes',
  'nudie',
  'topless',
  'libertine',
  'libertines',
  'softcore',
  'stripper',
  'striptease',
  'stripping',
  'molest',
  'molester',
  'rape',
  'rapist',
  // Images de guerre ou de violence explicites (documentaires d'époque) : le titre les annonce souvent (« GRAPHIC »).
  'graphic',
  'gore',
  'gory',
  'executed',
  'execution',
  'executions',
  'corpse',
  'corpses',
  'massacre',
  'massacres',
  'torture',
  'atrocity',
  'atrocities',
  'beheading',
  'beheadings',
];

/** Radicaux refusés avec toutes leurs variantes : « pornograph » couvre pornographie, pornography, pornographique… */
const STEMS = [
  'pornograph',
  'pornstar',
  'erotic',
  'erotiq',
  'erotism',
  'sexual',
  'sexuel',
  'sexploit',
  'nudit',
  'nudism',
  'nunsploit',
  'nonnesploit',
  'perver',
  'incest',
  'pedophil',
  'paedophil',
  'mutilat',
  'decapitat',
];

const WORD = '(?<![\\p{L}\\p{N}])';
const TERMS = new RegExp(`${WORD}(?:(?:${EXACT_TERMS.join('|')})(?![\\p{L}\\p{N}])|(?:${STEMS.join('|')})\\p{L}*)`, 'u');
/** « -18 » : mention d'interdiction aux mineurs. */
const MINORS = /(?:^|[\s,;|])-\s?18(?:$|[\s,;|])/;

const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function safeSearchEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.SAFE_SEARCH ?? 'on').toLowerCase() !== 'off';
}

export interface Reviewable {
  title?: string;
  description?: string;
  subjects?: string[];
}

/** Vrai si rien ne signale un contenu inapproprié. */
export function isFamilySafe(item: Reviewable): boolean {
  const text = fold([item.title, item.description, ...(item.subjects ?? [])].filter(Boolean).join(' | '));
  return !TERMS.test(text) && !MINORS.test(text);
}
