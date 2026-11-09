import { describe, expect, it } from 'vitest';
import { interleave, scan } from '../src/scan.js';
import type { MediaSource } from '../src/sources/types.js';
import type { MediaItem, SourceId } from '../src/types.js';
import { classifyLicense } from '../src/licenses.js';
import { fakeHttp } from './helpers.js';

const item = (source: SourceId, n: number, licenseUrl?: string): MediaItem => ({
  uid: `${source}:${n}`,
  source,
  sourceId: String(n),
  title: `${source} ${n}`,
  kind: 'video',
  pageUrl: `https://x.test/${source}/${n}`,
  license: classifyLicense(null, licenseUrl),
});

function source(id: SourceId, impl: () => Promise<MediaItem[]>, extra: Partial<MediaSource> = {}): MediaSource {
  return {
    id,
    name: id,
    homepage: 'https://x.test',
    kinds: ['video'],
    supportsBrowse: true,
    search: impl,
    resolve: async () => ({ links: [] }),
    ...extra,
  };
}

const params = { q: 'film', kinds: ['video' as const], page: 1, limit: 3 };

describe('interleave', () => {
  it('mélange les listes de longueurs différentes', () => {
    expect(interleave([[1, 2, 3], [10], [20, 21]])).toEqual([1, 10, 20, 2, 21, 3]);
    expect(interleave([])).toEqual([]);
  });
});

describe('scan', () => {
  const http = fakeHttp({});

  it('entrelace les sources et conserve l’ordre des statuts', async () => {
    const a = source('internet-archive', async () => [item('internet-archive', 1), item('internet-archive', 2)]);
    const b = source('wikimedia-commons', async () => [item('wikimedia-commons', 1)]);
    const r = await scan([a, b], http, params);
    expect(r.items.map((i) => i.uid)).toEqual(['internet-archive:1', 'wikimedia-commons:1', 'internet-archive:2']);
    expect(r.sources.map((s) => [s.source, s.ok, s.count])).toEqual([
      ['internet-archive', true, 2],
      ['wikimedia-commons', true, 1],
    ]);
  });

  it('isole une source en échec', async () => {
    const ok = source('internet-archive', async () => [item('internet-archive', 1)]);
    const ko = source('nasa', async () => {
      throw new Error('HTTP 503');
    });
    const r = await scan([ok, ko], http, params);
    expect(r.items).toHaveLength(1);
    expect(r.sources.find((s) => s.source === 'nasa')).toMatchObject({ ok: false, error: 'HTTP 503' });
  });

  it('coupe une source trop lente', async () => {
    const slow = source('peertube', () => new Promise<MediaItem[]>(() => undefined));
    const fast = source('internet-archive', async () => [item('internet-archive', 1)]);
    const r = await scan([slow, fast], http, params, { timeoutMs: 30 });
    expect(r.items).toHaveLength(1);
    expect(r.sources.find((s) => s.source === 'peertube')?.error).toMatch(/délai dépassé/);
  });

  it('filtre freeOnly sur les licences vérifiées', async () => {
    const s = source('internet-archive', async () => [
      item('internet-archive', 1, 'https://creativecommons.org/publicdomain/mark/1.0/'),
      item('internet-archive', 2),
    ]);
    const all = await scan([s], http, params);
    const free = await scan([s], http, params, { freeOnly: true });
    expect(all.items).toHaveLength(2);
    expect(free.items.map((i) => i.sourceId)).toEqual(['1']);
  });

  it('ignore les sources qui ne gèrent pas le type demandé ou la navigation sans mot-clé', async () => {
    let called = 0;
    const audioOnly = source('nasa', async () => (called++, []), { kinds: ['audio'] });
    const needsQuery = source('peertube', async () => (called++, []), { supportsBrowse: false });
    const r = await scan([audioOnly, needsQuery], http, { ...params, q: '' });
    expect(called).toBe(0);
    expect(r.sources.every((s) => s.ok && s.skipped)).toBe(true);
  });

  it('respecte la sélection de sources, retire les doublons et signale hasMore', async () => {
    const a = source('internet-archive', async () => [item('internet-archive', 1), item('internet-archive', 1), item('internet-archive', 2)]);
    const b = source('nasa', async () => {
      throw new Error('ne doit pas être appelée');
    });
    const r = await scan([a, b], http, params, { sources: ['internet-archive'] });
    expect(r.items.map((i) => i.sourceId)).toEqual(['1', '2']);
    expect(r.sources).toHaveLength(1);
    expect(r.hasMore).toBe(true); // 3 résultats bruts = limite
  });
});
