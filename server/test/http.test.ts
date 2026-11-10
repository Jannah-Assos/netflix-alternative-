import { describe, expect, it, vi } from 'vitest';
import { HttpError, assertPublicUrl, createHttp, detectProxied, isPrivateIp } from '../src/http.js';

const publicLookup = async () => [{ address: '93.184.216.34' }];

function res(body: unknown, init: ResponseInit = {}): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), init);
}

describe('isPrivateIp', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
    '%s est privée',
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  );
  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:2800:220:1:248:1893:25c8:1946'])('%s est publique', (ip) =>
    expect(isPrivateIp(ip)).toBe(false),
  );
});

describe('assertPublicUrl', () => {
  it('accepte une URL https publique', async () => {
    await expect(assertPublicUrl('https://archive.org/x', publicLookup)).resolves.toBeInstanceOf(URL);
  });

  it.each([
    'file:///etc/passwd',
    'ftp://archive.org/x',
    'http://localhost/x',
    'http://127.0.0.1/x',
    'http://[::1]/x',
    'http://169.254.169.254/latest/meta-data',
    'http://intranet/x',
    'http://service.internal/x',
    'https://archive.org:8443/x',
    'https://user:pw@archive.org/x',
    'pas une url',
  ])('refuse %s', async (u) => {
    await expect(assertPublicUrl(u, publicLookup)).rejects.toBeInstanceOf(HttpError);
  });

  it('refuse un nom de domaine qui résout vers une adresse privée', async () => {
    await expect(assertPublicUrl('https://evil.example/x', async () => [{ address: '10.0.0.5' }])).rejects.toThrow(/private/);
  });
});

describe('createHttp', () => {
  it('met les réponses JSON en cache', async () => {
    const fetchImpl = vi.fn(async () => res({ a: 1 }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.json('https://archive.org/a')).toEqual({ a: 1 });
    expect(await http.json('https://archive.org/a')).toEqual({ a: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('réessaie une fois après une erreur 503', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res('oups', { status: 503 }))
      .mockResolvedValueOnce(res({ ok: true }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup, retries: 1 });
    expect(await http.json('https://archive.org/r')).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('ne réessaie pas une 404', async () => {
    const fetchImpl = vi.fn(async () => res('non', { status: 404 }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup });
    await expect(http.json('https://archive.org/404')).rejects.toMatchObject({ status: 404 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('suit une redirection vers un hôte public', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res('', { status: 302, headers: { location: 'https://ia800.us.archive.org/f.mp4' } }))
      .mockResolvedValueOnce(res('', { status: 200, headers: { 'content-type': 'video/mp4', 'content-length': '1234' } }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.head('https://archive.org/download/x/f.mp4')).toMatchObject({
      alive: true,
      status: 200,
      contentType: 'video/mp4',
      sizeBytes: 1234,
    });
  });

  it('refuse une redirection vers une adresse privée (SSRF)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res('', { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.head('https://archive.org/x')).toEqual({ alive: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('head : retombe sur un GET partiel quand HEAD est refusé', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res('', { status: 405 }))
      .mockResolvedValueOnce(res('', { status: 206, headers: { 'content-range': 'bytes 0-0/987654' } }));
    const http = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: publicLookup });
    expect(await http.head('https://archive.org/y')).toMatchObject({ alive: true, status: 206, sizeBytes: 987654 });
  });

  it('head : 404 = hors ligne, erreur réseau = indéterminé', async () => {
    const down = createHttp({
      fetchImpl: (async () => res('', { status: 404 })) as unknown as typeof fetch,
      lookupImpl: publicLookup,
    });
    expect(await down.head('https://archive.org/z')).toMatchObject({ alive: false, status: 404 });

    const offline = createHttp({
      fetchImpl: (async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch,
      lookupImpl: publicLookup,
    });
    expect(await offline.head('https://archive.org/z')).toEqual({ alive: null });
  });
});

describe('derrière un proxy', () => {
  const noDns = async () => {
    throw Object.assign(new Error('getaddrinfo ENOTFOUND archive.org'), { code: 'ENOTFOUND' });
  };

  it('sans proxy, un échec DNS est une erreur réseau', async () => {
    await expect(assertPublicUrl('https://archive.org/x', noDns, false)).rejects.toMatchObject({ code: 'network' });
  });

  it('avec un proxy, un nom que le DNS local ne connaît pas est accepté (le proxy le résout)', async () => {
    await expect(assertPublicUrl('https://archive.org/x', noDns, true)).resolves.toBeInstanceOf(URL);
  });

  it('avec un proxy, les autres protections restent actives', async () => {
    for (const u of ['http://127.0.0.1/x', 'http://169.254.169.254/x', 'http://localhost/x', 'http://intranet/x', 'file:///etc/passwd', 'https://archive.org:8443/x']) {
      await expect(assertPublicUrl(u, noDns, true), u).rejects.toBeInstanceOf(HttpError);
    }
  });

  it('avec un proxy, un nom qui résout vers une adresse privée reste refusé', async () => {
    await expect(assertPublicUrl('https://evil.example/x', async () => [{ address: '10.0.0.5' }], true)).rejects.toThrow(/private/);
  });

  it('createHttp utilise l’option proxied', async () => {
    const fetchImpl = async () => new Response('{"ok":true}');
    const proxied = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: noDns, proxied: true });
    expect(await proxied.json('https://archive.org/p')).toEqual({ ok: true });
    const direct = createHttp({ fetchImpl: fetchImpl as unknown as typeof fetch, lookupImpl: noDns, proxied: false, retries: 0 });
    await expect(direct.json('https://archive.org/q')).rejects.toMatchObject({ code: 'network' });
  });

  it('detectProxied exige NODE_USE_ENV_PROXY=1 et une variable de proxy', () => {
    expect(detectProxied({ NODE_USE_ENV_PROXY: '1', HTTPS_PROXY: 'http://p:1' })).toBe(true);
    expect(detectProxied({ NODE_USE_ENV_PROXY: '1', http_proxy: 'http://p:1' })).toBe(true);
    expect(detectProxied({ NODE_USE_ENV_PROXY: '1' })).toBe(false);
    expect(detectProxied({ HTTPS_PROXY: 'http://p:1' })).toBe(false);
    expect(detectProxied({})).toBe(false);
  });
});
