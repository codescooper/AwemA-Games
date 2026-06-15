# AwemA — backend (Railway)

API de **classement mondial** (v1). Zéro dépendance (`node:http` natif), même éthos
léger que les jeux. C'est le premier maillon « en ligne » de la plateforme : le front
statique (GitHub Pages) appelle cette API via la couture `Cloud.*` de `classements.html`.

## Endpoints
| Méthode | Chemin | Rôle | Couture front |
|---|---|---|---|
| `GET` | `/api/health` | état du service | — |
| `POST` | `/api/score` | enregistrer son meilleur score | `Cloud.submit(payload)` |
| `GET` | `/api/leaderboard` | top mondial par Indice | `Cloud.global()` |
| `GET` | `/api/leaderboard?game=KEY` | top d'un jeu | `Cloud.game(key)` |

`POST /api/score` attend `{ uid, name, indice, games: { gameKey: bestScore } }`.
Le serveur conserve le **max** par champ et par `uid`.

## Variables d'environnement
| Var | Défaut | Rôle |
|---|---|---|
| `PORT` | `8090` | fourni automatiquement par Railway |
| `DATA_FILE` | *(vide)* | chemin de persistance JSON ; **régler sur un volume** (ex. `/data/board.json`) pour ne pas perdre le classement au redéploiement |
| `CORS_ORIGINS` | Pages + localhost | origines autorisées, séparées par `,` |

## Déploiement
Depuis ce dossier : `railway up` (le projet Railway est déjà lié).
Pour la persistance : ajouter un **Volume** monté sur `/data` puis `DATA_FILE=/data/board.json`.

## À suivre (hors v1)
- Persistance Postgres (si volume insuffisant) ;
- Anti-triche : recalcul de l'Indice côté serveur, limitation de débit par `uid` ;
- WebSocket : présence/chat du Village + synchro du Miroir (couture `Lobby.*`).
