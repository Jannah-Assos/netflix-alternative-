# Openflix — plan carré vers la V1

*Rédigé le 10/11/2026. Complète `ROADMAP.md` (vision et idées) : ici, on tranche, on ordonne et on fixe des critères de réussite vérifiables.*

## 1. Ce que veut dire « V1 100 % fonctionnelle »

> **Une personne qui ne connaît pas le projet ouvre un lien, trouve un film libre de droits, le regarde sans accroc sur son appareil, et peut recommencer demain. Rien de ce que l'application annonce ne ment ni ne plante.**

La V1 est atteinte quand **les 9 critères** ci-dessous sont tous vrais (mesurés, pas ressentis) :

| # | Critère de réussite | Comment on le vérifie |
|---|---|---|
| 1 | L'application est **en ligne en HTTPS**, disponible ≥ 99 % sur 14 jours | surveillance automatique |
| 2 | **Accueil affiché en moins de 2 s** (95 % des cas, cache chaud), même si une source est en panne | mesure automatique |
| 3 | **Lecture réussie ≥ 95 %** sur un échantillon de 200 titres, sur Chrome, Firefox, Safari (Mac et iPhone), Edge, Chrome Android | campagne de test + relevé |
| 4 | **Toutes les fonctions annoncées marchent** : recherche, filtres, fiche titre, lecteur (qualité, reprise, sous-titres, épisodes), Ma liste, FR/EN, installation | tests navigateur automatiques en CI |
| 5 | **100 % des titres affichés ont une licence libre déclarée** ; attribution Creative Commons conforme ; 0 contenu pour adultes sur 1 000 titres tirés au hasard | audit d'échantillon |
| 6 | **Pages légales en ligne** et procédure de signalement/retrait qui fonctionne | test de bout en bout |
| 7 | **Accessibilité** : contrastes AA, tout utilisable au clavier, aucun défaut bloquant lecteur d'écran | audit + Lighthouse ≥ 95 |
| 8 | **Performance** : Lighthouse mobile ≥ 85, JavaScript < 100 Ko (gzip) | CI |
| 9 | **5 à 10 testeurs réels** ont tout parcouru, 0 bug bloquant ouvert | bêta fermée |

## 2. Périmètre : ce qui est dedans, dehors, plus tard

