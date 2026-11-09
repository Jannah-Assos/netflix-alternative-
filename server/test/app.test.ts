import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { classifyLicense } from '../src/licenses.js';
import type { MediaSource } from '../src/sources/types.js';
import type { MediaLink } from '../src/types.js';
import { fakeHttp } from './helpers.js';

const stream: MediaLink = { url: 'https://x.test/a.mp4', type: 'stream', format: 'mp4', score: 100, playable: true };
const page: MediaLink = { url: 'https://x.test/p', type: 'page', score: 1, playable: false };

const demo: MediaSource = {
  id: 'internet-archive',
  name: 'Démo',
  homepage: 'https://x.test',
  kinds: ['video', 'audio'],
  supportsBrowse: true,
  async search(params) {
    return [
      {
        uid: 'internet-archive:a',
        source: 'internet-archive',
        sourceId: 'a',
        title: `résultat pour « ${params.q} » p${params.page} l${params.limit} ${params.kinds.join('+')}`,
        kind: 'video',
        pageUrl: 'https://x.test/p',
        license: classifyLicense('CC0'),
      },
    ];
  },
  async resolve(id, kind) {
    return { links: id === 'rien' ? [page] : [stream, page] };
  },
};

function app(head = { alive: true as boolean | null, status: 200 }) {
  return buildApp({ http: fakeHttp({}, head), sources: [demo], staticDir: null });
}

describe('API', () => {
  it('GET /api/sources liste les sources sans leurs fonctions', async () => {
    const res = await app().inject('/api/sources');
    expect(res.json()).toEqual([
      { id: 'internet-archive', name: 'Démo', homepage: 'https://x.test', kinds: ['video', 'audio'], supportsBrowse: true },
    ]);
  });

  it('GET /api/search valide et borne les paramètres', async () => {
    const res = await app().inject('/api/search?q=%20chaplin%20&kinds=video,nimportequoi&page=999&limit=500');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items[0].title).toBe('résultat pour « chaplin » p50 l50 video');
    expect(body.sources[0]).toMatchObject({ source: 'internet-archive', ok: true, count: 1 });
  });

  it('GET /api/search : type inconnu → tous les types, recherche vide acceptée', async () => {
    const res = await app().inject('/api/search?kinds=zzz');
    // La source de démo ne gère que video+audio : le serveur transmet l'intersection.
    expect(res.json().items[0].title).toBe('résultat pour «  » p1 l24 video+audio');
  });

  it('GET /api/search refuse une requête trop longue', async () => {
    const res = await app().inject(`/api/search?q=${'a'.repeat(201)}`);
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/resolve renvoie le meilleur lien et sa vérification', async () => {
    const res = await app().inject('/api/resolve?uid=internet-archive:a&kind=video');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ best: { url: stream.url }, check: { alive: true, status: 200 } });
    expect(res.json().links).toHaveLength(2);
  });

  it('GET /api/resolve?check=0 saute la vérification', async () => {
    const res = await app().inject('/api/resolve?uid=internet-archive:a&check=0');
    expect(res.json().check).toBeUndefined();
  });

  it('GET /api/resolve sans lien direct → pas de best', async () => {
    const res = await app().inject('/api/resolve?uid=internet-archive:rien');
    expect(res.json().best).toBeUndefined();
    expect(res.json().check).toBeUndefined();
  });

  it.each(['', 'sans-deux-points', 'inconnue:abc', 'internet-archive:', `internet-archive:${'a'.repeat(301)}`])(
    'GET /api/resolve refuse uid=%s',
    async (uid) => {
      const res = await app().inject(`/api/resolve?uid=${encodeURIComponent(uid)}`);
      expect(res.statusCode).toBe(400);
    },
  );

  it('une erreur de source remonte en JSON, sans fuite de pile', async () => {
    const broken: MediaSource = {
      ...demo,
      async resolve() {
        throw new Error('HTTP 503');
      },
    };
    const a = buildApp({ http: fakeHttp({}), sources: [broken], staticDir: null });
    const res = await a.inject('/api/resolve?uid=internet-archive:a');
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'HTTP 503' });
  });

  it('GET /api/home renvoie les rangées de la langue demandée (anglais par défaut)', async () => {
    const a = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: null });
    const fr = (await a.inject('/api/home?lang=fr')).json();
    expect(fr.lang).toBe('fr');
    expect(fr.rows.map((r: { id: string }) => r.id)).toContain('local-fr');
    const other = (await a.inject('/api/home?lang=zz')).json();
    expect(other.lang).toBe('en');
    expect(other.rows.map((r: { id: string }) => r.id)).toContain('local-en');
  });

  it('GET /api/home met le résultat en cache', async () => {
    let calls = 0;
    const counting: MediaSource = { ...demo, search: async (p) => (calls++, demo.search(p, fakeHttp({}))) };
    const a = buildApp({ http: fakeHttp({}), sources: [counting], staticDir: null });
    await a.inject('/api/home?lang=en');
    const after = calls;
    await a.inject('/api/home?lang=en');
    expect(calls).toBe(after);
  });
});
