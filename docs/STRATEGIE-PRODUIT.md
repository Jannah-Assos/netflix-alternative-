# Openflix — découverte, comptes, sécurité, monétisation

*Rédigé le 10/11/2026. Je ne suis pas juriste : tout ce qui touche au droit est signalé « à faire valider ». Les chiffres sur les sources viennent de mesures réelles du jour ; les tarifs et les objectifs sont des ordres de grandeur à vérifier.*

---

## 1. Montrer d'abord ce qui est intéressant

### Ce qu'il faut comprendre
Un « algorithme » n'est pas de l'IA magique. Au départ on n'a **aucun utilisateur, donc aucun historique** : un moteur de recommandation classique n'a rien à apprendre. Ce qui marche vraiment dans cette situation, c'est dans l'ordre : **ne montrer que du bon**, **bien ordonner**, **varier**, **éditorialiser**, et seulement ensuite **personnaliser**.

Aujourd'hui l'accueil montre « ce que la source renvoie par popularité ». C'est le point de départ, pas l'objectif.

### Les 5 couches

| Couche | Principe | Exemple concret |
|---|---|---|
| **0. Garde-fous** | on ne montre jamais un titre qui ne se lit pas, sans affiche, sans licence vérifiée, ou inapproprié | un lien mort ou un format que Safari ne lit pas n'apparaît pas à l'accueil |
| **1. Score d'intérêt** | une note par titre, calculée sans utilisateur (voir ci-dessous) | un film notoire, bien documenté, lisible en HD passe devant une copie obscure |
| **2. Variété et rythme** | on évite 5 Chaplin d'affilée ; on mélange époques, genres, durées ; l'accueil change chaque jour | « graine du jour » + 20 % d'exploration |
| **3. Éditorial** | des humains choisissent : c'est le levier le plus fort avec peu d'utilisateurs | « À l'affiche » de la semaine, « Il y a 100 ans : 1926 », « Nuit d'Halloween », anniversaires de réalisateurs |
| **4. Personnalisation** | dès qu'il y a des signaux : « parce que vous avez regardé X », reprise, goûts par décennie et genre | d'abord **sur l'appareil** (respect de la vie privée), puis synchronisé avec le compte |

### Le score d'intérêt (couche 1) : les signaux gratuits et légaux, mesurés

| Signal | Ce que j'ai mesuré sur les vraies données | Verdict |
|---|---|---|
| **Popularité** (téléchargements) | médiane 374 000 sur les films libres les plus vus | utile mais **biaisée** : « Sex Madness » culmine à 3,7 M de téléchargements |
| **Notoriété** (nombre de versions Wikipédia du film) | « The Pawnshop » de Chaplin : 29 langues ; « Reefer Madness » : 0 | **bon signal**, mais n'existe que pour ~27 % des films populaires (IMDb dans la description ≈ 45 %, retrouvé dans Wikidata ≈ 60 %) ; à élargir par correspondance titre + année |
| **Durée** (`runtime`) | présente pour **80 %** des films populaires | utile pour le score **et pour un filtre durée** (je pensais cette donnée trop rare) |
| **Réalisateur** | 70 % | utile pour « du même réalisateur » |
| **Couleur / noir et blanc**, **muet / parlant** | 97 % | bons filtres, jamais exploités |
| **Description, année** | 97 % / 70 % | complétude de la fiche |
| **Langue** | **seulement 10 %** | ⚠️ voir ci-dessous |

⚠️ **Découverte importante :** la langue n'est renseignée que pour ~10 % des films. Notre filtre « Langue » et la rangée « Cinéma en français » ne voient donc **qu'une minorité** du catalogue. À corriger : détection de la langue d'après le titre et la description, et pour les films connus d'après Wikidata.

### Comment on sait que ça marche
Mesures à suivre dès la mise en ligne : **part des visiteurs qui lancent une lecture depuis l'accueil**, **temps avant la première lecture**, **part des lectures de plus de 5 minutes**, **retour à 7 jours**, **diversité** des titres montrés. Chaque changement d'algorithme est comparé à l'ancien (test A/B).

### Étapes
1. **D1** (quelques jours) : garde-fous + score v1 + variété + rotation quotidienne. Déterministe, testable hors ligne.
2. **D2** : sélections éditoriales dans un fichier modifiable sans code.
3. **D3** : notoriété Wikidata calculée la nuit et mise en cache ; correction de la langue.
4. **D4** : personnalisation sur l'appareil (genres et décennies préférés, « parce que vous avez regardé »).
5. **D5** : avec compte, profil synchronisé ; « populaires chez Openflix cette semaine ».

---

## 2. Comptes avec Supabase (facultatifs, fortement encouragés)

