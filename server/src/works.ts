/**
 * LE CATALOGUE : les œuvres choisies et vérifiées d'Openflix.
 *
 * Chaque œuvre a : une copie précise sur Internet Archive (testée : lisible en MP4), ses auteurs avec
 * leur année de décès et leur nationalité (vérifiées sur Wikidata le 12/11/2026), et une phrase
 * « pourquoi le voir ». Le statut des droits en France est CALCULÉ à partir de ces données (rights.ts) :
 * rien n'est déclaré « libre » à la main.
 *
 * Ajouter une œuvre : une ligne ici, puis `npm run verify-catalogue` (copie lisible ? droits calculés ?).
 */

export interface Author {
  name: string;
  /** Année de décès ; `null` si inconnue (l'auteur est alors traité comme encore protégé). */
  died: number | null;
  /** Ressortissant d'un État de l'Union européenne (la règle « durée du pays d'origine » ne s'applique pas à lui). */
  eu: boolean;
}

export interface Episode {
  n: number;
  title: { fr: string; en: string };
  archiveId: string;
  /** Fichier précis quand tous les épisodes sont dans le même document Internet Archive. */
  file?: string;
  minutes?: number;
}

export type WorkKind = 'film' | 'short' | 'series' | 'animation' | 'documentary';
export type Tag = 'comedy' | 'fantasy' | 'horror' | 'adventure' | 'drama' | 'animation' | 'documentary' | 'scifi' | 'series' | 'experimental' | 'crime';

export interface Work {
  slug: string;
  title: { fr: string; en: string };
  year: number;
  /** Pays d'origine de l'œuvre (code à deux lettres ; « US » active la règle de la durée du pays d'origine). */
  country: string;
  directors: string[];
  kind: WorkKind;
  minutes: number;
  archiveId: string;
  tags: Tag[];
  authors: Author[];
  why: { fr: string; en: string };
  /** Licence Creative Commons accordée par l'ayant droit lui-même. */
  cc?: { holder: string; license: string; nc?: boolean };
  /** Film parlant : langue des dialogues (code ISO). Absent = muet. */
  spoken?: string;
  episodes?: Episode[];
  /** Autres titres connus, pour reconnaître d'autres copies dans l'archive (minuscules, sans accents). */
  aliases?: string[];
}

const eu = (name: string, died: number | null): Author => ({ name, died, eu: true });
const non = (name: string, died: number | null): Author => ({ name, died, eu: false });

// Auteurs (année de décès et nationalité vérifiées sur Wikidata, sauf mention « null »).
const P = {
  melies: eu('Georges Méliès', 1938),
  cohl: eu('Émile Cohl', 1938),
  chomon: eu('Segundo de Chomón', 1929),
  reynaud: eu('Émile Reynaud', 1918),
  feuillade: eu('Louis Feuillade', 1925),
  bernede: eu('Arthur Bernède', 1937),
  linder: eu('Max Linder', 1925),
  epstein: eu('Jean Epstein', 1953),
  poe: non('Edgar Allan Poe', 1849),
  dulac: eu('Germaine Dulac', 1942),
  artaud: eu('Antonin Artaud', 1948),
  murnau: eu('F. W. Murnau', 1931),
  galeen: eu('Henrik Galeen', 1949),
  stoker: eu('Bram Stoker', 1912),
  erdmann: eu('Hans Erdmann', 1942),
  wiene: eu('Robert Wiene', 1938),
  mayer: eu('Carl Mayer', 1944),
  janowitz: eu('Hans Janowitz', 1954),
  rye: eu('Stellan Rye', 1914),
  wegener: eu('Paul Wegener', 1948),
  ewers: eu('Hanns Heinz Ewers', 1943),
  nerz: eu('Louis Nerz', 1938),
  renard: eu('Maurice Renard', 1939),
  lubitsch: eu('Ernst Lubitsch', 1947),
  kraly: eu('Hanns Kräly', 1950),
  leni: eu('Paul Leni', 1929),
  birinski: eu('Leo Birinski', 1951),
  eggeling: eu('Viking Eggeling', 1925),
  vertov: non('Dziga Vertov', 1954),
  protazanov: non('Yakov Protazanov', 1945),
  volkoff: non('Alexandre Volkoff', 1942),
  tolstoy: non('Léon Tolstoï', 1910),
  bauer: non('Evgueni Bauer', 1917),
  williamson: non('James Williamson', 1933),
  hepworth: non('Cecil Hepworth', 1953),
  stow: non('Percy Stow', 1919),
  carroll: non('Lewis Carroll', 1898),
  gad: eu('Urban Gad', 1947),
  porter: non('Edwin S. Porter', 1941),
  mccay: non('Winsor McCay', 1934),
  blackton: non('J. Stuart Blackton', 1941),
  weber: non('Lois Weber', 1939),
  smalley: non('Phillips Smalley', 1939),
  dawley: non('J. Searle Dawley', 1949),
  shelley: non('Mary Shelley', 1851),
  paton: non('Stuart Paton', 1944),
  verne: eu('Jules Verne', 1905),
  griffith: non('D. W. Griffith', 1948),
  loos: non('Anita Loos', 1981),
  burke: non('Thomas Burke', 1945),
  kelly: non('Anthony Paul Kelly', 1932),
  parker: non('Lottie Blair Parker', 1937),
  keaton: non('Buster Keaton', 1966),
  bruckman: non('Clyde Bruckman', 1955),
  boasberg: non('Al Boasberg', 1937),
  havez: non('Jean Havez', 1925),
  mitchell: non('Joseph A. Mitchell', null),
  blystone: non('John G. Blystone', 1938),
  reisner: non('Charles Reisner', 1962),
  harbaugh: non('Carl Harbaugh', 1960),
  crisp: non('Donald Crisp', 1974),
  cline: non('Edward F. Cline', 1961),
  newmeyer: non('Fred C. Newmeyer', 1967),
  taylor: non('Sam Taylor', 1958),
  roach: non('Hal Roach', 1992),
  whelan: non('Tim Whelan', 1957),
  niblo: non('Fred Niblo', 1948),
  mcculley: non('Johnston McCulley', 1958),
  fairbanks: non('Douglas Fairbanks', 1939),
  julian: non('Rupert Julian', 1943),
  leroux: eu('Gaston Leroux', 1927),
  clawson: non('Elliott J. Clawson', 1942),
  schrock: non('Raymond L. Schrock', 1950),
  worsley: non('Wallace Worsley', 1944),
  hugo: eu('Victor Hugo', 1885),
  lowe: non('Edward T. Lowe Jr.', 1973),
  sheehan: non('Perley Poore Sheehan', 1943),
  hoyt: non('Harry O. Hoyt', 1961),
  doyle: non('Arthur Conan Doyle', 1930),
  fairfax: non('Marion Fairfax', 1970),
  robertson: non('John S. Robertson', 1964),
  beranger: non('Clara Beranger', 1956),
  stevenson: non('Robert Louis Stevenson', 1894),
  sudermann: eu('Hermann Sudermann', 1928),
  hilliker: non('Katherine Hilliker', 1965),
  cohn: non('Alfred A. Cohn', 1951),
  hill: non('Robert F. Hill', 1966),
  willard: non('John Willard', 1942),
  flaherty: non('Robert J. Flaherty', 1951),
  micheaux: non('Oscar Micheaux', 1951),
  disney: non('Walt Disney', 1966),
  iwerks: non('Ub Iwerks', 1971),
  messmer: non('Otto Messmer', 1983),
  sullivan: non('Pat Sullivan', 1933),
  semon: non('Larry Semon', 1928),
  baum: non('L. Frank Baum', 1919),
  baumJr: non('Frank Joslyn Baum', 1958),
} satisfies Record<string, Author>;

const BLENDER = { holder: 'Blender Foundation', license: 'CC BY' } as const;

const vampires = (n: number, id: string, fr: string, en: string, minutes: number): Episode => ({ n, title: { fr, en }, archiveId: `lesVampires1915Episode${id}`, minutes });
const judex = (n: number, file: string, fr: string, en: string, minutes: number): Episode => ({
  n,
  title: { fr, en },
  archiveId: 'JudexEpisode01LOmbreMystrieuse1916',
  file,
  minutes,
});

