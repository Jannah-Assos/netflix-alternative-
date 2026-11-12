import { createHttp } from './http.js';
import { pickBest } from './linkPicker.js';
import { evaluate } from './rights.js';
import { internetArchive } from './sources/internetArchive.js';
import { WORKS } from './works.js';

/**
 * Contrôle du catalogue en conditions réelles : `npm run verify-catalogue`.
 * Pour chaque œuvre et chaque épisode : la copie existe-t-elle, un fichier est-il lisible dans un
 * navigateur (MP4), et quel est le statut de droits calculé ? Sort en erreur s'il y a un problème.
 */
async function main(): Promise<void> {
  const http = createHttp({ timeoutMs: 40_000 });
  const targets = WORKS.flatMap((w) => (w.episodes?.length ? w.episodes.map((e) => ({ w, label: `${w.slug} #${e.n}`, id: e.archiveId, file: e.file })) : [{ w, label: w.slug, id: w.archiveId, file: undefined as string | undefined }]));
  let bad = 0;
  let next = 0;
  const lines: string[] = [];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (next < targets.length) {
        const t = targets[next++]!;
        try {
          const r = await internetArchive.resolve(t.id, 'video', http, t.file);
          const links = r.links;
          const best = pickBest(links.filter((l) => l.type === 'stream'));
          const mp4 = best?.playable && /mp4|h\.264/i.test(`${best.format ?? ''} ${best.url}`);
          if (!mp4) {
            bad++;
            lines.push(`❌ ${t.label} : aucun MP4 lisible (${t.id})`);
          }
        } catch (err) {
          bad++;
          lines.push(`❌ ${t.label} : ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }),
  );
  const count = { free: 0, likely: 0, unclear: 0, protected: 0 };
  for (const w of WORKS) count[evaluate(w).fr]++;
  console.log(lines.sort().join('\n'));
  console.log(`\n${WORKS.length} œuvres, ${targets.length} vidéos contrôlées, ${bad} problème(s).`);
  console.log(`Droits calculés : ${count.free} libres, ${count.likely} probablement libres, ${count.unclear + count.protected} à retirer.`);
  process.exit(bad || count.unclear || count.protected ? 1 : 0);
}

void main();
