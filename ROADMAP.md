# Openflix — feuille de route (proposition)

*Document de travail, à discuter. Rédigé le 10/11/2026 d'après les tests réels de l'application.*

## 1. Où on en est

Openflix est une application web de streaming **sans hébergement de vidéos** : elle retrouve des films, séries, documentaires et courts métrages dans des bases libres, choisit le meilleur fichier, vérifie que le lien répond et affiche la licence.

| Fait | Détail |
|---|---|
| Catalogue réel | 9 rangées d'accueil, ~175 titres, **100 % à licence libre déclarée** |
| Lecture | plein écran, qualité au choix, reprise automatique, raccourcis clavier, repli sur le lecteur de la source |
| Explorer | recherche multi-sources + filtres : type, genre, période, langue, tri, licences libres, sources |
| Langues | français et anglais |
| Installable | PWA (PC, téléphone, navigateur de TV), ouverte hors ligne (coquille) |
| Sécurité | filtre « grand public », limitation de débit, CSP stricte, anti-SSRF |
| Qualité | 198 tests unitaires, parcours navigateur sur données réelles, CI avec build Docker |

### D'où viennent les vidéos aujourd'hui

| Source | Ce qu'on y prend | Volume exploitable (licence libre déclarée ; chiffres mesurés le 10/11/2026 pour Internet Archive uniquement) |
|---|---|---|
| **Internet Archive** | films, séries TV, animation, documentaires, audio, livres, logiciels | ~9 100 longs métrages ; 2 500 séries/TV ; 1 900 courts ; 1 300 animations ; 700 films muets ; 600 comédies ; 400 sci-fi/horreur ; 300 films noirs |
| **Wikimedia Commons** | vidéos et audio, avec versions allégées WebM (240p à 1080p) | non mesuré (très varié) |
| **NASA Image and Video Library** | archives spatiales (domaine public) | non mesuré |
| **PeerTube** (via SepiaSearch) | vidéos sous licence Creative Commons (courts métrages, films Blender…) | non mesuré (qualité inégale) |

Limite à garder en tête : **la licence est celle déclarée par la personne qui a déposé le fichier**, ce n'est pas une garantie juridique.

## 2. Principes qui guident les priorités

1. **Légal d'abord** : ne jamais présenter comme libre ce qui ne l'est pas ; la licence est toujours visible.
2. **Famille par défaut** : un catalogue qu'on peut ouvrir devant ses enfants.
3. **Ça doit marcher partout** : PC, téléphone, TV, hors ligne partiel, clavier, télécommande.
4. **Pas d'hébergement** tant que ce n'est pas indispensable (coût, droits, modération).

## 3. Priorités proposées

Impact : ★ à ★★★. Effort : S (jours) · M (1-2 semaines) · L (plusieurs semaines).

| # | Chantier | Impact | Effort | Pourquoi |
|---|---|---|---|---|
| 1 | **Sous-titres** (VTT NASA, PeerTube, IA) | ★★★ | M | indispensable pour du vieux cinéma et pour le FR/EN |
| 2 | **Cache persistant des métadonnées** (SQLite) + préchauffage nocturne | ★★★ | M | accueil instantané, fin des « 429 » Wikimedia, moins de dépendance aux API |
| 3 | **Navigation à la télécommande** (flèches, focus visible, mode « 10 pieds ») | ★★★ | M | prérequis de l'Android TV et utile au clavier |
| 4 | **Tests navigateur en CI** (Playwright, mes parcours actuels) | ★★★ | S | verrouille les bugs déjà corrigés (lecteur, débordements) |
| 5 | **Épisodes et saisons** pour les séries (un item IA contient souvent plusieurs épisodes) | ★★ | M | aujourd'hui une série = un seul lien |
| 6 | **Profils + contrôle parental** (mode enfant, code) | ★★ | M | le filtre « grand public » devient réglable par foyer |
| 7 | **Comptes et synchronisation** (Ma liste, reprise entre appareils) | ★★ | L | usage multi-écrans |
| 8 | **Application Android TV** puis mobile | ★★ | L | l'objectif de départ ; repose sur 3 |
| 9 | **Nouvelles sources** (voir 5) | ★★ | M | plus de choix, surtout en français |
| 10 | **Sélections éditorialisées** (« Le coin du muet », « Nuit noire »…) | ★★ | S | donne du caractère, réduit l'effet « moteur de recherche » |

## 4. Par domaine

### 4.1 Direction artistique et UX
*Fait :* identité v1 « salle de projection » (voir `docs/DESIGN.md`), logo, polices, tampons de licence, hero, thème clair « papier crème ».