export const WORKS: Work[] = [
  // ───────── Les magiciens des débuts ─────────
  {
    slug: 'voyage-dans-la-lune', title: { fr: 'Le Voyage dans la Lune', en: 'A Trip to the Moon' }, year: 1902, country: 'FR', directors: ['Georges Méliès'],
    kind: 'short', minutes: 11, archiveId: 'Levoyagedanslalune', tags: ['scifi', 'fantasy'], authors: [P.melies], aliases: ['le voyage dans la lune', 'a trip to the moon'],
    why: { fr: 'Le premier film de science-fiction : une fusée dans l’œil de la Lune, et le cinéma découvre qu’il peut tout montrer.', en: 'The first science-fiction film: a rocket in the Moon’s eye, and cinema discovers it can show anything.' },
  },
  {
    slug: 'voyage-a-travers-l-impossible', title: { fr: 'Le Voyage à travers l’impossible', en: 'The Impossible Voyage' }, year: 1904, country: 'FR', directors: ['Georges Méliès'],
    kind: 'short', minutes: 20, archiveId: 'The_Impossible_Voyage', tags: ['scifi', 'fantasy'], authors: [P.melies, P.verne], aliases: ['the impossible voyage', 'le voyage a travers l impossible'],
    why: { fr: 'Méliès voit plus grand : un train qui s’envole vers le Soleil, peint à la main image par image.', en: 'Méliès goes bigger: a train that flies to the Sun, hand-painted frame by frame.' },
  },
  {
    slug: 'royaume-des-fees', title: { fr: 'Le Royaume des fées', en: 'The Kingdom of the Fairies' }, year: 1903, country: 'FR', directors: ['Georges Méliès'],
    kind: 'short', minutes: 16, archiveId: 'il-regno-delle-fate-1903-georges-melies', tags: ['fantasy'], authors: [P.melies],
    why: { fr: 'Un conte de fées sous-marin en couleurs peintes : le sommet de la féerie selon Méliès.', en: 'An underwater fairy tale in hand-painted colour: Méliès at the height of his magic.' },
  },
  {
    slug: 'a-la-conquete-du-pole', title: { fr: 'À la conquête du pôle', en: 'The Conquest of the Pole' }, year: 1912, country: 'FR', directors: ['Georges Méliès'],
    kind: 'short', minutes: 8, archiveId: '1912GeorgesMeliesALaConqueteDuPoleConquestOfTheNorthPole', tags: ['adventure', 'fantasy'], authors: [P.melies],
    why: { fr: 'Le dernier grand voyage de Méliès, avec un géant des glaces qu’on n’oublie pas.', en: 'Méliès’s last great voyage, with an ice giant you won’t forget.' },
  },
  {
    slug: 'excursion-dans-la-lune', title: { fr: 'Excursion dans la Lune', en: 'Excursion to the Moon' }, year: 1908, country: 'FR', directors: ['Segundo de Chomón'],
    kind: 'short', minutes: 7, archiveId: 'ExcursionDanLaLune', tags: ['scifi', 'fantasy'], authors: [P.chomon],
    why: { fr: 'La réponse espagnole à Méliès : même voyage, autres trucages. À comparer avec l’original.', en: 'Spain’s answer to Méliès: same journey, different tricks. Compare it with the original.' },
  },
  {
    slug: 'le-spectre-rouge', title: { fr: 'Le Spectre rouge', en: 'The Red Spectre' }, year: 1907, country: 'FR', directors: ['Segundo de Chomón'],
    kind: 'short', minutes: 9, archiveId: 'LeSpectreRouge', tags: ['fantasy', 'horror'], authors: [P.chomon],
    why: { fr: 'Un squelette magicien dans une grotte : neuf minutes d’illusions d’une élégance folle.', en: 'A skeleton magician in a cave: nine minutes of wildly elegant illusions.' },
  },
  {
    slug: 'hotel-electrique', title: { fr: 'L’Hôtel électrique', en: 'The Electric Hotel' }, year: 1908, country: 'FR', directors: ['Segundo de Chomón'],
    kind: 'short', minutes: 9, archiveId: 'ElHotelElectrico', tags: ['comedy', 'scifi'], authors: [P.chomon],
    why: { fr: 'La maison connectée imaginée en 1908 : les valises se défont seules, les cheveux se coiffent tout seuls.', en: 'The smart home as imagined in 1908: suitcases unpack themselves, hair brushes itself.' },
  },
  {
    slug: 'the-big-swallow', title: { fr: 'La Grosse Bouchée', en: 'The Big Swallow' }, year: 1901, country: 'GB', directors: ['James Williamson'],
    kind: 'short', minutes: 1, archiveId: 'silent-the-big-swallow-aka-a-photographic-contortion', tags: ['comedy', 'experimental'], authors: [P.williamson],
    why: { fr: 'Une minute, une idée géniale : un homme agacé avale la caméra. Le premier gros plan comique.', en: 'One minute, one brilliant idea: an annoyed man swallows the camera. The first comic close-up.' },
  },
  {
    slug: 'le-vol-du-grand-rapide', title: { fr: 'Le Vol du grand rapide', en: 'The Great Train Robbery' }, year: 1903, country: 'US', directors: ['Edwin S. Porter'],
    kind: 'short', minutes: 12, archiveId: 'TheGreatTrainRobbery_555', tags: ['adventure', 'crime'], authors: [P.porter], aliases: ['the great train robbery'],
    why: { fr: 'Le premier western, et le plan final qui faisait hurler les salles : le bandit tire sur vous.', en: 'The first western, and the final shot that made audiences scream: the bandit fires at you.' },
  },
  {
    slug: 'reve-d-un-gourmand', title: { fr: 'Le Rêve d’un gourmand', en: 'Dream of a Rarebit Fiend' }, year: 1906, country: 'US', directors: ['Edwin S. Porter'],
    kind: 'short', minutes: 6, archiveId: 'DreamOfARarebitFiend1906', tags: ['comedy', 'fantasy'], authors: [P.porter, P.mccay], aliases: ['dream of a rarebit fiend'],
    why: { fr: 'Un dîner trop arrosé, un lit qui s’envole au-dessus de la ville : le cauchemar le plus drôle de 1906.', en: 'Too much supper, a bed flying over the city: the funniest nightmare of 1906.' },
  },
  {
    slug: 'alice-au-pays-des-merveilles-1903', title: { fr: 'Alice au pays des merveilles (1903)', en: 'Alice in Wonderland (1903)' }, year: 1903, country: 'GB', directors: ['Cecil Hepworth', 'Percy Stow'],
    kind: 'short', minutes: 9, archiveId: 'AliceInWonderland1903', tags: ['fantasy'], authors: [P.hepworth, P.stow, P.carroll],
    why: { fr: 'La toute première Alice à l’écran, abîmée par le temps : une pellicule fantôme, très émouvante.', en: 'The very first Alice on screen, scarred by time: a ghostly, moving piece of film.' },
  },
  {
    slug: 'frankenstein-1910', title: { fr: 'Frankenstein (1910)', en: 'Frankenstein (1910)' }, year: 1910, country: 'US', directors: ['J. Searle Dawley'],
    kind: 'short', minutes: 12, archiveId: 'Frankenstein1910', tags: ['horror', 'fantasy'], authors: [P.dawley, P.shelley],
    why: { fr: 'Le premier Frankenstein du cinéma, longtemps cru perdu. La création du monstre reste saisissante.', en: 'Cinema’s first Frankenstein, long thought lost. The creature’s creation is still striking.' },
  },
  {
    slug: 'suspense-1913', title: { fr: 'Suspense', en: 'Suspense' }, year: 1913, country: 'US', directors: ['Lois Weber', 'Phillips Smalley'],
    kind: 'short', minutes: 10, archiveId: 'suspenseloisweber1913', tags: ['crime', 'drama'], authors: [P.weber, P.smalley],
    why: { fr: 'Dix minutes haletantes par une pionnière : écran partagé en trois, poursuite, rétroviseur. Tout y est déjà.', en: 'Ten breathless minutes by a pioneer: three-way split screen, a chase, a rear-view mirror. It’s all there already.' },
  },

  // ───────── Les rois du rire ─────────
  {
    slug: 'le-mecano-de-la-general', title: { fr: 'Le Mécano de la « General »', en: 'The General' }, year: 1926, country: 'US', directors: ['Buster Keaton', 'Clyde Bruckman'],
    kind: 'film', minutes: 78, archiveId: 'The_General_Buster_Keaton', tags: ['comedy', 'adventure'], authors: [P.keaton, P.bruckman, P.boasberg], aliases: ['the general'],
    why: { fr: 'Une poursuite en locomotive, sans trucage ni doublure. Souvent cité parmi les plus grands films de tous les temps.', en: 'A locomotive chase with no tricks and no stunt double. Often ranked among the greatest films ever made.' },
  },
  {
    slug: 'sherlock-junior', title: { fr: 'Sherlock Junior', en: 'Sherlock Jr.' }, year: 1924, country: 'US', directors: ['Buster Keaton'],
    kind: 'film', minutes: 45, archiveId: 'sherlockjr1924_201909', tags: ['comedy', 'fantasy'], authors: [P.keaton, P.havez, P.mitchell, P.bruckman], aliases: ['sherlock jr'],
    why: { fr: 'Un projectionniste s’endort et entre dans l’écran. Quarante-cinq minutes d’inventions qui étonnent encore.', en: 'A projectionist falls asleep and walks into the screen. Forty-five minutes of invention that still astonish.' },
  },
  {
    slug: 'monte-la-dessus', title: { fr: 'Monte là-dessus !', en: 'Safety Last!' }, year: 1923, country: 'US', directors: ['Fred C. Newmeyer', 'Sam Taylor'],
    kind: 'film', minutes: 73, archiveId: 'SafetyLastHaroldLloyd1923.FullMovieexcellentQuality.', tags: ['comedy'], authors: [P.newmeyer, P.taylor, P.roach, P.whelan], aliases: ['safety last'],
    why: { fr: 'L’homme suspendu aux aiguilles de l’horloge : l’image la plus célèbre du burlesque, et le vertige est réel.', en: 'The man hanging from the clock: slapstick’s most famous image, and the vertigo is real.' },
  },
  {
    slug: 'cadet-d-eau-douce', title: { fr: 'Cadet d’eau douce', en: 'Steamboat Bill, Jr.' }, year: 1928, country: 'US', directors: ['Charles Reisner', 'Buster Keaton'],
    kind: 'film', minutes: 69, archiveId: 'SteamboatBillJr', tags: ['comedy'], authors: [P.reisner, P.harbaugh, P.keaton], aliases: ['steamboat bill jr'],
    why: { fr: 'Pour la façade de maison qui tombe sur Keaton, sauvé par une fenêtre : la cascade la plus dangereuse du muet.', en: 'For the house front that falls on Keaton, saved by a window: the most dangerous stunt of the silent era.' },
  },
  {
    slug: 'les-lois-de-l-hospitalite', title: { fr: 'Les Lois de l’hospitalité', en: 'Our Hospitality' }, year: 1923, country: 'US', directors: ['Buster Keaton', 'John G. Blystone'],
    kind: 'film', minutes: 73, archiveId: 'OurHospitality_29', tags: ['comedy', 'adventure'], authors: [P.keaton, P.blystone, P.havez, P.mitchell, P.bruckman], aliases: ['our hospitality'],
    why: { fr: 'Une vendetta, un train miniature et un sauvetage au bord d’une cascade : Keaton invente la comédie d’aventure.', en: 'A feud, a toy-like train and a rescue at the edge of a waterfall: Keaton invents the adventure comedy.' },
  },
  {
    slug: 'la-croisiere-du-navigator', title: { fr: 'La Croisière du Navigator', en: 'The Navigator' }, year: 1924, country: 'US', directors: ['Buster Keaton', 'Donald Crisp'],
    kind: 'film', minutes: 59, archiveId: 'mymovie_202004', tags: ['comedy', 'adventure'], authors: [P.keaton, P.crisp, P.havez, P.mitchell, P.bruckman], aliases: ['the navigator'],
    why: { fr: 'Deux enfants gâtés seuls sur un paquebot à la dérive. Le plus gros succès de Keaton en son temps.', en: 'Two spoiled rich kids alone on a drifting ocean liner. Keaton’s biggest hit in its day.' },
  },
  {
    slug: 'la-maison-demontable', title: { fr: 'La Maison démontable', en: 'One Week' }, year: 1920, country: 'US', directors: ['Buster Keaton', 'Edward F. Cline'],
    kind: 'short', minutes: 24, archiveId: 'OneWeek1920', tags: ['comedy'], authors: [P.keaton, P.cline], aliases: ['one week'],
    why: { fr: 'Une maison en kit montée dans le désordre : vingt minutes parfaites pour découvrir Keaton.', en: 'A flat-pack house assembled in the wrong order: twenty perfect minutes to discover Keaton.' },
  },
  {
    slug: 'frigo-demenageur', title: { fr: 'Frigo déménageur', en: 'Cops' }, year: 1922, country: 'US', directors: ['Buster Keaton', 'Edward F. Cline'],
    kind: 'short', minutes: 18, archiveId: 'Cops1922', tags: ['comedy'], authors: [P.keaton, P.cline], aliases: ['cops'],
    why: { fr: 'Un homme seul poursuivi par toute la police de la ville. La course-poursuite à l’état pur.', en: 'One man chased by the city’s entire police force. The chase in its purest form.' },
  },
  {
    slug: 'sept-ans-de-malheur', title: { fr: 'Sept ans de malheur', en: 'Seven Years Bad Luck' }, year: 1921, country: 'US', directors: ['Max Linder'],
    kind: 'film', minutes: 61, archiveId: '1921SEVENYEARSBADLUCKSilent', tags: ['comedy'], authors: [P.linder], aliases: ['seven years bad luck'],
    why: { fr: 'Le Français qui a inspiré Chaplin, avec le célèbre gag du miroir brisé, repris plus tard par les Marx Brothers.', en: 'The Frenchman who inspired Chaplin, with the famous broken-mirror gag the Marx Brothers later borrowed.' },
  },
  {
    slug: 'l-etroit-mousquetaire', title: { fr: 'L’Étroit Mousquetaire', en: 'The Three Must-Get-Theres' }, year: 1922, country: 'US', directors: ['Max Linder'],
    kind: 'film', minutes: 52, archiveId: 'MaxLinderTheThreeMustGetTheres', tags: ['comedy', 'adventure'], authors: [P.linder], aliases: ['the three must get theres'],
    why: { fr: 'Les Trois Mousquetaires avec téléphones et motos : la parodie anachronique, un siècle avant tout le monde.', en: 'The Three Musketeers with telephones and motorbikes: anachronistic parody, a century ahead of everyone.' },
  },
  {
    slug: 'la-poupee', title: { fr: 'La Poupée', en: 'The Doll' }, year: 1919, country: 'DE', directors: ['Ernst Lubitsch'],
    kind: 'film', minutes: 65, archiveId: 'DiePuppe1919', tags: ['comedy', 'fantasy'], authors: [P.lubitsch, P.kraly], aliases: ['die puppe', 'the doll'],
    why: { fr: 'Un timide épouse une poupée mécanique… qui n’en est pas une. Lubitsch en décor de carton, malicieux et léger.', en: 'A shy man marries a mechanical doll… who isn’t one. Lubitsch in a cardboard world, mischievous and light.' },
  },
  {
    slug: 'la-princesse-aux-huitres', title: { fr: 'La Princesse aux huîtres', en: 'The Oyster Princess' }, year: 1919, country: 'DE', directors: ['Ernst Lubitsch'],
    kind: 'film', minutes: 57, archiveId: 'silent-the-oyster-princess', tags: ['comedy'], authors: [P.lubitsch, P.kraly], aliases: ['die austernprinzessin', 'the oyster princess'],
    why: { fr: 'Une satire des nouveaux riches menée tambour battant, avec une épidémie de fox-trot.', en: 'A fast-paced satire of the newly rich, complete with a fox-trot epidemic.' },
  },
  {
    slug: 'le-magicien-d-oz-1925', title: { fr: 'Le Magicien d’Oz (1925)', en: 'The Wizard of Oz (1925)' }, year: 1925, country: 'US', directors: ['Larry Semon'],
    kind: 'film', minutes: 85, archiveId: 'TheWizardOfOz1925', tags: ['comedy', 'fantasy'], authors: [P.semon, P.baum, P.baumJr],
    why: { fr: 'Oz avant Judy Garland, en version burlesque, avec Oliver Hardy en Homme de fer-blanc. Une curiosité.', en: 'Oz before Judy Garland, as slapstick, with Oliver Hardy as the Tin Man. A curiosity.' },
  },

  // ───────── Frissons & ombres ─────────
  {
    slug: 'nosferatu', title: { fr: 'Nosferatu le vampire', en: 'Nosferatu' }, year: 1922, country: 'DE', directors: ['F. W. Murnau'],
    kind: 'film', minutes: 93, archiveId: 'Nosferatu_most_complete_version_93_mins.', tags: ['horror', 'fantasy'], authors: [P.murnau, P.galeen, P.stoker, P.erdmann],
    aliases: ['nosferatu', 'nosferatu eine symphonie des grauens', 'nosferatu a symphony of horror'],
    why: { fr: 'L’ombre aux doigts crochus qui monte l’escalier : le film de vampire dont tous les autres descendent.', en: 'The shadow with clawed fingers climbing the stairs: the vampire film all the others descend from.' },
  },
  {
    slug: 'le-cabinet-du-docteur-caligari', title: { fr: 'Le Cabinet du docteur Caligari', en: 'The Cabinet of Dr. Caligari' }, year: 1920, country: 'DE', directors: ['Robert Wiene'],
    kind: 'film', minutes: 51, archiveId: 'DasKabinettdesDoktorCaligariTheCabinetofDrCaligari', tags: ['horror', 'crime'], authors: [P.wiene, P.mayer, P.janowitz],
    aliases: ['das kabinett des doktor caligari', 'the cabinet of dr caligari', 'cabinet of dr caligari', 'das cabinet des dr caligari'],
    why: { fr: 'Des décors peints, tordus comme un cauchemar, et l’un des premiers retournements de situation du cinéma.', en: 'Painted sets, twisted like a nightmare, and one of cinema’s first twist endings.' },
  },
  {
    slug: 'les-mains-d-orlac', title: { fr: 'Les Mains d’Orlac', en: 'The Hands of Orlac' }, year: 1924, country: 'AT', directors: ['Robert Wiene'],
    kind: 'film', minutes: 112, archiveId: 'TheHandsOfOrlac1924', tags: ['horror', 'crime'], authors: [P.wiene, P.nerz, P.renard], aliases: ['the hands of orlac', 'orlacs hande'],
    why: { fr: 'Un pianiste greffé des mains d’un assassin. Conrad Veidt y joue la peur avec tout son corps.', en: 'A pianist is given a murderer’s hands. Conrad Veidt acts fear with his whole body.' },
  },
  {
    slug: 'le-fantome-de-l-opera', title: { fr: 'Le Fantôme de l’Opéra', en: 'The Phantom of the Opera' }, year: 1925, country: 'US', directors: ['Rupert Julian'],
    kind: 'film', minutes: 106, archiveId: 'ThePhantomoftheOpera', tags: ['horror', 'drama'], authors: [P.julian, P.leroux, P.clawson, P.schrock], aliases: ['the phantom of the opera'],
    why: { fr: 'Le moment où le masque tombe : Lon Chaney avait créé lui-même ce visage, et des spectateurs s’évanouissaient.', en: 'The moment the mask comes off: Lon Chaney built that face himself, and audiences fainted.' },
  },
  {
    slug: 'la-volonte-du-mort', title: { fr: 'La Volonté du mort', en: 'The Cat and the Canary' }, year: 1927, country: 'US', directors: ['Paul Leni'],
    kind: 'film', minutes: 83, archiveId: 'The_Cat_and_the_Canary', tags: ['horror', 'comedy'], authors: [P.leni, P.cohn, P.hill, P.willard], aliases: ['the cat and the canary'],
    why: { fr: 'Un héritage, un manoir, une nuit d’orage : le modèle de tous les films de maison hantée, avec de l’humour.', en: 'An inheritance, a mansion, a stormy night: the template for every haunted-house film, with humour.' },
  },
  {
    slug: 'l-etudiant-de-prague', title: { fr: 'L’Étudiant de Prague', en: 'The Student of Prague' }, year: 1913, country: 'DE', directors: ['Stellan Rye', 'Paul Wegener'],
    kind: 'film', minutes: 56, archiveId: 'StudentZPragi1', tags: ['horror', 'fantasy'], authors: [P.rye, P.wegener, P.ewers], aliases: ['der student von prag', 'the student of prague'],
    why: { fr: 'Un étudiant vend son reflet au diable. Le premier film fantastique allemand, et déjà le thème du double.', en: 'A student sells his reflection to the devil. Germany’s first fantasy film, already about the double.' },
  },
  {
    slug: 'le-cabinet-des-figures-de-cire', title: { fr: 'Le Cabinet des figures de cire', en: 'Waxworks' }, year: 1924, country: 'DE', directors: ['Paul Leni'],
    kind: 'film', minutes: 83, archiveId: 'waxworks-1924-restored-movie-720p-hd', tags: ['horror', 'fantasy'], authors: [P.leni, P.birinski, P.galeen], aliases: ['das wachsfigurenkabinett', 'waxworks'],
    why: { fr: 'Trois histoires pour trois statues de cire, dont un Jack l’Éventreur de cauchemar. L’ancêtre du film à sketches.', en: 'Three tales for three wax figures, including a nightmarish Jack the Ripper. The ancestor of the anthology film.' },
  },
  {
    slug: 'genuine', title: { fr: 'Genuine', en: 'Genuine' }, year: 1920, country: 'DE', directors: ['Robert Wiene'],
    kind: 'film', minutes: 44, archiveId: 'RobertWienesgenuineATaleOfAVampire1920', tags: ['horror', 'fantasy'], authors: [P.wiene, P.mayer],
    why: { fr: 'L’équipe de Caligari récidive avec une prêtresse fatale et des décors encore plus délirants.', en: 'The Caligari team strikes again with a deadly priestess and even wilder sets.' },
  },
  {
    slug: 'la-chute-de-la-maison-usher', title: { fr: 'La Chute de la maison Usher', en: 'The Fall of the House of Usher' }, year: 1928, country: 'FR', directors: ['Jean Epstein'],
    kind: 'film', minutes: 62, archiveId: 'LaChuteDeLaMaisonUsher1928_201808', tags: ['horror', 'fantasy'], authors: [P.epstein, P.poe], aliases: ['la chute de la maison usher'],
    why: { fr: 'Edgar Poe filmé comme un rêve : ralentis, rideaux qui flottent, bougies. Un sommet du cinéma français muet.', en: 'Poe filmed like a dream: slow motion, drifting curtains, candles. A peak of French silent cinema.' },
  },
  {
    slug: 'docteur-jekyll-et-m-hyde', title: { fr: 'Docteur Jekyll et M. Hyde', en: 'Dr. Jekyll and Mr. Hyde' }, year: 1920, country: 'US', directors: ['John S. Robertson'],
    kind: 'film', minutes: 81, archiveId: 'DrJekyllandMrHyde', tags: ['horror', 'drama'], authors: [P.robertson, P.beranger, P.stevenson], aliases: ['dr jekyll and mr hyde'],
    why: { fr: 'John Barrymore se transforme d’abord sans maquillage, par le seul jeu de son visage.', en: 'John Barrymore begins his transformation without make-up, using nothing but his face.' },
  },
  {
    slug: 'notre-dame-de-paris-1923', title: { fr: 'Notre-Dame de Paris (1923)', en: 'The Hunchback of Notre Dame (1923)' }, year: 1923, country: 'US', directors: ['Wallace Worsley'],
    kind: 'film', minutes: 100, archiveId: 'The_Hunchback_of_Notre_Dame', tags: ['drama', 'adventure'], authors: [P.worsley, P.hugo, P.lowe, P.sheehan], aliases: ['the hunchback of notre dame'],
    why: { fr: 'Victor Hugo à Hollywood : une cathédrale reconstruite grandeur nature et Lon Chaney, bouleversant Quasimodo.', en: 'Victor Hugo in Hollywood: a full-size cathedral rebuilt and Lon Chaney as a heartbreaking Quasimodo.' },
  },

  // ───────── Séries d'époque ─────────
  {
    slug: 'les-vampires', title: { fr: 'Les Vampires', en: 'Les Vampires' }, year: 1915, country: 'FR', directors: ['Louis Feuillade'],
    kind: 'series', minutes: 417, archiveId: 'lesVampires1915Episode1-theSeveredHead', tags: ['series', 'crime', 'adventure'], authors: [P.feuillade], aliases: ['les vampires'],
    why: { fr: 'Une série en dix épisodes, tournée dans le Paris de 1915 : une société secrète, des toits, et Irma Vep en collant noir.', en: 'A ten-episode serial shot in 1915 Paris: a secret society, rooftops, and Irma Vep in her black bodysuit.' },
    episodes: [
      vampires(1, '1-theSeveredHead', 'La Tête coupée', 'The Severed Head', 31),
      vampires(2, '2-theRingThatKills', 'La Bague qui tue', 'The Ring That Kills', 13),
      vampires(3, '3-theRedCodebook', 'Le Cryptogramme rouge', 'The Red Codebook', 39),
      vampires(4, '4-theSpectre', 'Le Spectre', 'The Spectre', 30),
      vampires(5, '5-lvasionDuMort', 'L’Évasion du mort', 'Dead Man’s Escape', 35),
      vampires(6, '6-hypnoticEyes', 'Les Yeux qui fascinent', 'Hypnotic Eyes', 54),
      vampires(7, '7-satanus', 'Satanas', 'Satanas', 42),
      vampires(8, '8-theThunderMaster', 'Le Maître de la foudre', 'The Thunder Master', 50),
      vampires(9, '9-thePoisoner', 'L’Homme des poisons', 'The Poisoner', 48),
      vampires(10, '10-theTerribleWedding', 'Les Noces sanglantes', 'The Terrible Wedding', 58),
    ],
  },
  {
    slug: 'judex', title: { fr: 'Judex', en: 'Judex' }, year: 1916, country: 'FR', directors: ['Louis Feuillade'],
    kind: 'series', minutes: 266, archiveId: 'JudexEpisode01LOmbreMystrieuse1916', tags: ['series', 'crime', 'adventure'], authors: [P.feuillade, P.bernede],
    why: { fr: 'Un justicier masqué, une cape noire, un repaire secret : vingt ans avant Batman, en douze épisodes.', en: 'A masked avenger, a black cape, a secret lair: twenty years before Batman, in twelve episodes.' },
    episodes: [
      judex(1, "Judex_-_Episode_01_-_L'Ombre_mystérieuse_(1916).mp4", 'L’Ombre mystérieuse', 'The Mysterious Shadow', 26),
      judex(2, "Judex_-_Episode_02_-_L'Expiation_(1916).mp4", 'L’Expiation', 'Atonement', 15),
      judex(3, 'Judex_-_Episode_03_-_La_Meute_fantastique_(1916).mp4', 'La Meute fantastique', 'The Fantastic Hounds', 36),
      judex(4, 'Judex_-_Episode_04_-_Le_Secret_de_la_tombe_(1916).mp4', 'Le Secret de la tombe', 'The Secret of the Tomb', 25),
      judex(5, 'Judex_-_Episode_05_-_Le_moulin_tragique_(1916).mp4', 'Le Moulin tragique', 'The Tragic Mill', 25),
      judex(6, 'Judex_-_Episode_06_-_Le_Môme_Réglisse.mp4', 'Le Môme Réglisse', 'The Licorice Kid', 22),
      judex(7, 'Judex_-_Episode_07_-_La_Femme_en_noir_(1916).mp4', 'La Femme en noir', 'The Woman in Black', 29),
      judex(8, 'Judex_-_Episode_08-_Les_Souterrains_du_château_rouge_(1916)_.mp4', 'Les Souterrains du Château-Rouge', 'The Dungeons of the Château-Rouge', 24),
      judex(9, 'Judex_-_Episode_09_-_When_the_Child_Appears_(1916).mp4', 'Lorsque l’enfant parut', 'When the Child Appeared', 24),
      judex(10, 'Judex_-_Episode_10_-_Le_Coeur_de_Jacqueline_(1916).mp4', 'Le Cœur de Jacqueline', 'Jacqueline’s Heart', 8),
      judex(11, "Judex_-_Episode_11_-_L'Ondine_(1916).mp4", 'L’Ondine', 'The Water Goddess', 25),
      judex(12, 'Judex_-_Episode_12_-_The_Forgiveness_of_Love_(1916).mp4', 'Le Pardon d’amour', 'Love’s Forgiveness', 7),
    ],
  },

  // ───────── Grand spectacle ─────────
  {
    slug: 'le-signe-de-zorro', title: { fr: 'Le Signe de Zorro', en: 'The Mark of Zorro' }, year: 1920, country: 'US', directors: ['Fred Niblo'],
    kind: 'film', minutes: 74, archiveId: 'markofzorro-1920', tags: ['adventure'], authors: [P.niblo, P.mcculley, P.fairbanks], aliases: ['the mark of zorro', 'mark of zorro'],
    why: { fr: 'Le premier Zorro : Douglas Fairbanks saute, rit, ferraille, et invente le héros masqué à double vie.', en: 'The first Zorro: Douglas Fairbanks leaps, laughs, duels, and invents the masked hero with a double life.' },
  },
  {
    slug: 'le-monde-perdu', title: { fr: 'Le Monde perdu', en: 'The Lost World' }, year: 1925, country: 'US', directors: ['Harry O. Hoyt'],
    kind: 'film', minutes: 68, archiveId: 'lost_world', tags: ['adventure', 'scifi'], authors: [P.hoyt, P.doyle, P.fairfax], aliases: ['the lost world'],
    why: { fr: 'Des dinosaures animés image par image, huit ans avant King Kong, par le même magicien des effets.', en: 'Stop-motion dinosaurs eight years before King Kong, by the same effects wizard.' },
  },
  {
    slug: '20000-lieues-sous-les-mers', title: { fr: '20 000 lieues sous les mers (1916)', en: '20,000 Leagues Under the Sea (1916)' }, year: 1916, country: 'US', directors: ['Stuart Paton'],
    kind: 'film', minutes: 100, archiveId: '191620000LeaguesUnderTheSea', tags: ['adventure', 'scifi'], authors: [P.paton, P.verne], aliases: ['20 000 leagues under the sea', '20000 leagues under the sea'],
    why: { fr: 'Les premières vraies images sous-marines d’un film de fiction, tournées aux Bahamas en 1916.', en: 'The first real underwater footage in a fiction film, shot in the Bahamas in 1916.' },
  },
  {
    slug: 'intolerance', title: { fr: 'Intolérance', en: 'Intolerance' }, year: 1916, country: 'US', directors: ['D. W. Griffith'],
    kind: 'film', minutes: 176, archiveId: 'Intolerance', tags: ['drama', 'adventure'], authors: [P.griffith, P.loos], aliases: ['intolerance'],
    why: { fr: 'Quatre époques racontées en même temps, des décors de Babylone hauts comme des immeubles : la démesure à l’état pur.', en: 'Four eras told at once, Babylon sets as tall as buildings: sheer excess.' },
  },

  // ───────── Drames & passions ─────────
  {
    slug: 'l-aurore', title: { fr: 'L’Aurore', en: 'Sunrise' }, year: 1927, country: 'US', directors: ['F. W. Murnau'],
    kind: 'film', minutes: 94, archiveId: 'sunrise.-a.-song.-of.-two.-humans.-1927.720p.-blu-ray.x-264-hdclub-public-hd', tags: ['drama'], authors: [P.murnau, P.mayer, P.sudermann, P.hilliker],
    aliases: ['sunrise a song of two humans'],
    why: { fr: 'Un mari, une femme, une ville. Pour beaucoup de cinéastes, le plus beau film jamais tourné.', en: 'A husband, a wife, a city. For many film-makers, the most beautiful film ever shot.' },
  },
  {
    slug: 'le-lys-brise', title: { fr: 'Le Lys brisé', en: 'Broken Blossoms' }, year: 1919, country: 'US', directors: ['D. W. Griffith'],
    kind: 'film', minutes: 88, archiveId: 'brokenblossoms1919', tags: ['drama'], authors: [P.griffith, P.burke], aliases: ['broken blossoms'],
    why: { fr: 'Lillian Gish, deux doigts pour se forcer à sourire : un mélodrame d’une douceur et d’une cruauté rares.', en: 'Lillian Gish, two fingers forcing a smile: a melodrama of rare tenderness and cruelty.' },
  },
  {
    slug: 'a-travers-l-orage', title: { fr: 'À travers l’orage', en: 'Way Down East' }, year: 1920, country: 'US', directors: ['D. W. Griffith'],
    kind: 'film', minutes: 147, archiveId: 'WayDownEast_201312', tags: ['drama'], authors: [P.griffith, P.kelly, P.parker], aliases: ['way down east'],
    why: { fr: 'Pour le final sur la rivière gelée : Lillian Gish dérive vraiment sur la glace, sans doublure.', en: 'For the finale on the frozen river: Lillian Gish really drifts on the ice, with no double.' },
  },
  {
    slug: 'within-our-gates', title: { fr: 'Within Our Gates', en: 'Within Our Gates' }, year: 1920, country: 'US', directors: ['Oscar Micheaux'],
    kind: 'film', minutes: 77, archiveId: 'WithinOurGates', tags: ['drama'], authors: [P.micheaux], aliases: ['within our gates'],
    why: { fr: 'Le plus ancien film conservé d’un réalisateur afro-américain : une réponse directe au racisme de son époque.', en: 'The oldest surviving film by an African-American director: a direct answer to the racism of its time.' },
  },
  {
    slug: 'le-pere-serge', title: { fr: 'Le Père Serge', en: 'Father Sergius' }, year: 1918, country: 'RU', directors: ['Yakov Protazanov'],
    kind: 'film', minutes: 76, archiveId: 'silent-father-sergius', tags: ['drama'], authors: [P.protazanov, P.volkoff, P.tolstoy],
    why: { fr: 'Tolstoï, un officier devenu moine, et Ivan Mosjoukine, la plus grande star du cinéma russe d’avant 1917.', en: 'Tolstoy, an officer turned monk, and Ivan Mosjoukine, the greatest star of pre-1917 Russian cinema.' },
  },
  {
    slug: 'l-abime', title: { fr: 'L’Abîme', en: 'The Abyss' }, year: 1910, country: 'DK', directors: ['Urban Gad'],
    kind: 'short', minutes: 37, archiveId: 'Afgrunden_1910', tags: ['drama'], authors: [P.gad], aliases: ['afgrunden', 'the abyss'],
    why: { fr: 'Le film qui fit d’Asta Nielsen la première star européenne, et sa danse fit scandale.', en: 'The film that made Asta Nielsen Europe’s first star, with a dance that caused a scandal.' },
  },
  {
    slug: 'apres-la-mort', title: { fr: 'Après la mort', en: 'After Death' }, year: 1915, country: 'RU', directors: ['Evgueni Bauer'],
    kind: 'film', minutes: 46, archiveId: 'silent-posle-smerti', tags: ['drama', 'fantasy'], authors: [P.bauer],
    why: { fr: 'Un jeune homme hanté par une actrice morte. Bauer, génie oublié, éclaire chaque plan comme un tableau.', en: 'A young man haunted by a dead actress. Bauer, a forgotten genius, lights every shot like a painting.' },
  },

  // ───────── Naissance du dessin animé ─────────
  {
    slug: 'pauvre-pierrot', title: { fr: 'Pauvre Pierrot', en: 'Pauvre Pierrot' }, year: 1892, country: 'FR', directors: ['Émile Reynaud'],
    kind: 'animation', minutes: 4, archiveId: 'PauvrePierrot', tags: ['animation'], authors: [P.reynaud],
    why: { fr: 'Projeté à Paris en 1892, trois ans avant les frères Lumière : l’un des tout premiers dessins animés.', en: 'Shown in Paris in 1892, three years before the Lumière brothers: one of the very first animated films.' },
  },
  {
    slug: 'fantasmagorie', title: { fr: 'Fantasmagorie', en: 'Fantasmagorie' }, year: 1908, country: 'FR', directors: ['Émile Cohl'],
    kind: 'animation', minutes: 2, archiveId: 'Fantasmagorie', tags: ['animation', 'experimental'], authors: [P.cohl], aliases: ['fantasmagorie'],
    why: { fr: 'Sept cents dessins à la craie, deux minutes, aucune logique : le premier dessin animé sur pellicule.', en: 'Seven hundred chalk-line drawings, two minutes, no logic: the first animated cartoon on film.' },
  },
  {
    slug: 'humorous-phases-of-funny-faces', title: { fr: 'Phases amusantes de drôles de figures', en: 'Humorous Phases of Funny Faces' }, year: 1906, country: 'US', directors: ['J. Stuart Blackton'],
    kind: 'animation', minutes: 3, archiveId: 'Humorous_Phases_of_Funny_Faces_1906', tags: ['animation'], authors: [P.blackton],
    why: { fr: 'Des visages à la craie qui s’animent sur un tableau noir : l’animation américaine commence ici.', en: 'Chalk faces come to life on a blackboard: American animation starts here.' },
  },
  {
    slug: 'little-nemo', title: { fr: 'Little Nemo', en: 'Little Nemo' }, year: 1911, country: 'US', directors: ['Winsor McCay'],
    kind: 'animation', minutes: 11, archiveId: 'LittleNemo_548', tags: ['animation'], authors: [P.mccay],
    why: { fr: 'Un auteur de BD parie qu’il fera bouger ses dessins : quatre mille images plus tard, il gagne.', en: 'A comic-strip artist bets he can make his drawings move: four thousand drawings later, he wins.' },
  },
  {
    slug: 'how-a-mosquito-operates', title: { fr: 'Comment opère un moustique', en: 'How a Mosquito Operates' }, year: 1912, country: 'US', directors: ['Winsor McCay'],
    kind: 'animation', minutes: 6, archiveId: 'WinsorMcCay1912HowAMosquitoOperates', tags: ['animation', 'comedy'], authors: [P.mccay],
    why: { fr: 'Un moustique en chapeau haut-de-forme, glouton et cabotin : le premier personnage animé qui a du caractère.', en: 'A greedy, show-off mosquito in a top hat: the first animated character with a personality.' },
  },
  {
    slug: 'gertie-le-dinosaure', title: { fr: 'Gertie le dinosaure', en: 'Gertie the Dinosaur' }, year: 1914, country: 'US', directors: ['Winsor McCay'],
    kind: 'animation', minutes: 12, archiveId: 'Gertie', tags: ['animation'], authors: [P.mccay], aliases: ['gertie the dinosaur'],
    why: { fr: 'Gertie obéit, boude et pleure : la première star du dessin animé, que McCay présentait sur scène.', en: 'Gertie obeys, sulks and cries: animation’s first star, whom McCay presented live on stage.' },
  },
  {
    slug: 'le-naufrage-du-lusitania', title: { fr: 'Le Naufrage du Lusitania', en: 'The Sinking of the Lusitania' }, year: 1918, country: 'US', directors: ['Winsor McCay'],
    kind: 'animation', minutes: 9, archiveId: 'Sinking_of_the_Lusitania', tags: ['animation', 'documentary'], authors: [P.mccay],
    why: { fr: 'Un drame réel reconstitué en 25 000 dessins : le premier documentaire animé de l’histoire.', en: 'A real tragedy recreated in 25,000 drawings: the first animated documentary in history.' },
  },
  {
    slug: 'felix-le-chat-feline-follies', title: { fr: 'Félix le Chat : Feline Follies', en: 'Felix the Cat: Feline Follies' }, year: 1919, country: 'US', directors: ['Otto Messmer'],
    kind: 'animation', minutes: 4, archiveId: 'FelixTheCat-FelineFollies1919', tags: ['animation', 'comedy'], authors: [P.messmer, P.sullivan],
    why: { fr: 'La toute première apparition de Félix le Chat, vedette mondiale bien avant Mickey.', en: 'The very first appearance of Felix the Cat, a world star long before Mickey.' },
  },
  {
    slug: 'felix-le-chat-a-hollywood', title: { fr: 'Félix le Chat à Hollywood', en: 'Felix in Hollywood' }, year: 1923, country: 'US', directors: ['Otto Messmer'],
    kind: 'animation', minutes: 11, archiveId: 'Felix_inHollywood_NoAudio', tags: ['animation', 'comedy'], authors: [P.messmer, P.sullivan],
    why: { fr: 'Félix croise les stars de l’époque et se sert de sa queue comme d’une canne. Du pur dessin inventif.', en: 'Felix meets the stars of the day and uses his tail as a cane. Pure inventive cartooning.' },
  },
  {
    slug: 'steamboat-willie', title: { fr: 'Steamboat Willie', en: 'Steamboat Willie' }, year: 1928, country: 'US', directors: ['Walt Disney', 'Ub Iwerks'],
    kind: 'animation', minutes: 8, archiveId: 'steamboat-willie_1928', tags: ['animation', 'comedy'], authors: [P.disney, P.iwerks], spoken: 'en',
    why: { fr: 'Le premier Mickey sonore, entré dans le domaine public américain en 2024. Sept minutes d’histoire du cinéma.', en: 'The first sound Mickey, in the US public domain since 2024. Seven minutes of film history.' },
  },

  // ───────── Le cinéma s'invente ─────────
  {
    slug: 'l-homme-a-la-camera', title: { fr: 'L’Homme à la caméra', en: 'Man with a Movie Camera' }, year: 1929, country: 'SU', directors: ['Dziga Vertov'],
    kind: 'documentary', minutes: 66, archiveId: 'ChelovekskinoapparatomManWithAMovieCamera', tags: ['documentary', 'experimental'], authors: [P.vertov],
    aliases: ['man with a movie camera', 'chelovek s kinoapparatom'],
    why: { fr: 'Une journée dans une ville soviétique, sans histoire ni acteur. Élu meilleur documentaire de tous les temps par Sight & Sound.', en: 'A day in a Soviet city, with no story and no actors. Voted the greatest documentary of all time by Sight & Sound.' },
  },
  {
    slug: 'nanouk-l-esquimau', title: { fr: 'Nanouk l’Esquimau', en: 'Nanook of the North' }, year: 1922, country: 'US', directors: ['Robert J. Flaherty'],
    kind: 'documentary', minutes: 78, archiveId: 'nanookOfTheNorth1922', tags: ['documentary'], authors: [P.flaherty], aliases: ['nanook of the north'],
    why: { fr: 'La vie d’une famille inuite dans le Grand Nord : le film qui a inventé le documentaire, avec ses mises en scène.', en: 'An Inuit family’s life in the Far North: the film that invented the documentary, staged scenes included.' },
  },
  {
    slug: 'la-coquille-et-le-clergyman', title: { fr: 'La Coquille et le Clergyman', en: 'The Seashell and the Clergyman' }, year: 1928, country: 'FR', directors: ['Germaine Dulac'],
    kind: 'short', minutes: 40, archiveId: 'la-coquille-et-le-clergyman-1928_202507', tags: ['experimental'], authors: [P.dulac, P.artaud],
    why: { fr: 'Le premier film surréaliste, réalisé par une femme sur un scénario d’Artaud, un an avant Un chien andalou.', en: 'The first surrealist film, directed by a woman from a script by Artaud, a year before Un chien andalou.' },
  },
  {
    slug: 'symphonie-diagonale', title: { fr: 'Symphonie diagonale', en: 'Diagonal Symphony' }, year: 1924, country: 'DE', directors: ['Viking Eggeling'],
    kind: 'short', minutes: 7, archiveId: 'SymphonieDiagonale', tags: ['experimental', 'animation'], authors: [P.eggeling],
    why: { fr: 'Des lignes blanches qui dansent sur fond noir : sept minutes d’abstraction pure, comme de la musique pour les yeux.', en: 'White lines dancing on black: seven minutes of pure abstraction, like music for the eyes.' },
  },

  // ───────── Libres d'aujourd'hui (licence Creative Commons de l'ayant droit) ─────────
  {
    slug: 'big-buck-bunny', title: { fr: 'Big Buck Bunny', en: 'Big Buck Bunny' }, year: 2008, country: 'NL', directors: ['Sacha Goedegebure'],
    kind: 'animation', minutes: 10, archiveId: 'BigBuckBunny_124', tags: ['animation', 'comedy'], authors: [], cc: BLENDER, aliases: ['big buck bunny'],
    why: { fr: 'Un gros lapin placide, trois rongeurs odieux, une vengeance. Le court métrage libre le plus vu au monde.', en: 'A big placid rabbit, three nasty rodents, one revenge. The most-watched open short film in the world.' },
  },
  {
    slug: 'sintel', title: { fr: 'Sintel', en: 'Sintel' }, year: 2010, country: 'NL', directors: ['Colin Levy'],
    kind: 'animation', minutes: 15, archiveId: 'Sintel', tags: ['animation', 'fantasy', 'adventure'], authors: [], cc: BLENDER, spoken: 'en', aliases: ['sintel'],
    why: { fr: 'Une jeune femme cherche son dragon. Quinze minutes d’heroic fantasy qui finissent par serrer le cœur.', en: 'A young woman searches for her dragon. Fifteen minutes of heroic fantasy with a gut-punch ending.' },
  },
  {
    slug: 'tears-of-steel', title: { fr: 'Tears of Steel', en: 'Tears of Steel' }, year: 2012, country: 'NL', directors: ['Ian Hubert'],
    kind: 'short', minutes: 12, archiveId: 'Tears-of-Steel', tags: ['scifi'], authors: [], cc: BLENDER, spoken: 'en', aliases: ['tears of steel'],
    why: { fr: 'De la science-fiction avec de vrais acteurs et des robots géants à Amsterdam, financée par ses spectateurs.', en: 'Science fiction with real actors and giant robots in Amsterdam, funded by its audience.' },
  },
  {
    slug: 'cosmos-laundromat', title: { fr: 'Cosmos Laundromat', en: 'Cosmos Laundromat' }, year: 2015, country: 'NL', directors: ['Mathieu Auvray'],
    kind: 'animation', minutes: 12, archiveId: 'CosmosLaundromatFirstCycle', tags: ['animation', 'fantasy'], authors: [], cc: BLENDER, spoken: 'en', aliases: ['cosmos laundromat'],
    why: { fr: 'Un mouton dépressif, un vendeur mystérieux, une machine à laver cosmique. Étrange, drôle et superbe.', en: 'A depressed sheep, a mysterious salesman, a cosmic washing machine. Strange, funny and gorgeous.' },
  },
  {
    slug: 'spring', title: { fr: 'Spring', en: 'Spring' }, year: 2019, country: 'NL', directors: ['Andy Goralczyk'],
    kind: 'animation', minutes: 8, archiveId: 'spring_blenderopenmovie', tags: ['animation', 'fantasy'], authors: [], cc: BLENDER,
    why: { fr: 'Une bergère et son chien réveillent le printemps. Sans un mot, d’une beauté digne des grands studios.', en: 'A shepherd girl and her dog wake the spring. Wordless, and as beautiful as anything from the big studios.' },
  },
  {
    slug: 'elephants-dream', title: { fr: 'Elephants Dream', en: 'Elephants Dream' }, year: 2006, country: 'NL', directors: ['Bassam Kurdali'],
    kind: 'animation', minutes: 11, archiveId: 'ElephantsDream', tags: ['animation', 'scifi', 'experimental'], authors: [], cc: BLENDER, spoken: 'en', aliases: ['elephants dream'],
    why: { fr: 'Le tout premier « film libre » : deux hommes perdus dans une machine infinie. Là où tout a commencé.', en: 'The very first “open movie”: two men lost in an endless machine. Where it all began.' },
  },
  {
    slug: 'caminandes-llamigos', title: { fr: 'Caminandes : Llamigos', en: 'Caminandes: Llamigos' }, year: 2016, country: 'NL', directors: ['Pablo Vazquez'],
    kind: 'animation', minutes: 3, archiveId: 'CaminandesLlamigos', tags: ['animation', 'comedy'], authors: [], cc: BLENDER,
    why: { fr: 'Un lama, un manchot, des baies. Trois minutes de cartoon à l’ancienne, pour tous les âges.', en: 'A llama, a penguin, some berries. Three minutes of old-school cartoon fun for all ages.' },
  },
  {
    slug: 'agent-327', title: { fr: 'Agent 327 : Opération Barbershop', en: 'Agent 327: Operation Barbershop' }, year: 2017, country: 'NL', directors: ['Colin Levy', 'Hjalti Hjálmarsson'],
    kind: 'animation', minutes: 4, archiveId: 'agent327operationbarbershop', tags: ['animation', 'comedy', 'adventure'], authors: [], cc: { holder: 'Blender Foundation', license: 'CC BY-ND' }, spoken: 'en',
    why: { fr: 'Un agent secret néerlandais chez le coiffeur. Quatre minutes qui valent un film d’espionnage entier.', en: 'A Dutch secret agent at the barber’s. Four minutes worth a whole spy movie.' },
  },
  {
    slug: 'sprite-fright', title: { fr: 'Sprite Fright', en: 'Sprite Fright' }, year: 2021, country: 'NL', directors: ['Matthew Luhn', 'Hjalti Hjálmarsson'],
    kind: 'animation', minutes: 10, archiveId: 'sprite-fright', tags: ['animation', 'comedy', 'horror'], authors: [], cc: BLENDER, spoken: 'en',
    why: { fr: 'Des ados en forêt, d’adorables lutins… très rancuniers. Une comédie d’horreur réalisée par un ancien de Pixar.', en: 'Teens in a forest, adorable sprites… who hold a grudge. A horror comedy directed by a Pixar veteran.' },
  },
  {
    slug: 'the-internets-own-boy', title: { fr: 'The Internet’s Own Boy', en: 'The Internet’s Own Boy' }, year: 2014, country: 'US', directors: ['Brian Knappenberger'],
    kind: 'documentary', minutes: 105, archiveId: 'TheInternetsOwnBoyTheStoryOfAaronSwartz', tags: ['documentary'], authors: [], spoken: 'en',
    cc: { holder: 'Brian Knappenberger / Luminant Media', license: 'CC BY-NC-SA', nc: true },
    why: { fr: 'L’histoire d’Aaron Swartz, prodige du web et militant du savoir libre. Un documentaire lui-même diffusé sous licence libre.', en: 'The story of Aaron Swartz, web prodigy and open-knowledge activist. A documentary itself released under a free licence.' },
  },
];

