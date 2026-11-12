/**
 * Plein écran, y compris sur iPhone.
 *
 * Safari sur iPhone n'a pas l'API plein écran standard pour une page ou un conteneur : seul l'élément
 * <video> peut passer en plein écran, via `webkitEnterFullscreen()` (avec le lecteur natif d'iOS,
 * qui garde les sous-titres et la qualité). Sur ordinateur et Android, on met tout le lecteur en plein
 * écran pour garder notre barre.
 */

interface FsDocument {
  fullscreenEnabled?: boolean;
  fullscreenElement?: unknown;
  exitFullscreen?: () => Promise<void>;
}
interface FsRoot {
  requestFullscreen?: () => Promise<void>;
}
interface FsVideo {
  webkitEnterFullscreen?: () => void;
  webkitSupportsFullscreen?: boolean;
}

/**
 * Un bouton plein écran a-t-il un sens ici ? `videoLike` est un élément <video> ou son prototype :
 * sur iPhone, `document.fullscreenEnabled` est faux mais la vidéo sait passer en plein écran.
 */
export function canFullscreen(doc: FsDocument, videoLike: object | null | undefined): boolean {
  if (doc.fullscreenEnabled) return true;
  return !!videoLike && 'webkitEnterFullscreen' in videoLike;
}

/** Vrai si l'action a pu être lancée. */
export function toggleFullscreen(doc: FsDocument, root: FsRoot | null | undefined, videoEl: object | null | undefined): boolean {
  const video = videoEl as FsVideo | null | undefined;
  if (doc.fullscreenElement) {
    void doc.exitFullscreen?.();
    return true;
  }
  if (doc.fullscreenEnabled && root?.requestFullscreen) {
    void root.requestFullscreen().catch(() => undefined);
    return true;
  }
  if (typeof video?.webkitEnterFullscreen === 'function') {
    try {
      video.webkitEnterFullscreen();
      return true;
    } catch {
      return false; // la vidéo n'est pas encore prête : un second appui fonctionnera
    }
  }
  return false;
}
