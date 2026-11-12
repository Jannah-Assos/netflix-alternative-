import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { parseCatalogQuery } from './catalog.js';
import { buildHome, searchCatalogue, shareHtml, workDetail } from './library.js';
import { HttpError, createHttp, type Http } from './http.js';
import { pickBest } from './linkPicker.js';
import { scan } from './scan.js';
import { isArchiveDownloadUrl, toVtt } from './subtitles.js';
import { ENABLED_KINDS } from './scope.js';
import { enabledSources, findSource, type MediaSource } from './sources/index.js';
import {
  MEDIA_KINDS,
  type AppConfig,
  type CatalogueResult,
  type HomeResult,
  type WorkDetail,
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
  /** Requêtes /api par minute et par adresse IP (défaut 120 ; 0 = illimité). */
  rateLimitMax?: number;
  /** Derrière un reverse proxy : fait confiance à X-Forwarded-For pour l'adresse IP du client. */
  trustProxy?: boolean;
  /**
   * Autorise les moteurs de recherche à référencer le site (défaut : non, tant que `OPENFLIX_INDEXABLE=1`
   * n'est pas défini). Avant l'ouverture publique, on garde le site hors de Google.
   */
  indexable?: boolean;
  /** Ouvre l'archive élargie, non vérifiée (défaut : oui ; `OPENFLIX_ARCHIVE=off` pour ne garder que le catalogue). */
  archive?: boolean;
  /** Date courante (pour les tests : séance du jour, calcul des droits). */
  now?: () => Date;
}

/**
 * Politique de sécurité du contenu : l'application ne charge de scripts et de styles que depuis
 * elle-même ; les images, vidéos et lecteurs intégrés viennent des sources, donc en https.
 */
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  'frame-src https:',
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const MAX_Q = 200;

function splitKinds(raw: unknown): MediaKind[] {
  if (typeof raw !== 'string' || !raw) return [];
  return [...new Set(raw.split(',').filter((k): k is MediaKind => (MEDIA_KINDS as readonly string[]).includes(k)))];
}

/** Recherche : uniquement les types du périmètre (films et animation = vidéo). */
function parseKinds(raw: unknown): MediaKind[] {
  const allowed = splitKinds(raw).filter((k) => ENABLED_KINDS.includes(k));
  return allowed.length ? allowed : [...ENABLED_KINDS];
}

function clampInt(raw: unknown, def: number, min: number, max: number): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

