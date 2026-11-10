import { GENRE_IDS, PERIOD_IDS, SORT_KEYS, type GenreId, type Lang, type PeriodId, type SearchFilters, type SortKey } from './types.js';

/** Genres → filtres Internet Archive (noms de collections vérifiés sur la vraie API le 10/11/2026). */
export const GENRES: Record<GenreId, SearchFilters> = {
  film: { collections: ['feature_films'] },
  tv: { collections: ['classic_tv'] },
  animation: { collections: ['animationandcartoons'] },
  docs: { subjects: ['documentary'] },
  scifi: { collections: ['SciFi_Horror'] },
  comedy: { collections: ['Comedy_Films'] },
  noir: { collections: ['Film_Noir'] },
  silent: { collections: ['silent_films'] },
  shorts: { collections: ['short_films'] },
};

export const PERIODS: Record<PeriodId, { from?: number; to?: number }> = {
  before1930: { to: 1929 },
  y1930: { from: 1930, to: 1949 },
  y1950: { from: 1950, to: 1969 },
  y1970: { from: 1970, to: 1999 },
  y2000: { from: 2000 },
};

/** Langue du contenu → libellés Internet Archive (les métadonnées y sont libres) et code ISO. */
export const LANGUAGES: Record<Lang, string[]> = {
  fr: ['French', 'fre', 'fra'],
  en: ['English', 'eng'],
};

export interface CatalogQuery {
  filters: SearchFilters;
  sort: SortKey;
}

const pick = <T extends string>(raw: unknown, allowed: readonly T[]): T | undefined =>
  typeof raw === 'string' ? allowed.find((a) => a === raw) : undefined;

/**
 * Traduit les paramètres d'URL (genre, période, langue, tri) en filtres. Chaque valeur est
 * comparée à une liste blanche : une valeur inconnue est ignorée, jamais transmise telle quelle.
 */
export function parseCatalogQuery(query: Record<string, unknown>): CatalogQuery {
  const genre = pick(query.genre, GENRE_IDS);
  const period = pick(query.period, PERIOD_IDS);
  const lang = pick(query.lang, ['fr', 'en'] as const);
  const range = period ? PERIODS[period] : undefined;

  const filters: SearchFilters = {
    ...(genre ? GENRES[genre] : {}),
    ...(range?.from !== undefined ? { yearFrom: range.from } : {}),
    ...(range?.to !== undefined ? { yearTo: range.to } : {}),
    ...(lang ? { langCode: lang, languages: LANGUAGES[lang] } : {}),
  };
  return { filters, sort: pick(query.sort, SORT_KEYS) ?? 'popular' };
}
