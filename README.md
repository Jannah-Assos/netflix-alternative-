# Open Media Scanner

Un outil qui **scanne les bases de données libres** (Internet Archive et sources du même style), **trouve le meilleur lien direct** de chaque contenu et le présente dans une interface claire.

> Il ne copie ni n'héberge aucun fichier : il trouve où ils sont, choisit le bon fichier, vérifie que le lien répond, et affiche la licence.

## Sources

| Source | Contenu | Licence affichée |
|---|---|---|
| **Internet Archive** | vidéos, audio, logiciels/jeux, livres | selon l'item (`licenseurl`) ; sinon « à vérifier » |
| **Wikimedia Commons** | vidéos, audio | licence déclarée par fichier (CC, domaine public…) |
| **NASA Image and Video Library** | vidéos, audio | domaine public (NASA) |
| **PeerTube** (via SepiaSearch) | vidéos | uniquement les vidéos avec une licence CC / CC0 déclarée |

Ajouter une source = un fichier dans `server/src/sources/` qui implémente `search()` et `resolve()` (voir `sources/types.ts`).

## Ce que fait le « scan »

1. **Recherche** en parallèle sur toutes les sources cochées. Une source en panne ou lente (15 s max) n'empêche pas les autres de répondre, et son erreur est affichée.
2. **Résolution** d'un item : on lit la liste de ses fichiers et on les classe.
   - vidéo : MP4/h.264 (lisible partout) > WebM > OGV > MKV/AVI… ; meilleure résolution ; les versions « 512Kb », les fichiers vides, vignettes et métadonnées sont écartés ;
   - audio : MP3 > M4A/OGG > FLAC > WAV ; logiciels : ZIP en premier ; livres : PDF > EPUB.
3. **Vérification** du meilleur lien (requête `HEAD`) : « En ligne », « Hors ligne » ou « Non vérifié ».
4. **Licence** classée en domaine public / Creative Commons / CC non commercial / droits réservés / inconnue. Le filtre « libres vérifiées seulement » ne garde que les licences déclarées libres par la source.

## Démarrage

Prérequis : Node.js 20+.

```bash
npm install
npm run dev          # API sur :8787, interface sur http://localhost:5173
```

Mode « production » (une seule URL) :

```bash
npm run build
npm start            # http://127.0.0.1:8787 sert l'API et l'interface
```

Variables : `PORT` (défaut 8787), `HOST` (défaut `127.0.0.1` : l'outil n'a ni authentification ni limitation de débit, ne l'exposez pas sur internet tel quel).
Derrière un proxy d'entreprise, lancez avec `NODE_USE_ENV_PROXY=1`.

### En ligne de commande

```bash
npm run scan -- "nosferatu" --kind video --resolve
npm run scan -- "apollo 11" --source nasa --free -n 5
```

### Vérifier les sources en réel

Les tests unitaires utilisent des réponses d'API reconstituées d'après leur documentation. Pour confirmer que les formats n'ont pas changé, depuis une machine connectée à internet :

```bash
npm run smoke
```

Il interroge chaque source, résout le premier résultat et vérifie son lien.

## API

| Route | Rôle |
|---|---|
| `GET /api/sources` | liste des sources |
| `GET /api/search?q=&kinds=video,audio&sources=internet-archive,nasa&freeOnly=1&page=1&limit=24` | scan (résultats entrelacés + état de chaque source) |
| `GET /api/resolve?uid=<source:id>&kind=video[&check=0]` | meilleurs liens d'un item + vérification |

## Structure

```
server/   Fastify + TypeScript : sources, classement des liens, licences, API, CLI
web/      React + Vite : recherche, filtres, résultats, panneau de liens, lecteur
```

```bash
npm test             # tests (serveur)
npm run typecheck
```

## Sécurité

Les URL de fichiers viennent de tiers (ex. instances PeerTube). Toute requête sortante passe par `server/src/http.ts` : http(s) uniquement, ports standards, hôtes publics seulement (les adresses privées, loopback et link-local sont refusées, y compris après résolution DNS et à chaque redirection).

## Droits d'auteur

Les contenus appartiennent à leurs auteurs et restent hébergés par leurs sources. Une licence « à vérifier » signifie que la source n'en déclare pas : vérifiez les droits avant de réutiliser un contenu. Les jeux « abandonware » restent protégés par le droit d'auteur : seuls les jeux et logiciels que la source déclare libres sont affichés comme tels.

## Suite prévue

Application Android / Android TV (navigation à la télécommande), profils et favoris, liens de sous-titres.
