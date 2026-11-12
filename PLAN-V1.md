# Openflix — plan carré vers la V1

*Rédigé le 10/11/2026, mis à jour le même jour (comptes, découverte, sécurité, droits). Complète `ROADMAP.md` (vision et idées) et `docs/STRATEGIE-PRODUIT.md` (algorithme de découverte, comptes, cybersécurité, monétisation) : ici, on tranche, on ordonne et on fixe des critères de réussite vérifiables.*

> **Mise à jour du 12/11/2026 : le principe a changé.** Openflix n'est plus un moteur de recherche sur Internet Archive mais une **cinémathèque vérifiée** : un catalogue fermé de 74 œuvres (`server/src/works.ts`), dont le statut de droits est calculé à partir de données vérifiées, avec une page partageable par film, des séries à épisodes, une recherche maison et un accueil instantané. L'ancienne recherche devient une page « Archive », secondaire et non vérifiée. Cela avance d'un coup les jalons J2 (accueil qui ne dépend plus des sources, recherche à nous), J3 (page par film, épisodes) et J5 (droits). Détail : `README.md` et `docs/DROITS-CATALOGUE.md`.

## 1. Ce que veut dire « V1 100 % fonctionnelle »

> **Une personne qui ne connaît pas le projet ouvre un lien, trouve un film libre de droits, le regarde sans accroc sur son appareil, et peut recommencer demain. Rien de ce que l'application annonce ne ment ni ne plante.**

La V1 est atteinte quand **les 11 critères** ci-dessous sont tous vrais (mesurés, pas ressentis) :

| # | Critère de réussite | Comment on le vérifie |
|---|---|---|
| 1 | L'application est **en ligne en HTTPS**, disponible ≥ 99 % sur 14 jours | surveillance automatique |
| 2 | **Accueil affiché en moins de 2 s** (95 % des cas, cache chaud), même si une source est en panne | mesure automatique |
| 3 | **Lecture réussie ≥ 95 %** sur un échantillon de 200 titres, sur Chrome, Firefox, Safari (Mac et iPhone), Edge, Chrome Android | campagne de test + relevé |
| 4 | **Toutes les fonctions annoncées marchent** : recherche, filtres, fiche titre, lecteur (qualité, reprise, sous-titres, épisodes), Ma liste, FR/EN, installation | tests navigateur automatiques en CI |
| 5 | **100 % des titres affichés ont une licence libre déclarée** ; attribution Creative Commons conforme ; **statut de droits prudent pour la France/UE** ; 0 contenu pour adultes sur 1 000 titres tirés au hasard | audit d'échantillon + avis juridique |
| 6 | **Pages légales en ligne** et procédure de signalement/retrait qui fonctionne | test de bout en bout |
| 7 | **Accessibilité** : contrastes AA, tout utilisable au clavier, aucun défaut bloquant lecteur d'écran | audit + Lighthouse ≥ 95 |
| 8 | **Performance** : Lighthouse mobile ≥ 85, JavaScript < 100 Ko (gzip) | CI |
| 9 | **5 à 10 testeurs réels** ont tout parcouru, 0 bug bloquant ouvert | bêta fermée |
| 10 | **L'accueil montre du bon** : 0 titre illisible, sans affiche ou sans licence ; variété mesurée ; au moins **40 % des visiteurs lancent une lecture depuis l'accueil** *(objectif à calibrer)* | mesure d'audience |
| 11 | **Les comptes sont sûrs** : règles d'accès (RLS) auditées, export et suppression de compte fonctionnels, aucune donnée d'un utilisateur lisible par un autre | audit + tests |

## 2. Périmètre : ce qui est dedans, dehors, plus tard

