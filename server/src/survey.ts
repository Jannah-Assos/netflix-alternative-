import { parseArgs } from 'node:util';
import { createHttp, type Http } from './http.js';
import { pickSubtitles } from './subtitles.js';

/**
 * Mesure une ou plusieurs collections d'Internet Archive AVANT de les ajouter au catalogue.
 * C'est la méthode de décomposition : on ne parcourt pas les 40 millions de documents, on mesure
 * collection par collection (combien de films, combien avec une licence, fiches complètes ?,
 * sous-titres ?) sur un échantillon des titres les plus vus, puis on applique les critères de
 * `docs/METHODE-CATALOGUE.md`.
 *
 *   npm run survey -- wwIIarchive universal_newsreels
 *   npm run survey -- -n 60 prelinger
 */

const BASE = 'https://archive.org';
const FIELDS = ['identifier', 'title', 'year', 'creator', 'licenseurl', 'description', 'language'];
const MOVIES = 'mediatype:movies AND -access-restricted-item:true';

interface Doc {
  identifier: string;
  year?: unknown;
  creator?: unknown;
  licenseurl?: unknown;
  description?: unknown;
  language?: unknown;
}
interface Meta {
  files?: { name?: string; format?: string; length?: string | number; size?: string | number; private?: string | boolean }[];
}

async function search(http: Http, q: string, rows: number): Promise<{ total: number; docs: Doc[] }> {
  const url = new URL(`${BASE}/advancedsearch.php`);
  url.searchParams.set('q', q);
  for (const f of FIELDS) url.searchParams.append('fl[]', f);
  url.searchParams.append('sort[]', 'downloads desc');
  url.searchParams.set('rows', String(rows));
  url.searchParams.set('output', 'json');
  const r = await http.json<{ response?: { numFound?: number; docs?: Doc[] } }>(url.href, { ttlMs: 0 });
  return { total: r.response?.numFound ?? 0, docs: r.response?.docs ?? [] };
}

const pct = (n: number, total: number): string => `${total ? Math.round((100 * n) / total) : 0} %`.padStart(5);
const first = (v: unknown): string => String((Array.isArray(v) ? v[0] : v) ?? '');

/** Exécute `fn` sur chaque élément, `width` à la fois (on reste poli avec la source). */
async function pool<T, R>(items: T[], width: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i] as T);
      }
    }),
  );
  return out;
}

export async function surveyCollection(http: Http, collection: string, sample: number): Promise<string> {
  if (!/^[A-Za-z0-9_-]+$/.test(collection)) throw new Error(`Nom de collection invalide : ${collection}`);
  const all = await search(http, `${MOVIES} AND collection:${collection}`, 0);
  const licensed = await search(http, `${MOVIES} AND licenseurl:* AND collection:${collection}`, sample);
  const docs = licensed.docs;
  const metas = await pool(docs, 4, (d) => http.json<Meta>(`${BASE}/metadata/${encodeURIComponent(d.identifier)}`, { ttlMs: 0 }).catch((): Meta => ({})));

  let year = 0;
  let desc = 0;
  let duration = 0;
  let mp4 = 0;
  let lang = 0;
  let subs = 0;
  const licences = new Map<string, number>();
  const creators = new Map<string, number>();
  docs.forEach((d, i) => {
    const files = (metas[i]?.files ?? []).filter((f) => f.name && f.private !== true && f.private !== 'true');
    year += d.year ? 1 : 0;
    desc += d.description ? 1 : 0;
    lang += d.language ? 1 : 0;
    duration += files.some((f) => f.length) ? 1 : 0;
    mp4 += files.some((f) => /^h\.264|^mpeg4/i.test(f.format ?? '') || /\.mp4$/i.test(f.name ?? '')) ? 1 : 0;
    subs += pickSubtitles(files, (n) => n).length > 0 ? 1 : 0;
    const lic = first(d.licenseurl).replace(/^https?:\/\/(www\.)?/, '').slice(0, 46) || '?';
    licences.set(lic, (licences.get(lic) ?? 0) + 1);
    const c = first(d.creator).slice(0, 32);
    if (c) creators.set(c, (creators.get(c) ?? 0) + 1);
  });
  const top = (m: Map<string, number>, n: number): string =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ') || '—';

  const n = docs.length;
  return [
    `## ${collection}`,
    `  films : ${all.total} · avec licence déclarée : ${licensed.total} (${pct(licensed.total, all.total).trim()})`,
    `  échantillon : ${n} titres les plus vus, avec licence`,
    `  fiche  : année ${pct(year, n)} · description ${pct(desc, n)} · durée ${pct(duration, n)} · MP4 ${pct(mp4, n)}`,
    `  langue renseignée ${pct(lang, n)} · sous-titres ${pct(subs, n)}`,
    `  licences : ${top(licences, 3)}`,
    `  auteurs  : ${top(creators, 4)}`,
  ].join('\n');
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { sample: { type: 'string', short: 'n' }, help: { type: 'boolean', short: 'h' } },
  });
  if (values.help || positionals.length === 0) {
    console.log('Usage : npm run survey -- [-n <taille de l’échantillon, défaut 30>] <collection> [<collection> …]');
    return;
  }
  const sample = Math.min(100, Math.max(5, Number(values.sample ?? 30) || 30));
  const http = createHttp({ timeoutMs: 40_000 });
  for (const c of positionals) {
    try {
      console.log(`\n${await surveyCollection(http, c, sample)}`);
    } catch (err) {
      console.log(`\n## ${c}\n  ÉCHEC : ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

if (process.argv[1]?.endsWith('survey.ts')) void main();
