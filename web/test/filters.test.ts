import { describe, expect, it } from 'vitest';
import { GENRE_IDS, PERIOD_IDS, SORT_KEYS } from '../../server/src/types';
import { CONTENT_LANGS, GENRES, PERIODS, SORTS } from '../src/labels';
import { messages } from '../src/messages';

describe('filtres : l’interface et le serveur parlent des mêmes valeurs', () => {
  it('genres, périodes et tris sont identiques des deux côtés', () => {
    expect([...GENRES]).toEqual([...GENRE_IDS]);
    expect([...PERIODS]).toEqual([...PERIOD_IDS]);
    expect([...SORTS]).toEqual([...SORT_KEYS]);
  });

  it('chaque valeur a un libellé dans les deux langues', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const g of GENRES) expect(messages[lang], `genre.${g}`).toHaveProperty(`genre.${g}`);
      for (const p of PERIODS) expect(messages[lang], `period.${p}`).toHaveProperty(`period.${p}`);
      for (const s of SORTS) expect(messages[lang], `sort.${s}`).toHaveProperty(`sort.${s}`);
      for (const l of CONTENT_LANGS) expect(messages[lang], `lang.${l}`).toHaveProperty(`lang.${l}`);
      for (const k of ['genre.all', 'period.any', 'lang.any', 'skip.filter-unsupported', 'watch.hint', 'watch.fullscreen']) {
        expect(messages[lang], k).toHaveProperty(k);
      }
    }
  });

  it('le nom de l’application est Openflix dans les deux langues', () => {
    expect(messages.fr['app.name']).toBe('Openflix');
    expect(messages.en['app.name']).toBe('Openflix');
  });
});