### Principe : « local d'abord, compte ensuite »
Tout marche **sans compte** (liste et reprise sur l'appareil). On propose le compte **au moment où il a de la valeur**, jamais avant : après le premier ajout à « Ma liste » ou la deuxième reprise, « Retrouvez votre liste sur tous vos écrans ». Aucun mur d'inscription.

### Ce que le compte apporte
Synchronisation de Ma liste et de la reprise entre appareils · profils (famille) · préférences · base de la personnalisation (D5) · base de l'offre payante éventuelle.

### Architecture proposée
- **Connexion** : lien magique par e-mail + Google ; Apple si on publie une application iPhone (Apple l'exige quand d'autres connexions sociales sont proposées, à vérifier). Clés d'accès (passkeys) ensuite.
- **Données** : profils, liste, reprise, préférences, signalements. **Chaque table protégée par des règles d'accès par ligne (RLS)** : un utilisateur ne peut lire et écrire que ses lignes.
- **Fusion à la première connexion** : les données locales sont fusionnées avec celles du compte (la plus récente l'emporte).
- **Région UE**, export et suppression du compte en un clic, durée de conservation limitée (RGPD).
- L'application parle à Supabase directement avec la clé publique (et les règles RLS), **la clé secrète n'est jamais dans l'application**.

### Ce que je peux faire et ce que je ne peux pas
- Je rédige le **schéma SQL et les règles RLS**, le code de connexion, la fusion, les tests.
- **Vous** créez le projet Supabase (région UE) et placez l'adresse et la clé publique dans les variables d'environnement de l'hébergement : **ne me les envoyez pas dans la conversation**.
- Si vous connectez le connecteur Supabase à Claude, je pourrai appliquer le schéma moi-même ; sinon je vous donne le SQL à coller.
- Coût : offre gratuite pour démarrer, offre payante (≈ 25 $/mois, à vérifier) pour la production (sauvegardes, pas de mise en veille).

---

## 3. Cybersécurité

### Déjà en place
Garde anti-SSRF sur toutes les requêtes sortantes · limitation de débit par IP · CSP stricte et en-têtes de sécurité · listes blanches sur toutes les valeurs de filtres · iframes en bac à sable · texte jamais interprété comme du HTML · conteneur sans droits administrateur · aucun secret dans le code · tests et CI.

### À faire avant la V1

| Domaine | Action | Priorité |
|---|---|---|
| **Comptes** | RLS auditée table par table · e-mail vérifié · anti-robots (Turnstile ou hCaptcha) à l'inscription · limites par compte · export/suppression · journaux sans données personnelles | 🔴 |
| **Contenu à risque** | la catégorie **« Logiciels & jeux » propose des téléchargements** (zip, exe) déposés par des internautes : **risque de logiciels malveillants pour l'utilisateur**. Pour la V1 : la retirer, ou n'offrir que le lecteur intégré d'Internet Archive, avec avertissement | 🔴 |
| **Lecteurs intégrés** | le repli « lecteur de la source » charge une page tierce (PeerTube : n'importe quelle instance). Limiter à une **liste d'instances connues** | 🟠 |
| **Périmètre** | **Cloudflare** devant l'application (anti-DDoS, pare-feu, anti-robots, mise en cache de l'accueil) · HTTPS imposé (HSTS) | 🟠 |
| **Chaîne d'approvisionnement** | Dependabot, `npm audit` et CodeQL en CI · analyse des secrets (GitHub) · analyse de l'image Docker (Trivy) · image de base figée | 🟠 |
| **Détection et réponse** | suivi d'erreurs (Sentry) · surveillance de disponibilité · alertes · procédure d'incident · **sauvegardes et test de restauration** | 🟠 |
| **Divulgation** | page de contact sécurité (`security.txt`) + procédure de signalement | 🟡 |
| **Vie privée** | les images et vidéos se chargent **directement depuis les sources** : l'adresse IP du visiteur leur est donc visible. À écrire dans la politique de confidentialité ; amélioration possible : passer les vignettes par notre CDN | 🟡 |
| **Vérification externe** | **test d'intrusion** avant l'ouverture publique ; cible : niveau 1 du référentiel OWASP ASVS | 🟡 |

---

## 4. Monétisation et proposition de valeur unique (PVU)

### 4.1 Deux réalités juridiques à connaître avant tout (à faire valider par un juriste)
1. **Le non commercial.** Une partie du catalogue est en Creative Commons « non commercial ». Tirer un revenu d'un service qui met ces œuvres en avant est risqué : en V1, aucune monétisation, et en V1.1 on **sépare ou exclut** ces titres.
2. **« Domaine public » n'est pas le même partout.** Un film peut être dans le domaine public aux États-Unis (où Internet Archive classe beaucoup de films) tout en étant **protégé en France et en Europe** (70 ans après la mort du dernier des coauteurs). La licence affichée est celle déclarée par la personne qui a déposé le fichier, pas un statut par pays. Et en Europe, **renvoyer vers une œuvre non autorisée dans un but lucratif** est plus risqué que le faire gratuitement.

→ Conséquence directe : **la confiance dans les droits n'est pas un détail, c'est le cœur du produit et la condition de toute monétisation.**

### 4.2 La PVU recommandée
> **« Le cinéma libre de droits, vérifié et enfin agréable à regarder. »**

Trois piliers, un par concurrent faible :

| Pilier | Contre quoi | Preuve concrète |
|---|---|---|
| **Confiance** : droits vérifiés | Internet Archive (immense mais brut, droits flous), YouTube (droits incertains) | sceau **« Droits vérifiés France/UE »** sur chaque titre |
| **Découverte** : curation et algorithme | Internet Archive (recherche difficile) | sélections, score d'intérêt, variété (§1) |
| **Confort** : expérience, français, famille | plateformes gratuites financées par la pub (Pluto TV, Tubi) : contenu sous licence commerciale, publicité | sous-titres FR, mode famille, aucune pub |

C'est aussi votre idée de **« quality seals »** : le premier sceau naturel est **« droits vérifiés »**, un deuxième « qualité de lecture » (HD, sous-titres), un troisième « sélection de la rédaction ».

### 4.3 Les modèles, classés
| Modèle | Fit PVU | Risque juridique | Potentiel | Quand |
|---|---|---|---|---|
| **Soutien / dons** (Open Collective, Liberapay) | ★★ | faible | faible | V1 |
| **Openflix+ : abonnement** ≈ 3-5 €/mois : synchro, profils famille, contrôle parental, listes partagées, sous-titres FR améliorés, ciné-club en groupe. On vend le **service**, pas le contenu | ★★★ | moyen (catalogue « droits vérifiés » uniquement) | moyen | V1.1 |
| **B2B éducation et culture** : médiathèques, écoles, cinémathèques, associations : catalogue vérifié, fiches pédagogiques, extraits, accès en marque blanche | ★★★ | faible à moyen | **le plus fort potentiel par client** | V1.1 / V2 |
| **Sponsoring de sélections éditoriales** (une marque présente « Nuit noire », sans publicité intrusive), sur titres sans « non commercial » | ★★ | moyen | faible à moyen | V1.1 |
| **Affiliation** : « si vous avez aimé, voir la version restaurée / le livre / l'offre légale » | ★★ | faible | faible à moyen | V1.1 |
| **Restauration et sous-titres IA vendus** (films 100 % domaine public vérifiés : image restaurée, sous-titres FR) | ★★★ | faible si domaine public réel | fort, mais gros chantier | V2 |
| **Publicité** | ★ (contredit « agréable ») | élevé | faible | **à éviter** |

### 4.4 Économie : très favorable
**On n'héberge ni ne diffuse de vidéo**, donc pas de coût de bande passante. Les coûts sont l'hébergement, la base de comptes et quelques outils : de l'ordre de **40 à 60 €/mois** au départ. Il faut donc **de l'ordre de 15 abonnés** à 4 € pour couvrir les frais fixes (hypothèse à tester). Le vrai coût est **le temps de vérification des droits** : c'est lui qui fait la valeur du sceau.

### 4.5 Valider la PVU avant de construire (à faire en parallèle, sans code)
1. **Page d'attente** (positionnement + liste d'inscription) : mesurer le taux d'inscription.
2. **10 entretiens** (parents, cinéphiles, enseignants, médiathécaires).
3. **« Fausse porte »** : un bouton « Openflix+ » dans la bêta, on mesure les clics.
4. **Enquête de prix** (méthode Van Westendorp) sur 50-100 réponses.
5. **Bêta de 100 personnes** : activation (visite → première lecture), retour à 7 jours, part qui crée un compte, intention de payer.

Votre expertise produit et marketing est **le moteur de cette partie** ; je fournis les maquettes, la mesure et le code.

---

## 5. Ce que cela change dans le plan V1
- **Comptes Supabase facultatifs : dans la V1** (ils étaient en V1.1).
- **Nouveau jalon « Découverte »** (§1, D1 à D3) et **« Comptes »**.
- **Sécurité renforcée** (§3) et **retrait ou encadrement de « Logiciels & jeux »**.
- **Droits par territoire** : le statut « domaine public » affiché doit être prudent pour la France/UE (J5 du plan), avec un premier sceau « droits vérifiés » sur une sélection.
- **Monétisation : aucune en V1**, mais la **PVU est testée** en parallèle (§4.5).
- Délai : **10 à 12 semaines** au lieu de 8 à 10.
