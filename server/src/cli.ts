import { parseArgs } from 'node:util';
import { createHttp } from './http.js';
import { pickBest } from './linkPicker.js';
import { scan } from './scan.js';
import { ALL_SOURCES, findSource } from './sources/index.js';
import { MEDIA_KINDS, type MediaKind, type SourceId } from './types.js';
import { formatBytes } from './util.js';

const USAGE = `Usage : npm run scan -- "<recherche>" [options]

  -k, --kind <video|audio|software|text>   types séparés par des virgules (défaut : tous)
  -s, --source <id>                        internet-archive, wikimedia-commons, nasa, peertube
  -n, --limit <n>                          résultats par source (défaut : 8)
  -f, --free                               licences libres vérifiées uniquement
  -r, --resolve                            résout et vérifie le meilleur lien de chaque résultat
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      kind: { type: 'string', short: 'k' },
      source: { type: 'string', short: 's' },
      limit: { type: 'string', short: 'n' },
      free: { type: 'boolean', short: 'f' },
      resolve: { type: 'boolean', short: 'r' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return;
  }

  const kinds = (values.kind?.split(',') ?? [...MEDIA_KINDS]).filter((k): k is MediaKind =>
    (MEDIA_KINDS as readonly string[]).includes(k),
  );
  const sources = values.source?.split(',').filter((id) => findSource(id)) as SourceId[] | undefined;
  const http = createHttp();

  const result = await scan(
    ALL_SOURCES,
    http,
    { q: positionals.join(' '), kinds, page: 1, limit: Number(values.limit ?? 8) || 8 },
    { ...(sources?.length ? { sources } : {}), freeOnly: values.free === true },
  );

  for (const s of result.sources) {
    const state = s.skipped ? `ignorée (${s.skipped})` : s.ok ? `${s.count} résultat(s) en ${s.tookMs} ms` : `ÉCHEC : ${s.error}`;
    console.error(`• ${s.source}: ${state}`);
  }

  for (const item of result.items) {
    console.log(`\n[${item.kind}] ${item.title}${item.year ? ` (${item.year})` : ''}`);
    console.log(`  ${item.source} · ${item.license.label}${item.license.verified ? '' : ' (à vérifier)'}`);
    console.log(`  ${item.pageUrl}`);
    if (!values.resolve) continue;
    try {
      const resolved = await findSource(item.source)!.resolve(item.sourceId, item.kind, http);
      const best = pickBest(resolved.links);
      if (!best) {
        console.log('  → aucun lien direct trouvé');
        continue;
      }
      const check = await http.head(best.url);
      const status = check.alive === true ? 'en ligne' : check.alive === false ? `HORS LIGNE (${check.status})` : 'non vérifié';
      console.log(`  → ${best.label} [${status}]${best.sizeBytes ? ` ${formatBytes(best.sizeBytes)}` : ''}`);
      console.log(`    ${best.url}`);
    } catch (err) {
      console.log(`  → résolution impossible : ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
