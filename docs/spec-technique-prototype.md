# « Lignées » — Spécification technique du prototype

**But :** document que tu peux donner à toi-même + un assistant IA de code (ou à un dev) pour **commencer à coder sans flou**. Cible : le prototype de « la graine » (cf. `mvp-lignees-graine.md` et `boucle-quotidienne-maquette.md`). Principe directeur : **tout est déterministe et asynchrone ; le "serveur" = un job planifié 1×/jour.**

---

## 0. Stack & prérequis (à avoir côté toi)

- **Frontend :** SvelteKit (PWA) — *ou* vanilla JS si tu préfères ultra-simple. Service worker pour l'offline.
- **Backend/BDD :** **Supabase** (Postgres + Auth + Edge Functions + `pg_cron`).
- **Moteur de jeu :** un module TypeScript **partagé** (`/engine`) exécuté dans une Edge Function (la résolution).
- **Hébergement PWA :** Cloudflare Pages ou Vercel.
- **Outils :** compte GitHub, projet Supabase (free), un assistant IA de code (Cursor / Claude Code), Node 20+.
- ⚠️ **Prérequis non-technique :** le **test papier** (Phase 0) doit valider la boucle *avant* d'investir dans le code. Le spec ci-dessous sera vrai quand tu coderas — il n'y a pas d'urgence à coder avant le test.

---

## 0.5 Décisions d'architecture figées (ADR)

**ADR-1 — Local-first, puis mince serveur autoritaire. PAS de P2P.**
- **Prototype :** 100 % local (navigateur, IndexedDB, solo vs factions IA), 0 backend.
- **Multijoueur :** client PWA offline-capable + **mince serveur async always-on** qui détient la vérité et lance le tick. Le moteur (`resolveTick`, module **pur**) y migre **sans réécriture**.
- **P2P rejeté :** incompatible avec l'async (personne en ligne à l'heure du tick), triche/autorité, pas de persistance durable (= ton fossé), coût des relais TURN sur NAT mobile. **Pas de CRDT** pour l'état de jeu (un conflit compétitif se tranche par résolution déterministe, pas par fusion automatique).

**ADR-2 — Frugalité des ressources = contrainte de 1er ordre (contexte africain).**

| Ressource | Budget cible | Pourquoi |
|---|---|---|
| 1er chargement (app shell, compressé) | **< 150 Ko** (viser ~100) | coût de la data |
| App totale en cache | **< 1 Mo** | stockage limité |
| Data par session quotidienne | **< 30 Ko** (deltas seulement) | data chère/métrée |
| RAM | fluide sur **Android 2 Go**, vieux WebView | parc réel |
| Offline | **app ouvrable + jouable hors-ligne** (ordres en file, sync au retour) | connectivité intermittente |
| Réseau/batterie | **aucun polling, aucun websocket, aucun GPS** | autonomie + data |

