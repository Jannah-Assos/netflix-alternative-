import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { buildHome } from './home.js';
import { HttpError, createHttp, type Http } from './http.js';
import { pickBest } from './linkPicker.js';
import { scan } from './scan.js';
import { ALL_SOURCES, findSource, type MediaSource } from './sources/index.js';
import {
  MEDIA_KINDS,
  type HomeResult,
  type Lang,
  type MediaKind,
  type ResolveResult,
  type SourceId,
  type SourceInfo,
} from './types.js';

export interface AppDeps {
  http?: Http;
  sources?: MediaSource[];
  /** Dossier du build web à servir (par défaut web/dist s'il existe). */
  staticDir?: string | null;
}

const MAX_Q = 200;
const HOME_TTL_MS = 30 * 60_000;

function parseKinds(raw: unknown): MediaKind[] {
  if (typeof raw !== 'string' || !raw) return [...MEDIA_KINDS];
  const kinds = raw.split(',').filter((k): k is MediaKind => (MEDIA_KINDS as readonly string[]).includes(k));
  return kinds.length ? [...new Set(kinds)] : [...MEDIA_KINDS];
}

function clampInt(raw: unknown, def: number, min: number, max: number): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

export function buildApp(deps: AppDeps = {}): FastifyInstance {
  const http = deps.http ?? createHttp();
  const sources = deps.sources ?? ALL_SOURCES;
  const app = Fastify({ logger: false });
  const homeCache = new Map<Lang, { at: number; ttl: number; value: HomeResult }>();

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/sources', async (): Promise<SourceInfo[]> =>
    sources.map(({ id, name, homepage, kinds, supportsBrowse }) => ({ id, name, homepage, kinds, supportsBrowse })),
  );

  app.get('/api/search', async (req, reply) => {
    const query = req.query as Record<string, unknown>;
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    if (q.length > MAX_Q) return reply.code(400).send({ error: `q too long (max ${MAX_Q})` });

    const wanted =
      typeof query.sources === 'string' && query.sources
        ? (query.sources.split(',').filter((id) => findSource(id, sources)) as SourceId[])
        : undefined;

    return scan(
      sources,
      http,
      {
        q,
        kinds: parseKinds(query.kinds),
        page: clampInt(query.page, 1, 1, 50),
        limit: clampInt(query.limit, 24, 1, 50),
      },
      { ...(wanted?.length ? { sources: wanted } : {}), freeOnly: query.freeOnly === '1' },
    );
  });

  app.get('/api/home', async (req): Promise<HomeResult> => {
    const raw = (req.query as Record<string, unknown>).lang;
    const lang: Lang = raw === 'fr' ? 'fr' : 'en';
    const hit = homeCache.get(lang);
    if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
    const value = await buildHome(lang, sources, http);
    // Un accueil incomplet (source en panne) est gardé peu de temps pour se réparer vite.
    homeCache.set(lang, { at: Date.now(), ttl: value.partial || value.rows.length === 0 ? 60_000 : HOME_TTL_MS, value });
    return value;
  });

  app.get('/api/resolve', async (req, reply): Promise<ResolveResult | undefined> => {
    const query = req.query as Record<string, unknown>;
    const uid = typeof query.uid === 'string' ? query.uid : '';
    const cut = uid.indexOf(':');
    const source = cut > 0 ? findSource(uid.slice(0, cut), sources) : undefined;
    const sourceId = cut > 0 ? uid.slice(cut + 1) : '';
    if (!source || !sourceId || sourceId.length > 300) {
      void reply.code(400).send({ error: 'invalid uid' });
      return undefined;
    }
    const kind = parseKinds(query.kind)[0] ?? 'video';

    const resolved = await source.resolve(sourceId, kind, http);
    const best = pickBest(resolved.links);
    const check = best && query.check !== '0' ? await http.head(best.url) : undefined;
    return { ...resolved, ...(best ? { best } : {}), ...(check ? { check } : {}) };
  });

  app.setErrorHandler((err, _req, reply) => {
    const status = err instanceof HttpError ? 502 : (err as { statusCode?: number }).statusCode ?? 500;
    void reply.code(status).send({ error: err instanceof Error ? err.message : 'Internal error' });
  });

  const staticDir =
    deps.staticDir === undefined
      ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist')
      : deps.staticDir;
  if (staticDir && existsSync(staticDir)) {
    void app.register(fastifyStatic, { root: staticDir });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
