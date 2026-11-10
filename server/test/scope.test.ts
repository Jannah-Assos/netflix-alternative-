import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { GENRES } from '../src/catalog.js';
import { classifyLicense } from '../src/licenses.js';
import { ROWS } from '../src/home.js';
import { ENABLED_KINDS, EXCLUDED_COLLECTIONS, SCOPE_COLLECTIONS, enabledSourceIds } from '../src/scope.js';
import { buildQuery } from '../src/sources/internetArchive.js';
import { enabledSources } from '../src/sources/index.js';
import type { MediaSource } from '../src/sources/types.js';
import type { MediaItem, SearchParams } from '../src/types.js';
import { fakeHttp } from './helpers.js';

describe('périmètre du catalogue : films et animation', () => {
  it('la requête Internet Archive est limitée à une liste blanche de collections', () => {
    const q = buildQuery('pokemon', ['video'], {}, true, true);
    expect(q).toContain(`collection:(${SCOPE_COLLECTIONS.join(' OR ')})`);
    expect(q).toContain('-collection:(anime)');
    expect(q).toContain('mediatype:(movies)');
    // Sans la liste blanche (appel « brut »), rien n'est ajouté.
    expect(buildQuery('pokemon', ['video'], {}, true, false)).not.toContain('feature_films');
  });

  it('l’anime est exclu, et les séries TV ne sont pas dans les collections retenues', () => {
    expect(EXCLUDED_COLLECTIONS).toContain('anime');
    expect(SCOPE_COLLECTIONS).not.toContain('anime' as never);
    expect(SCOPE_COLLECTIONS).not.toContain('classic_tv' as never);
  });

  it('chaque genre proposé pointe vers une collection retenue', () => {
    for (const [id, f] of Object.entries(GENRES)) {
      for (const c of f.collections ?? []) expect(SCOPE_COLLECTIONS, `${id} → ${c}`).toContain(c as never);
    }
    expect(Object.keys(GENRES)).not.toContain('tv');
    expect(Object.keys(GENRES)).not.toContain('docs');
  });

  it('chaque rangée de l’accueil reste dans le périmètre (Internet Archive, collections retenues, aucune NASA ni PeerTube)', () => {
    for (const r of ROWS) {
      expect(r.source, r.id).toBe('internet-archive');
      for (const c of r.filters?.collections ?? []) expect(SCOPE_COLLECTIONS, `${r.id} → ${c}`).toContain(c as never);
    }
  });

  it('seule la vidéo est proposée', () => {
    expect(ENABLED_KINDS).toEqual(['video']);
  });
});

describe('sources actives', () => {
  it('Internet Archive par défaut', () => {
    expect(enabledSourceIds({})).toEqual(['internet-archive']);
    expect(enabledSources({}).map((s) => s.id)).toEqual(['internet-archive']);
  });

  it('OPENFLIX_SOURCES réactive d’autres sources, ignore les noms inconnus et les doublons', () => {
    expect(enabledSourceIds({ OPENFLIX_SOURCES: 'internet-archive, nasa,nasa,inconnue' })).toEqual(['internet-archive', 'nasa']);
    expect(enabledSourceIds({ OPENFLIX_SOURCES: 'inconnue,' })).toEqual(['internet-archive']);
    expect(enabledSources({ OPENFLIX_SOURCES: 'peertube' }).map((s) => s.id)).toEqual(['peertube']);
  });
});

describe('API : seul le périmètre est exposé', () => {
  const seen: SearchParams[] = [];
  const item = (): MediaItem => ({
    uid: 'internet-archive:a',
    source: 'internet-archive',
    sourceId: 'a',
    title: 'A',
    kind: 'video',
    year: 1950,
    pageUrl: 'https://x.test',
    license: classifyLicense('CC0'),
  });
  const source: MediaSource = {
    id: 'internet-archive',
    name: 'x',
    homepage: 'https://x.test',
    kinds: ['video', 'audio', 'software', 'text'],
    supportsBrowse: true,
    search: async (p) => (seen.push(p), [item()]),
    resolve: async (_id, kind) => ({ links: [{ url: `https://x.test/${kind}.mp4`, type: 'stream', score: 1, playable: true }] }),
  };
  const app = () => buildApp({ http: fakeHttp({}), sources: [source], staticDir: null });

  it('une demande d’audio, de logiciels ou de livres est ramenée à la vidéo', async () => {
    seen.length = 0;
    await app().inject('/api/search?q=x&kinds=audio,software,text');
    await app().inject('/api/search?q=x&kinds=audio,video');
    await app().inject('/api/search?q=x');
    expect(seen.map((p) => p.kinds)).toEqual([['video'], ['video'], ['video']]);
  });

  it('un titre déjà enregistré d’un autre type reste lisible (résolution non restreinte)', async () => {
    const r = await app().inject('/api/resolve?uid=internet-archive:a&kind=audio&check=0');
    expect(r.json().best.url).toBe('https://x.test/audio.mp4');
  });
});