**Choix techniques imposés par ce budget :**
- **Svelte/SvelteKit** (compile, runtime ≈ 0) *ou* vanilla JS. ❌ **Interdits :** React + grosses deps, Unity/Phaser/WebGL, gros bundles.
- **UI texte/2D, DOM léger.** Graphismes en **SVG/CSS** (sigles, carte). Pas d'images raster (sinon AVIF/WebP basse déf, cachées à vie).
- **Polices système** (0 webfont). Icônes en **SVG inline** (pas de librairie d'icônes).
- **Service worker** : cache du shell → ouverture instantanée **sans re-téléchargement** (économise la data + marche sur réseau instable).
- **Sync = deltas JSON minimes** depuis le dernier tick, compressés. **Pas de realtime.**
- **Notifications via la plateforme** (Web Push / Telegram), jamais par polling applicatif.
- **0 SDK analytics lourd** (data + vie privée).

> **Point clé :** ton archi async + local-first **est déjà la plus frugale possible.** La contrainte africaine et le design se renforcent — comme le thème et les mécaniques.

---

## 1. Schéma de données (Postgres)

```sql
-- Joueurs (liés à Supabase auth)
players(id uuid pk, auth_id uuid unique, display_name text, created_at timestamptz)

-- Un "monde" = une saison jouable
worlds(id uuid pk, name text, status text check in('forming','active','ended'),
       season_number int, current_tick int default 0,
       resolve_hour_utc int, created_at timestamptz, ends_at timestamptz)

-- Maisons (player_id NULL = faction IA)
houses(id uuid pk, world_id uuid fk, player_id uuid fk null, name text, sigil text,
       gold int, grain int, soldiers int, prestige int default 0,
       reputation int default 50, is_ai bool default false, alive bool default true)

-- Lieux de la carte
holdings(id uuid pk, world_id uuid fk, name text, type text check in('city','oasis','port'),
         base_income_gold int, base_income_grain int,
         owner_house_id uuid fk null, fortification int default 0)

-- Graphe de la carte (adjacence non orientée)
holding_edges(world_id uuid fk, a uuid fk, b uuid fk, primary key(world_id,a,b))

-- Ordres du jour (max 3 / maison / tick)
orders(id uuid pk, world_id uuid fk, tick int, house_id uuid fk, slot int check in(0,1,2),
       type text check in('DEV','LEVEE','CARAVANE','MARCHE','FORTIFIE','EMISSAIRE'),
       params jsonb, status text default 'pending', -- pending|resolved|invalid
       unique(world_id,tick,house_id,slot))

-- Choix d'événement du jour
event_choices(world_id uuid fk, tick int, house_id uuid fk, choice text,
              primary key(world_id,tick,house_id))

-- Traités (proposition asynchrone)
treaties(id uuid pk, world_id uuid fk, house_a uuid fk, house_b uuid fk,
         type text check in('non_aggression','mutual_defense','trade_pact'),
         status text check in('proposed','active','broken'), proposed_by uuid fk, since_tick int)

-- Alliances
alliances(id uuid pk, world_id uuid fk, name text, objective_holding_id uuid fk null)
alliance_members(alliance_id uuid fk, house_id uuid fk, primary key(alliance_id,house_id))

-- Messages (diplomatie + chat d'alliance)
messages(id uuid pk, world_id uuid fk, tick int, from_house uuid fk,
         to_house uuid fk null, alliance_id uuid fk null, body text)

-- Briefings du matin (généré par le tick) + chronique de saison
briefings(world_id uuid fk, tick int, house_id uuid fk, body jsonb, primary key(world_id,tick,house_id))
chronicle(id uuid pk, world_id uuid fk, tick int, entry text, public bool default true)
```

Index clés : `orders(world_id,tick)`, `houses(world_id)`, `holdings(world_id)`.

---

## 2. Constantes de balance (source unique — un seul fichier `config.ts`)

| Constante | Valeur (prototype) |
|---|---|
| Départ : gold / grain / soldiers | 100 / 100 / 50 |
| Revenu cité / oasis / port | +20 or / +20 grain / (+15 or,+10 grain) |
| DEV : coût → effet | 40 or → +5 au revenu du lieu |
| LEVEE : coût par guerrier | 1 grain + 1 or (max = grain dispo) |
| CARAVANE : profit route sûre | +50 % de l'or envoyé |
| FORTIFIE : coût → effet | 40 or → +1 niveau (mult. défense +0,25/niv) |
| Combat : pertes vainqueur / perdant | 30 % / 80 % des guerriers engagés |
| Renfort défense mutuelle | +25 % des guerriers d'un allié adjacent |
| EMISSAIRE rupture de traité | −10 réputation, annonce publique |
| Prestige | lieux×10 + profit_net÷10 + traités_honorés×5 + défenses_gagnées×8 + palier_réputation |

---

## 3. Le moteur de résolution (« le tick ») — pseudocode

**Déclencheur :** `pg_cron` (ou cron externe → Edge Function) 1×/jour à `resolve_hour_utc`.
**Garanties :** déterministe (aucun aléatoire), **idempotent** (lock + vérif `current_tick`).

```
function resolveTick(world):
  acquire advisory lock(world.id)        // empêche double exécution
  if world.status != 'active': return
  T = world.current_tick

  // 0. Les factions IA posent leurs ordres pour ce tick (cf. §5)
  generateAIOrders(world, T)

  load houses, holdings, edges, orders(T), event_choices(T)
  validateOrders(orders)                 // cf. §4 ; invalides -> status='invalid', ignorés

  // 1. Revenus
  for h in holdings where owner: owner.gold += income_gold; owner.grain += income_grain

  // 2. Événement du jour (effet agrégé, cf. table d'événements)
  applyEventAggregate(event_choices)

  // 3. Caravanes (déterministe : pas de hasard)
  for o in orders type CARAVANE:
     path = shortestPath(edges, o.house.mainHolding, o.params.dest)
     if any holding on path owned by a NON-traité house with soldiers>0:
        intercept: that owner.gold += o.params.gold      // saisie
     else: o.house.gold += round(o.params.gold * 1.5)

  // 4. Combats : regrouper les MARCHE par lieu cible
  for target in holdings attacked:
     attackPool = sum(soldiers of all MARCHE on target)   // simplification v1
     defense = target.soldiers*(1+0.25*target.fortif) + mutualDefenseReinforcements(target)
     if attackPool > defense:                              // égalité => défenseur gagne
        target.soldiers = 0 ; attackers lose 30% ; if target.soldiers==0: capture by biggest attacker
     else:
        attackers lose 80% ; defender loses 30%
     log to chronicle + briefings

  // 5. Développement / Levée / Fortification
  applyEconomyOrders(orders)

  // 6. Traités : activer les acceptés ; rupture -> broken, -10 rép, chronique publique
  updateTreaties(orders)

  // 7. Prestige + réputation (recalcul complet)
  recomputeStandings(houses)

  // 8. Briefings du matin + entrées de chronique
  for h in houses: briefings[T+1][h] = buildBriefing(h, events of this tick)

  world.current_tick = T+1
  if winConditionMet(world) or now>=world.ends_at: endSeason(world)   // cf. §6
  release lock ; commit
```

---

## 4. Validation des ordres

Vérifiée **à la soumission** ET **re-vérifiée à la résolution** (l'état a pu changer). Un ordre invalide à la résolution → `status='invalid'`, ignoré.

- Max 3 ordres/maison/tick, slots distincts (0,1,2).
- Pas de dépense supérieure aux ressources (or/grain).
- `LEVEE n` : `n ≤ grain` de la maison.
- `MARCHE n vers X` : X **adjacent** à un lieu de la maison ; `n ≤ soldiers` présents au lieu source.
- `CARAVANE or vers X` : `or ≤ gold` ; X existe.
- `EMISSAIRE M` : M est une autre maison vivante du monde.

---

## 5. Logique des factions IA (heuristiques scriptées — 0 appel externe)

```
function decideAI(house):
  orders = []
  if house.gold > 80: orders.push(DEV on weakest-income holding)
  else:               orders.push(LEVEE of min(20, house.grain))
  if has untreatied strong neighbor: orders.push(EMISSAIRE -> propose non_aggression)
  if house.soldiers > 70: orders.push(MARCHE 60 -> weakest adjacent enemy holding)
  eventChoice = "partager" if reputation<50 else "thésauriser"   // simple
  return first 3 orders + eventChoice
```

> v1 : **aucun LLM**. (Plus tard, option : LLM pour *habiller* les messages diplomatiques, en batch + cache — jamais dans la boucle de calcul.)

---

## 6. Cycle de vie d'une saison

```
forming  -> remplir les maisons humaines ; les slots vides => factions IA ; placer la carte
active   -> ticks quotidiens jusqu'à ends_at OU condition de victoire
ended    -> calculer le vainqueur (plus haut prestige / contrôle des cités-clés),
            archiver la chronique, figer le classement
            -> créer world suivant (season_number+1)
```

Condition de victoire : à `ends_at`, plus haut **Prestige** (ou alliance contrôlant les lieux-objectifs).

---

## 7. Auth & onboarding

1. Supabase Auth : **OTP téléphone** (idéal émergents) ou magic-link email ou **anonyme** (friction min.).
2. À la 1ʳᵉ connexion : assigner le joueur à un `world` en `forming` → créer sa `house` (lieu de départ libre).
3. **Tutoriel = 3 cartes** : « voici ton Conseil », « donne 3 ordres », « parle à un voisin ». Puis premier briefing.

---

## 8. Non-fonctionnel (à ne pas oublier)

- **Fuseaux :** résolution à heure **UTC fixe** ; l'UI affiche un compte à rebours en heure locale.
- **Idempotence :** lock applicatif + vérif `current_tick` → le tick ne peut pas tourner deux fois.
- **Offline (PWA) :** lire l'état en cache (IndexedDB) ; **mettre les ordres en file** hors-ligne ; envoyer à la reconnexion (re-validés serveur).
- **Anti-abus :** 1 maison/joueur/monde ; rate-limit sur les messages.

---

## 9. Ordre de construction (vertical slice — code dans CET ordre)

| # | Étape | Pourquoi en premier |
|---|---|---|
| 1 | Projet Supabase + migration du schéma + **seed** d'1 monde/carte/maisons | socle |
| 2 | Auth + écran **« Le Conseil »** en lecture seule (ta maison + briefing statique) | voir l'état |
| 3 | **Soumettre des ordres** (écriture en table), sans résolution | la saisie |
| 4 | **Tick manuel** : un bouton qui résout 1 tour → tu vois l'état changer | ⭐ valider le **moteur** ici, avant d'automatiser |
| 5 | Automatiser le tick via cron | le rythme |
| 6 | Diplomatie (messages + traités) + **La Carte** + **Alliances** | la couche sociale |
| 7 | Factions IA (génération d'ordres) | l'anti-monde-vide |
| 8 | Fin de saison + chronique + reset | la boucle longue |
| 9 | Polish PWA : offline, installable, **emballage TWA** Play Store | distribution |

> **L'étape 4 est le cœur du risque technique.** Fais-la tourner à la main sur ton monde de test (mêmes chiffres que le test papier) : si la résolution reproduit tes calculs papier, ton moteur est bon.

---

## 10. Définition de « prêt à coder »

Tu as le nécessaire quand : ✅ ce spec + ✅ le test papier validé + ✅ tes comptes (GitHub/Supabase) + ✅ ton assistant IA de code en place. Le spec est là. Restent : **le test papier** et **tes comptes/outils**.
