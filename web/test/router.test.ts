import { describe, expect, it } from 'vitest';
import { legacyHashToPath, parsePath } from '../src/hooks';

describe('parsePath', () => {
  it('reconnaît chaque page', () => {
    expect(parsePath('/').view).toBe('home');
    expect(parsePath('/catalogue', '?q=keaton').view).toBe('catalogue');
    expect(parsePath('/catalogue', '?q=keaton').query.get('q')).toBe('keaton');
    expect(parsePath('/archive').view).toBe('archive');
    expect(parsePath('/liste').view).toBe('list');
    expect(parsePath('/a-propos').view).toBe('about');
  });
  it('lit l’identifiant d’un film', () => {
    expect(parsePath('/film/nosferatu')).toMatchObject({ view: 'film', slug: 'nosferatu' });
    expect(parsePath('/film/nosferatu/')).toMatchObject({ view: 'film', slug: 'nosferatu' });
  });
  it('retombe sur l’accueil pour une adresse inconnue ou un identifiant suspect', () => {
    expect(parsePath('/nimporte/quoi').view).toBe('home');
    expect(parsePath('/film/').view).toBe('home');
    expect(parsePath('/film/<script>').view).toBe('home');
  });
  it('la clé change avec l’adresse', () => {
    expect(parsePath('/film/a').key).not.toBe(parsePath('/film/b').key);
  });
});

describe('anciennes adresses en #/', () => {
  it('sont converties', () => {
    expect(legacyHashToPath('#/explore?q=chaplin&free=0')).toBe('/archive?q=chaplin&free=0');
    expect(legacyHashToPath('#/list')).toBe('/liste');
    expect(legacyHashToPath('#/')).toBe('/');
  });
  it('un # ordinaire est ignoré', () => {
    expect(legacyHashToPath('')).toBeNull();
    expect(legacyHashToPath('#section')).toBeNull();
  });
});
