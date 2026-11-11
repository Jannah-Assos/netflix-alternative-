import type { MediaKind, SourceId } from './types.js';

/**
 * Périmètre du catalogue V1 : des FILMS et de l'ANIMATION, en vidéo uniquement.
 *
 * Ce périmètre repose sur des mesures réelles (10/11/2026), pas sur des suppositions :
 * - Films : fiches bien renseignées (année 91 %, description 93 %, durée 77 %), 29 sur 30 lisibles en MP4.
 * - Animation : fiches correctes (année 78 %, auteur 83 %), 30 sur 30 lisibles en MP4.
 * - Séries TV : EXCLUES pour l'instant. Fiches trop pauvres (année 33 %, description 41 %, durée 28 %)
 *   et aucune structure saison/épisode.
 * - Anime : EXCLU. Dans la collection « anime » d'Internet Archive, 45 des 60 titres les plus vus se
 *   déclarent en CC0 ou « domaine public » alors que ce sont Pokémon, Digimon, Beastars… La licence
 *   déclarée n'y est pas fiable.
 * - Musique, livres, logiciels, images : hors périmètre.
 *
 * Une liste blanche de collections est plus sûre qu'une liste noire : un titre qui n'est dans aucune
 * collection retenue n'apparaît jamais, même si son déposant lui a attribué une licence libre.
 */
export const ENABLED_KINDS: readonly MediaKind[] = ['video'];

export const SCOPE_COLLECTIONS = [
  'feature_films',
  'silent_films',
  'Film_Noir',
  'SciFi_Horror',
  'Comedy_Films',
  'short_films',
  'animationandcartoons',
  'classic_cartoons',
] as const;

/** Exclues même si un titre est aussi classé dans une collection retenue. */
export const EXCLUDED_COLLECTIONS = ['anime'] as const;

const KNOWN_SOURCES: readonly SourceId[] = ['internet-archive', 'wikimedia-commons', 'nasa', 'peertube'];

/**
 * Sources actives. Seule Internet Archive l'est par défaut : les autres (Wikimedia, NASA, PeerTube)
 * contiennent surtout des vidéos qui ne sont ni des films ni des séries. Le code reste en place :
 * `OPENFLIX_SOURCES=internet-archive,nasa` les réactive pour étoffer le catalogue plus tard.
 */
export function enabledSourceIds(env: NodeJS.ProcessEnv = process.env): SourceId[] {
  const wanted = (env.OPENFLIX_SOURCES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is SourceId => (KNOWN_SOURCES as readonly string[]).includes(s));
  return wanted.length ? [...new Set(wanted)] : ['internet-archive'];
}
