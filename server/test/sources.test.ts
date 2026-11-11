/**
 * Les réponses ci-dessous sont construites d'après les formats d'API documentés de chaque source.
 * Ce ne sont PAS des captures de réponses réelles : `npm run smoke` valide les formats en direct.
 */
import { describe, expect, it } from 'vitest';
import { buildQuery, internetArchive, toItem as iaItem } from '../src/sources/internetArchive.js';
import { nasa } from '../src/sources/nasa.js';
import { decodeId, peertube } from '../src/sources/peertube.js';
import { cleanTitle, wikimediaCommons } from '../src/sources/wikimediaCommons.js';
import { fakeHttp } from './helpers.js';

describe('Internet Archive', () => {
  it('construit la requête : mots-clés nettoyés, types de média, hors prêt restreint', () => {
    expect(buildQuery('nosferatu: (1922)', ['video'], {}, false, false)).toBe(
      '(nosferatu 1922) AND mediatype:(movies) AND -access-restricted-item:true',
    );
    expect(buildQuery('', ['video', 'audio'], {}, false, false)).toBe('mediatype:(movies OR audio OR etree) AND -access-restricted-item:true');
  });

  it('transforme un résultat de recherche (champs parfois en tableau)', () => {
    const item = iaItem({
      identifier: 'Nosferatu_1922',
      title: ['Nosferatu'],
      description: '<p>Un classique &amp; muet</p>',
      mediatype: 'movies',
      year: '1922',
      downloads: 123456,
      licenseurl: 'https://creativecommons.org/publicdomain/mark/1.0/',
      creator: ['F. W. Murnau'],
    });
    expect(item).toMatchObject({
      uid: 'internet-archive:Nosferatu_1922',
      title: 'Nosferatu',
      description: 'Un classique & muet',
      kind: 'video',
      year: 1922,
      creator: 'F. W. Murnau',
      popularity: 123456,
      thumbnail: 'https://archive.org/services/img/Nosferatu_1922',
      pageUrl: 'https://archive.org/details/Nosferatu_1922',
      license: { category: 'public-domain', verified: true },
    });
    expect(iaItem({ identifier: 'x', mediatype: 'collection' })).toBeNull();
  });

  it('search interroge advancedsearch avec tri par téléchargements', async () => {
    const http = fakeHttp({
      advancedsearch: { response: { docs: [{ identifier: 'a', title: 'A', mediatype: 'movies' }, { identifier: 'b', mediatype: 'audio' }] } },
    });
    const items = await internetArchive.search({ q: 'chaplin', kinds: ['video', 'audio'], page: 2, limit: 10 }, http);
    expect(items.map((i) => i.uid)).toEqual(['internet-archive:a', 'internet-archive:b']);
    const url = new URL(http.calls[0] as string);
    expect(url.searchParams.get('rows')).toBe('10');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.getAll('sort[]')).toEqual(['downloads desc']);
    expect(url.searchParams.get('output')).toBe('json');
  });

  it('resolve choisit le MP4 h.264 et encode les noms de fichiers', async () => {
    const http = fakeHttp({
      '/metadata/Film_1': {
        metadata: { mediatype: 'movies', licenseurl: 'https://creativecommons.org/licenses/by/4.0/' },
        files: [
          { name: 'Film 1.mkv', format: 'Matroska', size: '2000000000', source: 'original' },
          { name: 'Film 1.mp4', format: 'h.264', size: '600000000', source: 'derivative', length: '5400.5', height: '480' },
          { name: 'Film 1_512kb.mp4', format: '512Kb MPEG4', size: '90000000', source: 'derivative' },
          { name: 'Film 1_thumb.jpg', format: 'Thumbnail', source: 'derivative' },
          { name: 'Film_1_files.xml', format: 'Metadata', source: 'original' },
          { name: 'secret.mp4', format: 'h.264', private: 'true' },
        ],
      },
    });
    const r = await internetArchive.resolve('Film_1', 'video', http);
    expect(r.links[0]).toMatchObject({
      url: 'https://archive.org/download/Film_1/Film%201.mp4',
      type: 'stream',
      height: 480,
      durationSec: 5400.5,
    });
    expect(r.links.map((l) => l.type)).toEqual(['stream', 'stream', 'download', 'embed', 'page']);
    expect(r.links.some((l) => l.url.includes('secret'))).toBe(false);
    expect(r.license).toMatchObject({ category: 'cc', label: 'CC BY 4.0' });
    expect(r.durationSec).toBe(5400.5);
  });

  it('resolve renvoie zéro lien pour un item « dark »', async () => {
    const http = fakeHttp({ '/metadata/': { is_dark: true } });
    expect((await internetArchive.resolve('gone', 'video', http)).links).toEqual([]);
  });
});

