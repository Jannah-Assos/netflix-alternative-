import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { classifyLicense } from '../src/licenses.js';
import type { MediaSource } from '../src/sources/types.js';
import { fakeHttp } from './helpers.js';

const demo: MediaSource = {
  id: 'internet-archive',
  name: 'Démo',
  homepage: 'https://x.test',
  kinds: ['video'],
  supportsBrowse: true,
  search: async () => [
    {
      uid: 'internet-archive:a',
      source: 'internet-archive',
      sourceId: 'a',
      title: 'A',
      kind: 'video',
      pageUrl: 'https://x.test',
      license: classifyLicense('CC0'),
    },
  ],
  resolve: async () => ({ links: [] }),
};

function siteDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'oms-site-'));
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>app</title>');
  writeFileSync(path.join(dir, 'sw.js'), '// sw');
  writeFileSync(path.join(dir, 'manifest.webmanifest'), '{"name":"Open Media"}');
  writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), 'console.log(1)');
  return dir;
}

describe('en-têtes de sécurité', () => {
  it('sont présents sur l’API et sur les fichiers, avec une CSP stricte', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: siteDir() });
    for (const url of ['/api/health', '/', '/sw.js']) {
      const res = await app.inject(url);
      expect(res.headers['x-content-type-options'], url).toBe('nosniff');
      expect(res.headers['referrer-policy'], url).toBe('no-referrer');
      const csp = String(res.headers['content-security-policy']);
      expect(csp, url).toContain("script-src 'self'");
      expect(csp, url).toContain("frame-ancestors 'none'");
      expect(csp, url).toContain("object-src 'none'");
      expect(csp, url).not.toMatch(/script-src[^;]*unsafe/);
    }
  });
});

describe('cache des fichiers', () => {
  it('assets à empreinte : cache longue durée ; page, service worker et manifeste : toujours revalidés', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: siteDir() });
    expect((await app.inject('/assets/index-abc123.js')).headers['cache-control']).toBe('public, max-age=31536000, immutable');
    for (const url of ['/', '/sw.js', '/manifest.webmanifest']) {
      expect(String((await app.inject(url)).headers['cache-control']), url).toMatch(/max-age=0/);
    }
  });

  it('sert le manifeste avec un type MIME reconnu et retombe sur index.html pour les routes de l’interface', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: siteDir() });
    expect(String((await app.inject('/manifest.webmanifest')).headers['content-type'])).toMatch(/manifest\+json|application\/json/);
    const fallback = await app.inject('/n-importe-quelle-route');
    expect(fallback.statusCode).toBe(200);
    expect(fallback.body).toContain('<title>app</title>');
    expect((await app.inject('/api/inconnue')).statusCode).toBe(404);
  });
});

describe('limitation de débit', () => {
  it('bloque au-delà du maximum avec un code 429 et Retry-After', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: null, rateLimitMax: 3 });
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await app.inject('/api/sources')).statusCode);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
    const blocked = await app.inject('/api/sources');
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.json().error).toMatch(/rate limit/i);
  });

  it('ne limite pas les fichiers de l’application', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: siteDir(), rateLimitMax: 2 });
    for (let i = 0; i < 6; i++) expect((await app.inject('/')).statusCode).toBe(200);
  });

  it('limite plus bas la route /api/resolve (coûteuse)', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: null, rateLimitMax: 1000 });
    const codes: number[] = [];
    for (let i = 0; i < 42; i++) codes.push((await app.inject('/api/resolve?uid=internet-archive:a&check=0')).statusCode);
    expect(codes.slice(0, 40).every((c) => c === 200)).toBe(true);
    expect(codes.slice(40)).toEqual([429, 429]);
  });

  it('rateLimitMax = 0 désactive la limite', async () => {
    const app = buildApp({ http: fakeHttp({}), sources: [demo], staticDir: null, rateLimitMax: 0 });
    for (let i = 0; i < 30; i++) expect((await app.inject('/api/health')).statusCode).toBe(200);
  });
});
