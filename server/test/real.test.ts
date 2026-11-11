/**
 * Ces tests utilisent de VRAIES réponses des API, capturées le 10/11/2026 (test/fixtures/*.json).
 * Elles protègent les parseurs contre un décalage entre la documentation et la réalité.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createHttp } from '../src/http.js';
import { pickBest } from '../src/linkPicker.js';
import { internetArchive } from '../src/sources/internetArchive.js';
import { nasa } from '../src/sources/nasa.js';
import { peertube } from '../src/sources/peertube.js';
import { wikimediaCommons } from '../src/sources/wikimediaCommons.js';
import { fakeHttp } from './helpers.js';

const fx = (name: string): unknown => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const params = (q: string) => ({ q, kinds: ['video' as const], page: 1, limit: 5 });

describe('Internet Archive (réponses réelles)', () => {
  it('recherche : 4 films muets avec miniature, année et licence', async () => {
    const items = await internetArchive.search(params('nosferatu'), fakeHttp({ advancedsearch: fx('ia-search.json') }));
    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({
      source: 'internet-archive',
      kind: 'video',
      year: 1919,
      thumbnail: expect.stringMatching(/^https:\/\/archive\.org\/services\/img\//),
      pageUrl: expect.stringMatching(/^https:\/\/archive\.org\/details\//),
      license: { category: 'public-domain', verified: true },
    });
    // Beaucoup d'items n'ont aucune licence déclarée : ils doivent rester « non vérifiés ».
    expect(items.filter((i) => !i.license.verified).length).toBeGreaterThan(0);
    for (const i of items) expect(i.title.length).toBeGreaterThan(0);
  });

  it('résolution : le MP4 (lisible partout) passe avant l’OGV, avec lecteur intégré et page en secours', async () => {
    const r = await internetArchive.resolve('Das', 'video', fakeHttp({ '/metadata/': fx('ia-metadata.json') }));
    const streams = r.links.filter((l) => l.type === 'stream');
    expect(streams.map((l) => l.format)).toEqual(['mp4', 'ogv']);
    expect(pickBest(r.links)?.url).toMatch(/^https:\/\/archive\.org\/download\/Das\/.*_512kb\.mp4$/);
    expect(r.links.map((l) => l.type).slice(-2)).toEqual(['embed', 'page']);
    // Pas de vignettes, de métadonnées ni de torrents dans les liens.
    expect(r.links.some((l) => /\.(jpg|gif|xml|torrent|sqlite)$/i.test(l.url))).toBe(false);
  });
});

describe('NASA (réponses réelles)', () => {
  it('recherche : vidéos du domaine public, miniatures en https', async () => {
    const items = await nasa.search(params('apollo 11'), fakeHttp({ 'images-api.nasa.gov/search': fx('nasa-search.json') }));
    expect(items).toHaveLength(3);
    for (const i of items) {
      expect(i.license).toMatchObject({ category: 'public-domain', verified: true });
      expect(i.thumbnail).toMatch(/^https:\/\//);
      expect(i.kind).toBe('video');
    }
    expect(items[1]?.year).toBe(1969);
  });

  it('résolution : ~small avant l’original d’1,5 Go, ~preview écarté, sous-titres et images ignorés', async () => {
    const r = await nasa.resolve('x', 'video', fakeHttp({ '/asset/': fx('nasa-asset.json') }));
    const streams = r.links.filter((l) => l.type === 'stream');
    expect(streams.map((l) => l.variant)).toEqual(['small', 'original', 'mobile']);
    expect(streams.every((l) => l.url.startsWith('https://'))).toBe(true);
    expect(r.links.some((l) => /preview|\.vtt|\.jpg|\.json/.test(l.url))).toBe(false);
  });
});

describe('PeerTube (réponses réelles)', () => {
  it('recherche : uniquement des vidéos sous licence Creative Commons', async () => {
    const items = await peertube.search(params('blender'), fakeHttp({ 'sepiasearch.org': fx('peertube-search.json') }));
    expect(items.length).toBeGreaterThan(0);
    for (const i of items) {
      expect(['cc', 'cc-nc', 'public-domain']).toContain(i.license.category);
      expect(i.sourceId).toMatch(/^[a-z0-9.-]+\|[0-9a-f-]{36}$/);
    }
    expect(items[0]?.license.label).toBe('CC BY-SA 4.0');
  });

  it('résolution : toutes les résolutions MP4, de la meilleure à la plus légère', async () => {
    const [first] = await peertube.search(params('blender'), fakeHttp({ 'sepiasearch.org': fx('peertube-search.json') }));
    const r = await peertube.resolve(first!.sourceId, 'video', fakeHttp({ '/api/v1/videos/': fx('peertube-detail.json') }));
    const heights = r.links.filter((l) => l.type === 'stream').map((l) => l.height);
    expect(heights).toEqual([...heights].sort((a, b) => (b ?? 0) - (a ?? 0)));
    expect(heights.length).toBeGreaterThanOrEqual(3);
    expect(pickBest(r.links)?.format).toBe('mp4');
    expect(r.links.map((l) => l.type).slice(-2)).toEqual(['embed', 'page']);
  });
});

describe('Wikimedia Commons (réponses réelles)', () => {
  it('recherche : licence CC, miniature et durée', async () => {
    const items = await wikimediaCommons.search(params('bunny'), fakeHttp({ 'commons.wikimedia.org': fx('commons-search.json') }));
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ title: 'Big Buck Bunny 4K', license: { label: 'CC BY 3.0', verified: true }, durationSec: expect.any(Number) });
    for (const i of items) {
      expect(i.thumbnail).toMatch(/^https:\/\//);
      expect(i.uid.startsWith('wikimedia-commons:File:')).toBe(true);
    }
  });

  it('résolution : le WebM 1080p transcodé passe avant l’original 4K de 2,9 Go ; DASH et .mov écartés', async () => {
    const r = await wikimediaCommons.resolve('File:Big_Buck_Bunny_4K.webm', 'video', fakeHttp({ 'commons.wikimedia.org': fx('commons-file.json') }));
    const streams = r.links.filter((l) => l.type === 'stream');
    expect(pickBest(r.links)?.url).toMatch(/\.1080p\.vp9\.webm$/);
    expect(streams.map((l) => l.height)).toEqual([1080, 2250, 480, 240]);
    expect(streams[1]?.sizeBytes).toBeGreaterThan(2.9e9); // l'original : toujours proposé, mais pas en premier
    expect(r.links.some((l) => /\.mpd$|\.mov$/.test(l.url))).toBe(false);
    expect(r.license).toMatchObject({ category: 'cc', label: 'CC BY 3.0' });
  });
});

describe('client HTTP : limites de débit', () => {
  const publicLookup = async () => [{ address: '93.184.216.34' }];

  it('un 429 sur un lien n’est pas « hors ligne » mais « indéterminé »', async () => {
    const http = createHttp({ fetchImpl: (async () => new Response('', { status: 429 })) as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.head('https://upload.wikimedia.org/x.webm')).toMatchObject({ alive: null, status: 429 });
  });

  it('un vrai 404 reste « hors ligne »', async () => {
    const http = createHttp({ fetchImpl: (async () => new Response('', { status: 404 })) as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.head('https://upload.wikimedia.org/x.webm')).toMatchObject({ alive: false, status: 404 });
  });

  it('respecte Retry-After avant de réessayer', async () => {
    let calls = 0;
    const times: number[] = [];
    const fetchImpl = async () => {
      times.push(Date.now());
      return calls++ === 0 ? new Response('', { status: 429, headers: { 'retry-after': '1' } }) : new Response('{"ok":true}');
    };
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup, retries: 1 });
    expect(await http.json('https://commons.wikimedia.org/w/api.php?x=1')).toEqual({ ok: true });
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(950);
  });
});
