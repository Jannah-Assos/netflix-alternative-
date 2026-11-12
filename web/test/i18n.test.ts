import { describe, expect, it } from 'vitest';
import { detectLang, interpolate, messages, SUGGESTIONS } from '../src/messages';

describe('traductions', () => {
  const fr = Object.keys(messages.fr).sort();
  const en = Object.keys(messages.en).sort();

  it('FR et EN ont exactement les mêmes clés', () => {
    expect(en).toEqual(fr);
  });

  it('aucun texte vide', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const [key, value] of Object.entries(messages[lang])) expect(value.trim(), `${lang}:${key}`).not.toBe('');
    }
  });

  it('les variables {x} sont les mêmes dans les deux langues', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of fr as (keyof typeof messages.fr)[]) {
      expect(vars(messages.en[key]), key).toEqual(vars(messages.fr[key]));
    }
  });

  it('chaque genre du catalogue du serveur a un libellé dans les deux langues', async () => {
    const { WORKS } = await import('../../server/src/works');
    const { TAGS } = await import('../src/views/Catalogue');
    const used = new Set(WORKS.flatMap((w) => w.tags));
    for (const tag of used) {
      expect(messages.fr, tag).toHaveProperty(`tag.${tag}`);
      expect(messages.en, tag).toHaveProperty(`tag.${tag}`);
      expect(TAGS as readonly string[], tag).toContain(tag);
    }
  });

  it('chaque code d’erreur ou de saut du serveur est traduit', () => {
    for (const code of ['network', 'timeout', 'http', 'blocked', 'unknown']) expect(messages.fr).toHaveProperty(`err.${code}`);
    for (const reason of ['unsupported-kind', 'query-required']) expect(messages.fr).toHaveProperty(`skip.${reason}`);
  });

  it('suggestions dans les deux langues', () => {
    expect(SUGGESTIONS.fr.length).toBeGreaterThan(3);
    expect(SUGGESTIONS.en.length).toBeGreaterThan(3);
  });
});

describe('interpolate / detectLang', () => {
  it('remplace les variables et laisse celles qui manquent visibles', () => {
    expect(interpolate('{n} résultats pour « {q} »', { n: 3, q: 'film' })).toBe('3 résultats pour « film »');
    expect(interpolate('Salut {nom}')).toBe('Salut {nom}');
    expect(interpolate('Salut {nom}', {})).toBe('Salut {nom}');
  });

  it('préfère le choix mémorisé, puis la langue du navigateur', () => {
    expect(detectLang('en', ['fr-FR'])).toBe('en');
    expect(detectLang('fr', ['en-US'])).toBe('fr');
    expect(detectLang(null, ['fr-CA', 'en'])).toBe('fr');
    expect(detectLang(null, ['de-DE', 'en-GB'])).toBe('en');
    expect(detectLang('zz', ['es'])).toBe('en');
    expect(detectLang(null, [])).toBe('en');
  });
});
