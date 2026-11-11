# Droits du catalogue : liste de travail (V1)

> **Ceci n'est pas un avis juridique.** C'est une base de travail pour un premier catalogue de chefs-d'œuvre, à faire valider par un juriste avant la mise en ligne publique (jalon J5 du plan).
> Les dates de décès viennent de notre connaissance générale et **n'ont pas été revérifiées** (Wikidata a refusé nos requêtes : limite de débit). À contrôler titre par titre.

## Le principe

Notre public est français : c'est le **droit français** qui compte, pas seulement le droit américain qu'applique Internet Archive.

- **États-Unis** : une œuvre est libre selon sa date de publication (ex. : 1929 et avant en 2025, puis 1930…).
- **France** : une œuvre audiovisuelle est protégée **70 ans après la mort du dernier survivant** parmi le réalisateur, l'auteur du scénario, l'auteur des dialogues et le compositeur. Les **prolongations de guerre** (environ +6 ans et +8 ans pour les œuvres anciennes) peuvent s'y ajouter. Un seul co-auteur mort tard suffit à protéger tout le film.

**Règle de prudence que nous appliquons** : un titre n'est en « catégorie A » que si **tous** les auteurs principaux sont morts **avant 1946**, ou si l'ayant droit lui-même a mis une licence Creative Commons.

## Catégorie A : on peut les mettre en avant

| Titre | Année | Auteurs principaux (décès) | Sur Internet Archive |
|---|---|---|---|
| Le Voyage dans la Lune | 1902 | Georges Méliès (1938) | oui (licence déclarée par l'uploader : CC BY-NC-SA, incohérente) |
| The Wandering Jew | 1905 | Georges Méliès (1938) | oui |
| Excursion dans la Lune | 1908 | Segundo de Chomón (1929) | oui |
| Fantasmagorie | 1908 | Émile Cohl (1938) | oui |
| Little Nemo | 1911 | Winsor McCay (1934) | oui |
| Les Vampires (série, 10 épisodes) | 1915 | Louis Feuillade (1925) | oui |
| Sunrise | 1927 | F. W. Murnau (1931), Carl Mayer (1944), Hugo Riesenfeld (1939) | oui |
| Big Buck Bunny, Sintel, Elephants Dream | 2006–2010 | Blender Foundation, **CC BY 3.0 par l'ayant droit** | oui |

Pour les films Blender, la licence vient de l'ayant droit : c'est le cas le plus solide. À vérifier : que la copie d'Internet Archive est bien celle de la fondation.

## Catégorie B : libres aux États-Unis, doute en France → signalées, jamais mises en avant

| Titre | Pourquoi le doute |
|---|---|
| Nosferatu (1922) | Murnau (1931) OK, mais le scénariste Henrik Galeen est mort en 1949. |
| Das Cabinet des Dr. Caligari (1920) | Le scénariste Hans Janowitz est mort en 1954. |
| Le Golem (1920) | Paul Wegener (1948) et Henrik Galeen (1949). |
| Intolerance (1916) | D. W. Griffith est mort en 1948 : limite, selon les prolongations de guerre. |
| Le Cuirassé Potemkine (1925) | La co-scénariste Nina Agadzhanova serait morte en 1974 (**date non vérifiée**). |
| The Phantom of the Opera (1925) | Un co-scénariste serait mort en 1957 (**date non vérifiée**). |

Ces titres restent dans le catalogue (Internet Archive les propose) et portent le tampon « Doute en France ».

## Catégorie C : protégés en France → écartés du catalogue

Le serveur écarte ces œuvres (sauf `RIGHTS_FILTER=off`) :

- **Par œuvre** (année de décès du dernier auteur ≥ 1956) : *Häxan* (Christensen, 1959), *Faust* 1926 (scénariste Kyser, 1960), *Metropolis* 1927 (Fritz Lang, 1976).
- **Par créateur ou personnage**, quelle que soit la copie : Charlie Chaplin (1977), Buster Keaton (1966), Harold Lloyd (1971), Fritz Lang, Fleischer Studios (Popeye, Betty Boop, Gulliver…), Walt Disney, Felix le Chat (Messmer), Harman-Ising (Bosko), Looney Tunes / Merrie Melodies, Tom et Jerry.

## Ce que montrent les vraies données

La **même œuvre** porte des licences différentes selon qui l'a mise en ligne (ex. : *Le Golem* « domaine public » sur une copie, « CC BY-NC-ND » sur une autre ; *Faust* et *La Grande Attaque du train*, idem). La licence affichée par Internet Archive est donc un signal faible : **un badge « libre » ne garantit pas que l'œuvre est libre en France.**

## Ce qui est en place

- **Table de droits** : `server/src/rights.ts`. Elle donne à chaque œuvre connue un statut en France : `free`, `unclear` ou `protected`, calculé à partir de la date de décès des auteurs principaux :
  - **avant 1946** → libre (marge de sécurité) ;
  - **1946 à 1955** → doute ;
  - **1956 ou après** → protégé ;
  - une date incertaine empêche « libre » comme « protégé » (le tampon indique alors que la date reste à vérifier) ;
  - une licence Creative Commons donnée par l'ayant droit → libre.
- **Reconnaissance d'une copie** : par identifiant Internet Archive vérifié, ou par titre et année (±1 an). Sans année, le titre doit être identique. Mieux vaut ne rien dire qu'une erreur.
- **Affichage** : tampon « Libre en France » / « Doute en France » / « Protégé en France » sur les vignettes et la fiche, avec l'explication.
- **Rangée « Panthéon »** en tête de l'accueil : une seule copie par œuvre, uniquement des œuvres libres.
- **Exclusion** des œuvres protégées de l'accueil et de la recherche. `RIGHTS_FILTER=off` les remet, signalées.

## Limite essentielle : « sans tampon » ne veut pas dire « libre »

La table ne connaît qu'une trentaine d'œuvres et quelques créateurs. **Tout le reste est affiché comme avant**, sans tampon de droits, y compris des titres probablement protégés en France (*His Girl Friday*, de Howard Hawks, mort en 1977, par exemple). Il faut donc :

1. **Étendre la table** titre par titre, en commençant par ce qui est le plus regardé.
2. Avant l'ouverture publique, passer à un mode « **catalogue fermé** » : seules les œuvres de la table (ou d'un lot vérifié) sont visibles, le reste est masqué.
3. **Faire valider** les règles et les dates par un juriste (droit d'auteur français, prolongations de guerre, œuvres de collaboration).

## Pour la suite

- **Séries et anime** : la catégorie A ne contient presque pas de séries (*Les Vampires*). Le reste passera par le guide « où regarder légalement », étudié à part.
- **Upscale 4K** : seulement sur la catégorie A, jamais sur une licence « sans modification » ou « non commerciale ».
