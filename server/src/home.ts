import type { Http } from './http.js';
import { PANTHEON_IDS, uniqueByWork } from './rights.js';
import { scan } from './scan.js';
import type { MediaSource } from './sources/types.js';
import type { HomeResult, HomeRow, Lang, SearchFilters, SourceId } from './types.js';

/**
 * Rangées de l'accueil. Le titre n'est pas ici : l'interface le traduit (`row.<id>`).
 * `langs` limite une rangée à certaines langues ; `q` peut varier selon la langue.
 *
 * Les noms de collections Internet Archive (feature_films, SciFi_Horror, classic_tv…)
 * sont ceux de collections publiques connues ; `npm run smoke` / l'accueil réel disent
 * vite si l'une d'elles a changé (rangée vide = rangée masquée).
 */
export interface RowDef {
  id: string;
  source: SourceId;
  langs?: Lang[];
  q?: string | Record<Lang, string>;
  filters?: SearchFilters;
  limit?: number;
  /** Garder une seule copie par œuvre connue (sélection éditoriale). */
  uniqueWorks?: boolean;
}

export const ROWS: RowDef[] = [
  // Sélection éditoriale : œuvres libres aussi en France (table de droits, rights.ts).
  { id: 'pantheon', source: 'internet-archive', filters: { identifiers: PANTHEON_IDS }, uniqueWorks: true },
  // Documentaires de guerre et actualités d'époque (images parfois difficiles : voir `sensitive`).
  { id: 'war', source: 'internet-archive', filters: { collections: ['wwIIarchive'] } },
  { id: 'newsreels', source: 'internet-archive', filters: { collections: ['universal_newsreels'] } },
  { id: 'local-fr', source: 'internet-archive', langs: ['fr'], filters: { languages: ['French', 'fre', 'fra'], collections: ['feature_films'] } },
  { id: 'local-en', source: 'internet-archive', langs: ['en'], filters: { languages: ['English', 'eng'], collections: ['feature_films'], yearTo: 1965 } },
  { id: 'featured', source: 'internet-archive', filters: { collections: ['feature_films'] } },
  { id: 'comedy', source: 'internet-archive', filters: { collections: ['Comedy_Films'] } },
  { id: 'noir', source: 'internet-archive', filters: { collections: ['Film_Noir'] } },
  { id: 'scifi', source: 'internet-archive', filters: { collections: ['SciFi_Horror'] } },
  { id: 'silent', source: 'internet-archive', filters: { collections: ['silent_films'] } },
  { id: 'animation', source: 'internet-archive', filters: { collections: ['animationandcartoons'] } },
  { id: 'shorts', source: 'internet-archive', filters: { collections: ['short_films'] } },
];

const ROW_LIMIT = 20;
const ROW_TIMEOUT_MS = 12_000;

export async function buildHome(
  lang: Lang,
  sources: MediaSource[],
  http: Http,
  rows: RowDef[] = ROWS,
): Promise<HomeResult> {
  const defs = rows.filter((r) => !r.langs || r.langs.includes(lang));
  let partial = false;

  const settled = await Promise.all(
    defs.map(async (def): Promise<HomeRow | null> => {
      const q = typeof def.q === 'string' ? def.q : (def.q?.[lang] ?? '');
      const result = await scan(
        sources,
        http,
        { q, kinds: ['video'], page: 1, limit: def.limit ?? ROW_LIMIT, ...(def.filters ? { filters: def.filters } : {}) },
        // L'accueil ne montre que des titres dont la licence libre est déclarée par la source.
        { sources: [def.source], timeoutMs: ROW_TIMEOUT_MS, freeOnly: true },
      );
      if (result.sources.some((s) => !s.ok)) partial = true;
      const items = def.uniqueWorks ? uniqueByWork(result.items) : result.items;
      return items.length > 0 ? { id: def.id, items } : null;
    }),
  );

  return { lang, rows: settled.filter((r): r is HomeRow => r !== null), partial };
}