| Dans la V1 | Reporté (V1.1) | Hors périmètre |
|---|---|---|
| Accueil, Explorer, filtres, recherche avec suggestions | Profils et contrôle parental par code | Héberger des vidéos |
| **Algorithme de découverte v1** (garde-fous, score, variété, sélections éditoriales) | Personnalisation avancée (recommandations avec compte) | Publicité |
| **Page dédiée par titre** (lien partageable) | **Offre payante « Openflix+ »** ; **séries** et **anime** si les critères ci-dessous sont remplis | Contenus dont les droits sont incertains |
| Lecteur : qualité, reprise, **sous-titres**, **épisodes**, plein écran, PiP, raccourcis | Android TV et navigation à la télécommande complète | « Quality seals » IA (voir `BACKLOG.md`) |
| **Comptes facultatifs (Supabase)** : synchro de Ma liste et de la reprise ; tout marche aussi sans compte | Publication sur les magasins (Play Store, App Store) | |
| FR / EN, thèmes clair et sombre, **PWA installable** | Chromecast / AirPlay | |
| **Sceau « droits vérifiés »** sur une première sélection ; filtre « grand public » | Offre B2B éducation et culture | |
| Pages légales, signalement, mesure d'audience respectueuse | Affiliation, sponsoring de sélections | |
| **Sécurité renforcée** (voir J4) | | |
| **Bêtas** : application Android (.apk) et de bureau (Mac, Windows) | | |

### Le catalogue de la V1 : films et animation (mesures du 10/11/2026)

Vous avez demandé de rester sur ce dont on est sûr d'avoir assez d'informations. Voici ce que montrent les mesures sur les 80 titres les plus vus de chaque catégorie :

| Catégorie | Année | Description | Durée | Auteur | Lisible en MP4 | Décision |
|---|---|---|---|---|---|---|
| **Films** (≈ 9 100 titres libres) | 91 % | 93 % | 77 % | 78 % | 29/30 | ✅ **dans la V1** |
| **Animation** (≈ 1 300) | 78 % | 78 % | 56 % | 83 % | 30/30 | ✅ **dans la V1** |
| **Documentaires de guerre** (WWII Archive, 2 840 films) | 98 % | 100 % | 100 % | — | 100 % | ✅ **dans la V1** (11/11/2026, sur demande prioritaire) |
| **Actualités d'époque** (Universal, 611 films) | 100 % | 100 % | 100 % | — | 100 % | ✅ **dans la V1** ; sous-titres automatiques sur 80 % |
| **Séries TV** (≈ 2 500) | **33 %** | **41 %** | **28 %** | **17 %** | 30/30 | ⏸ **hors V1** : fiches trop pauvres et aucune structure saison/épisode |
| **Anime** (≈ 1 700 déclarés libres) | — | — | — | — | — | ⛔ **exclu** : voir ci-dessous |

⛔ **Pourquoi l'anime est exclu.** Dans la collection « anime », **45 des 60 titres les plus vus se déclarent en CC0 ou « domaine public »**, alors que ce sont *Pokémon*, *Digimon*, *Beastars*, *Black Clover*… des œuvres évidemment protégées. La licence déclarée n'y est donc **pas fiable**. Le catalogue est désormais limité à une **liste blanche de collections** (films, film noir, sci-fi et horreur, comédies, courts métrages, films muets, animation) : chercher « pokemon » ne renvoie plus rien.

Hors périmètre aussi, pour l'instant : musique, livres, logiciels, documentaires, archives NASA, vidéos Wikimedia et PeerTube (le code reste, ces sources sont désactivées ; `OPENFLIX_SOURCES` les réactive).

