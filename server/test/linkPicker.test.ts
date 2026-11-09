import { describe, expect, it } from 'vitest';
import { pickBest, rankCandidates, type Candidate } from '../src/linkPicker.js';

const c = (name: string, extra: Partial<Candidate> = {}): Candidate => ({ url: `https://x.test/${name}`, name, ...extra });

describe('rankCandidates (vidéo)', () => {
  it('préfère un MP4 h.264 dérivé à un MKV original', () => {
    const links = rankCandidates(
      [
        c('film.mkv', { format: 'Matroska', sizeBytes: 3e9 }),
        c('film.mp4', { format: 'h.264', derivative: true, sizeBytes: 5e8, height: 480 }),
      ],
      'video',
    );
    expect(links[0]?.url).toContain('film.mp4');
    expect(links[0]).toMatchObject({ type: 'stream', playable: true });
    expect(links[1]).toMatchObject({ type: 'download', playable: false });
  });

  it('préfère la meilleure résolution à format égal', () => {
    const links = rankCandidates([c('a.mp4', { height: 360 }), c('b.mp4', { height: 1080 })], 'video');
    expect(links[0]?.url).toContain('b.mp4');
  });

  it('pénalise la version 512Kb et ignore vignettes, métadonnées et fichiers vides', () => {
    const links = rankCandidates(
      [
        c('film_512kb.mp4', { format: '512Kb MPEG4', derivative: true }),
        c('film.mp4', { format: 'h.264', derivative: true }),
        c('film_thumb.jpg'),
        c('film_meta.xml'),
        c('vide.mp4', { sizeBytes: 0 }),
      ],
      'video',
    );
    expect(links.map((l) => l.url)).toEqual(['https://x.test/film.mp4', 'https://x.test/film_512kb.mp4']);
  });

  it('retire les doublons et respecte le maximum', () => {
    const many = Array.from({ length: 12 }, (_, i) => c(`f${i}.mp4`, { height: 100 + i }));
    expect(rankCandidates([...many, many[0] as Candidate], 'video', 5)).toHaveLength(5);
  });
});

describe('rankCandidates (autres types)', () => {
  it('audio : mp3 avant flac et wav', () => {
    const links = rankCandidates([c('a.wav'), c('a.flac'), c('a.mp3')], 'audio');
    expect(links.map((l) => l.format)).toEqual(['mp3', 'flac', 'wav']);
  });

  it('logiciel : zip en premier, jamais « lisible »', () => {
    const links = rankCandidates([c('game.iso'), c('game.zip')], 'software');
    expect(links[0]?.format).toBe('zip');
    expect(links.every((l) => !l.playable)).toBe(true);
  });

  it('texte : pdf avant epub', () => {
    expect(rankCandidates([c('b.epub'), c('b.pdf')], 'text')[0]?.format).toBe('pdf');
  });
});

describe('pickBest', () => {
  it('choisit une lecture directe, sinon un téléchargement, jamais une page', () => {
    const base = { label: '', score: 1, playable: false };
    expect(
      pickBest([
        { ...base, url: 'p', type: 'page' },
        { ...base, url: 'd', type: 'download' },
        { ...base, url: 's', type: 'stream', playable: true },
      ])?.url,
    ).toBe('s');
    expect(pickBest([{ ...base, url: 'p', type: 'page' }, { ...base, url: 'd', type: 'download' }])?.url).toBe('d');
    expect(pickBest([{ ...base, url: 'e', type: 'embed' }])).toBeUndefined();
  });
});
