import { beforeEach, describe, expect, it } from 'vitest';
import type { MediaItem } from '../../server/src/types';
import { clearProgress, getContinue, getList, getProgress, isInList, saveProgress, subscribe, toggleList } from '../src/storage';

const item = (n: number): MediaItem => ({
  uid: `internet-archive:${n}`,
  source: 'internet-archive',
  sourceId: String(n),
  title: `Film ${n}`,
  kind: 'video',
  pageUrl: 'https://x.test',
  license: { category: 'public-domain', label: 'Public domain', verified: true },
});

// Dans Node, localStorage n'existe pas : le module doit fonctionner en mémoire.
beforeEach(() => {
  for (const i of getList()) toggleList(i);
  for (let n = 0; n < 80; n++) clearProgress(`internet-archive:${n}`);
});

describe('Ma liste', () => {
  it('ajoute puis retire un titre', () => {
    expect(toggleList(item(1))).toBe(true);
    expect(isInList('internet-archive:1')).toBe(true);
    expect(getList().map((i) => i.title)).toEqual(['Film 1']);
    expect(toggleList(item(1))).toBe(false);
    expect(isInList('internet-archive:1')).toBe(false);
  });

  it('met le plus récent en premier et notifie les abonnés', () => {
    let calls = 0;
    const off = subscribe(() => calls++);
    toggleList(item(1));
    toggleList(item(2));
    off();
    toggleList(item(3));
    expect(getList().map((i) => i.uid)).toEqual(['internet-archive:3', 'internet-archive:2', 'internet-archive:1']);
    expect(calls).toBe(2);
  });
});

describe('Reprendre la lecture', () => {
  it('ne propose que les titres vus plus de 10 s et pas terminés', () => {
    saveProgress(item(1), 5, 3600); // trop court
    saveProgress(item(2), 600, 3600); // à reprendre
    saveProgress(item(3), 3590, 3600); // presque fini
    saveProgress(item(4), 120, 0); // durée inconnue : à reprendre
    saveProgress(item(9), 22, 40); // court extrait, à mi-parcours : à reprendre
    saveProgress(item(10), 39, 40); // court extrait, fini : non
    const uids = getContinue().map((p) => p.item.uid);
    expect(uids).toContain('internet-archive:2');
    expect(uids).toContain('internet-archive:4');
    expect(uids).not.toContain('internet-archive:1');
    expect(uids).not.toContain('internet-archive:3');
    expect(uids).toContain('internet-archive:9');
    expect(uids).not.toContain('internet-archive:10');
  });

  it('trie par dernière lecture et garde la position', async () => {
    saveProgress(item(5), 100, 1000);
    await new Promise((r) => setTimeout(r, 5));
    saveProgress(item(6), 200, 1000);
    expect(getContinue().slice(0, 2).map((p) => p.item.uid)).toEqual(['internet-archive:6', 'internet-archive:5']);
    expect(getProgress('internet-archive:5')?.position).toBe(100);
  });

  it('clearProgress retire le titre, les valeurs invalides sont ignorées', () => {
    saveProgress(item(7), 300, 1000);
    clearProgress('internet-archive:7');
    expect(getProgress('internet-archive:7')).toBeUndefined();
    saveProgress(item(8), Number.NaN, 1000);
    saveProgress(item(8), -3, 1000);
    expect(getProgress('internet-archive:8')).toBeUndefined();
  });

  it('limite l’historique à 50 titres en gardant les plus récents', () => {
    for (let n = 0; n < 60; n++) saveProgress(item(n), 100, 1000);
    expect(getContinue().length).toBe(50);
    expect(getProgress('internet-archive:59')).toBeDefined();
  });
});
