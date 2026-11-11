import type { MediaItem } from '../../server/src/types';

/**
 * Stockage local (Ma liste, reprise de lecture, langue).
 * localStorage peut être absent ou bloqué (navigation privée) : on retombe sur la mémoire.
 */

const LIST_KEY = 'oms.list.v1';
const PROGRESS_KEY = 'oms.progress.v1';
const LANG_KEY = 'oms.lang';
const MAX_LIST = 200;
const MAX_PROGRESS = 50;

const memory = new Map<string, string>();
const bus = new EventTarget();
const CHANGE = 'change';

function readRaw(key: string): string | null {
  try {
    const v = globalThis.localStorage?.getItem(key);
    if (typeof v === 'string') return v;
  } catch {
    /* indisponible */
  }
  return memory.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  memory.set(key, value);
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* quota ou accès refusé : la mémoire suffit pour la session */
  }
}

function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emit(): void {
  bus.dispatchEvent(new Event(CHANGE));
}

export function subscribe(cb: () => void): () => void {
  bus.addEventListener(CHANGE, cb);
  return () => bus.removeEventListener(CHANGE, cb);
}

// Langue
export const getStoredLang = (): string | null => readRaw(LANG_KEY);
export const storeLang = (lang: string): void => writeRaw(LANG_KEY, lang);

// Ma liste
export function getList(): MediaItem[] {
  const list = readJson<MediaItem[]>(LIST_KEY, []);
  return Array.isArray(list) ? list : [];
}

export const isInList = (uid: string): boolean => getList().some((i) => i.uid === uid);

/** Ajoute ou retire un titre ; renvoie true s'il est maintenant dans la liste. */
export function toggleList(item: MediaItem): boolean {
  const list = getList();
  const exists = list.some((i) => i.uid === item.uid);
  const next = exists ? list.filter((i) => i.uid !== item.uid) : [item, ...list].slice(0, MAX_LIST);
  writeRaw(LIST_KEY, JSON.stringify(next));
  emit();
  return !exists;
}

// Reprise de lecture
export interface Progress {
  item: MediaItem;
  position: number;
  duration: number;
  updatedAt: number;
}

function readProgress(): Record<string, Progress> {
  const all = readJson<Record<string, Progress>>(PROGRESS_KEY, {});
  return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
}

export const getProgress = (uid: string): Progress | undefined => readProgress()[uid];

export function saveProgress(item: MediaItem, position: number, duration: number): void {
  if (!Number.isFinite(position) || position < 0) return;
  const all = readProgress();
  all[item.uid] = { item, position, duration: Number.isFinite(duration) ? duration : 0, updatedAt: Date.now() };
  const kept = Object.entries(all)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_PROGRESS);
  writeRaw(PROGRESS_KEY, JSON.stringify(Object.fromEntries(kept)));
  emit();
}

export function clearProgress(uid: string): void {
  const all = readProgress();
  if (!(uid in all)) return;
  delete all[uid];
  writeRaw(PROGRESS_KEY, JSON.stringify(all));
  emit();
}

/** Un titre est « à reprendre » s'il a été regardé plus de 10 s et pas jusqu'au générique (95 % de la durée). */
export function isResumable(p: Progress): boolean {
  return p.position >= 10 && (p.duration <= 0 || p.position <= p.duration * 0.95);
}

export function getContinue(): Progress[] {
  return Object.values(readProgress())
    .filter(isResumable)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
