import type { SourceId } from '../types.js';
import { internetArchive } from './internetArchive.js';
import { nasa } from './nasa.js';
import { peertube } from './peertube.js';
import type { MediaSource } from './types.js';
import { wikimediaCommons } from './wikimediaCommons.js';

export const ALL_SOURCES: MediaSource[] = [internetArchive, wikimediaCommons, nasa, peertube];

export function findSource(id: string, sources: MediaSource[] = ALL_SOURCES): MediaSource | undefined {
  return sources.find((s) => s.id === id);
}

export function isSourceId(id: string, sources: MediaSource[] = ALL_SOURCES): id is SourceId {
  return sources.some((s) => s.id === id);
}

export type { MediaSource } from './types.js';
