# Openflix — direction artistique (v1)

## Concept : « la salle de projection »

Openflix présente du cinéma libre de droits : surtout du patrimoine (muet, noir et blanc, années 30 à 60), avec des vignettes souvent sombres et granuleuses. Plutôt que le noir froid et le rouge d'un service de streaming classique, l'identité s'appuie sur ce qui fait la magie d'une salle : **le noir d'une salle obscure et la lumière chaude d'un projecteur**.

Trois mots : *chaleureux, cinéphile, net.*

## Palette

| Rôle | Sombre (défaut) | Clair « papier crème » |
|---|---|---|
| Fond | `#0d0b12` (encre légèrement violacée) | `#f6f0e6` |
| Surface | `#1b1724` | `#fffaf1` |
| Texte | `#f5efe6` (crème chaud) | `#1e1a26` |
| **Accent « projecteur »** | `#ffb347` (ambre) | `#b45f06` (ambre profond) |
| Tampon domaine public | `#86e0b0` | `#1f7a4d` |
| Tampon Creative Commons | `#8cc8ff` | `#1d63a8` |
| Tampon CC non commercial | `#ffc58a` | `#a65a00` |
| Licence inconnue | `#c9a2ff` (contour pointillé) | `#6b3fb0` |

Les couleurs sont des variables CSS (`web/src/styles.css`, début du fichier) : changer l'identité = changer ces valeurs. La bannière « À l'affiche » reste toujours sombre, quel que soit le thème, comme un écran de cinéma.

## Typographie

- **Titres : Fraunces** (empattement chaleureux, un peu éditorial) — logo, titres de page, titres de rangée, titre des fiches.
- **Interface : Instrument Sans** — lisible, sobre, neutre pour les boutons, listes, filtres.
- Polices hébergées par l'application (aucun appel à un service externe), chargées à la demande par alphabet.

## Signature visuelle

- **Logo** : un anneau ouvert (le « open ») traversé d'un triangle de lecture ; logotype « Open » en crème et « flix » en ambre italique.
- **Étiquette « À l'affiche »** façon billet : bordure en pointillés, petite lumière.
- **Tampons de licence** : lettres capitales, cadre net, couleur selon le statut. Une licence inconnue est en **pointillés** : on voit tout de suite ce qui n'est pas vérifié.
- **Faisceau de projecteur** : halo ambre en haut à droite de la bannière ; **grain de pellicule** léger.
- **Affiche « épinglée »** : légère rotation de l'image dans la bannière.
- **Marqueur ambre** devant les titres de rangée.

## Mouvement

Apparition des rangées l'une après l'autre ; survol des cartes (léger soulèvement, halo ambre, zoom de l'image) ; barre du lecteur qui s'efface pendant la lecture. Toutes les animations sont coupées si l'utilisateur demande « réduire les animations ».

## Règles d'usage

- Le plein ambre est réservé à **l'action principale** et à la **sélection unique** (genre actif, bouton Regarder) ; les sélections multiples utilisent un contour ambre.
- Une seule couleur d'accent par écran.
- Les titres de contenu (films) ne sont jamais en capitales : on respecte les titres d'origine.
- Texte sur image : toujours sur un dégradé sombre (contraste vérifié en clair comme en sombre).
- Les images remplissent leur cadre sans jamais en dicter la taille (les vraies vignettes sont de tailles très variées).

## Pistes pour la v2

Logo définitif par un graphiste ; affiches verticales ; illustrations des états vides ; mode « 10 pieds » pour la télévision ; système de composants documenté (Storybook).
