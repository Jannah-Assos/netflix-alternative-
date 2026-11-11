import { describe, expect, it } from 'vitest';
import { surveyCollection } from '../src/survey.js';
import { fakeHttp } from './helpers.js';

describe('surveyCollection', () => {
  const docs = [
    { identifier: 'a', year: '1944', description: 'x', licenseurl: 'https://creativecommons.org/publicdomain/mark/1.0/', creator: 'United States. Navy', language: 'eng' },
    { identifier: 'b', licenseurl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
  ];
  const meta = { files: [{ name: 'a.mp4', format: 'h.264', length: '120' }, { name: 'a.asr.vtt', size: '900' }] };

  it('résume une collection : volumes, complétude des fiches, sous-titres', async () => {
    const http = fakeHttp({ 'advancedsearch.php': { response: { numFound: 10, docs } }, '/metadata/': meta });
    const out = await surveyCollection(http, 'wwIIarchive', 30);
    expect(out).toContain('## wwIIarchive');
    expect(out).toContain('films : 10');
    expect(out).toMatch(/année\s+50 %/);
    expect(out).toMatch(/sous-titres\s+100 %/);
    expect(out).toContain('United States. Navy (1)');
  });

  it('refuse un nom de collection qui pourrait modifier la requête', async () => {
    await expect(surveyCollection(fakeHttp({}), 'x OR collection:*', 30)).rejects.toThrow(/invalide/);
  });
});
