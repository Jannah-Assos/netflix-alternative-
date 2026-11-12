# Droits : comment Openflix décide qu'une œuvre est libre

> **Ce document n'est pas un avis juridique.** Il décrit les règles qu'applique le code (`server/src/rights.ts`) aux données du catalogue (`server/src/works.ts`). Une revue par un juriste en droit d'auteur reste nécessaire avant l'ouverture publique (jalon J5).

## Le principe : rien n'est déclaré « libre » à la main

Pour chaque œuvre du catalogue, on enregistre des **faits vérifiables** : les auteurs (réalisateur, scénariste, auteur de l'œuvre adaptée, compositeur), leur **année de décès**, s'ils sont **ressortissants de l'Union européenne**, le **pays d'origine** et l'**année de publication**. Le statut est ensuite **calculé**. Si une donnée change, ou simplement avec le temps qui passe, le statut change tout seul.

Les années de décès et les nationalités ont été **vérifiées sur Wikidata le 12 novembre 2026** (elles venaient auparavant de la mémoire de l'assistant). Un test automatique refuse toute œuvre du catalogue dont le calcul ne donne pas « libre » ou « probablement libre ».

La licence affichée par Internet Archive n'est **pas** utilisée : la même œuvre y porte des licences différentes selon l'internaute qui a déposé la copie.

## Les trois règles

| # | Règle | Résultat affiché |
|---|---|---|
| 1 | L'**ayant droit lui-même** a publié l'œuvre sous licence **Creative Commons** (films de la fondation Blender, *The Internet's Own Boy*). | **Libre en France** |
| 2 | **Droit commun français** : une œuvre entre dans le domaine public 70 ans après la mort du dernier de ses auteurs. | Tous morts depuis **plus de 80 ans** : **Libre en France**. Entre **70 et 80 ans** : **Probablement libre**. |
| 3 | **Œuvre d'origine américaine dont les auteurs ne sont pas européens** : la France n'accorde pas une protection plus longue que le pays d'origine (article **L.123-12** du code de la propriété intellectuelle). Une œuvre publiée il y a plus de 95 ans est dans le domaine public aux États-Unis. | **Probablement libre** |

Précisions :

- **Prorogations de guerre.** Selon la Cour de cassation (27 février 2007, affaires Monet et Boldini), elles ne s'ajoutent plus aux 70 ans pour les œuvres dont la durée a été allongée par l'harmonisation européenne. La marge de 10 ans de la règle 2 couvre les cas restants ; c'est pourquoi « libre » sans réserve n'est affiché qu'au-delà de 80 ans.
- **Règle 3, lecture prudente.** Elle n'est appliquée que si **tous les auteurs encore « dans les 70 ans » sont non européens**. Un auteur européen doit, lui, être mort depuis plus de 70 ans (exemple : *L'Aurore*, 1927, de l'Allemand Murnau, mort en 1931, avec des intertitres d'une Américaine morte en 1965).
- **Décès inconnu** : l'auteur est traité comme encore protégé.
- **Droit moral** : en France il est perpétuel. Il n'empêche pas la diffusion, mais il compte pour toute **modification** (colorisation, « upscale » par IA) : à faire valider avant de proposer des versions retouchées.

## Ce que ça donne (novembre 2026)

74 œuvres au catalogue : **38 « Libre en France »**, **36 « Probablement libre »**. Chaque page de film affiche la règle appliquée et la liste des auteurs avec leur année de décès.

Exemples :

| Œuvre | Données | Statut |
|---|---|---|
| *Le Voyage dans la Lune* (1902) | Méliès † 1938 | Libre (règle 2) |
| *Les Vampires* (1915) | Feuillade † 1925 | Libre (règle 2) |
| *Nosferatu* (1922) | Murnau † 1931, Galeen † 1949 | Probablement libre (règle 2) |
| *Le Cabinet du docteur Caligari* (1920) | Janowitz † 1954 | Probablement libre (règle 2), depuis le 1er janvier 2025 |
| *Le Mécano de la « General »* (1926) | Keaton † 1966, Américain ; film américain de plus de 95 ans | Probablement libre (règle 3) |
| *Steamboat Willie* (1928) | Disney † 1966, Américain ; domaine public américain depuis 2024 | Probablement libre (règle 3) |
| *Sintel* (2010) | CC BY, fondation Blender | Libre (règle 1) |

## Œuvres écartées, et pourquoi

| Œuvre | Raison (décès vérifiés) |
|---|---|
| *Le Golem* (1920) | co-réalisateur Carl Boese † 1958 : protégé jusqu'à fin 2028 |
| *Le Cuirassé Potemkine* (1925) | co-scénariste Nina Agadjanova † 1974 |
| *Häxan* (1922), *Faust* (1926), *Metropolis* (1927) | Christensen † 1959, Kyser † 1960, Lang † 1976 |
| **Charlie Chaplin** | Britannique : la règle 3 est incertaine pour lui et ses ayants droit défendent activement ses films en France. Écarté par prudence. |
| Popeye, Betty Boop, Looney Tunes, Disney **après 1930** | la durée américaine court encore |
| *Zéro de conduite*, *L'Atalante* (Vigo) | compositeur Maurice Jaubert « mort pour la France » en 1940 (30 ans de protection supplémentaires) ; co-auteurs |

## Ce qui a changé par rapport aux premières versions

Trois affirmations antérieures étaient inexactes ; elles sont corrigées ici et dans le code :

1. « Buster Keaton est protégé en France jusqu'en 2037 » : c'était raisonner avec la seule règle des 70 ans. La règle 3 s'applique à ses films américains des années 1920.
2. « Libre seulement si tous les auteurs sont morts avant 1946 » : trop strict. La règle est 70 ans ; la marge de 10 ans reste, mais comme une nuance (« probablement libre »), pas comme une exclusion.
3. « Le Golem est seulement douteux » : il est protégé (co-réalisateur mort en 1958, vérifié).

## L'archive élargie (non vérifiée)

La page « Archive » cherche en direct dans Internet Archive, hors catalogue. Les œuvres connues comme protégées en sont écartées ; les autres s'affichent **sans garantie**, avec un bandeau qui le dit. Les œuvres du gouvernement américain et les films américains anciens non encore vérifiés portent « Droits à vérifier ».

`OPENFLIX_ARCHIVE=off` ferme l'archive : le site ne montre alors que le catalogue vérifié. C'est le réglage recommandé pour une ouverture au grand public tant que la revue juridique n'est pas faite.

**Le plus grand réservoir pour la suite** : les films américains d'après 1930 dont le droit d'auteur n'a pas été renouvelé (film noir, science-fiction, des milliers de titres sur Internet Archive). La règle 3 les rendrait libres en France, mais il faut vérifier le non-renouvellement œuvre par œuvre : chantier à mener avec le juriste.

## Ajouter une œuvre

1. Une entrée dans `server/src/works.ts` (copie Internet Archive, auteurs, décès, nationalité, phrase « pourquoi le voir »).
2. `npm run verify-catalogue` : la copie est-elle lisible, le statut calculé est-il « libre » ou « probablement libre » ?
3. `npm test` : les tests refusent une œuvre incomplète ou protégée.

## Sources

- [Article L.123-12 du code de la propriété intellectuelle (Légifrance)](https://www.legifrance.gouv.fr/codes/id/LEGIARTI000006278947/2007-01-01)
- [Prorogations de guerre : arrêts du 27 février 2007 (Squire Patton Boggs)](https://larevue.squirepattonboggs.com/prorogations-de-guerre-et-duree-de-protection-des-oeuvres_a243.html)
- [« La durée des droits d'auteur est bien de 70 ans » (Livres Hebdo)](https://www.livreshebdo.fr/article/la-duree-des-droits-dauteur-est-bien-de-70-ans)
- Wikidata (années de décès et nationalités), consulté le 12 novembre 2026.
