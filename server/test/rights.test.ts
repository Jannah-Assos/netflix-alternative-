import { describe, expect, it } from 'vitest';
import { buildQuery } from '../src/sources/internetArchive.js';
import { applyRights, findWork, frStatus, normalize, PANTHEON_IDS, rightsOf, uniqueByWork, WORKS } from '../src/rights.js';
import { classifyLicense } from '../src/licenses.js';
import type { MediaItem } from '../src/types.js';

const mk = (sourceId: string, title: string, year?: number, creator?: string): MediaItem => ({
  uid: `internet-archive:${sourceId}`,
  source: 'internet-archive',
  sourceId,
  title,
  kind: 'video',
  pageUrl: `https://archive.org/details/${sourceId}`,
  license: classifyLicense('Public domain'),
  ...(year !== undefined ? { year } : {}),
  ...(creator ? { creator } : {}),
});

describe('frStatus', () => {
  const a = (...died: number[]) => ({ authors: died.map((d, i) => ({ name: `A${i}`, died: d })) });
  it('libre si tous les auteurs sont morts avant 1946', () => {
    expect(frStatus(a(1931, 1944))).toBe('free');
  });
  it('doute entre 1946 et 1955', () => {
    expect(frStatus(a(1931, 1946))).toBe('unclear');
    expect(frStatus(a(1954))).toBe('unclear');
  });
  it('protégé à partir de 1956, même si un autre auteur est mort tôt', () => {
    expect(frStatus(a(1931, 1956))).toBe('protected');
    expect(frStatus(a(1977))).toBe('protected');
  });
  it('une date de décès incertaine ne permet ni « libre » ni « protégé »', () => {
    expect(frStatus({ authors: [{ name: 'X', died: 1930, sure: false }] })).toBe('unclear');
    expect(frStatus({ authors: [{ name: 'X', died: 1974, sure: false }] })).toBe('unclear');
  });
  it('une licence Creative Commons de l’ayant droit est libre', () => {
    expect(frStatus({ authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY 3.0' } })).toBe('free');
  });
  it('sans aucun auteur renseigné : jamais « libre »', () => {
    expect(frStatus({ authors: [] })).toBe('unclear');
  });
});

describe('normalize', () => {
  it('ignore accents, casse, parenthèses et ponctuation', () => {
    expect(normalize('Das Kabinett des Doktor Caligari ( The Cabinet of Dr. Caligari )')).toBe('das kabinett des doktor caligari');
    expect(normalize('Nosferatu_DVD_quality')).toBe('nosferatu dvd quality');
    expect(normalize('Häxan')).toBe('haxan');
  });
});

describe('findWork / rightsOf', () => {
  it('reconnaît une copie par son identifiant vérifié', () => {
    expect(findWork(mk('Fantasmagorie', 'N’importe quel titre'))?.id).toBe('fantasmagorie');
  });

  it('reconnaît une copie par le titre et l’année (±1)', () => {
    expect(rightsOf(mk('Nosferatu_DVD_quality', 'Nosferatu_DVD_quality', 1922))).toMatchObject({ fr: 'unclear', lastDeath: 1949 });
    expect(rightsOf(mk('x', 'Das Kabinett des Doktor Caligari ( The Cabinet of Dr. Caligari )', 1919))?.fr).toBe('unclear');
    expect(rightsOf(mk('y', 'Les vampires (1915)', 1915))?.fr).toBe('free');
  });

  it('ne confond pas deux œuvres de même titre : l’année doit correspondre', () => {
    expect(rightsOf(mk('z', 'Nosferatu the Vampyre', 1979))).toBeUndefined();
    expect(rightsOf(mk('z2', 'Metropolis', 2001))).toBeUndefined();
    expect(rightsOf(mk('z3', 'Faust', 1994))).toBeUndefined();
  });

  it('sans année, exige un titre strictement identique', () => {
    expect(findWork(mk('a', 'Little Nemo'))?.id).toBe('little-nemo');
    expect(findWork(mk('b', 'Little Nemo: Adventures in Slumberland'))).toBeUndefined();
    expect(findWork(mk('c', 'Sunrise'))).toBeUndefined();
  });

  it('marque les œuvres Blender comme libres (licence de l’ayant droit)', () => {
    expect(rightsOf(mk('BigBuckBunny_328', 'Big Buck Bunny'))).toEqual({ fr: 'free', basis: 'cc' });
  });

  it('repère les créateurs protégés, quelle que soit la copie', () => {
    expect(rightsOf(mk('p', 'Charlie Chaplin Festival', 1917))?.fr).toBe('protected');
    expect(rightsOf(mk('q', 'Gulliver’s Travels', 1939, 'Max Fleischer'))?.fr).toBe('protected');
    expect(rightsOf(mk('p2', 'CUKESIM’s New Job! ( Charles Chaplin )', 1915))?.fr).toBe('protected');
    expect(rightsOf(mk('r', 'Popeye the Sailor Meets Sindbad', 1936))?.fr).toBe('protected');
    expect(rightsOf(mk('s', 'Merrie Melodies - A Corny Concerto (Bugs Bunny, Daffy Duck)', 1943))?.fr).toBe('protected');
  });

  it('signale une estimation fondée sur une date de décès non vérifiée', () => {
    expect(rightsOf(mk('p1', 'The Phantom of the Opera', 1925))).toMatchObject({ fr: 'unclear', uncertain: true });
    expect(rightsOf(mk('n1', 'Nosferatu', 1922))?.uncertain).toBeUndefined();
  });

  it('ne dit rien d’un titre inconnu', () => {
    expect(rightsOf(mk('t', 'Un film inconnu', 1930))).toBeUndefined();
  });
});

describe('applyRights', () => {
  const items = [
    mk('Fantasmagorie', 'Fantasmagorie', 1908),
    mk('p', 'Charlie Chaplin Festival', 1917),
    mk('u', 'Un film inconnu', 1930),
    mk('n', 'Nosferatu', 1922),
  ];

  it('écarte les œuvres protégées et annote les œuvres connues', () => {
    const out = applyRights(items, true);
    expect(out.map((i) => i.sourceId)).toEqual(['Fantasmagorie', 'u', 'n']);
    expect(out.find((i) => i.sourceId === 'Fantasmagorie')?.rights?.fr).toBe('free');
    expect(out.find((i) => i.sourceId === 'n')?.rights?.fr).toBe('unclear');
    expect(out.find((i) => i.sourceId === 'u')?.rights).toBeUndefined();
  });

  it('RIGHTS_FILTER=off garde les œuvres protégées mais les signale', () => {
    const out = applyRights(items, false);
    expect(out).toHaveLength(4);
    expect(out.find((i) => i.sourceId === 'p')?.rights?.fr).toBe('protected');
  });
});

describe('uniqueByWork', () => {
  it('garde une seule copie par œuvre connue et conserve les autres items', () => {
    const out = uniqueByWork([
      mk('LesVampires1915DirectedByLouisFeuillade', 'Les Vampires'),
      mk('les-vampires-1915', 'Les vampires (1915)', 1915),
      mk('u', 'Un film inconnu', 1930),
      mk('u2', 'Un autre film', 1931),
    ]);
    expect(out.map((i) => i.sourceId)).toEqual(['LesVampires1915DirectedByLouisFeuillade', 'u', 'u2']);
  });
});

describe('table de droits', () => {
  it('la sélection « Panthéon » ne contient que des œuvres libres', () => {
    expect(PANTHEON_IDS.length).toBeGreaterThan(5);
    for (const w of WORKS.filter((w) => w.archiveIds?.some((id) => PANTHEON_IDS.includes(id)))) {
      expect(frStatus(w), w.id).toBe('free');
    }
  });

  it('chaque œuvre a un identifiant unique et au moins un titre', () => {
    expect(new Set(WORKS.map((w) => w.id)).size).toBe(WORKS.length);
    for (const w of WORKS) expect(w.aliases.length, w.id).toBeGreaterThan(0);
  });

  it('les titres connus sont déjà normalisés (sinon ils ne correspondraient jamais)', () => {
    for (const w of WORKS) for (const alias of w.aliases) expect(normalize(alias), `${w.id}: ${alias}`).toBe(alias);
  });

  it('une œuvre sans auteur renseigné doit être sous licence CC', () => {
    for (const w of WORKS) if (w.authors.length === 0) expect(w.cc, w.id).toBeDefined();
  });
});

describe('requête Internet Archive pour une sélection par identifiants', () => {
  it('cible les identifiants entre guillemets et ignore la liste blanche de collections', () => {
    const q = buildQuery('', ['video'], { identifiers: ['Fantasmagorie', 'sunrise.-a.-song'] }, true);
    expect(q).toContain('identifier:("Fantasmagorie" OR "sunrise.-a.-song")');
    expect(q).not.toContain('collection:(feature_films');
  });

  it('refuse un identifiant contenant des caractères de requête', () => {
    const q = buildQuery('', ['video'], { identifiers: ['ok_id', 'x" OR collection:*', 'a b'] }, true);
    expect(q).toContain('identifier:("ok_id")');
    expect(q).not.toContain('collection:*');
  });
});
