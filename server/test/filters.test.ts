import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { GENRES, PERIODS, parseCatalogQuery } from '../src/catalog.js';
import { classifyLicense } from '../src/licenses.js';
import { order, scan } from '../src/scan.js';
import { internetArchive } from '../src/sources/internetArchive.js';
import { nasa } from '../src/sources/nasa.js';
import { peertube } from '../src/sources/peertube.js';
import type { MediaSource } from '../src/sources/types.js';
import { GENRE_IDS, PERIOD_IDS, type MediaItem, type SearchParams, type SourceId } from '../src/types.js';
import { fakeHttp } from './helpers.js';

const item = (source: SourceId, n: number, title: string, year?: number): MediaItem => ({
  uid: `${source}:${n}`,
  source,
  sourceId: String(n),
  title,
  kind: 'video',
  ...(year !== undefined ? { year } : {}),
  pageUrl: 'https://x.test',
  license: classifyLicense('CC0'),
});

describe('parseCatalogQuery (liste blanche)', () => {
  it('traduit genre, période, langue et tri', () => {
    expect(parseCatalogQuery({ genre: 'noir', period: 'y1950', lang: 'fr', sort: 'recent' })).toEqual({
      filters: {
        collections: ['Film_Noir'],
        yearFrom: 1950,
        yearTo: 1969,
        langCode: 'fr',
        languages: ['French', 'fre', 'fra'],
      },
      sort: 'recent',
    });
  });

  it('ignore toute valeur hors liste blanche (aucune injection Lucene possible)', () => {
    expect(parseCatalogQuery({ genre: 'feature_films) OR (mediatype:texts', period: '1950', lang: 'de', sort: 'drop table' })).toEqual({
      filters: {},
      sort: 'popular',
    });
    expect(parseCatalogQuery({ genre: ['film'], sort: 42 })).toEqual({ filters: {}, sort: 'popular' });
    expect(parseCatalogQuery({})).toEqual({ filters: {}, sort: 'popular' });
  });

  it('chaque genre et chaque période déclarés ont une définition', () => {
    for (const g of GENRE_IDS) expect(GENRES[g], g).toBeDefined();
    for (const p of PERIOD_IDS) expect(PERIODS[p], p).toBeDefined();
    expect(Object.keys(GENRES).sort()).toEqual([...GENRE_IDS].sort());
    expect(Object.keys(PERIODS).sort()).toEqual([...PERIOD_IDS].sort());
  });

  it('les périodes ne se chevauchent pas', () => {
    const ranges = PERIOD_IDS.map((p) => PERIODS[p]).sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
    for (let i = 1; i < ranges.length; i++) expect(ranges[i]!.from!).toBeGreaterThan(ranges[i - 1]!.to!);
  });
});

describe('sources : paramètres envoyés', () => {
  const p = (extra: Partial<SearchParams>): SearchParams => ({ q: 'film', kinds: ['video'], page: 1, limit: 10, ...extra });

  it.each([
    ['popular', 'downloads desc'],
    ['recent', 'date desc'],
    ['oldest', 'date asc'],
    ['title', 'titleSorter asc'],
  ] as const)('Internet Archive trie « %s » par « %s »', async (sort, expected) => {
    const http = fakeHttp({ advancedsearch: { response: { docs: [] } } });
    await internetArchive.search(p({ sort }), http);
    expect(new URL(http.calls[0] as string).searchParams.getAll('sort[]')).toEqual([expected]);
  });

  it('Internet Archive : genre, période et langue dans la requête', async () => {
    const http = fakeHttp({ advancedsearch: { response: { docs: [] } } });
    const { filters } = parseCatalogQuery({ genre: 'comedy', period: 'y1930', lang: 'en' });
    await internetArchive.search(p({ filters }), http);
    const q = new URL(http.calls[0] as string).searchParams.get('q') as string;
    expect(q).toContain('collection:(Comedy_Films)');
    expect(q).toContain('language:(English OR eng)');
    expect(q).toContain('year:[1930 TO 1949]');
  });

  it('PeerTube : langue et tri vérifiés sur la vraie API', async () => {
    const http = fakeHttp({ 'sepiasearch.org': { data: [] } });
    await peertube.search(p({ sort: 'recent', filters: { langCode: 'fr' } }), http);
    const u = new URL(http.calls[0] as string);
    expect(u.searchParams.get('sort')).toBe('-publishedAt');
    expect(u.searchParams.get('languageOneOf')).toBe('fr');
    const http2 = fakeHttp({ 'sepiasearch.org': { data: [] } });
    await peertube.search(p({ sort: 'oldest' }), http2);
    expect(new URL(http2.calls[0] as string).searchParams.get('sort')).toBe('publishedAt');
    expect(new URL(http2.calls[0] as string).searchParams.has('languageOneOf')).toBe(false);
  });

  it('NASA : période transmise (bornes par défaut si une seule est donnée)', async () => {
    const http = fakeHttp({ 'images-api.nasa.gov/search': { collection: { items: [] } } });
    await nasa.search(p({ filters: { yearFrom: 1969, yearTo: 1970 } }), http);
    expect(new URL(http.calls[0] as string).searchParams.get('year_start')).toBe('1969');
    expect(new URL(http.calls[0] as string).searchParams.get('year_end')).toBe('1970');
    const http2 = fakeHttp({ 'images-api.nasa.gov/search': { collection: { items: [] } } });
    await nasa.search(p({ filters: { yearFrom: 2000 } }), http2);
    expect(new URL(http2.calls[0] as string).searchParams.get('year_end')).toBe('2100');
    const http3 = fakeHttp({ 'images-api.nasa.gov/search': { collection: { items: [] } } });
    await nasa.search(p({}), http3);
    expect(new URL(http3.calls[0] as string).searchParams.has('year_start')).toBe(false);
  });
});

