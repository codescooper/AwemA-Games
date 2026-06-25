# Funnel & rétention PostHog — AwemA

Objectif : **arrêter de décider à l'aveugle**. Quels jeux sont ouverts, finis, et fait-on **revenir** les joueurs.
Analytics câblé via `engine/shared/analytics.js` (PostHog EU, fail-safe) + le wrapper `AWEMA.track(name, props)`.

## Événements
| Événement | Où | Propriétés | Statut |
|-----------|----|------------|--------|
| `$pageview` | autocapture (toutes pages) | `page` (nom de page/jeu, enregistré par analytics.js) | ✅ actif |
| `cabinet_open` | cabinet (`index.html`) au chargement | `games`, `indice` | ✅ actif |
| `game_open` | clic sur une carte du cabinet | `game`, `category`, `mp` | ✅ actif |
| `game_finished` | fin de partie, via `AWEMA.finish(gameId, score)` | `game`, `score` | ⏳ à adopter par jeu (*good first issue*) |
| `duel_start` / `duel_matched` | jeux en duel | — | ✅ partiel (déjà dans certains jeux) |
| `village_joined`, `doleance_add/vote`, `lignees_create/join` | sociaux | — | ✅ actifs |

**Adopter `game_finished`** (tâche idéale pour un contributeur) : à l'écran de fin de chaque jeu, appeler
`AWEMA.finish("<id>", score)` (id = celui du catalogue). Rend le funnel « ouvert → fini » comparable entre jeux.

## Insights à créer dans PostHog (dashboard « AwemA — Produit »)
1. **Funnel d'engagement** — étapes `cabinet_open` → `game_open` → `game_finished`. Breakdown par `game` puis par `category`.
   *Lecture :* où on décroche, et quels jeux convertissent le mieux (→ lesquels approfondir).
2. **Rétention J1 / J7** — *Retention insight* sur `$pageview` (ou `cabinet_open`), « performed event » → « came back ».
   *C'est le North Star* : revient-on le lendemain / la semaine ?
3. **Trends — popularité** — `game_open` (total), breakdown par `game` et par `category`.
   *Lecture :* le top/flop du catalogue → confirmer/couper, prioriser la profondeur.
4. **Trends — duels** — `duel_start` vs `duel_matched` : taux d'appariement (assez de monde en ligne ?).
5. **Web analytics** — pages vues, appareils, pays (déjà fourni par PostHog).

## Créer le dashboard
- **Auto (recommandé)** : une fois le **MCP PostHog reconnecté** (connecteur claude.ai → réautoriser, puis redémarrer Claude Code), demander : « crée le dashboard *AwemA — Produit* avec ces 5 insights ». Je peux le générer via le MCP (`dashboard-create` + `insight-create`).
- **À la main** : PostHog → *New insight* pour chacun ci-dessus → *Add to dashboard*.

> Confidentialité : on n'envoie pas le pseudo (PII) dans les events ; l'`uid` anonyme suffit. Région EU, pas de session replay.