| Dans la V1 | Reporté (V1.1) | Hors périmètre |
|---|---|---|
| Accueil, Explorer, filtres, recherche avec suggestions | Comptes et synchronisation entre appareils | Héberger des vidéos |
| **Page dédiée par titre** (lien partageable) | Profils et contrôle parental par code | Publicité / monétisation |
| Lecteur : qualité, reprise, **sous-titres**, **épisodes**, plein écran, PiP, raccourcis | Android TV et navigation à la télécommande complète | Contenus dont les droits sont incertains |
| Ma liste et Reprendre la lecture (**sur l'appareil**) | Publication sur les magasins (Play Store, App Store) | « Quality seals » IA (voir `BACKLOG.md`) |
| FR / EN, thèmes clair et sombre, **PWA installable** | Chromecast / AirPlay, recommandations | |
| Sélections éditoriales, filtre « grand public » | | |
| Pages légales, signalement, mesure d'audience respectueuse | | |
| **Bêtas** : application Android (.apk) et de bureau (Mac, Windows) | | |

> **Pourquoi pas de monétisation en V1 ?** Une partie du catalogue est en licence Creative Commons **non commerciale**. Tant qu'Openflix n'est pas strictement non commercial ou filtré en conséquence, on ne peut pas y mettre de publicité ni d'abonnement.

## 3. Les 7 décisions à prendre (avec ma recommandation)

| # | Décision | Ma recommandation |
|---|---|---|
| D1 | **Public visé** : usage perso, communauté, grand public ? | grand public francophone, **bêta fermée d'abord** |
| D2 | **Nom** : garder « Openflix » ? (proche de « Netflix ») | **vérifier la disponibilité de la marque AVANT d'acheter un domaine** ; garder 2 noms de secours |
| D3 | **Hébergement** | Render (déjà préparé, le plus simple) ; payant dès la bêta pour éviter la mise en veille. Hostinger (déjà connecté chez vous) possible |
| D4 | **Nom de domaine** (ex. openflix.fr / .app) | à acheter une fois D2 validée |
| D5 | **Comptes en V1 ?** | **Non** : tout reste sur l'appareil, comptes en V1.1 |
| D6 | **Applications natives** | bêtas Android + bureau en V1, **magasins après** la V1 |
| D7 | **Monétisation** | **aucune** en V1 (voir ci-dessus) |

## 4. Le plan en 7 jalons

*Effort : S = 1-2 jours · M = 3-5 jours · L = 1-2 semaines (travail effectif, hors attente de décisions). Calendrier réaliste : **8 à 10 semaines** si les décisions arrivent dans la semaine.*

### J0 — Décider et mettre en ligne *(semaine 1)*
**Objectif : un lien public que n'importe qui peut ouvrir.**

| Tâche | Qui | Effort |
|---|---|---|
| Valider D1 à D7 | **Vous** | — |
| Vérifier la marque « Openflix » (INPI / EUIPO) | **Vous** (ou conseil) | S |
| Fusionner la PR dans `main` | Moi, sur votre accord | S |
| Créer le compte Render et lancer le déploiement (3 clics) | **Vous** guidé par moi | S |
| Contrôler l'application en ligne (accueil, lecture, installation mobile) | Moi | S |
| Surveillance de disponibilité + alertes d'erreurs | Moi | S |

**Sortie de jalon :** lien HTTPS fonctionnel, surveillance active, accueil vérifié en réel. *(critère 1 en route)*

### J1 — Lecture fiable sur tous les navigateurs *(semaine 2)*
**Objectif : « ça se lit », partout.** C'est le risque n°1 d'une V1 « 100 % fonctionnelle » : aujourd'hui l'application propose des fichiers WebM et OGV que **Safari/iPhone ne lit pas (ou pas toujours, selon la version)**.

| Tâche | Effort |
|---|---|
| **Choisir le format selon le navigateur** (test `canPlayType`), MP4 d'abord pour Safari | M |
| Repli automatique si un fichier échoue (déjà partiel), puis lecteur de la source, puis lien de téléchargement | S |
| **Campagne de lecture** : 200 titres × 5 navigateurs, relevé des échecs, corrections | M |
| Test sur vrais appareils : iPhone, Android, Mac, Windows, navigateur de télévision | **Vous** prêtez les appareils, moi je guide | S |

**Sortie :** lecture réussie ≥ 95 % sur l'échantillon. *(critère 3)*

### J2 — Catalogue fiable et rapide *(semaines 2-3)*
**Objectif : un accueil instantané qui ne dépend plus de l'humeur des API.**

| Tâche | Effort |
|---|---|
| **Cache persistant** (SQLite) des métadonnées + préchauffage nocturne de l'accueil | M |
| Si une source tombe ou limite les requêtes (429) : on sert la dernière version connue | S |
| **Contrôle périodique des liens** : retrait des liens morts, taux suivi | M |
| Alerte quand une rangée devient vide (collection renommée) | S |
| **Sélections éditoriales** (« Le coin du muet », « Nuit noire »…) en fichier modifiable sans code | S |
| Dédoublonnage (même film, plusieurs versions) | S |

**Sortie :** accueil < 2 s (95 %), liens morts < 2 % sur 200 titres. *(critères 2 et 5)*

### J3 — Fonctions manquantes *(semaines 3-5)*
**Objectif : tout ce que promet un service de streaming, en version libre.**

| Fonction | Détail | Effort |
|---|---|---|
| **Sous-titres** | NASA (WebVTT), PeerTube, Internet Archive ; choix de la langue ; réglage de taille | M |
| **Épisodes et saisons** | une série (un item Internet Archive) devient une liste d'épisodes ; « épisode suivant » | M |
| **Page titre dédiée** | lien partageable `/titre/…`, synopsis, licence détaillée avec attribution, titres proches | M |
| **Recherche** | suggestions pendant la frappe, tolérance aux fautes | S |
| **« Voir tout »** par rangée + chargement continu | | S |
| Préférences mémorisées (filtres, qualité, langue des sous-titres) | | S |
| Lecteur : vitesse, picture-in-picture, mémoire du volume | | S |
| Illustrations des états vides et d'erreur | | S |

**Sortie :** toutes les fonctions du périmètre V1 présentes. *(critère 4, côté développement)*

### J4 — Qualité, accessibilité, performance *(semaines 4-6, en parallèle de J3)*
| Tâche | Effort |
|---|---|
| **Tests navigateur en CI** (Playwright) : mes parcours actuels (lecteur sur 5 tailles, détail, PWA, hors ligne, focus) + les nouveautés | M |
| Audit accessibilité : contrastes AA, navigation aux flèches dans les rangées, lecteur d'écran | M |
| Budgets de performance en CI (Lighthouse, poids JavaScript) | S |
| Revue du filtre « grand public » sur 1 000 titres tirés au hasard ; liste évolutive + signalement | S |
| **Test utilisateur** à 5 personnes (parent, ado, cinéphile, senior, utilisateur de TV) | **Vous** recrutez, moi j'analyse | S |

**Sortie :** CI verte avec tests navigateur ; Lighthouse atteint ; 0 contenu inapproprié sur l'échantillon. *(critères 4, 5, 7, 8)*

### J5 — Légal et confiance *(semaines 3-6, en parallèle ; surtout vous)*
| Tâche | Qui | Effort |
|---|---|---|
| Mentions légales, conditions d'utilisation, politique de confidentialité | **Vous** + relecture juridique conseillée ; moi je rédige le brouillon technique | M |
| **Procédure de signalement / retrait** (formulaire + adresse dédiée) et son traitement | Moi (formulaire), **vous** (traitement) | S |
| **Attribution Creative Commons** correcte sur chaque fiche (auteur, source, licence, lien) | Moi | S |
| Lecture des conditions d'usage de chaque source (Internet Archive, Wikimedia, NASA, PeerTube) et mise en conformité | Moi, validation **vous** | S |
| Mesure d'audience respectueuse (sans cookies), formulaire de retour utilisateur | Moi | S |

**Sortie :** pages légales en ligne, signalement testé de bout en bout. *(critère 6)*

### J6 — Bêta fermée puis lancement *(semaines 6-8)*
| Tâche | Qui |
|---|---|
| Bêta à **5-10 testeurs** : parcours guidé, formulaire de retour | **Vous** (recrutement) |
| Correction des retours, **0 bug bloquant** | Moi |
| Positionnement, page d'accueil marketing, captures, kit presse, plan de lancement | **Vous** (votre expertise), moi pour les visuels et les textes de l'interface |
| **Lancement V1.0 web + installable** | ensemble |

**Sortie :** les 9 critères sont vrais → **V1.0**.

### J7 — Applications natives en bêta *(semaines 8-10, après le lancement web)*
| Version | Ce que je prépare | Ce que vous fournissez | Effort |
|---|---|---|---|
| **Android (.apk)** | application Android autour du site, construite automatiquement par GitHub | rien pour l'APK ; **25 $ une fois** pour Google Play plus tard | M |
| **Mac (.dmg) et Windows (.exe)** | application de bureau, construite automatiquement par GitHub | rien pour une bêta (avertissement à l'ouverture) ; **99 $/an** pour la signature Apple plus tard | M |
| **Page de téléchargement** | sur le site | — | S |

Limite honnête : je ne peux pas lancer le Mac ni Windows depuis mon environnement ; je les construis, vous les essayez, je corrige d'après vos retours.

**Sortie :** applications téléchargeables, installables, qui affichent le site et lisent une vidéo.

## 5. Après la V1 (V1.1 et suivantes)
Comptes et synchronisation · profils et contrôle parental · Android TV (navigation à la télécommande complète) · publication sur Play Store / App Store · Chromecast / AirPlay · nouvelles sources (voir `ROADMAP.md` §4.4) · éventuelle plateforme de vidéos IA avec « quality seals » (`BACKLOG.md`).

## 6. Budget indicatif *(à vérifier, les tarifs changent)*

| Poste | Estimation |
|---|---|
| Hébergement (offre payante d'entrée de gamme) | ≈ 7 $/mois |
| Nom de domaine | ≈ 10-15 €/an |
| Mesure d'audience, surveillance, suivi d'erreurs | offres gratuites suffisantes au départ |
| Relecture juridique des pages légales *(recommandée)* | quelques centaines d'euros |
| Dépôt de marque *(recommandé avant communication publique)* | selon le pays et les classes |
| Google Play *(V1.1)* | 25 $, une fois |
| Apple Developer *(signature Mac, App Store, V1.1)* | 99 $/an |

## 7. Risques et parades

| Risque | Gravité | Parade |
|---|---|---|
| **Lecture qui échoue sur Safari/iPhone** (formats) | 🔴 | J1 en priorité, test sur vrais appareils |
| **Une licence mal déclarée** par la personne qui a déposé le fichier | 🔴 | filtre conservateur, bouton de signalement, retrait rapide, mentions claires |
| **Nom proche de « Netflix »** | 🔴 | vérification de marque avant domaine et communication |
| Les API des sources changent ou limitent (429) | 🟠 | cache persistant, alertes, dernière version connue |
| Contenu inapproprié qui passe le filtre | 🟠 | échantillonnage régulier, signalement, liste évolutive |
| Mise en veille de l'hébergement gratuit (premier chargement lent) | 🟡 | offre payante dès la bêta |
| Refus par un magasin d'applications | 🟡 | V1 sans magasin ; licences libres uniquement ; dossier préparé |
| Une seule personne qui maintient le projet | 🟡 | tests automatiques, documentation, CI |

## 7 bis. Prochaine action concrète

1. Vous répondez aux **7 décisions** (même « je prends vos recommandations »).
2. Vous dites **« oui, fusionne »** pour que j'intègre le travail actuel dans `main`.
3. Vous créez le compte Render ; je vous guide pour les 3 clics.
4. Je démarre **J1 (lecture fiable)** et **J2 (catalogue fiable)**, qui sont le cœur de la V1.