describe('scan : filtres, période et tri', () => {
  const mk = (id: SourceId, items: MediaItem[], supports: MediaSource['supports'] = {}): MediaSource => ({
    id,
    name: id,
    homepage: 'https://x.test',
    kinds: ['video'],
    supportsBrowse: true,
    supports,
    search: async () => items,
    resolve: async () => ({ links: [] }),
  });
  const params = { q: 'x', kinds: ['video' as const], page: 1, limit: 20 };
  const http = fakeHttp({});

  it('ignore (et le dit) les sources qui ne gèrent pas le genre ou la langue', async () => {
    const ia = mk('internet-archive', [item('internet-archive', 1, 'A', 1950)], { genre: true, lang: true });
    const nas = mk('nasa', [item('nasa', 1, 'B', 1950)]);
    const pt = mk('peertube', [item('peertube', 1, 'C', 1950)], { lang: true });

    const genre = await scan([ia, nas, pt], http, { ...params, filters: { collections: ['Film_Noir'] } });
    expect(genre.items.map((i) => i.title)).toEqual(['A']);
    expect(genre.sources.map((s) => s.skipped)).toEqual([undefined, 'filter-unsupported', 'filter-unsupported']);

    const lang = await scan([ia, nas, pt], http, { ...params, filters: { langCode: 'fr', languages: ['French'] } });
    expect(lang.items.map((i) => i.title).sort()).toEqual(['A', 'C']);
    expect(lang.sources.find((s) => s.source === 'nasa')?.skipped).toBe('filter-unsupported');
  });

  it('applique la période à toutes les sources, titres sans année exclus', async () => {
    const s = mk('nasa', [item('nasa', 1, 'Vieux', 1925), item('nasa', 2, 'Milieu', 1955), item('nasa', 3, 'Récent', 2010), item('nasa', 4, 'Sans année')]);
    const r = await scan([s], http, { ...params, filters: { yearFrom: 1950, yearTo: 1969 } });
    expect(r.items.map((i) => i.title)).toEqual(['Milieu']);
    expect((await scan([s], http, params)).items).toHaveLength(4);
  });

  it('order : récent, ancien et titre ; sans année en dernier ; popularité = entrelacement', () => {
    const a = [item('nasa', 1, 'Zèbre', 1990), item('nasa', 2, 'Abeille')];
    const b = [item('peertube', 1, 'Mouette', 2020), item('peertube', 2, 'Ânon', 1950)];
    expect(order([a, b], 'recent').map((i) => i.title)).toEqual(['Mouette', 'Zèbre', 'Ânon', 'Abeille']);
    expect(order([a, b], 'oldest').map((i) => i.title)).toEqual(['Ânon', 'Zèbre', 'Mouette', 'Abeille']);
    expect(order([a, b], 'title').map((i) => i.title)).toEqual(['Abeille', 'Ânon', 'Mouette', 'Zèbre']);
    expect(order([a, b], 'popular').map((i) => i.title)).toEqual(['Zèbre', 'Mouette', 'Abeille', 'Ânon']);
  });
});

describe('API /api/search : filtres', () => {
  it('transmet genre, période, langue et tri aux sources, et ignore le reste', async () => {
    const seen: SearchParams[] = [];
    const spy: MediaSource = {
      id: 'internet-archive',
      name: 'x',
      homepage: 'https://x.test',
      kinds: ['video'],
      supportsBrowse: true,
      supports: { genre: true, lang: true },
      search: async (params) => (seen.push(params), []),
      resolve: async () => ({ links: [] }),
    };
    const a = buildApp({ http: fakeHttp({}), sources: [spy], staticDir: null });
    await a.inject('/api/search?q=x&kinds=video&genre=scifi&period=y1970&lang=fr&sort=title');
    expect(seen[0]).toMatchObject({
      sort: 'title',
      filters: { collections: ['SciFi_Horror'], yearFrom: 1970, yearTo: 1999, langCode: 'fr' },
    });
    await a.inject('/api/search?q=x&kinds=video&genre=nimporte&period=1&lang=zz&sort=zz');
    expect(seen[1]?.filters).toBeUndefined();
    expect(seen[1]?.sort).toBe('popular');
  });
});
