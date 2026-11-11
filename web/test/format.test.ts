import { describe, expect, it } from 'vitest';
import type { LicenseInfo, MediaLink } from '../../server/src/types';
import { formatBytes, formatClock, formatDuration, licenseText, linkText, qualityText } from '../src/format';
import { interpolate, messages, type MessageKey } from '../src/messages';

const tFor = (lang: 'fr' | 'en') => (key: MessageKey, vars?: Record<string, string | number>) => interpolate(messages[lang][key], vars);

describe('formatage', () => {
  it('octets selon la langue', () => {
    expect(formatBytes(641728512, 'fr')).toBe('612 Mo');
    expect(formatBytes(641728512, 'en')).toBe('612 MB');
    expect(formatBytes(1536, 'fr')).toBe('1,5 Ko');
    expect(formatBytes(1536, 'en')).toBe('1.5 KB');
    expect(formatBytes(0, 'fr')).toBeUndefined();
    expect(formatBytes(undefined, 'en')).toBeUndefined();
  });

  it('durées', () => {
    expect(formatDuration(5640, 'fr')).toBe('1 h 34');
    expect(formatDuration(5640, 'en')).toBe('1h 34m');
    expect(formatDuration(635, 'fr')).toBe('10 min');
    expect(formatDuration(45, 'en')).toBe('45 s');
    expect(formatDuration(0, 'fr')).toBeUndefined();
  });

  it('horloge de lecture', () => {
    expect(formatClock(83)).toBe('1:23');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-4)).toBe('0:00');
  });
});

describe('licenseText', () => {
  const lic = (category: LicenseInfo['category'], label: string): LicenseInfo => ({ category, label, verified: category !== 'unknown' && category !== 'restricted' });

  it('traduit les catégories et garde le libellé CC', () => {
    expect(licenseText(lic('public-domain', 'Public domain'), tFor('fr'))).toBe('Domaine public');
    expect(licenseText(lic('public-domain', 'Public domain'), tFor('en'))).toBe('Public domain');
    expect(licenseText(lic('public-domain', 'CC0'), tFor('fr'))).toBe('CC0');
    expect(licenseText(lic('cc', 'CC BY-SA 4.0'), tFor('fr'))).toBe('CC BY-SA 4.0');
    expect(licenseText(lic('cc-nc', 'CC BY-NC 4.0'), tFor('en'))).toBe('CC BY-NC 4.0');
    expect(licenseText(lic('unknown', 'Unknown'), tFor('fr'))).toBe('Licence à vérifier');
    expect(licenseText(lic('unknown', 'Licence maison'), tFor('en'))).toBe('License unverified');
    expect(licenseText(lic('restricted', 'All rights reserved'), tFor('en'))).toBe('All rights reserved');
  });
});

describe('linkText', () => {
  const base = { score: 1, playable: false };
  const stream: MediaLink = { ...base, url: 'https://archive.org/download/x/a.mp4', type: 'stream', format: 'mp4', height: 480, sizeBytes: 641728512, playable: true };

  it('construit le libellé dans la langue choisie', () => {
    expect(linkText(stream, tFor('fr'), 'fr')).toBe('Lecture directe · MP4 · 480p · 612 Mo');
    expect(linkText(stream, tFor('en'), 'en')).toBe('Direct playback · MP4 · 480p · 612 MB');
    expect(linkText({ ...base, url: 'https://x.test/a.mkv', type: 'download', format: 'mkv' }, tFor('en'), 'en')).toBe('Download · MKV');
  });

  it('gère HLS, lecteur intégré et page de la source', () => {
    expect(linkText({ ...base, url: 'https://t.example.org/m.m3u8', type: 'download', format: 'm3u8' }, tFor('fr'), 'fr')).toBe('Flux HLS (VLC, mpv…)');
    expect(linkText({ ...base, url: 'https://archive.org/embed/x', type: 'embed' }, tFor('en'), 'en')).toBe('Source’s embedded player');
    expect(linkText({ ...base, url: 'https://www.archive.org/details/x', type: 'page' }, tFor('fr'), 'fr')).toBe('Page sur archive.org');
    expect(linkText({ ...base, url: 'pas une url', type: 'page' }, tFor('en'), 'en')).toBe('Page on ');
  });
});

describe('qualityText', () => {
  it('hauteur si connue, sinon déclinaison traduite, sinon rien', () => {
    expect(qualityText({ height: 1080 }, tFor('fr'))).toBe('1080p');
    expect(qualityText({ variant: 'small' }, tFor('fr'))).toBe('petite');
    expect(qualityText({ variant: 'small' }, tFor('en'))).toBe('small');
    expect(qualityText({ variant: 'original' }, tFor('fr'))).toBe('originale');
    expect(qualityText({ variant: 'inconnue' }, tFor('fr'))).toBe('inconnue');
    expect(qualityText({}, tFor('fr'))).toBeUndefined();
    expect(qualityText({ height: 480, variant: 'small' }, tFor('en'))).toBe('480p');
  });

  it('apparaît dans le libellé des liens NASA', () => {
    const link = { url: 'https://images-assets.nasa.gov/x~small.mp4', type: 'stream' as const, format: 'mp4', variant: 'small', score: 104, playable: true };
    expect(linkText(link, tFor('fr'), 'fr')).toBe('Lecture directe · MP4 · petite');
    expect(linkText(link, tFor('en'), 'en')).toBe('Direct playback · MP4 · small');
  });
});
