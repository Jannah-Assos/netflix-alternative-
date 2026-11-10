# Qu'est-ce qu'on héberge ?

*Réponse courte : **ni vidéo, ni catalogue.** Tout vient des sources par appels d'API. Ce qu'on héberge, c'est le site et un petit serveur qui fait le tri.*

## Qui parle à qui

```
   Vous (navigateur)
     │
     ├──①──► Openflix (notre site + notre petit serveur)
     │          ├─ envoie la page et l'interface
     │          └─ interroge Internet Archive POUR vous, choisit le bon fichier,
     │             écarte ce qui est inapproprié, garde le résultat en mémoire
     │
     └──②──► Internet Archive (directement)
                └─ envoie les affiches et les vidéos
```

| Flux | Poids | Qui paie la bande passante |
|---|---|---|
| ① Page, interface, listes de titres (quelques Ko) | très léger | nous, mais c'est négligeable |
| ② **Vidéos et affiches** (des centaines de Mo par film) | **très lourd** | **la source** (Internet Archive), jamais nous |

C'est pour cela que le coût d'Openflix est si bas : **la partie chère d'un service de streaming (diffuser la vidéo) n'est pas la nôtre.**

## Ce qu'on héberge vraiment

| Élément | Rôle | Aujourd'hui |
|---|---|---|
| **Le site** (fichiers de l'interface) | ce que vous voyez | oui |
| **Le serveur Openflix** (petit programme) | cherche chez Internet Archive, choisit le meilleur lien, filtre, protège contre les abus, garde en mémoire | oui |
| Mémoire persistante du catalogue (SQLite) | accueil instantané, moins d'appels | prévu (J2) |
| **Base de comptes** (Supabase) | listes et reprise synchronisées | prévu (J3c), hébergée par Supabase |

## Pourquoi un serveur, si tout passe par des API ?
Techniquement **le navigateur pourrait appeler Internet Archive lui-même** : j'ai vérifié, les quatre sources l'autorisent. Le serveur apporte pourtant des choses utiles :

- **Le tri** : choisir le meilleur fichier (format, qualité, taille), écarter le contenu inapproprié, appliquer la liste blanche de collections.
- **La mémoire** : ne pas redemander la même chose 1 000 fois (et éviter les « 429 », refus pour trop de requêtes).
- **La protection** : limitation de débit, politique de sécurité, filtrage des adresses dangereuses.
- **L'algorithme de découverte** : calculer l'accueil à l'avance, pas dans chaque navigateur.
- **La mesure** : savoir ce qui est regardé, pour l'améliorer.

## Les trois façons de l'héberger

| | A. Un serveur *(aujourd'hui)* | B. 100 % navigateur | C. Hybride *(cible)* |
|---|---|---|---|
| Principe | un conteneur fait tout | site statique, le navigateur appelle les sources | site statique + **catalogue précalculé la nuit** (un fichier) + appels directs pour la recherche |
| Hébergement | Render (≈ 7 $/mois, à vérifier) | gratuit (Netlify, GitHub Pages) | gratuit à quelques $ |
| Facilité | **prêt** (`render.yaml`) | simple | demande le travail du jalon J2 |
| Tri et filtre « grand public » | **imposés côté serveur** | contournables par un utilisateur averti | imposés à la fabrication du catalogue |
| Accueil rapide | oui avec la mémoire | dépend des sources | **instantané** (un fichier) |
| Algorithme de découverte, tests A/B | oui | difficile | oui |
| Risque de refus (429) | partagé sur une adresse | **réparti** entre les visiteurs | faible |
| Si l'hébergeur tombe | tout tombe | rien ne tombe | le site reste, la recherche dépend des sources |

**Recommandation :** **A pour la V1** (prête, rien à construire), puis **C** quand la mémoire persistante et le catalogue précalculé du jalon J2 existent : on obtient le meilleur des deux, pour presque rien.