export function buildApp(deps: AppDeps = {}): FastifyInstance {
  const http = deps.http ?? createHttp();
  const sources = deps.sources ?? enabledSources();
  const limit = deps.rateLimitMax ?? 120;
  const indexable = deps.indexable ?? process.env.OPENFLIX_INDEXABLE === '1';
  const app = Fastify({ logger: false, trustProxy: deps.trustProxy ?? false });
  const archiveOpen = deps.archive ?? (process.env.OPENFLIX_ARCHIVE ?? 'on').toLowerCase() !== 'off';
  const now = deps.now ?? (() => new Date());
  const langOf = (raw: unknown): Lang => (raw === 'fr' ? 'fr' : 'en');

  app.addHook('onSend', async (_req, reply) => {
    reply.header('content-security-policy', CSP);
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (!indexable) reply.header('x-robots-tag', 'noindex, nofollow');
  });

  app.get('/robots.txt', async (_req, reply) => {
    void reply.type('text/plain; charset=utf-8');
    return indexable ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
  });

  if (limit > 0) {
    void app.register(rateLimit, {
      max: limit,
      timeWindow: '1 minute',
      // Seules les routes /api sont limitées : les fichiers de l'application ne coûtent rien.
      allowList: (req) => !req.url.startsWith('/api/'),
    });
  }

  // Les routes sont dans un plugin enregistré APRÈS la limitation de débit : sinon Fastify
  // ne l'appliquerait pas aux routes déjà définies.
  void app.register(async (api) => {
    api.get('/api/health', async () => ({ ok: true }));

    // Relais des sous-titres d'Internet Archive : même origine que le site (pas de souci de CORS dans
    // le lecteur), converti en WebVTT, limité aux fichiers .vtt/.srt d'archive.org.
    api.get('/api/subtitle', async (req, reply) => {
      const url = (req.query as { url?: unknown }).url;
      if (typeof url !== 'string' || !isArchiveDownloadUrl(url)) return reply.code(400).send({ error: 'Invalid subtitle URL' });
      const text = await http.text(url, { maxBytes: 1_500_000, ttlMs: 24 * 3_600_000 });
      void reply.type('text/vtt; charset=utf-8').header('cache-control', 'public, max-age=86400');
      return toVtt(text);
    });

    api.get('/api/sources', async (): Promise<SourceInfo[]> =>
      sources.map(({ id, name, homepage, kinds, supportsBrowse }) => ({ id, name, homepage, kinds, supportsBrowse })),
    );

    api.get('/api/config', async (): Promise<AppConfig> => {
      const contact = process.env.OPENFLIX_CONTACT?.trim();
      return { archive: archiveOpen, ...(contact ? { contact: contact.slice(0, 200) } : {}) };
    });

    // ───── Le catalogue : œuvres choisies, données locales, réponses instantanées ─────
    api.get('/api/home', async (req): Promise<HomeResult> => buildHome(langOf((req.query as Record<string, unknown>).lang), now()));

    api.get('/api/catalogue', async (req, reply): Promise<CatalogueResult | undefined> => {
      const query = req.query as Record<string, unknown>;
      const q = typeof query.q === 'string' ? query.q.trim() : '';
      if (q.length > MAX_Q) {
        void reply.code(400).send({ error: `q too long (max ${MAX_Q})` });
        return undefined;
      }
      const tag = typeof query.tag === 'string' && /^[a-z]{2,20}$/.test(query.tag) ? query.tag : undefined;
      return searchCatalogue(q, tag, langOf(query.lang), now());
    });

    api.get('/api/work/:slug', async (req, reply): Promise<WorkDetail | undefined> => {
      const { slug } = req.params as { slug: string };
      const detail = /^[a-z0-9-]{1,80}$/.test(slug) ? workDetail(slug, langOf((req.query as Record<string, unknown>).lang), now()) : undefined;
      if (!detail) {
        void reply.code(404).send({ error: 'Unknown work' });
        return undefined;
      }
      return detail;
    });

    // ───── L'archive élargie : recherche en direct chez Internet Archive, non vérifiée ─────
    api.get('/api/search', async (req, reply) => {
      if (!archiveOpen) return reply.code(404).send({ error: 'Archive closed' });
      const query = req.query as Record<string, unknown>;
      const q = typeof query.q === 'string' ? query.q.trim() : '';
      if (q.length > MAX_Q) return reply.code(400).send({ error: `q too long (max ${MAX_Q})` });

      const wanted =
        typeof query.sources === 'string' && query.sources
          ? (query.sources.split(',').filter((id) => findSource(id, sources)) as SourceId[])
          : undefined;

      const { filters, sort } = parseCatalogQuery(query);
      return scan(
        sources,
        http,
        {
          q,
          kinds: parseKinds(query.kinds),
          page: clampInt(query.page, 1, 1, 50),
          limit: clampInt(query.limit, 24, 1, 50),
          ...(Object.keys(filters).length ? { filters } : {}),
          sort,
        },
        { ...(wanted?.length ? { sources: wanted } : {}), freeOnly: query.freeOnly === '1' },
      );
    });

    // Plus coûteuse (appels vers les sources + vérification du lien) : limite plus basse.
    const resolveOpts = limit > 0 ? { config: { rateLimit: { max: Math.max(1, Math.min(40, limit)), timeWindow: '1 minute' } } } : {};
    api.get('/api/resolve', resolveOpts, async (req, reply): Promise<ResolveResult | undefined> => {
      const query = req.query as Record<string, unknown>;
      const uid = typeof query.uid === 'string' ? query.uid : '';
      const cut = uid.indexOf(':');
      const source = cut > 0 ? findSource(uid.slice(0, cut), sources) : undefined;
      // « identifiant#fichier » : un épisode précis quand toute la série est dans le même document.
      const [sourceId = '', file] = cut > 0 ? uid.slice(cut + 1).split('#') : [''];
      if (!source || !sourceId || sourceId.length > 300 || (file !== undefined && file.length > 300)) {
        void reply.code(400).send({ error: 'invalid uid' });
        return undefined;
      }
      // Pas de restriction ici : un titre déjà dans « Ma liste » doit rester lisible.
      const kind = splitKinds(query.kind)[0] ?? 'video';

      const resolved = await source.resolve(sourceId, kind, http, file);
      const best = pickBest(resolved.links);
      const check = best && query.check !== '0' ? await http.head(best.url) : undefined;
      return { ...resolved, ...(best ? { best } : {}), ...(check ? { check } : {}) };
    });
  });

  app.setErrorHandler((err, _req, reply) => {
    const status = err instanceof HttpError ? 502 : ((err as { statusCode?: number }).statusCode ?? 500);
    void reply.code(status).send({ error: err instanceof Error ? err.message : 'Internal error' });
  });

  const staticDir =
    deps.staticDir === undefined
      ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist')
      : deps.staticDir;
  if (staticDir && existsSync(staticDir)) {
    void app.register(fastifyStatic, {
      root: staticDir,
      // Les fichiers de /assets portent leur empreinte dans leur nom : cache longue durée.
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.header('cache-control', 'public, max-age=31536000, immutable');
        }
      },
    });
    const indexPath = path.join(staticDir, 'index.html');
    // Relu à chaque demande (petit fichier) : après une mise à jour, les noms des fichiers changent.
    const readIndex = (): string => (existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '');
    // Page d'une œuvre : même application, avec les balises d'aperçu pour le partage.
    app.get('/film/:slug', async (req, reply) => {
      const { slug } = req.params as { slug: string };
      const origin = `${req.protocol}://${req.host}`;
      const indexHtml = readIndex();
      const html = /^[a-z0-9-]{1,80}$/.test(slug) ? shareHtml(indexHtml, slug, origin) : undefined;
      void reply.type('text/html; charset=utf-8').header('cache-control', 'no-cache');
      return html ?? indexHtml;
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
      // Un fichier manquant (ancienne version encore ouverte) doit échouer franchement, pas renvoyer la page.
      if (req.url.startsWith('/assets/') || /\.[a-z0-9]{2,5}(\?|$)/i.test(req.url)) return reply.code(404).type('text/plain').send('Not found');
      return reply.header('cache-control', 'no-cache').sendFile('index.html');
    });
  }

  return app;
}