À faire, dans l'ordre :
- **Logo définitif** dessiné par un graphiste (le symbole actuel est un point de départ) ; kit de marque (couleurs, usages, favicon, bannière de partage social).
- **Page d'accueil v2** : sélection éditoriale en tête, rangée « Nouveautés », bouton « Voir tout » par rangée, hero qui change toutes les N secondes.
- **États vides et d'erreur illustrés** (aujourd'hui du texte seul).
- **Fiche titre en page dédiée** (aujourd'hui un panneau latéral) : synopsis, licence détaillée, titres similaires, liens.
- **Affiches verticales** pour les titres connus (via une base d'affiches libre de droits ; TMDB impose des limites commerciales) ; sinon recadrage intelligent.
- **Micro-interactions** : aperçu au survol, animation de l'ajout à « Ma liste », transitions entre pages.
- **Test utilisateur** avec 5 personnes (parent, ado, cinéphile, senior, utilisateur de TV) avant d'aller plus loin.

### 4.2 Lecteur
*Fait :* correctif du débordement (vidéo sous le bord de l'écran), barre auto-masquée, plein écran, ±10 s, F/M/Espace/Échap, reprise.

À faire : sous-titres et choix de langue audio ; vitesse de lecture ; « épisode suivant » ; aperçu sur la barre de progression ; Chromecast/AirPlay ; mode « picture-in-picture » ; mémoire du volume ; lecture en continu (HLS/DASH adaptatif quand la source le propose : Wikimedia fournit du DASH).

### 4.3 Filtres et recherche
*Fait :* type, genre (9), période (5), langue du contenu, tri (4), licences libres, sources ; les sources qui ne gèrent pas un filtre sont signalées.

Ensuite :
- **Durée** (court / moyen / long) : Internet Archive ne la donne pas toujours, à vérifier source par source.
- **Qualité** (HD seulement), **lisible dans le navigateur** seulement.
- **Genres multiples** et **pays/réalisateur** (métadonnées IA et Wikidata).
- **Recherche** : suggestions pendant la frappe, tolérance aux fautes, recherche dans les sous-titres, historique.
- **Mémoriser les préférences** de filtres.

### 4.4 Catalogue et qualité des contenus
- **Nouvelles sources à étudier** : Library of Congress (films), Europeana (patrimoine audiovisuel européen), Prelinger Archives (déjà dans IA), Jamendo et Free Music Archive (musique CC), Vimeo/YouTube en Creative Commons (conditions d'API à lire de près). Pour le français : archives régionales et cinémathèques qui publient sous licence ouverte (à recenser).
- **Contrôle des liens** : tâche périodique qui repère les liens morts et retire les titres cassés.
- **Filtre « grand public » v2** : liste évolutive, signalement par les utilisateurs, revue des faux positifs, profils enfant/ado.
- **Déduplication** : le même film apparaît parfois dans plusieurs sources ou en plusieurs versions.

### 4.5 Performance
Budget actuel : JavaScript ~83 Ko (gzip), polices ~110 Ko. Pistes : images redimensionnées et `srcset`, préchargement des vignettes visibles, rendu différé des rangées hors écran, cache serveur persistant (voir priorité 2), compression Brotli au niveau du proxy.

### 4.6 Accessibilité
*Fait :* focus piégé dans les fenêtres, Échap, animations réduites, contrastes soignés. *À faire :* audit de contraste AA complet, navigation aux flèches dans les rangées, annonces pour lecteurs d'écran, taille de texte réglable, sous-titres (priorité 1).

### 4.7 Technique et exploitation
Tests Playwright en CI ; base SQLite ; journalisation et métriques (requêtes lentes, taux d'échec par source) ; alerte quand une collection Internet Archive change de nom (rangée vide) ; mises à jour de dépendances automatisées ; sauvegarde des préférences utilisateur ; documentation de déploiement (reverse proxy HTTPS, accès restreint).

### 4.8 Du projet perso au produit public
À traiter **avant** toute ouverture publique :
- **Nom et marque** : « Openflix » rappelle « Netflix » ; vérifier la disponibilité et le risque de confusion (INPI/EUIPO) avant de communiquer.
- **Mentions légales, conditions d'utilisation, politique de confidentialité** (RGPD si comptes), procédure de signalement et de retrait.
- **Authentification et protection contre les abus** (aujourd'hui aucune : l'outil est prévu pour un usage perso ou derrière un proxy).
- **Conditions d'utilisation des API** de chaque source (usage raisonnable, pas de copie massive) et conformité des liens directs.
- **Hébergement** et budget (le serveur est léger, les vidéos ne passent pas par lui).

## 5. Idées en attente
Voir `BACKLOG.md` : plateforme de vidéos générées par IA avec « quality seals » (en cours de cadrage dans une discussion dédiée).

## 6. Proposition de séquence

1. **Semaine 1-2** : tests navigateur en CI (4) · sous-titres (1) · sélections éditorialisées (10).
2. **Semaine 3-4** : cache persistant (2) · épisodes (5) · page titre dédiée.
3. **Semaine 5-6** : navigation à la télécommande (3) · accueil v2 · test utilisateur.
4. **Semaine 7+** : profils et contrôle parental (6) · comptes (7) · Android TV (8) · nouvelles sources (9).

*À décider ensemble :* le public visé (perso, famille, public), car cela change les priorités 6, 7 et la section 4.8.
