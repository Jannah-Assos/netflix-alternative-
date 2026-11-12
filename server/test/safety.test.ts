import { afterEach, describe, expect, it } from 'vitest';
import { classifyLicense } from '../src/licenses.js';
import { BLOCKED_COLLECTIONS, isFamilySafe, safeSearchEnabled } from '../src/safety.js';
import { scan } from '../src/scan.js';
import { buildQuery, toItem } from '../src/sources/internetArchive.js';
import type { MediaSource } from '../src/sources/types.js';
import type { MediaItem } from '../src/types.js';
import { fakeHttp } from './helpers.js';

// Titres et mots-clés RÉELS relevés sur Internet Archive (collection feature_films, etc.).
const ADULT = [
  { title: 'Les Novices libertines', subjects: ['film italien', 'érotique', 'erotic', 'nude', 'sexe', '-18', 'nunsploitation'] },
  { title: 'Dr. Sex.', subjects: ['full movie', 'nudie cutie', 'sexploition', 'stripping'] },
  { title: 'Sex Madness', subjects: ['exploitation', 'melodrama'] },
  { title: 'The Child Molester (1964)', subjects: ['educational', 'social issues', 'criminal'] },
  { title: 'My Body Burns, Dossier Erotique D’un Notaire 1973', subjects: [] },
  { title: 'Real Sex (HBO Series: 1990-2009)', subjects: ['real sex', 'Pornucopia'] },
  { title: 'Nude Aerobics (1983) Full Movie - American Softcore Erotica', subjects: [] },
  { title: 'Teaserama', subjects: ['burlesque', 'striptease'] },
  { title: 'Flesh Gordon', subjects: ['sexploitation', 'parody'] },
  { title: 'Film sans titre évocateur', subjects: ['drame', '-18'] },
  { title: 'Documentaire', subjects: ['pornographie', 'sexualité'] },
  { title: 'Cinéma d’érotisme des années 70', subjects: [] },
  { title: 'Camp de nudisme', subjects: [] },
  { title: 'Felicia, Les Mille Et Une Perversions De Felicia 1975', subjects: [] },
];

const FAMILY = [
  { title: 'Nosferatu, eine Symphonie des Grauens', subjects: ['horror', 'silent', 'murnau'] },
  { title: 'The Cabinet of Dr. Caligari', subjects: ['expressionism'] },
  { title: 'Charlie Chaplin Festival', subjects: ['comedy', 'chaplin'] },
  { title: 'House on Haunted Hill', subjects: ['horror', 'vincent price'] },
  { title: 'Apollo 11 Productions', subjects: ['space'] },
  { title: 'Big Buck Bunny', subjects: ['animation', 'blender'] },
  // Pièges classiques du filtrage par mots-clés : le mot ne doit pas être détecté dans un autre mot ou un lieu.
  { title: 'Essex Boys', subjects: [] },
  { title: 'Middlesex County Fair 1950', subjects: [] },
  { title: 'Sussex Downs', subjects: [] },
  { title: 'Grapes of Wrath', subjects: ['drama'] },
  { title: 'Therapeutics 101 : Scunthorpe', subjects: [] },
  { title: 'The Naked City', subjects: ['film noir'] },
  { title: 'Film de 1918 (-1918)', subjects: [] },
  { title: 'Pornic, port de Bretagne', subjects: [] },
  { title: 'Sexton Blake and the Hooded Terror', subjects: [] },
];

describe('isFamilySafe', () => {
  it.each(ADULT)('refuse « $title »', (it) => expect(isFamilySafe(it)).toBe(false));
  it.each(FAMILY)('accepte « $title »', (it) => expect(isFamilySafe(it)).toBe(true));

  it('ignore la casse et les accents', () => {
    expect(isFamilySafe({ title: 'ÉROTIQUE' })).toBe(false);
    expect(isFamilySafe({ title: 'nudité' })).toBe(false);
    expect(isFamilySafe({ title: 'EROTIC' })).toBe(false);
  });

  it('regarde aussi la description', () => {
    expect(isFamilySafe({ title: 'Titre neutre', description: 'Un film érotique des années 70' })).toBe(false);
  });
});

