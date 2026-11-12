import { describe, expect, it } from 'vitest';
import { buildHome, catalogue, episodeItem, featuredOf, searchCatalogue, shareHtml, workDetail } from '../src/library.js';
import { evaluate } from '../src/rights.js';
import { SHELVES, WORKS } from '../src/works.js';

const DAY = new Date('2026-11-12T10:00:00Z');

describe('données du catalogue', () => {
  it('chaque œuvre a un identifiant de page unique, propre à une adresse web', () => {
    expect(new Set(WORKS.map((w) => w.slug)).size).toBe(WORKS.length);
    for (const w of WORKS) expect(w.slug, w.slug).toMatch(/^[a-z0-9-]{1,80}$/);
  });
  it('chaque œuvre est complète : titres, phrase « pourquoi », durée, copie', () => {
    for (const w of WORKS) {
      expect(w.title.fr && w.title.en, w.slug).toBeTruthy();
      expect(w.why.fr.length, w.slug).toBeGreaterThan(30);
      expect(w.why.en.length, w.slug).toBeGreaterThan(30);
      expect(w.minutes, w.slug).toBeGreaterThan(0);
      expect(w.archiveId, w.slug).toMatch(/^[A-Za-z0-9._-]+$/);
      expect(w.directors.length, w.slug).toBeGreaterThan(0);
    }
  });
  it('aucune œuvre n’est déclarée libre à la main : toutes passent le calcul des droits', () => {
    for (const w of WORKS) expect(['free', 'likely'], `${w.slug} → ${evaluate(w, 2026).fr}`).toContain(evaluate(w, 2026).fr);
  });
  it('une œuvre sans auteur renseigné doit porter une licence de l’ayant droit', () => {
    for (const w of WORKS) if (w.authors.length === 0) expect(w.cc, w.slug).toBeDefined();
  });
  it('les titres alternatifs sont déjà normalisés (sinon ils ne correspondraient jamais)', () => {
    for (const w of WORKS) for (const a of w.aliases ?? []) expect(a, `${w.slug}: ${a}`).toMatch(/^[a-z0-9 ]+$/);
  });
  it('chaque parcours ne cite que des œuvres existantes, et chaque œuvre est dans un parcours', () => {
    const slugs = new Set(WORKS.map((w) => w.slug));
    const shelved = new Set(SHELVES.flatMap((s) => s.slugs));
    for (const s of SHELVES) for (const slug of s.slugs) expect(slugs.has(slug), `${s.id} → ${slug}`).toBe(true);
    for (const w of WORKS) expect(shelved.has(w.slug), w.slug).toBe(true);
  });
  it('les épisodes sont numérotés de 1 à n', () => {
    for (const w of WORKS) if (w.episodes) expect(w.episodes.map((e) => e.n)).toEqual(w.episodes.map((_, i) => i + 1));
  });
});

describe('accueil', () => {
  it('donne une séance du jour et des parcours non vides, dans la langue demandée', () => {
    const fr = buildHome('fr', DAY);
    expect(fr.total).toBe(catalogue(2026).length);
    expect(fr.rows.every((r) => r.items.length > 0 && r.title && r.intro)).toBe(true);
    expect(fr.rows[0]?.title).toBe('Les rois du rire');
    expect(buildHome('en', DAY).rows[0]?.title).toBe('Kings of comedy');
    expect(fr.featured.why).toBeTruthy();
  });
  it('la séance du jour est la même toute la journée et change le lendemain', () => {
    const pool = catalogue(2026);
    const a = featuredOf(new Date('2026-11-12T00:05:00Z'), pool);
    expect(featuredOf(new Date('2026-11-12T23:50:00Z'), pool).slug).toBe(a.slug);
    expect(featuredOf(new Date('2026-11-13T00:05:00Z'), pool).slug).not.toBe(a.slug);
    expect(a.minutes).toBeGreaterThanOrEqual(40);
  });
  it('une œuvre qui redevient protégée disparaît d’elle-même', () => {
    // En 1990, Keaton (mort en 1966) et ses films de 1926 étaient protégés partout.
    const old = buildHome('fr', new Date('1990-01-01T00:00:00Z'));
    expect(old.rows.flatMap((r) => r.items).some((i) => i.slug === 'le-mecano-de-la-general')).toBe(false);
  });
});

