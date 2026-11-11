import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { ErrorCode, LinkCheck } from './types.js';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code: ErrorCode = 'unknown',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface Http {
  json<T>(url: string, opts?: { ttlMs?: number }): Promise<T>;
  head(url: string): Promise<LinkCheck>;
}

type LookupFn = (host: string) => Promise<{ address: string }[]>;

export interface HttpOptions {
  fetchImpl?: typeof fetch;
  lookupImpl?: LookupFn;
  userAgent?: string;
  timeoutMs?: number;
  headTimeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
  maxCacheEntries?: number;
  /**
   * Requêtes envoyées via un proxy (NODE_USE_ENV_PROXY=1) : c'est le proxy qui résout les noms de
   * domaine, la résolution locale n'est donc pas fiable (souvent impossible) et n'est plus exigée.
   * Les autres protections restent actives ; la politique de sortie du proxy fait foi pour le reste.
   * Détecté automatiquement d'après l'environnement.
   */
  proxied?: boolean;
}

/** Vrai si Node envoie ses requêtes via le proxy de l'environnement. */
export function detectProxied(env: NodeJS.ProcessEnv = process.env): boolean {
  const hasProxy = !!(env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy);
  return env.NODE_USE_ENV_PROXY === '1' && hasProxy;
}

const DEFAULT_UA = 'Openflix/0.1 (+https://github.com/Jannah-Assos/netflix-alternative-)';
const MAX_REDIRECTS = 4;

/** Adresses non routables publiquement (protection SSRF). */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const p = ip.split('.').map(Number) as [number, number, number, number];
    const [a, b] = p;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      a >= 224
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s);
    if (mapped?.[1]) return isPrivateIp(mapped[1]);
    return (
      s === '::' ||
      s === '::1' ||
      s.startsWith('fc') ||
      s.startsWith('fd') ||
      s.startsWith('fe8') ||
      s.startsWith('fe9') ||
      s.startsWith('fea') ||
      s.startsWith('feb') ||
      s.startsWith('ff')
    );
  }
  return true;
}

/** Refuse tout ce qui n'est pas une URL http(s) publique sur un port standard. */
export async function assertPublicUrl(
  raw: string,
  lookupImpl: LookupFn = defaultLookup,
  proxied = false,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError('Invalid URL', undefined, 'blocked');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new HttpError('Protocol refused', undefined, 'blocked');
  if (url.username || url.password) throw new HttpError('Credentials in URL refused', undefined, 'blocked');
  if (url.port !== '') throw new HttpError('Non-standard port refused', undefined, 'blocked');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new HttpError('Private address refused', undefined, 'blocked');
    return url;
  }
  if (!host.includes('.') || /\.(local|localhost|internal|lan|home|corp)$/i.test(host)) {
    throw new HttpError('Non-public host refused', undefined, 'blocked');
  }
  let addrs: { address: string }[];
  try {
    addrs = await lookupImpl(host);
  } catch (err) {
    // Derrière un proxy, un nom que le DNS local ne connaît pas peut être parfaitement valide.
    if (proxied) return url;
    const reason = err instanceof Error ? err.message : String(err);
    throw new HttpError(`DNS lookup failed (${reason})`, undefined, 'network');
  }
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new HttpError('Host resolves to a private address, refused', undefined, 'blocked');
  }
  return url;
}

const defaultLookup: LookupFn = (host) => lookup(host, { all: true });

export function createHttp(options: HttpOptions = {}): Http {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookupImpl = options.lookupImpl ?? defaultLookup;
  const ua = options.userAgent ?? DEFAULT_UA;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const headTimeoutMs = options.headTimeoutMs ?? 6_000;
  const retries = options.retries ?? 1;
  const cacheTtl = options.cacheTtlMs ?? 5 * 60_000;
  const maxEntries = options.maxCacheEntries ?? 500;
  const proxied = options.proxied ?? detectProxied();

  const cache = new Map<string, { at: number; ttl: number; value: unknown }>();
  const inflight = new Map<string, Promise<unknown>>();

  async function safeFetch(rawUrl: string, init: RequestInit, timeout: number): Promise<Response> {
    let current = rawUrl;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const url = await assertPublicUrl(current, lookupImpl, proxied);
      const res = await fetchImpl(url.href, {
        ...init,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout),
        headers: { 'user-agent': ua, ...(init.headers as Record<string, string> | undefined) },
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel().catch(() => undefined);
        current = new URL(location, url).href;
        continue;
      }
      return res;
    }
    throw new HttpError('Too many redirects', undefined, 'http');
  }

  async function fetchJson(url: string): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await safeFetch(url, { headers: { accept: 'application/json' } }, timeoutMs);
        if (!res.ok) {
          const retryable = res.status === 429 || res.status >= 500;
          // Retry-After (en secondes) : on respecte la demande de la source, dans la limite de 4 s.
          const wait = Number(res.headers.get('retry-after'));
          await res.body?.cancel().catch(() => undefined);
          if (retryable && attempt < retries) {
            const delay = Number.isFinite(wait) && wait > 0 ? Math.min(wait * 1000, 4000) : 400 * (attempt + 1);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new HttpError(`HTTP ${res.status}`, res.status, 'http');
        }
        return await res.json();
      } catch (err) {
        if (err instanceof HttpError && err.status !== undefined) throw err;
        if (err instanceof HttpError) throw err; // refus de sécurité : pas de nouvelle tentative
        lastError = err;
        if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    throw new HttpError(`Network unavailable (${reason})`, undefined, 'network');
  }

  return {
    async json<T>(url: string, opts?: { ttlMs?: number }): Promise<T> {
      const ttl = opts?.ttlMs ?? cacheTtl;
      const hit = cache.get(url);
      if (hit && Date.now() - hit.at < hit.ttl) return hit.value as T;
      const pending = inflight.get(url);
      if (pending) return pending as Promise<T>;

      const p = fetchJson(url)
        .then((value) => {
          if (cache.size >= maxEntries) cache.delete(cache.keys().next().value as string);
          cache.set(url, { at: Date.now(), ttl, value });
          return value as T;
        })
        .finally(() => inflight.delete(url));
      inflight.set(url, p);
      return p;
    },

    async head(url: string): Promise<LinkCheck> {
      try {
        let res = await safeFetch(url, { method: 'HEAD' }, headTimeoutMs);
        if ([403, 405, 501].includes(res.status)) {
          await res.body?.cancel().catch(() => undefined);
          res = await safeFetch(url, { method: 'GET', headers: { range: 'bytes=0-0' } }, headTimeoutMs);
        }
        const contentType = res.headers.get('content-type') ?? undefined;
        const range = /\/(\d+)$/.exec(res.headers.get('content-range') ?? '');
        const len = Number(res.headers.get('content-length'));
        const sizeBytes = range?.[1] ? Number(range[1]) : Number.isFinite(len) && len > 1 ? len : undefined;
        await res.body?.cancel().catch(() => undefined);
        // 429 = « trop de requêtes » : le fichier n'est pas hors ligne, on ne sait simplement pas.
        return {
          alive: res.ok || res.status === 206 ? true : res.status === 429 ? null : false,
          status: res.status,
          ...(contentType ? { contentType } : {}),
          ...(sizeBytes ? { sizeBytes } : {}),
        };
      } catch {
        return { alive: null };
      }
    },
  };
}
