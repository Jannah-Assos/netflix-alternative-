import { describe, expect, it } from 'vitest';
import { buildQuery } from '../src/sources/internetArchive.js';
import { applyRights, evaluate, findWork, frStatus, normalize, rightsOf } from '../src/rights.js';
import { classifyLicense } from '../src/licenses.js';
import type { MediaItem } from '../src/types.js';
import type { Author } from '../src/works.js';

const NOW = 2026;
const eu = (died: number | null): Author => ({ name: 'E', died, eu: true });
const non = (died: number | null): Author => ({ name: 'N', died, eu: false });
const work = (authors: Author[], country = 'FR', year = 1920) => ({ authors, country, year });

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

describe('evaluate : règle des 70 ans', () => {
  it('libre sans réserve si tous les auteurs sont morts depuis plus de 80 ans', () => {
    expect(evaluate(work([eu(1931), eu(1945)]), NOW)).toEqual({ fr: 'free', basis: 'authors', lastDeath: 1945 });
  });
  it('probablement libre entre 70 et 80 ans', () => {
    expect(frStatus(work([eu(1931), eu(1946)]), NOW)).toBe('likely');
    expect(frStatus(work([eu(1955)]), NOW)).toBe('likely');
  });
  it('protégée si un auteur est mort depuis moins de 70 ans pleins', () => {
    expect(frStatus(work([eu(1931), eu(1956)]), NOW)).toBe('protected');
    expect(frStatus(work([eu(1977)]), NOW)).toBe('protected');
  });
  it('le calcul suit l’année : une œuvre entre dans le domaine public le 1er janvier', () => {
    expect(frStatus(work([eu(1956)]), 2026)).toBe('protected');
    expect(frStatus(work([eu(1956)]), 2027)).toBe('likely');
  });
  it('un décès inconnu est traité comme un auteur encore protégé', () => {
    expect(frStatus(work([eu(1920), eu(null)]), NOW)).toBe('protected');
  });
  it('licence Creative Commons de l’ayant droit : libre', () => {
    expect(evaluate({ authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY' }, country: 'NL', year: 2010 }, NOW)).toEqual({ fr: 'free', basis: 'cc' });
  });
  it('sans auteur ni licence : jamais libre', () => {
    expect(frStatus(work([]), NOW)).toBe('unclear');
  });
});

describe('evaluate : œuvre américaine, durée du pays d’origine', () => {
  it('auteurs américains + publication il y a plus de 95 ans : probablement libre', () => {
    expect(evaluate(work([non(1966), non(1955)], 'US', 1926), NOW)).toEqual({ fr: 'likely', basis: 'us-term', lastDeath: 1966 });
    expect(frStatus(work([non(1966)], 'US', 1930), NOW)).toBe('likely');
  });
  it('publication trop récente : la durée américaine court encore', () => {
    expect(frStatus(work([non(1966)], 'US', 1931), NOW)).toBe('protected');
  });
  it('un auteur européen encore dans les 70 ans bloque la règle', () => {
    expect(frStatus(work([non(1966), eu(1976)], 'US', 1926), NOW)).toBe('protected');
  });
  it('un auteur européen mort depuis plus de 70 ans ne la bloque pas', () => {
    expect(frStatus(work([non(1965), eu(1931)], 'US', 1927), NOW)).toBe('likely');
  });
  it('la règle ne vaut que pour une œuvre d’origine américaine', () => {
    expect(frStatus(work([non(1966)], 'GB', 1926), NOW)).toBe('protected');
  });
  it('un auteur américain au décès inconnu reste couvert par la durée américaine', () => {
    expect(frStatus(work([non(null), non(1925)], 'US', 1924), NOW)).toBe('likely');
  });
});

describe('normalize', () => {
  it('ignore accents, casse, parenthèses et ponctuation', () => {
    expect(normalize('Das Kabinett des Doktor Caligari ( The Cabinet of Dr. Caligari )')).toBe('das kabinett des doktor caligari');
    expect(normalize('Häxan')).toBe('haxan');
  });
});

describe('reconnaître une copie dans l’archive', () => {
  it('par son identifiant, y compris celui d’un épisode', () => {
    expect(findWork(mk('Fantasmagorie', 'Titre quelconque'))?.slug).toBe('fantasmagorie');
    expect(findWork(mk('lesVampires1915Episode4-theSpectre', 'x'))?.slug).toBe('les-vampires');
    expect(findWork(mk('JudexEpisode01LOmbreMystrieuse1916#fichier.mp4', 'x'))?.slug).toBe('judex');
  });
  it('par le titre et l’année (±1)', () => {
    expect(rightsOf(mk('x', 'Nosferatu_DVD_quality', 1922), NOW)).toMatchObject({ fr: 'likely', lastDeath: 1949 });
    expect(rightsOf(mk('y', 'Das Kabinett des Doktor Caligari ( The Cabinet of Dr. Caligari )', 1919), NOW)?.fr).toBe('likely');
    expect(rightsOf(mk('g', 'The General (complete)', 1926), NOW)).toMatchObject({ fr: 'likely', basis: 'us-term' });
  });
  it('ne confond pas deux œuvres de même titre', () => {
    expect(rightsOf(mk('z', 'Nosferatu the Vampyre', 1979), NOW)).toBeUndefined();
    expect(rightsOf(mk('z2', 'Metropolis', 2001), NOW)).toBeUndefined();
  });
  it('sans année, exige un titre strictement identique', () => {
    expect(findWork(mk('a', 'Sherlock Jr'))?.slug).toBe('sherlock-junior');
    expect(findWork(mk('b', 'Sherlock Jr and friends'))).toBeUndefined();
  });
  it('écarte les œuvres connues comme protégées (décès vérifiés)', () => {
    expect(rightsOf(mk('p1', 'The Golem', 1920), NOW)).toMatchObject({ fr: 'protected', lastDeath: 1958 });
    expect(rightsOf(mk('p2', 'Bronenosets Potyomkin (Battleship Potemkin)', 1925), NOW)?.fr).toBe('protected');
    expect(rightsOf(mk('p3', 'Metropolis', 1927), NOW)?.fr).toBe('protected');
  });
  it('Chaplin (britannique) reste protégé quelle que soit l’année', () => {
    expect(rightsOf(mk('c', 'CUKESIM’s New Job! ( Charles Chaplin )', 1915), NOW)?.fr).toBe('protected');
  });
  it('créateurs américains : protégés après 1930, non tranché avant', () => {
    expect(rightsOf(mk('q', 'Popeye the Sailor Meets Sindbad', 1936), NOW)?.fr).toBe('protected');
    expect(rightsOf(mk('s', 'Merrie Melodies - A Corny Concerto (Bugs Bunny)', 1943), NOW)?.fr).toBe('protected');
    expect(rightsOf(mk('k', 'Buster Keaton in The Scarecrow', 1920), NOW)).toEqual({ fr: 'unclear', basis: 'us-term', uncertain: true });
    expect(rightsOf(mk('k2', 'Buster Keaton shorts'), NOW)?.fr).toBe('protected');
  });
  it('œuvres du gouvernement américain : non tranché', () => {
    expect(rightsOf(mk('m', 'Battle of Midway', 1942, 'United States. Navy'), NOW)).toEqual({ fr: 'unclear', basis: 'government', uncertain: true });
  });
  it('ne dit rien d’un titre inconnu', () => {
    expect(rightsOf(mk('t', 'Un film inconnu', 1930), NOW)).toBeUndefined();
  });
});

describe('applyRights', () => {
  const items = [mk('Fantasmagorie', 'Fantasmagorie', 1908), mk('p', 'Charlie Chaplin Festival', 1917), mk('u', 'Un film inconnu', 1930), mk('n', 'Nosferatu', 1922)];
  it('écarte les œuvres protégées, annote les autres et relie celles du catalogue à leur page', () => {
    const out = applyRights(items, true, NOW);
    expect(out.map((i) => i.sourceId)).toEqual(['Fantasmagorie', 'u', 'n']);
    expect(out[0]).toMatchObject({ slug: 'fantasmagorie', rights: { fr: 'free' } });
    expect(out[2]).toMatchObject({ slug: 'nosferatu', rights: { fr: 'likely' } });
    expect(out[1]?.rights).toBeUndefined();
  });
  it('RIGHTS_FILTER=off garde les œuvres protégées mais les signale', () => {
    const out = applyRights(items, false, NOW);
    expect(out).toHaveLength(4);
    expect(out.find((i) => i.sourceId === 'p')?.rights?.fr).toBe('protected');
  });
});

describe('requête Internet Archive pour une sélection par identifiants', () => {
  it('cible les identifiants entre guillemets et refuse les caractères de requête', () => {
    const q = buildQuery('', ['video'], { identifiers: ['ok_id', 'x" OR collection:*', 'a b'] }, true);
    expect(q).toContain('identifier:("ok_id")');
    expect(q).not.toContain('collection:*');
  });
});