describe('page d’une œuvre', () => {
  it('donne les auteurs, le parcours et des œuvres proches', () => {
    const d = workDetail('nosferatu', 'fr', DAY);
    expect(d?.item.rights).toMatchObject({ fr: 'likely', lastDeath: 1949 });
    expect(d?.authors.map((a) => a.name)).toContain('Henrik Galeen');
    expect(d?.shelf?.id).toBe('frissons');
    expect(d?.related.length).toBeGreaterThan(3);
    expect(d?.related.some((i) => i.slug === 'nosferatu')).toBe(false);
  });
  it('une série expose ses épisodes, chacun lisible séparément', () => {
    const v = workDetail('les-vampires', 'fr', DAY);
    expect(v?.episodes).toHaveLength(10);
    expect(v?.episodes[0]?.item.title).toBe('Les Vampires · 1. La Tête coupée');
    const j = WORKS.find((w) => w.slug === 'judex');
    const e = episodeItem(j!, j!.episodes![1]!, 'fr', 2026);
    expect(e.uid).toBe("internet-archive:JudexEpisode01LOmbreMystrieuse1916#Judex_-_Episode_02_-_L'Expiation_(1916).mp4");
    expect(new Set(workDetail('judex', 'fr', DAY)?.episodes.map((x) => x.item.uid)).size).toBe(12);
  });
  it('renvoie undefined pour une œuvre inconnue', () => {
    expect(workDetail('inconnu', 'fr', DAY)).toBeUndefined();
  });
});

describe('recherche dans le catalogue', () => {
  const titles = (q: string, tag?: string) => searchCatalogue(q, tag, 'fr', DAY).items.map((i) => i.title);
  it('trouve par titre, sans accents ni majuscules, dans les deux langues', () => {
    expect(titles('melies').length).toBeGreaterThan(3);
    expect(titles('MÉCANO')[0]).toBe('Le Mécano de la « General »');
    expect(titles('the general')[0]).toBe('Le Mécano de la « General »');
  });
  it('trouve par réalisateur et par début de mot', () => {
    expect(titles('keaton')).toContain('Sherlock Junior');
    expect(titles('nosf')).toEqual(['Nosferatu le vampire']);
  });
  it('tous les mots doivent correspondre', () => {
    expect(titles('keaton 1924')).toEqual(expect.arrayContaining(['Sherlock Junior', 'La Croisière du Navigator']));
    expect(titles('keaton 1924')).not.toContain('Le Mécano de la « General »');
    expect(titles('zzzz')).toEqual([]);
  });
  it('filtre par genre et renvoie tout le catalogue sans mot-clé', () => {
    expect(searchCatalogue('', undefined, 'fr', DAY).total).toBe(catalogue(2026).length);
    expect(titles('', 'series')).toEqual(['Les Vampires', 'Judex']);
  });
});

describe('aperçu de partage', () => {
  const index = '<html><head><meta name="description" content="x" /><title>Openflix</title></head><body></body></html>';
  it('injecte titre, description et image de l’œuvre', () => {
    const html = shareHtml(index, 'nosferatu', 'https://exemple.test');
    expect(html).toContain('<title>Nosferatu le vampire (1922) · Openflix</title>');
    expect(html).toContain('property="og:image" content="https://archive.org/services/img/');
    expect(html).toContain('content="https://exemple.test/film/nosferatu"');
  });
  it('échappe le HTML et ignore une œuvre inconnue', () => {
    expect(shareHtml(index, 'le-mecano-de-la-general', 'https://x.test"><script>')).not.toContain('"><script>');
    expect(shareHtml(index, 'inconnu', 'https://x.test')).toBeUndefined();
  });
});