describe('Internet Archive : filtre grand public', () => {
  afterEach(() => {
    delete process.env.SAFE_SEARCH;
  });

  it('la requête exclut les collections signalées', () => {
    const q = buildQuery('', ['video'], {}, true, false);
    expect(q).toContain('-collection:(adultvhs OR adultcomics OR no-preview OR deemphasize OR nsfw)');
    expect(BLOCKED_COLLECTIONS).toContain('adultvhs');
    expect(buildQuery('', ['video'], {}, false, false)).not.toContain('-collection:');
  });

  it('toItem écarte un résultat dont les mots-clés sont inappropriés', () => {
    const doc = { identifier: 'novices', title: 'Les Novices libertines', mediatype: 'movies', subject: ['érotique', 'nude', '-18'] };
    expect(toItem(doc, true)).toBeNull();
    expect(toItem(doc, false)).not.toBeNull();
    expect(toItem({ identifier: 'ok', title: 'Nosferatu', mediatype: 'movies', subject: ['horror'] }, true)).not.toBeNull();
  });

  it('SAFE_SEARCH=off désactive le filtre, il est actif par défaut', () => {
    expect(safeSearchEnabled({})).toBe(true);
    expect(safeSearchEnabled({ SAFE_SEARCH: 'on' })).toBe(true);
    expect(safeSearchEnabled({ SAFE_SEARCH: 'off' })).toBe(false);
    expect(safeSearchEnabled({ SAFE_SEARCH: 'OFF' })).toBe(false);
  });
});

describe('scan : toutes les sources passent le filtre', () => {
  const item = (n: number, title: string, description?: string): MediaItem => ({
    uid: `nasa:${n}`,
    source: 'nasa',
    sourceId: String(n),
    title,
    ...(description ? { description } : {}),
    kind: 'video',
    pageUrl: 'https://x.test',
    license: classifyLicense('CC0'),
  });
  const source: MediaSource = {
    id: 'nasa',
    name: 'x',
    homepage: 'https://x.test',
    kinds: ['video'],
    supportsBrowse: true,
    search: async () => [item(1, 'Apollo 11'), item(2, 'Nude beach', 'x'), item(3, 'Titre neutre', 'contenu pornographie explicite'), item(4, 'Lune')],
    resolve: async () => ({ links: [] }),
  };
  const params = { q: 'x', kinds: ['video' as const], page: 1, limit: 10 };

  afterEach(() => {
    delete process.env.SAFE_SEARCH;
  });

  it('retire les résultats inappropriés (titre ou description)', async () => {
    const r = await scan([source], fakeHttp({}), params);
    expect(r.items.map((i) => i.title)).toEqual(['Apollo 11', 'Lune']);
    expect(r.sources[0]?.count).toBe(2);
  });

  it('SAFE_SEARCH=off les laisse passer', async () => {
    process.env.SAFE_SEARCH = 'off';
    const r = await scan([source], fakeHttp({}), params);
    expect(r.items).toHaveLength(3 + 0 + 1 - 1 + 1 - 1 + 1 - 1 + 1); // 4 résultats bruts
  });
});

describe('images de guerre explicites', () => {
  it('écarte les titres qui annoncent des images violentes', () => {
    for (const title of ['Mussolini Is Executed GRAPHIC', 'The Execution of Mary Stuart', 'Graphic content: massacre footage', 'Mutilated soldiers']) {
      expect(isFamilySafe({ title }), title).toBe(false);
    }
  });
  it('garde les documentaires de guerre ordinaires', () => {
    for (const title of ['DZ Normandy', 'The Last Bomb', 'Eve of Battle', 'Why We Fight: Prelude to War']) {
      expect(isFamilySafe({ title }), title).toBe(true);
    }
  });
});