describe('Wikimedia Commons', () => {
  const page = {
    title: 'File:Big_Buck_Bunny_4K.webm',
    index: 1,
    imageinfo: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Big_Buck_Bunny_4K.webm',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_4K.webm',
        thumburl: 'http://upload.wikimedia.org/thumb.jpg',
        size: 123456789,
        duration: 635.5,
        mime: 'video/webm',
        extmetadata: {
          LicenseShortName: { value: 'CC BY 3.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by/3.0' },
          ImageDescription: { value: '<b>Big Buck Bunny</b> film' },
          Artist: { value: '<a href="x">Blender Foundation</a>' },
          DateTimeOriginal: { value: '2008-04-10' },
        },
      },
    ],
  };

  it('nettoie les titres', () => {
    expect(cleanTitle('File:Big_Buck_Bunny_4K.webm')).toBe('Big Buck Bunny 4K');
  });

  it('search : une requête par type, items normalisés', async () => {
    const http = fakeHttp({ 'commons.wikimedia.org': { query: { pages: [page] } } });
    const items = await wikimediaCommons.search({ q: 'bunny', kinds: ['video', 'audio'], page: 1, limit: 10 }, http);
    expect(http.calls).toHaveLength(2);
    expect(new URL(http.calls[0] as string).searchParams.get('gsrsearch')).toBe('bunny filetype:video');
    expect(new URL(http.calls[1] as string).searchParams.get('gsrsearch')).toBe('bunny filetype:audio');
    expect(items[0]).toMatchObject({
      title: 'Big Buck Bunny 4K',
      kind: 'video',
      year: 2008,
      creator: 'Blender Foundation',
      description: 'Big Buck Bunny film',
      thumbnail: 'https://upload.wikimedia.org/thumb.jpg',
      license: { category: 'cc', label: 'CC BY 3.0', verified: true },
    });
  });

  it('resolve : lecture directe WebM + page', async () => {
    const http = fakeHttp({ 'commons.wikimedia.org': { query: { pages: [page] } } });
    const r = await wikimediaCommons.resolve('File:Big_Buck_Bunny_4K.webm', 'video', http);
    expect(r.links[0]).toMatchObject({ type: 'stream', format: 'webm', sizeBytes: 123456789 });
    expect(r.links.at(-1)?.type).toBe('page');
  });
});

describe('NASA', () => {
  const searchData = {
    collection: {
      items: [
        {
          data: [{ nasa_id: 'GSFC_1', title: 'Apollo 11', description: 'Premier pas', date_created: '1969-07-20T00:00:00Z', media_type: 'video', center: 'JSC' }],
          links: [{ href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~thumb.jpg', rel: 'preview' }],
        },
        { data: [{ nasa_id: 'IMG_1', media_type: 'image' }] },
      ],
    },
  };

  it('search : garde vidéo et audio, public domain, miniature en https', async () => {
    const http = fakeHttp({ 'images-api.nasa.gov/search': searchData });
    const items = await nasa.search({ q: 'apollo', kinds: ['video'], page: 1, limit: 5 }, http);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      uid: 'nasa:GSFC_1',
      year: 1969,
      thumbnail: 'https://images-assets.nasa.gov/video/GSFC_1/GSFC_1~thumb.jpg',
      license: { category: 'public-domain', verified: true },
    });
    expect(new URL(http.calls[0] as string).searchParams.get('media_type')).toBe('video');
  });

  it('search : ignore la requête sans mot-clé', async () => {
    const http = fakeHttp({});
    expect(await nasa.search({ q: '  ', kinds: ['video'], page: 1, limit: 5 }, http)).toEqual([]);
    expect(http.calls).toHaveLength(0);
  });

  it('resolve : préfère ~large.mp4 à l’original et écarte aperçus et sous-titres', async () => {
    const http = fakeHttp({
      '/asset/GSFC_1': {
        collection: {
          items: [
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~orig.mp4' },
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~large.mp4' },
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~mobile.mp4' },
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~preview.mp4' },
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1.srt' },
            { href: 'http://images-assets.nasa.gov/video/GSFC_1/GSFC_1~thumb.jpg' },
          ],
        },
      },
    });
    const r = await nasa.resolve('GSFC_1', 'video', http);
    const urls = r.links.filter((l) => l.type === 'stream').map((l) => l.url);
    expect(urls).toEqual([
      'https://images-assets.nasa.gov/video/GSFC_1/GSFC_1~large.mp4',
      'https://images-assets.nasa.gov/video/GSFC_1/GSFC_1~orig.mp4',
      'https://images-assets.nasa.gov/video/GSFC_1/GSFC_1~mobile.mp4',
    ]);
  });
});

