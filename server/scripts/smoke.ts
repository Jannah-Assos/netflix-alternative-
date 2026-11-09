/**
 * Test en réel : interroge chaque source avec une vraie requête, résout le premier résultat
 * et vérifie son meilleur lien. À lancer depuis une machine qui a accès à internet :
 *
 *   npm run smoke
 *
 * Sert à valider que les formats d'API supposés par les parseurs sont toujours exacts.
 */
import { createHttp } from '../src/http.js';
import { pickBest } from '../src/linkPicker.js';
import { ALL_SOURCES } from '../src/sources/index.js';
import type { MediaKind } from '../src/types.js';

const QUERIES: Record<string, { q: string; kind: MediaKind }> = {
  'internet-archive': { q: 'nosferatu', kind: 'video' },
  'wikimedia-commons': { q: 'big buck bunny', kind: 'video' },
  nasa: { q: 'apollo 11', kind: 'video' },
  peertube: { q: 'blender', kind: 'video' },
};

const http = createHttp();
let failures = 0;

for (const source of ALL_SOURCES) {
  const { q, kind } = QUERIES[source.id] ?? { q: 'test', kind: 'video' as MediaKind };
  process.stdout.write(`\n== ${source.name} — « ${q} »\n`);
  try {
    const items = await source.search({ q, kinds: [kind], page: 1, limit: 5 }, http);
    console.log(`   ${items.length} résultat(s)`);
    if (items.length === 0) throw new Error('aucun résultat');
    for (const i of items.slice(0, 3)) console.log(`   - ${i.title} [${i.license.label}]`);

    const first = items[0]!;
    const resolved = await source.resolve(first.sourceId, first.kind, http);
    const best = pickBest(resolved.links);
    if (!best) throw new Error(`aucun lien direct pour « ${first.title} »`);
    const check = await http.head(best.url);
    console.log(`   meilleur lien : ${best.label}\n   ${best.url}\n   vérification : ${JSON.stringify(check)}`);
    if (check.alive !== true) throw new Error('le meilleur lien ne répond pas');
  } catch (err) {
    failures++;
    console.log(`   ÉCHEC : ${err instanceof Error ? err.message : err}`);
  }
}

console.log(failures ? `\n${failures} source(s) en échec.` : '\nToutes les sources répondent.');
process.exit(failures ? 1 : 0);