**Critères pour ajouter une catégorie plus tard** (c'est la règle du jeu) :
1. fiches renseignées à **≥ 85 %** (année, description, durée) ;
2. lecture réussie **≥ 95 %** ;
3. **droits vérifiables** (licence fiable, ou liste blanche) ;
4. une **structure adaptée** (épisodes et saisons pour les séries).

Méthode de mesure et résultats détaillés (Prelinger, Periscope, guerres récentes…) : [`docs/METHODE-CATALOGUE.md`](docs/METHODE-CATALOGUE.md). Commande : `npm run survey -- <collection>`.

Pistes pour les **séries** : enrichir les fiches (Wikidata) et regrouper les épisodes ; pour l'**anime** : une liste blanche manuelle de quelques œuvres réellement libres (premiers dessins animés japonais, films Blender…).

> **« Logiciels & jeux » est retiré de la V1** (ou limité au lecteur intégré d'Internet Archive, avec avertissement) : les téléchargements déposés par des internautes exposent les utilisateurs à des logiciels malveillants.

> **Pourquoi pas de monétisation en V1 ?** Une partie du catalogue est en licence Creative Commons **non commerciale**. Tant qu'Openflix n'est pas strictement non commercial ou filtré en conséquence, on ne peut pas y mettre de publicité ni d'abonnement.

## 3. Les 8 décisions à prendre (avec ma recommandation)

| # | Décision | Ma recommandation |
|---|---|---|
| D1 | **Public visé** : usage perso, communauté, grand public ? | grand public francophone, **bêta fermée d'abord** |
| D2 | **Nom** : garder « Openflix » ? (proche de « Netflix ») | **vérifier la disponibilité de la marque AVANT d'acheter un domaine** ; garder 2 noms de secours |
| D3 | **Hébergement** | Render (déjà préparé, le plus simple) ; payant dès la bêta pour éviter la mise en veille. Hostinger (déjà connecté chez vous) possible |
| D4 | **Nom de domaine** (ex. openflix.fr / .app) | à acheter une fois D2 validée |
| D5 | **Comptes en V1 ?** | **Oui, facultatifs** (Supabase, région UE) : « local d'abord, compte ensuite », jamais de mur d'inscription |
| D6 | **Applications natives** | bêtas Android + bureau en V1, **magasins après** la V1 |
| D7 | **Monétisation** | **aucune** en V1 ; on **teste la PVU** en parallèle (`docs/STRATEGIE-PRODUIT.md` §4.5) |
| D8 | **Droits par territoire** : afficher « domaine public » tel que déclaré, ou rester prudent pour la France/UE ? | **prudent** + sceau « droits vérifiés » sur une première sélection ; avis juridique |

## 4. Le plan en 9 jalons

*Effort : S = 1-2 jours · M = 3-5 jours · L = 1-2 semaines (travail effectif, hors attente de décisions). Calendrier réaliste : **10 à 12 semaines** si les décisions arrivent dans la semaine.*

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
| **Recherche** | **moteur de recherche à nous** sur le cache du jalon J2 (le classement d'Internet Archive est bruité : « Night of the Living Dead » renvoie d'abord un film sur les camps nazis) ; suggestions pendant la frappe ; tolérance aux fautes | M |
| **« Voir tout »** par rangée + chargement continu | | S |
| Préférences mémorisées (filtres, qualité, langue des sous-titres) | | S |
| Lecteur : vitesse, picture-in-picture, mémoire du volume | | S |
| Illustrations des états vides et d'erreur | | S |

**Sortie :** toutes les fonctions du périmètre V1 présentes. *(critère 4, côté développement)*

### J3b — Découverte : montrer d'abord ce qui est intéressant *(semaines 3-5)*
Détail et mesures dans `docs/STRATEGIE-PRODUIT.md` §1.

| Tâche | Effort |
|---|---|
| **Garde-fous** : ne montrer que des titres lisibles (lien vivant, format compatible), avec affiche et licence vérifiée | S |
| **Score d'intérêt v1** : popularité (log), complétude de la fiche, durée, qualité de lecture, notoriété | M |
| **Variété et rythme** : re-classement pour éviter les répétitions, rotation quotidienne, 20 % d'exploration | S |
| **Sélections éditoriales** dans un fichier modifiable sans code (« À l'affiche », « Il y a 100 ans », thèmes de saison) | S |
| **Notoriété Wikidata** calculée la nuit et mise en cache | M |
| **Langue du contenu** : détection d'après titre et description (aujourd'hui seulement 10 % des films sont renseignés) | M |
| **Filtres nouveaux** : durée (`runtime`, 80 % de couverture), couleur / noir et blanc, muet / parlant | S |
| Mesure : lancement de lecture depuis l'accueil, temps avant la première lecture, retour à 7 jours | S |

**Sortie :** critère 10. L'accueil est comparé à l'ancien sur les mêmes visiteurs (test A/B).

### J3c — Comptes facultatifs avec Supabase *(semaines 4-6)*
| Tâche | Qui | Effort |
|---|---|---|
| Créer le projet Supabase (région UE), poser les variables d'environnement | **Vous** | S |
| **Schéma SQL et règles RLS** (profils, liste, reprise, préférences) ; tests | Moi | M |
| Connexion (lien magique + Google), **fusion des données locales** à la première connexion | Moi | M |
| Invitation à créer un compte **au bon moment** (pas de mur), écran Compte (export, suppression) | Moi | S |
| Anti-robots à l'inscription, limites par compte | Moi | S |

**Sortie :** critère 11. Tout continue de marcher sans compte.

### J4 — Qualité, accessibilité, performance, sécurité *(semaines 4-8, en parallèle)*
| Tâche | Effort |
|---|---|
| **Tests navigateur en CI** (Playwright) : mes parcours actuels (lecteur sur 5 tailles, détail, PWA, hors ligne, focus) + les nouveautés | M |
| Audit accessibilité : contrastes AA, navigation aux flèches dans les rangées, lecteur d'écran | M |
| Budgets de performance en CI (Lighthouse, poids JavaScript) | S |
| **Sécurité renforcée** (`docs/STRATEGIE-PRODUIT.md` §3) : Dependabot, `npm audit`, CodeQL, analyse de l'image Docker, Cloudflare + HSTS, liste d'instances autorisées pour les lecteurs intégrés, suivi d'erreurs, sauvegardes avec test de restauration, `security.txt` | M |
| **Retrait de « Logiciels & jeux »** (ou lecteur intégré seul + avertissement) | S |
| **Test d'intrusion** avant l'ouverture publique | **Vous** (prestataire), moi je corrige | M |
| Revue du filtre « grand public » sur 1 000 titres tirés au hasard ; liste évolutive + signalement | S |
| **Test utilisateur** à 5 personnes (parent, ado, cinéphile, senior, utilisateur de TV) | **Vous** recrutez, moi j'analyse | S |

**Sortie :** CI verte avec tests navigateur ; Lighthouse atteint ; 0 contenu inapproprié sur l'échantillon. *(critères 4, 5, 7, 8)*

### J5 — Légal, droits et confiance *(semaines 3-8, en parallèle ; surtout vous)*
| Tâche | Qui | Effort |
|---|---|---|
| Mentions légales, conditions d'utilisation, politique de confidentialité | **Vous** + relecture juridique conseillée ; moi je rédige le brouillon technique | M |
| **Procédure de signalement / retrait** (formulaire + adresse dédiée) et son traitement | Moi (formulaire), **vous** (traitement) | S |
| **Attribution Creative Commons** correcte sur chaque fiche (auteur, source, licence, lien) | Moi | S |
| **Droits par territoire** : « domaine public aux États-Unis » ≠ « domaine public en France/UE » ; libellé prudent, sceau **« droits vérifiés »** sur une première sélection (règles de vérification à fixer avec un juriste). Base de travail : [`docs/DROITS-CATALOGUE.md`](docs/DROITS-CATALOGUE.md) (catégories A/B/C) | **Vous** + juriste, moi l'outillage | M |
| Lecture des conditions d'usage de chaque source (Internet Archive, Wikimedia, NASA, PeerTube) et mise en conformité | Moi, validation **vous** | S |
| Mesure d'audience respectueuse (sans cookies), formulaire de retour utilisateur | Moi | S |

**Sortie :** pages légales en ligne, signalement testé de bout en bout. *(critère 6)*

### J6 — Bêta fermée puis lancement *(semaines 8-10)*
| Tâche | Qui |
|---|---|
| Bêta à **5-10 testeurs** : parcours guidé, formulaire de retour | **Vous** (recrutement) |
| Correction des retours, **0 bug bloquant** | Moi |
| Positionnement, page d'accueil marketing, captures, kit presse, plan de lancement | **Vous** (votre expertise), moi pour les visuels et les textes de l'interface |
| **Lancement V1.0 web + installable** | ensemble |

**Sortie :** les 9 critères sont vrais → **V1.0**.

### J7 — Applications natives en bêta *(semaines 10-12, après le lancement web)*
| Version | Ce que je prépare | Ce que vous fournissez | Effort |
|---|---|---|---|
| **Android (.apk)** | application Android autour du site, construite automatiquement par GitHub | rien pour l'APK ; **25 $ une fois** pour Google Play plus tard | M |
| **Mac (.dmg) et Windows (.exe)** | application de bureau, construite automatiquement par GitHub | rien pour une bêta (avertissement à l'ouverture) ; **99 $/an** pour la signature Apple plus tard | M |
| **Page de téléchargement** | sur le site | — | S |

Limite honnête : je ne peux pas lancer le Mac ni Windows depuis mon environnement ; je les construis, vous les essayez, je corrige d'après vos retours.

**Sortie :** applications téléchargeables, installables, qui affichent le site et lisent une vidéo.

## 5. Après la V1 (V1.1 et suivantes)
Profils et contrôle parental · offre « Openflix+ » et autres modèles (`docs/STRATEGIE-PRODUIT.md` §4) · personnalisation avancée · Android TV (navigation à la télécommande complète) · publication sur Play Store / App Store · Chromecast / AirPlay · nouvelles sources (voir `ROADMAP.md` §4.4) · éventuelle plateforme de vidéos IA avec « quality seals » (`BACKLOG.md`).

## 6. Budget indicatif *(à vérifier, les tarifs changent)*

| Poste | Estimation |
|---|---|
| Hébergement (offre payante d'entrée de gamme) | ≈ 7 $/mois |
| Nom de domaine | ≈ 10-15 €/an |
| Mesure d'audience, surveillance, suivi d'erreurs, Cloudflare | offres gratuites suffisantes au départ |
| Base de comptes (Supabase, offre de production) | ≈ 25 $/mois *(l'offre gratuite suffit pour la bêta ; à vérifier)* |
| Test d'intrusion avant l'ouverture publique | quelques centaines à quelques milliers d'euros selon le prestataire |
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
| **Licence déclarée non fiable** : des déposants attribuent CC0 à des œuvres protégées (45 titres sur 60 dans la collection anime) | 🔴 | liste blanche de collections (faite), sceau « droits vérifiés », signalement, revue d'échantillons |
| **« Domaine public » aux États-Unis mais protégé en France/UE** | 🔴 | libellé prudent, sceau « droits vérifiés », avis juridique, retrait rapide |
| **Logiciels malveillants** via les téléchargements de « Logiciels & jeux » | 🔴 | retrait de la catégorie en V1 |
| **Fuite de données de comptes** | 🔴 | RLS auditée, clé secrète jamais dans l'application, test d'intrusion |
| Les API des sources changent ou limitent (429) | 🟠 | cache persistant, alertes, dernière version connue |
| Contenu inapproprié qui passe le filtre | 🟠 | échantillonnage régulier, signalement, liste évolutive |
| Mise en veille de l'hébergement gratuit (premier chargement lent) | 🟡 | offre payante dès la bêta |
| Refus par un magasin d'applications | 🟡 | V1 sans magasin ; licences libres uniquement ; dossier préparé |
| Une seule personne qui maintient le projet | 🟡 | tests automatiques, documentation, CI |

## 7 bis. Prochaine action concrète

1. Vous répondez aux **8 décisions** (même « je prends vos recommandations »).
2. Vous dites **« oui, fusionne »** pour que j'intègre le travail actuel dans `main`.
3. Vous créez le compte Render ; je vous guide pour les 3 clics.
4. Je démarre **J1 (lecture fiable)**, **J2 (catalogue fiable)** et **J3b (découverte)**, qui sont le cœur de la V1.
5. En parallèle, **vous** lancez la validation de la PVU (`docs/STRATEGIE-PRODUIT.md` §4.5), la vérification de la marque et la prise de contact avec un juriste (droits par territoire).
6. Quand vous êtes prêt pour les comptes : vous créez le projet Supabase (région UE) ; **ne m'envoyez jamais les clés dans la conversation**, on les place ensemble dans les variables d'environnement.
