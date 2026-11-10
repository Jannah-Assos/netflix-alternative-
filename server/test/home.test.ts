import { describe, expect, it } from 'vitest';
import { classifyLicense } from '../src/licenses.js';
import { ROWS, buildHome, type RowDef } from '../src/home.js';
import type { MediaSource } from '../src/sources/types.js';
import type { MediaItem, SearchParams, SourceId } from '../src/types.js';
import { fakeHttp } from './helpers.js';

const item = (source: SourceId, n: number): MediaItem => ({
  uid: `${source}:${n}`,
  source,
  sourceId: String(n),
  title: `${source} ${n}`,
  kind: 'video',
  pageUrl: 'https://x.test',
  license: classifyLicense('CC0'),
});

function source(id: SourceId, search: (p: SearchParams) => Promise<MediaItem[]>, supportsBrowse = true): MediaSource {
  return { id, name: id, homepage: 'https://x.test', kinds: ['video'], supportsBrowse, search, resolve: async () => ({ links: [] }) };
}

describe('buildHome', () => {
  const seen: SearchParams[] = [];
  const ia = source('internet-archive', async (p) => (seen.push(p), [item('internet-archive', 1)]));
  const nasa = source('nasa', async (p) => (seen.push(p), [item('nasa', 1)]), false);
  const defs: RowDef[] = [
    { id: 'local-fr', source: 'internet-archive', langs: ['fr'], filters: { languages: ['French'] } },
    { id: 'local-en', source: 'internet-archive', langs: ['en'] },
    { id: 'featured', source: 'internet-archive', filters: { collections: ['feature_films'] } },
    { id: 'space', source: 'nasa', q: { fr: 'lune', en: 'moon' } },
  ];

  it('ne garde que les rangées de la langue demandée et transmet filtres et requêtes', async () => {
    seen.length = 0;
    const fr = await buildHome('fr', [ia, nasa], fakeHttp({}), defs);
    expect(fr.rows.map((r) => r.id)).toEqual(['local-fr', 'featured', 'space']);
    expect(seen.find((p) => p.filters?.languages)?.filters?.languages).toEqual(['French']);
    expect(seen.find((p) => p.q === 'lune')).toBeDefined();

    const en = await buildHome('en', [ia, nasa], fakeHttp({}), defs);
    expect(en.rows.map((r) => r.id)).toEqual(['local-en', 'featured', 'space']);
    expect(seen.find((p) => p.q === 'moon')).toBeDefined();
    expect(fr.lang).toBe('fr');
    expect(en.partial).toBe(false);
  });

  it('masque une rangée vide ou en échec et signale un accueil partiel', async () => {
    const broken = source('nasa', async () => {
      throw new Error('HTTP 503');
    });
    const empty = source('internet-archive', async () => []);
    const r = await buildHome('en', [empty, broken], fakeHttp({}), defs);
    expect(r.rows).toEqual([]);
    expect(r.partial).toBe(true);
  });

  it('les rangées par défaut sont cohérentes', () => {
    const ids = ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ROWS.filter((r) => !r.langs).length).toBeGreaterThan(4);
    for (const r of ROWS.filter((r) => r.langs)) expect(r.id.startsWith('local-')).toBe(true);
  });

  it('ne demande que des titres à licence libre déclarée', async () => {
    const asked: SearchParams[] = [];
    const spy = source('internet-archive', async (p) => (asked.push(p), [item('internet-archive', 1)]));
    await buildHome('en', [spy], fakeHttp({}), [{ id: 'featured', source: 'internet-archive', filters: { collections: ['feature_films'] } }]);
    expect(asked[0]?.filters).toMatchObject({ collections: ['feature_films'], licensed: true });
  });
});