export interface Shelf {
  id: string;
  title: { fr: string; en: string };
  intro: { fr: string; en: string };
  slugs: string[];
}

/** Les « parcours » de l'accueil : des rangées pensées comme un programme, pas comme un rayon. */
export const SHELVES: Shelf[] = [
  {
    id: 'rire', title: { fr: 'Les rois du rire', en: 'Kings of comedy' },
    intro: { fr: 'Sans paroles, sans trucages, et toujours aussi drôles.', en: 'No words, no tricks, and still just as funny.' },
    slugs: ['le-mecano-de-la-general', 'sherlock-junior', 'monte-la-dessus', 'cadet-d-eau-douce', 'la-maison-demontable', 'sept-ans-de-malheur', 'la-poupee', 'les-lois-de-l-hospitalite', 'la-croisiere-du-navigator', 'frigo-demenageur', 'l-etroit-mousquetaire', 'la-princesse-aux-huitres', 'le-magicien-d-oz-1925'],
  },
  {
    id: 'frissons', title: { fr: 'Frissons et ombres', en: 'Chills and shadows' },
    intro: { fr: 'Vampires, savants fous et maisons hantées : tout le cinéma d’épouvante vient de là.', en: 'Vampires, mad scientists and haunted houses: all of horror cinema starts here.' },
    slugs: ['nosferatu', 'le-cabinet-du-docteur-caligari', 'le-fantome-de-l-opera', 'les-mains-d-orlac', 'la-volonte-du-mort', 'la-chute-de-la-maison-usher', 'docteur-jekyll-et-m-hyde', 'le-cabinet-des-figures-de-cire', 'l-etudiant-de-prague', 'genuine', 'frankenstein-1910'],
  },
  {
    id: 'series', title: { fr: 'Séries d’époque', en: 'Vintage serials' },
    intro: { fr: 'On regardait déjà des séries en 1915, un épisode par semaine au cinéma.', en: 'People already binged serials in 1915, one episode a week at the cinema.' },
    slugs: ['les-vampires', 'judex'],
  },
  {
    id: 'aujourdhui', title: { fr: 'Libres d’aujourd’hui', en: 'Free films of today' },
    intro: { fr: 'Des films récents que leurs auteurs ont choisi d’offrir à tout le monde.', en: 'Recent films whose makers chose to give them to everyone.' },
    slugs: ['sintel', 'big-buck-bunny', 'cosmos-laundromat', 'spring', 'tears-of-steel', 'sprite-fright', 'agent-327', 'caminandes-llamigos', 'elephants-dream', 'the-internets-own-boy'],
  },
  {
    id: 'spectacle', title: { fr: 'Grand spectacle', en: 'Epic adventures' },
    intro: { fr: 'Capes, dinosaures, sous-marins et cathédrales reconstruites.', en: 'Capes, dinosaurs, submarines and rebuilt cathedrals.' },
    slugs: ['le-signe-de-zorro', 'le-monde-perdu', 'notre-dame-de-paris-1923', '20000-lieues-sous-les-mers', 'intolerance'],
  },
  {
    id: 'magiciens', title: { fr: 'Les magiciens des débuts', en: 'The first magicians' },
    intro: { fr: 'Dix minutes chacun : le cinéma découvre qu’il peut tout inventer.', en: 'Ten minutes each: cinema discovers it can invent anything.' },
    slugs: ['voyage-dans-la-lune', 'le-vol-du-grand-rapide', 'voyage-a-travers-l-impossible', 'hotel-electrique', 'le-spectre-rouge', 'reve-d-un-gourmand', 'the-big-swallow', 'royaume-des-fees', 'excursion-dans-la-lune', 'a-la-conquete-du-pole', 'suspense-1913', 'alice-au-pays-des-merveilles-1903'],
  },
  {
    id: 'animation', title: { fr: 'Naissance du dessin animé', en: 'The birth of animation' },
    intro: { fr: 'De la craie sur un tableau noir à Mickey, en dix films courts.', en: 'From chalk on a blackboard to Mickey, in ten short films.' },
    slugs: ['gertie-le-dinosaure', 'steamboat-willie', 'felix-le-chat-a-hollywood', 'fantasmagorie', 'little-nemo', 'le-naufrage-du-lusitania', 'how-a-mosquito-operates', 'felix-le-chat-feline-follies', 'humorous-phases-of-funny-faces', 'pauvre-pierrot'],
  },
  {
    id: 'passions', title: { fr: 'Drames et passions', en: 'Drama and passion' },
    intro: { fr: 'De grands mélodrames, et quelques-uns des plus beaux plans jamais tournés.', en: 'Great melodramas, and some of the most beautiful shots ever filmed.' },
    slugs: ['l-aurore', 'le-lys-brise', 'a-travers-l-orage', 'within-our-gates', 'le-pere-serge', 'apres-la-mort', 'l-abime'],
  },
  {
    id: 'invente', title: { fr: 'Le cinéma s’invente', en: 'Cinema reinvents itself' },
    intro: { fr: 'Documentaires et expériences : d’autres façons de regarder le monde.', en: 'Documentaries and experiments: other ways of looking at the world.' },
    slugs: ['l-homme-a-la-camera', 'nanouk-l-esquimau', 'la-coquille-et-le-clergyman', 'symphonie-diagonale'],
  },
];
