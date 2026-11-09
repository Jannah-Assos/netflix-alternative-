import type { Lang } from '../../server/src/types';

export const LANGS: readonly Lang[] = ['fr', 'en'];

const fr = {
  'app.name': 'Open Media',
  'app.tagline': 'Trouvez les meilleurs liens directs dans les bases de données libres.',

  'nav.home': 'Accueil',
  'nav.explore': 'Explorer',
  'nav.list': 'Ma liste',
  'nav.search': 'Rechercher',
  'nav.searchPlaceholder': 'Titres, genres, sujets…',
  'nav.language': 'Langue',

  'hero.watch': 'Regarder',
  'hero.info': 'Plus d’infos',
  'hero.addList': 'Ajouter à ma liste',
  'hero.inList': 'Dans ma liste',
  'hero.featured': 'À l’affiche',

  'row.continue': 'Reprendre la lecture',
  'row.list': 'Ma liste',
  'row.prev': 'Précédent',
  'row.next': 'Suivant',
  'row.local-fr': 'Cinéma en français',
  'row.local-en': 'Classiques en anglais',
  'row.featured': 'Films du domaine public',
  'row.scifi': 'Science-fiction & épouvante',
  'row.silent': 'Cinéma muet',
  'row.animation': 'Dessins animés',
  'row.tv': 'Séries & télévision classiques',
  'row.docs': 'Documentaires',
  'row.space': 'Conquête spatiale (NASA)',
  'row.shorts': 'Courts métrages libres',

  'home.loadError': 'Impossible de charger le catalogue pour le moment.',
  'home.loadErrorHint': 'Les sources en ligne ne répondent pas. Vérifiez votre connexion, puis réessayez.',
  'home.retry': 'Réessayer',
  'home.empty': 'Le catalogue est vide pour le moment.',
  'home.toExplore': 'Essayer l’exploration',

  'list.title': 'Ma liste',
  'list.empty': 'Votre liste est vide.',
  'list.emptyHint': 'Ajoutez des titres avec le bouton « + » pour les retrouver ici.',

  'explore.popular': 'Les plus populaires',
  'explore.results.one': '{n} résultat pour « {q} »',
  'explore.results.other': '{n} résultats pour « {q} »',
  'explore.placeholder': 'Film, musique, jeu, livre…  ( / )',
  'explore.scan': 'Scanner',
  'explore.empty': 'Aucun résultat.',
  'explore.emptyHint': 'Essayez d’autres mots-clés, activez plus de sources ou désactivez « licences libres vérifiées ».',
  'explore.loadMore': 'Charger plus',
  'explore.loading': 'Chargement…',
  'explore.serverError': 'Le serveur ne répond pas : {error}',

  'kind.video': 'Vidéos',
  'kind.audio': 'Audio',
  'kind.software': 'Logiciels & jeux',
  'kind.text': 'Livres & textes',
  'kind1.video': 'Vidéo',
  'kind1.audio': 'Audio',
  'kind1.software': 'Logiciel',
  'kind1.text': 'Texte',

  'lic.public-domain': 'Domaine public',
  'lic.cc': 'Creative Commons',
  'lic.cc-nc': 'CC non commercial',
  'lic.restricted': 'Droits réservés',
  'lic.unknown': 'Licence à vérifier',
  'lic.view': 'voir la licence',
  'lic.warning': 'Licence non déclarée par la source : vérifiez les droits avant de réutiliser ce contenu.',

  'filters.kinds': 'Types de contenu',
  'filters.sources': 'Sources',
  'filters.freeOnly': 'Licences libres vérifiées seulement',

  'status.allFailed': 'Aucune source n’a répondu.',
  'status.someFailed': 'Certaines sources n’ont pas répondu.',
  'err.network': 'Source injoignable',
  'err.timeout': 'Réponse trop lente',
  'err.http': 'La source a renvoyé une erreur',
  'err.blocked': 'Adresse refusée par mesure de sécurité',
  'err.unknown': 'Erreur inattendue',
  'skip.unsupported-kind': 'Type de contenu non pris en charge',
  'skip.query-required': 'Mot-clé requis',

  'detail.links': 'Liens',
  'detail.otherLinks': 'Autres liens',
  'detail.loading': 'Recherche des meilleurs liens…',
  'detail.error': 'Impossible de récupérer les liens : {error}',
  'detail.none': 'Aucun lien direct trouvé. Utilisez la page de la source.',
  'detail.best': 'Meilleur lien',
  'detail.open': 'Ouvrir',
  'detail.copy': 'Copier le lien',
  'detail.copied': 'Copié ✓',
  'detail.close': 'Fermer',
  'detail.online': 'En ligne',
  'detail.offline': 'Hors ligne',
  'detail.unchecked': 'Non vérifié',

  'link.stream': 'Lecture directe',
  'link.download': 'Téléchargement',
  'link.hls': 'Flux HLS (VLC, mpv…)',
  'link.embed': 'Lecteur intégré de la source',
  'link.page': 'Page sur {host}',

  'watch.back': 'Retour',
  'watch.loading': 'Préparation de la lecture…',
  'watch.error': 'Impossible de préparer la lecture : {error}',
  'watch.noPlayable': 'Aucune version lisible dans le navigateur. Utilisez les liens pour ouvrir ou télécharger le fichier.',
  'watch.embedFallback': 'Lecture via le lecteur de la source.',
  'watch.playError': 'Ce fichier ne peut pas être lu ici.',
  'watch.quality': 'Qualité',
  'watch.resume': 'Reprise à {time}',
  'watch.openSource': 'Ouvrir la page de la source',

  'foot.disclaimer':
    'Les fichiers restent hébergés par leurs sources : cet outil ne fait que les trouver. Vérifiez toujours la licence avant de réutiliser un contenu.',
} as const;

