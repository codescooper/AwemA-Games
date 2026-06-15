# AwemA — backend (Railway)

Back-end « en ligne » de la plateforme (hébergé sur Railway) : **API de classement
mondial** (HTTP) + **présence/chat temps réel du Village** (WebSocket), sur le même
service/port. Le front statique (GitHub Pages) l'appelle via `Cloud.*` (`classements.html`)
et un client WebSocket (`monde.html`). Une seule dépendance runtime : `ws`.

## Endpoints
| Méthode | Chemin | Rôle | Couture front |
|---|---|---|---|
| `GET` | `/api/health` | état du service | — |
| `POST` | `/api/score` | enregistrer son meilleur score | `Cloud.submit(payload)` |
| `GET` | `/api/leaderboard` | top mondial par Indice | `Cloud.global()` |
| `GET` | `/api/leaderboard?game=KEY` | top d'un jeu | `Cloud.game(key)` |

`POST /api/score` attend `{ uid, name, indice, games: { gameKey: bestScore } }`.
Le serveur conserve le **max** par champ et par `uid`.

## Temps réel — WebSocket (`/ws`)
Présence + chat du Village. Protocole compact (clés courtes → egress minimal) :
- **client → serveur** : `{t:"hi",n}` hello · `{t:"m",x,y,d}` move · `{t:"c",m}` chat
- **serveur → client** : `{t:"w",you,peers}` welcome+roster · `{t:"j",id,n,x,y,d}` join · `{t:"m",id,x,y,d}` · `{t:"c",id,n,m}` · `{t:"l",id}` leave

État volatile (aucune persistance). Anti-spam (1 msg/600 ms), heartbeat 30 s, contrôle
d'origine, plafond 200 connexions. `monde.html` retombe sur les bots si le serveur est injoignable.

## Variables d'environnement
| Var | Défaut | Rôle |
|---|---|---|
| `PORT` | `8090` | fourni automatiquement par Railway |
| `DATA_FILE` | *(vide)* | chemin de persistance JSON ; **régler sur un volume** (ex. `/data/board.json`) pour ne pas perdre le classement au redéploiement |
| `CORS_ORIGINS` | Pages + localhost | origines autorisées, séparées par `,` |

## Déploiement
Depuis ce dossier : `railway up` (le projet Railway est déjà lié).
Pour la persistance : ajouter un **Volume** monté sur `/data` puis `DATA_FILE=/data/board.json`.

## À suivre
- **La poisse en jeu multijoueur arbitré** (le serveur décide qui est « chat ») → base anti-triche ;
- Synchro du Miroir (vidéo à la seconde) + votes des Doléances partagés ;
- Modération du chat live (signalement) ; anti-triche classement (recalcul de l'Indice côté serveur) ;
- Persistance Postgres si le volume devient insuffisant.
