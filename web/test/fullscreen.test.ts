import { describe, expect, it, vi } from 'vitest';
import { canFullscreen, toggleFullscreen } from '../src/fullscreen';

describe('canFullscreen', () => {
  it('ordinateur et Android : l’API standard suffit', () => {
    expect(canFullscreen({ fullscreenEnabled: true }, {})).toBe(true);
  });
  it('iPhone : pas d’API standard, mais la vidéo sait passer en plein écran', () => {
    expect(canFullscreen({ fullscreenEnabled: false }, { webkitEnterFullscreen: () => undefined })).toBe(true);
    expect(canFullscreen({}, Object.create({ webkitEnterFullscreen() {} }))).toBe(true);
  });
  it('aucun moyen : pas de bouton', () => {
    expect(canFullscreen({ fullscreenEnabled: false }, {})).toBe(false);
    expect(canFullscreen({}, null)).toBe(false);
  });
});

describe('toggleFullscreen', () => {
  it('met tout le lecteur en plein écran quand l’API standard existe', () => {
    const requestFullscreen = vi.fn(() => Promise.resolve());
    const webkitEnterFullscreen = vi.fn();
    expect(toggleFullscreen({ fullscreenEnabled: true }, { requestFullscreen }, { webkitEnterFullscreen })).toBe(true);
    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(webkitEnterFullscreen).not.toHaveBeenCalled();
  });
  it('iPhone : passe par la vidéo', () => {
    const webkitEnterFullscreen = vi.fn();
    expect(toggleFullscreen({ fullscreenEnabled: false }, {}, { webkitEnterFullscreen })).toBe(true);
    expect(webkitEnterFullscreen).toHaveBeenCalledOnce();
  });
  it('quitte le plein écran s’il est actif', () => {
    const exitFullscreen = vi.fn(() => Promise.resolve());
    expect(toggleFullscreen({ fullscreenElement: {}, exitFullscreen, fullscreenEnabled: true }, {}, {})).toBe(true);
    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
  it('ne plante pas si la vidéo n’est pas prête', () => {
    const webkitEnterFullscreen = () => {
      throw new Error('not ready');
    };
    expect(toggleFullscreen({}, {}, { webkitEnterFullscreen })).toBe(false);
  });
  it('rien à faire sans aucun moyen', () => {
    expect(toggleFullscreen({}, null, null)).toBe(false);
  });
});