describe('PeerTube (SepiaSearch)', () => {
  const video = {
    uuid: '6f8e2b1c-aaaa-bbbb-cccc-1234567890ab',
    name: 'Mon film libre',
    description: 'Court métrage',
    duration: 300,
    thumbnailUrl: 'https://tube.example.org/lazy-static/thumb.jpg',
    url: 'https://tube.example.org/w/6f8e2b1c',
    publishedAt: '2023-05-01T10:00:00Z',
    views: 42,
    licence: { id: 2 },
    account: { displayName: 'Alice' },
  };

  it('search : ne garde que les vidéos sous licence libre', async () => {
    const http = fakeHttp({
      'sepiasearch.org': { data: [video, { ...video, uuid: 'x'.repeat(12), licence: { id: undefined } }, { ...video, uuid: 'y'.repeat(12), licence: null }] },
    });
    const items = await peertube.search({ q: 'film', kinds: ['video'], page: 3, limit: 10 }, http);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      sourceId: 'tube.example.org|6f8e2b1c-aaaa-bbbb-cccc-1234567890ab',
      license: { category: 'cc', label: 'CC BY-SA 4.0' },
      year: 2023,
      creator: 'Alice',
    });
    const url = new URL(http.calls[0] as string);
    expect(url.searchParams.get('start')).toBe('20');
    expect(url.searchParams.getAll('licenceOneOf')).toHaveLength(7);
  });

  it('decodeId refuse les identifiants suspects (hôte forgé, port, chemin…)', () => {
    expect(decodeId('tube.example.org|6f8e2b1c-aaaa-bbbb-cccc-1234567890ab')).not.toBeNull();
    expect(decodeId('tube.example.org:8080|6f8e2b1c-aaaa')).toBeNull();
    expect(decodeId('evil.com/path|6f8e2b1c-aaaa')).toBeNull();
    expect(decodeId('tube.example.org|../../etc')).toBeNull();
    expect(decodeId('seulement-un-hote')).toBeNull();
  });

  it('resolve : fichiers MP4 classés par résolution, HLS en téléchargement', async () => {
    const http = fakeHttp({
      'tube.example.org/api/v1/videos/': {
        files: [
          { fileUrl: 'https://tube.example.org/static/web-videos/a-480.mp4', size: 1000, resolution: { id: 480 } },
          { fileUrl: 'https://tube.example.org/static/web-videos/a-1080.mp4', size: 4000, resolution: { id: 1080 } },
        ],
        streamingPlaylists: [{ playlistUrl: 'https://tube.example.org/static/streaming-playlists/hls/a/master.m3u8' }],
      },
    });
    const r = await peertube.resolve('tube.example.org|6f8e2b1c-aaaa-bbbb-cccc-1234567890ab', 'video', http);
    expect(r.links[0]).toMatchObject({ type: 'stream', height: 1080 });
    expect(r.links.map((l) => l.type)).toEqual(['stream', 'stream', 'download', 'embed', 'page']);
  });

  it('resolve : identifiant invalide → aucun appel réseau', async () => {
    const http = fakeHttp({});
    expect((await peertube.resolve('n-importe|quoi', 'video', http)).links).toEqual([]);
    expect(http.calls).toHaveLength(0);
  });
});

describe('Internet Archive : filtres de catalogue', () => {
  it('ajoute collections, langues, sujets et années', () => {
    expect(
      buildQuery('', ['video'], {
        collections: ['feature_films', 'SciFi_Horror'],
        languages: ['French', 'fre'],
        subjects: ['documentary'],
        yearFrom: 1920,
        yearTo: 1950,
      }, false, false),
    ).toBe(
      'mediatype:(movies) AND collection:(feature_films OR SciFi_Horror) AND language:(French OR fre) AND subject:(documentary) AND year:[1920 TO 1950] AND -access-restricted-item:true',
    );
  });

  it('écarte les valeurs qui pourraient injecter de la syntaxe Lucene', () => {
    const q = buildQuery('', ['video'], { collections: ['ok_1', 'x) OR (mediatype:texts', 'a b'], subjects: ['*'] }, false, false);
    expect(q).toBe('mediatype:(movies) AND collection:(ok_1) AND -access-restricted-item:true');
  });

  it('une borne d’année seule suffit', () => {
    expect(buildQuery('', ['video'], { yearTo: 1930 }, false, false)).toContain('year:[1850 TO 1930]');
  });
});

describe('Internet Archive : licence déclarée', () => {
  it('« licensed » ajoute licenseurl:* à la requête (syntaxe validée sur la vraie API)', () => {
    expect(buildQuery('', ['video'], { collections: ['feature_films'], licensed: true }, false, false)).toBe(
      'mediatype:(movies) AND collection:(feature_films) AND licenseurl:* AND -access-restricted-item:true',
    );
    expect(buildQuery('', ['video'], {}, false, false)).not.toContain('licenseurl');
  });
});