export type MessageKey = keyof typeof fr;

const en: Record<MessageKey, string> = {
  'app.name': 'Open Media',
  'app.tagline': 'Find the best direct links across free online databases.',

  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.list': 'My list',
  'nav.search': 'Search',
  'nav.searchPlaceholder': 'Titles, genres, topics…',
  'nav.language': 'Language',

  'hero.watch': 'Watch',
  'hero.info': 'More info',
  'hero.addList': 'Add to my list',
  'hero.inList': 'In my list',
  'hero.featured': 'Featured',

  'row.continue': 'Continue watching',
  'row.list': 'My list',
  'row.prev': 'Previous',
  'row.next': 'Next',
  'row.local-fr': 'French-language cinema',
  'row.local-en': 'English-language classics',
  'row.featured': 'Public-domain feature films',
  'row.scifi': 'Sci-fi & horror',
  'row.silent': 'Silent cinema',
  'row.animation': 'Cartoons & animation',
  'row.tv': 'Classic TV',
  'row.docs': 'Documentaries',
  'row.space': 'Space exploration (NASA)',
  'row.shorts': 'Free short films',

  'home.loadError': 'The catalog can’t be loaded right now.',
  'home.loadErrorHint': 'The online sources aren’t responding. Check your connection and try again.',
  'home.retry': 'Try again',
  'home.empty': 'The catalog is empty for now.',
  'home.toExplore': 'Try exploring instead',

  'list.title': 'My list',
  'list.empty': 'Your list is empty.',
  'list.emptyHint': 'Add titles with the “+” button to find them here.',

  'explore.popular': 'Most popular',
  'explore.results.one': '{n} result for “{q}”',
  'explore.results.other': '{n} results for “{q}”',
  'explore.placeholder': 'Film, music, game, book…  ( / )',
  'explore.scan': 'Scan',
  'explore.empty': 'No results.',
  'explore.emptyHint': 'Try other keywords, enable more sources, or turn off “verified free licenses only”.',
  'explore.loadMore': 'Load more',
  'explore.loading': 'Loading…',
  'explore.serverError': 'The server isn’t responding: {error}',

  'kind.video': 'Videos',
  'kind.audio': 'Audio',
  'kind.software': 'Software & games',
  'kind.text': 'Books & texts',
  'kind1.video': 'Video',
  'kind1.audio': 'Audio',
  'kind1.software': 'Software',
  'kind1.text': 'Text',

  'lic.public-domain': 'Public domain',
  'lic.cc': 'Creative Commons',
  'lic.cc-nc': 'CC non-commercial',
  'lic.restricted': 'All rights reserved',
  'lic.unknown': 'License unverified',
  'lic.view': 'view license',
  'lic.warning': 'The source doesn’t declare a license: check the rights before reusing this content.',

  'filters.kinds': 'Content types',
  'filters.sources': 'Sources',
  'filters.freeOnly': 'Verified free licenses only',

  'status.allFailed': 'No source responded.',
  'status.someFailed': 'Some sources didn’t respond.',
  'err.network': 'Source unreachable',
  'err.timeout': 'Response too slow',
  'err.http': 'The source returned an error',
  'err.blocked': 'Address refused for security reasons',
  'err.unknown': 'Unexpected error',
  'skip.unsupported-kind': 'Content type not supported',
  'skip.query-required': 'Keyword required',

  'detail.links': 'Links',
  'detail.otherLinks': 'Other links',
  'detail.loading': 'Finding the best links…',
  'detail.error': 'Couldn’t fetch the links: {error}',
  'detail.none': 'No direct link found. Use the source page.',
  'detail.best': 'Best link',
  'detail.open': 'Open',
  'detail.copy': 'Copy link',
  'detail.copied': 'Copied ✓',
  'detail.close': 'Close',
  'detail.online': 'Online',
  'detail.offline': 'Offline',
  'detail.unchecked': 'Unchecked',

  'link.stream': 'Direct playback',
  'link.download': 'Download',
  'link.hls': 'HLS stream (VLC, mpv…)',
  'link.embed': 'Source’s embedded player',
  'link.page': 'Page on {host}',

  'watch.back': 'Back',
  'watch.loading': 'Preparing playback…',
  'watch.error': 'Couldn’t prepare playback: {error}',
  'watch.noPlayable': 'No version playable in the browser. Use the links to open or download the file.',
  'watch.embedFallback': 'Playing through the source’s own player.',
  'watch.playError': 'This file can’t be played here.',
  'watch.quality': 'Quality',
  'watch.resume': 'Resuming at {time}',
  'watch.openSource': 'Open the source page',

  'foot.disclaimer':
    'Files stay hosted by their sources: this tool only finds them. Always check the license before reusing any content.',
};

export const messages: Record<Lang, Record<MessageKey, string>> = { fr, en };

export const SUGGESTIONS: Record<Lang, string[]> = {
  fr: ['Nosferatu', 'Charlie Chaplin', 'Apollo 11', 'Big Buck Bunny', 'Jazz 1950', 'Méliès'],
  en: ['Nosferatu', 'Charlie Chaplin', 'Apollo 11', 'Big Buck Bunny', 'Jazz 1950', 'Doom shareware'],
};

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Langue de départ : choix mémorisé, sinon langue du navigateur, sinon anglais. */
export function detectLang(stored: string | null, navigatorLanguages: readonly string[]): Lang {
  if (stored === 'fr' || stored === 'en') return stored;
  return navigatorLanguages.some((l) => l.toLowerCase().startsWith('fr')) ? 'fr' : 'en';
}
