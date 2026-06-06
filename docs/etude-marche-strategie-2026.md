# Où sera le marché des jeux de stratégie / économie / conquête / simulation / social persistant dans 5-10 ans — et comment se positionner avant les autres

**Rapport de recherche stratégique** · Juin 2026
**Équipe simulée :** analyste marché · prospectiviste tech · économiste virtuel · game designer senior · expert rétention/monétisation · investisseur.

---

## Avertissement méthodologique

- **Sources :** données observables (Newzoo, Sensor Tower / data.ai, SteamDB/SteamCharts, GSMA, KPMG, Naavik, Quantic Foundry, GDC State of the Industry, rapports investisseurs Roblox/Paradox, postmortems). ~70 recherches web menées, dont une **passe de vérification adverse** dont le rôle était de *réfuter* mes hypothèses, pas de les confirmer.
- **Niveau de confiance** noté pour chaque affirmation clé : **[É]** élevé · **[M]** moyen · **[F]** faible.
- **Honnêteté intellectuelle :** une section entière (§6.7) liste ce qui *réfute* la recommandation finale. Ce rapport n'est pas un argumentaire de vente.
- **Filtres durs** appliqués partout (issus de tes réponses + du brief) : **solo/bootstrap (<50 k€)** · **F2P éthique (pas de pay-to-win, pas de loot boxes)** · **profil game-design (dev externalisé/assisté IA)** · **PWA + smartphones modestes** · **marchés émergents** · **rétention >10 ans + plusieurs millions de joueurs**.

---

## 0. Résumé exécutif

**Le constat central :** le segment commercialement dominant (mobile 4X type *Last War*, *Whiteout Survival*, *Rise of Kingdoms*, ~1,75 Md$/an) repose sur des mécaniques que les joueurs **détestent activement** (pay-to-win, timers, whales) mais tolèrent faute d'alternative. En parallèle, les formats qui **durent 10 à 27 ans** (Travian, OGame, EVE Online, RuneScape) partagent un ADN commun — **asynchrone, persistant, social, économie joueur, coût serveur faible** — mais sont **vieillissants, non-mobiles, et n'ont jamais été refaits proprement pour les marchés émergents**. C'est là qu'est le Blue Ocean.

**Les 3 forces durables qui définiront 2030-2035** (confiance élevée) :
1. **Explosion mobile des marchés émergents** (Afrique 2,29 → 4,1 Md$ ; Asie du Sud-Est énorme en installs mais sous-monétisée ; LatAm) — mais ARPU 10-100× inférieur à l'Occident.
2. **Social asynchrone & UGC** (Roblox : 150 M DAU, 1,5 Md$ versés aux créateurs en 2025) — le jeu devient un lieu social persistant.
3. **IA comme outil de production et de simulation** (pas comme argument marketing : 85 % des joueurs sont hostiles à l'IA *visible*).

**Les pièges (confiance élevée) :** Web3/play-to-earn est **mort** (>90 % d'échecs) ; la distribution **PWA pure est fragile** (Meta ferme ses Instant Games en 2026) ; le F2P éthique a un **plafond de revenu** ; le temps réel **tue le budget serveur** d'un solo.

**Recommandation finale (Phase 6) :** un **MMO de stratégie diplomatique et économique, asynchrone et persistant**, jouable au **tour-par-tour sur n'importe quel téléphone**, où des milliers de joueurs incarnent des **dynasties** dans une **même civilisation vivante** — maintenue en permanence « habitée » par des **factions pilotées par IA** (outil invisible) — sur des **saisons de plusieurs mois**, avec une **économie pilotée par les joueurs** et une **monétisation strictement cosmétique/confort**. Différencié, défendable (effets de réseau + histoire accumulée + savoir-faire d'équilibrage), réalisable en solo+IA, taillé pour les marchés émergents, capable de monter à plusieurs millions de joueurs sur 10 ans. Codename de travail : **« Lignées »**.

---

# PHASE 1 — Analyse du présent

## 1.1 Cartographie des 4 grands segments

| Segment | Exemples | Modèle | Coût serveur | Longévité observée |
|---|---|---|---|---|
| **Premium PC/console** | Paradox (CK3, EU5, Stellaris), Manor Lords, Frostpunk 2, Anno 117, Civ VII | Achat + DLC | Faible (solo/coop) | Moyenne (relances) |
| **Mobile 4X / MMO-stratégie F2P** | Last War, Whiteout Survival, Rise of Kingdoms, Evony, Clash of Clans | F2P + gacha + battle pass + **P2W** | Élevé (temps réel, live-ops) | 3-8 ans |
| **Browser / idle async persistant** | Travian, OGame, Grepolis, Cookie Clicker, Melvor Idle | F2P premium / payant léger | **Très faible** | **10-24 ans** |
| **Sandbox économie-joueur** | EVE Online, Albion, RuneScape/OSRS | Abonnement / F2P cosmétique | EVE élevé / Albion-RS moyen | **20-27 ans** |

> **Lecture stratégique :** le segment le plus rentable (mobile 4X) est aussi le plus **coûteux à opérer**, le plus **prédateur**, et le plus **saturé**. Le segment le plus **durable et le moins cher** (browser/idle async + économie joueur) est **délaissé, vieillissant et non-mobile**. Le décalage entre ces deux faits est l'opportunité centrale de ce rapport. **[M-É]**

## 1.2 Jeux dominants (données observables)

| Titre | Donnée | Source / Conf. |
|---|---|---|
| **Last War: Survival** | ~1,1 Md$ en 2024, +360 % YoY | Sensor Tower / Naavik · **[É]** |
| **Whiteout Survival** | pic ~123 M$/mois (mars 2024) | Sensor Tower · **[É]** |
| **Rise of Kingdoms** | >3,5 Md$ cumulés | Sensor Tower · **[É]** |
| **Manor Lords** (premium indie) | 3 M ventes, 1 M le 1er jour | éditeur / PCGamer · **[É]** |
| **Cities: Skylines II** | accueil mitigé, < Manor Lords en pic CCU | SteamDB · **[É]** |
| **Free Fire** (émergents) | ~110 M MAU, low-end, cosmétique | BusinessofApps · **[É]** |
| **Ludo King** (Inde) | >1 Md téléchargements, **non-P2W**, ARPU ~3 $ | Naavik/Sensor Tower · **[É]** |
| **Roblox** (UGC social) | 150 M DAU (Q3 2025), 1,5 Md$ aux créateurs | IR Roblox · **[É]** |

## 1.3 Jeux émergents

- **Premium indie de niche, scope resserré** : *Manor Lords*, *Frostpunk 2*, *Balatro*, *Vampire Survivors* — la qualité focalisée bat l'AAA bloqué. **[É]**
- **Hybrides 4X + auto-battler / narratif** : *Songs of Silence*, grand strategy character-driven (CK3). **[M]**
- **Social-collection mémétique sur Roblox** : *Grow a Garden*, *Steal a Brainrot* — non-violent, viral, async. **[É]**
- **Jeux Telegram/“tap-to-earn”** : *Hamster Kombat*, *Notcoin* — **fausse échelle** (installs gonflés, monétisation par airdrop crypto non durable). **[M-É, à ne pas imiter]**

## 1.4 Jeux en déclin / échecs

- **Live-service AAA** : *Concord* (mort en 2 semaines, studio fermé), *MultiVersus*, *Star Wars Hunters*. Cause : coûts d'acquisition + live-ops insoutenables hors franchise établie. **[É]**
- **Clones 4X sans différenciation** : *Millennia* (« pire rival de Civ »). **[É]**
- **Web3 / play-to-earn** : >90 % morts, durée de vie moyenne ~4 mois, tokens -95 %. **[É]**
- **Browser MMO classiques** : Travian/OGame survivent mais base déclinante ; RuneScape a coupé le navigateur en 2025. **[M]**

## 1.5 Innovations de gameplay des 10 dernières années (2015-2025)

Battle royale (PUBG/Fortnite/**Free Fire** — décisif en émergents) · auto-battlers (Auto Chess→TFT) · roguelite puis **survivors-like** (Hades, Vampire Survivors) · deckbuilders (Slay the Spire→Balatro) · **idle/incremental mainstream** · social-deduction (Among Us) · survival-craft (Valheim, Palworld) · **cozy games** · **plateformes UGC** (Roblox, UEFN). 
> Pour la stratégie spécifiquement, **l'innovation a été faible** : le 4X reste hexagonal/Civ-like, le mobile-stratégie reste Travian + monétisation agressive. **C'est un genre mûr pour une rupture.** **[M]**

## 1.6 Tendances de rétention

| Levier | Effet | Conf. |
|---|---|---|
| **Liens sociaux / guildes / alliances** | #1 levier long terme (EVE, Travian) — « barrière de sortie » | **É** |
| **Resets saisonniers / prestige** | relance l'intérêt, casse le burnout (Travian rounds 200-250 j, Cookie Clicker) | **É** |
| **Asynchrone** | participation tous fuseaux, faible friction quotidienne | **É** |
| **Persistance + économie joueur** | sens et appartenance durables (RuneScape GE : ~500 T or/mois) | **É** |
| **Habitude quotidienne légère** | (type Wordle) ancrage rituel | **M** |
| Benchmarks | D1 ~45 %, D7 ~20 %, D30 6-10 % | **M** |

## 1.7 Tendances de monétisation

- **F2P + battle pass** ≈ 63 % des jeux ; **gacha** énorme en Asie (~78 Md$). **[É]**
- **Premium upfront** = refuge de la stratégie PC. **[É]**
- **Pression réglementaire montante** : loot boxes encadrées (Belgique, Pays-Bas) ; **l'Inde a interdit les jeux d'argent réel en oct. 2025**. → le **F2P éthique devient un avantage défensif réglementaire**. **[É]**
- **Plafond du F2P éthique** : Brawl Stars/Free Fire (~200-400 M$/an) = haut du panier cosmétique ; *Among Us* s'est effondré (86 M$→1,5 M$). **[É]**

## 1.8 Causes des succès / échecs (patterns)

**Succès :** scope focalisé + polish · cœur social/communautaire · accessibilité (async, low-end) · localisation culturelle (Ludo King) · live-ops maîtrisé.
**Échecs :** sur-ambition live-service · régression technique (CS2) · absence de différenciation (Millennia) · backlash P2W · token Ponzi (Web3).
> **Pattern investisseur :** le marché récompense désormais **la différenciation focalisée + la communauté**, et punit **l'imitation coûteuse**. **[M-É]**

## 1.9 Mécaniques surutilisées / saturées / sous-exploitées

| Surutilisées (à éviter ou subvertir) | Saturées (rouge vif) | **Sous-exploitées (whitespace)** |
|---|---|---|
| Timers d'énergie / speed-ups payants | Match-3 ; gacha RPG ; survivors-like (depuis 2023) | **Async PvP moderne, mobile, éthique** (Travian jamais « refait bien ») |
| Pay-to-win / dominance des whales | Clones 4X hexagonaux | **Économie joueur sans P2W et sans coût temps réel** |
| Battle pass omniprésent | Battle royale | **Stratégie coopérative** (presque tout est compétitif/solo) |
| Cadre médiéval-fantasy générique | Clones Travian/OGame déclinants | **Diplomatie / négociation comme cœur de jeu** |
| Toujours-en-ligne obligatoire | Idle clickers prédateurs | **Stratégie pensée low-end / tolérante au offline** |
| | | **Localisation culturelle régionale forte** (Afrique, etc.) |

## 1.10 Frustrations récurrentes des joueurs (avis Steam / Reddit / stores)

1. **Pay-to-win / domination des whales** — *critique* sur le mobile 4X. **[É]**
2. **Timers / attentes forcées** — *critique*. **[É]**
3. **Publicités agressives** · **toujours-en-ligne obligatoire** · **mécaniques (pas que cosmétiques) derrière paywall**. **[É]**
4. **FOMO / épuisement live-ops** ; **grind sans sens** ; **PvP temps réel toxique**. **[M-É]**
5. PC : **optimisation/perf** (CS2, Victoria 3 en fin de partie). **[É]**

> **Synthèse Phase 1 :** il existe une **demande captive et frustrée** pour de la stratégie profonde, sociale et persistante, *sans* les abus du F2P. Personne ne sert proprement cette demande sur mobile/émergents. **[M-É]**

---

# PHASE 2 — Signaux faibles (2030-2040)

| Signal | Classement | Preuve clé | Conf. |
|---|---|---|---|
| **IA générative & agents autonomes** | **RUPTURE POTENTIELLE** | adoption studios massive ; **MAIS 85 % joueurs hostiles** (Quantic Foundry, pire que blockchain), 52 % devs négatifs (GDC) | **M-É** |
| **Génération procédurale** | **TENDANCE DURABLE** | invisible quand bien faite, démocratisée (Unity/Godot) | **M** |
| **Web3 / play-to-earn** | **MODE MORTE** | >90 % d'échecs, tokens -95 %, financements -93 % | **É** |
| **Économie pilotée par les joueurs (centralisée, non-crypto)** | **TENDANCE DURABLE & sous-exploitée** | EVE, RuneScape GE, Albion — distincte du Web3 | **É** |
| **UGC / social asynchrone (modèle Roblox)** | **TENDANCE DURABLE ACCÉLÉRANTE** | 150 M DAU, 1,5 Md$ créateurs (2025) | **É** |
| **Gameplay asynchrone** | **TENDANCE DURABLE & sous-exploitée** | longévité Travian/OGame ; fuseaux horaires globaux | **M-É** |
| **Personnalisation massive (difficulté/offres IA)** | **TENDANCE DURABLE** | +5-15 % revenu, déjà standard F2P | **M** |
| **Mobile marchés émergents** | **TENDANCE DURABLE (croissance forte)** | Afrique 2,29→4,1 Md$ ; SEA 1,93 Md installs Q1 2025 mais 625 M$ IAP (**gap**) ; M-Pesa 450 Md$ traités | **É** |
| **Connectivité limitée / low-end** | **CONTRAINTE DURABLE** | devices 2-4 Go dominants ; 960 M Africains couverts mais hors-ligne (coût) | **É** |

### Lecture prospective (raisonnement → preuve → confiance)

- **Raisonnement :** l'IA résout le **problème n°1 du dev solo en multijoueur** — le « monde vide » au lancement et le manque de contenu — en peuplant le monde de factions/PNJ crédibles et en assistant la production. **Preuve :** marché PNJ-IA ~500 M$ (25 % CAGR), agents autonomes opérationnels (NVIDIA ACE 120+ jeux). **Mais :** hostilité joueurs réelle et **ciblée sur l'IA visible** (art/voix/remplacement d'humains), pas sur l'IA-simulation invisible. **Implication :** *utiliser l'IA comme outil, jamais comme argument marketing.* **Confiance : M-É.**
- **Raisonnement :** les marchés émergents sont la seule source de croissance massive en *joueurs*, mais pas en *ARPU*. **Preuve :** SEA = 2ᵉ mondial en installs, 7ᵉ en dépenses ; ARPU Inde ~3 $. **Implication :** viser le **volume** (millions de joueurs) avec coût serveur ~0 et monétisation cosmétique sur une minorité — pas l'ARPU. **Confiance : É.**

---

# PHASE 3 — Matrice opportunités (demande × concurrence)

| | **Forte concurrence** | **Faible concurrence** |
|---|---|---|
| **Forte demande** | 🔴 **Red Ocean** — mobile 4X P2W, battle royale, match-3, gacha RPG, UGC sandbox Roblox, survivors-like | 🟢 **CIBLE** — stratégie async **sociale & persistante non-prédatrice** pour mobile/émergents ; **économie joueur sans P2W** ; **stratégie coopérative** ; « forever games » modernisés |
| **Faible demande** | ⚪ **Piège** — clones Travian/OGame déclinants, idle clickers prédateurs, jeux Web3 | 🟡 **Niche** — play-by-email hardcore, sims économiques ultra-profondes, simulation de niche (difficile d'atteindre des millions) |

**Espaces peu exploités identifiés (case verte) :**
1. Stratégie **asynchrone persistante**, **mobile-first**, **éthique**, **localisée** pour marchés émergents.
2. **Économie pilotée par les joueurs** sans pay-to-win et sans coût temps réel.
3. **Diplomatie/négociation** comme cœur de boucle (quasi-zéro compute, fort lien social).
4. **Monde « toujours vivant »** grâce à des factions IA (résout le cold-start du solo dev).

---

# PHASE 4 — Recherche de Blue Ocean

**Filtres (les 6 critères du brief) appliqués comme grille éliminatoire :**

| Critère | Conséquence de design |
|---|---|
| Difficile à cloner | profondeur **systémique + sociale + économique** + **histoire accumulée** + effets de réseau (≠ un match-3 clonable en 2 semaines) |
| Faible coût serveur | **asynchrone / tick-based (cron) / tour-par-tour** — *jamais* d'état autoritatif temps réel (le mur de coût prouvé : Melvor ×10, Screeps 40 serveurs) |
| PWA + low-end | rendu **texte / 2D léger**, petits payloads, **tolérance offline** |
| Forte rétention | **liens sociaux + monde persistant + resets saisonniers + économie** |
| Viable >10 ans | persistance + communauté + **cycles de saisons** (modèle Travian/EVE) |
| Réalisable solo+IA | logique serveur simple ; **IA pour le contenu et la vie du monde** |

**Catégories candidates qui passent TOUS les filtres :**
- **A.** Stratégie géopolitique/diplomatique asynchrone persistante (Travian + diplomatie, moderne, éthique).
- **B.** Simulation d'économie pilotée par les joueurs (EVE-économie sans EVE-combat/coût).
- **C.** Monde-civilisation persistant peuplé d'agents IA (profondeur + anti-cold-start).
- **D.** Jeu de dynastie/légende sociale (CK3 async + identité sociale → rétention 10 ans).

> La **fusion A+B+C+D** définit l'espace Blue Ocean. C'est l'objet de la Phase 6.

---

# PHASE 5 — 20 concepts originaux, notés

**Grille (1-5 par critère).** Convention : pour **Dév / Serv / Maint**, **5 = coût/difficulté faible (favorable)**. Pondérations : Potentiel (moyenne 1a/5a/10a) ×3 · Dév ×1 · Serv ×2 · Maint ×1 · Différenciation/défendabilité ×2 · Fit émergents ×2 · F2P éthique ×1 · Communauté ×2. **Total max = 70.**

| N° | Concept (async, PWA, éthique sauf mention) | 1a | 5a | 10a | Dév | Serv | Maint | Diff | Émerg | Éthiq | Comm | **/70** |
|---|---|--|--|--|--|--|--|--|--|--|--|--|
| **16** | **Civilisation à thème régional/culturel** (royaumes africains, etc.) | 3 | 4 | 5 | 3 | 5 | 3 | 5 | 5 | 5 | 5 | **63** |
| **1** | **Grande stratégie géopolitique async** (Travian + diplomatie moderne) | 3 | 4 | 5 | 3 | 5 | 3 | 4 | 4 | 5 | 5 | **59** |
| **18** | **Puzzle stratégique quotidien → guerre persistante** (échelle Wordle) | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | 4 | **59** |
| **20** | **Dynastie/légende sociale** (CK3 async, héritage sur des mois) | 3 | 4 | 5 | 3 | 5 | 3 | 4 | 4 | 5 | 5 | **59** |
| **11** | **Manager sportif async social** (football = universel émergents) | 4 | 4 | 4 | 3 | 5 | 3 | 3 | 5 | 4 | 5 | **58** |
| **15** | **Jeu de commerce « mobile-money native »** (codes culturels émergents) | 3 | 4 | 4 | 3 | 5 | 3 | 4 | 5 | 4 | 4 | **57** |
| **2** | **Sim d'économie pilotée par les joueurs** (EVE-éco sans combat) | 2 | 4 | 5 | 2 | 5 | 2 | 5 | 4 | 5 | 4 | **56** |
| **5** | **Monde vivant peuplé d'agents IA** (anti-cold-start, IA invisible) | 3 | 4 | 5 | 3 | 4 | 3 | 5 | 4 | 4 | 4 | **56** |
| **8** | **Diplomatie/traités persistante & scalable** (quasi-zéro compute) | 3 | 3 | 4 | 4 | 5 | 4 | 4 | 3 | 5 | 4 | **55** |
| **10** | **Réseau de cités économiques** (chaînes d'appro interconnectées) | 2 | 4 | 4 | 3 | 5 | 3 | 4 | 4 | 5 | 4 | **55** |
| **12** | **Idle-civilisation + couche sociale** (idle non-solo, alliances) | 4 | 3 | 3 | 4 | 5 | 4 | 3 | 4 | 4 | 4 | **54** |
| **6** | **Royaume persistant « texte d'abord »** (MUD réinventé, 2G) | 2 | 3 | 3 | 4 | 5 | 4 | 3 | 4 | 5 | 4 | **53** |
| **3** | **Royaume de déduction sociale async** (rôles cachés sur des jours) | 3 | 3 | 3 | 4 | 5 | 4 | 3 | 3 | 5 | 4 | **52** |
| **13** | **Constructeur d'Histoire/lore persistant** (actes → canon du monde) | 2 | 3 | 4 | 3 | 5 | 3 | 5 | 2 | 5 | 4 | **52** |
| **9** | **Territoire alliance-vs-alliance** (carte partagée, guerres saisonnières) | 3 | 3 | 3 | 3 | 5 | 3 | 2 | 4 | 4 | 5 | **51** |
| **4** | **Civilisation coopérative** (construction commune non-PvP) | 2 | 3 | 4 | 3 | 4 | 3 | 4 | 3 | 5 | 4 | **50** |
| **14** | **Ligue d'auto-battler async** (armées résolues hors temps réel) | 4 | 3 | 3 | 4 | 5 | 4 | 2 | 4 | 4 | 3 | **50** |
| **7** | **4X « play-by-cloud »** (1 tour/jour, parties mondiales) | 3 | 3 | 3 | 3 | 5 | 3 | 3 | 3 | 5 | 3 | **48** |
| **17** | **Colonie de survie coopérative async** (Frostpunk persistant) | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 5 | 4 | **48** |
| **19** | **Dieu-jeu d'écosystème persistant** (planète façonnée collectivement) | 2 | 3 | 4 | 3 | 4 | 3 | 4 | 3 | 5 | 3 | **48** |

**Lecture :** les concepts gagnants partagent tous le même socle — **async + persistant + social/économique + faible coût + fit émergents**. Le n°16 (thème culturel) gagne par **différenciation + fit émergents** ; les n°1/18/20 ajoutent profondeur, habitude quotidienne et rétention décennale ; le n°5 (IA invisible) est le multiplicateur technique qui rend le solo viable.

> **Décision Phase 6 :** ne pas choisir *un* concept, mais **fusionner le cluster de tête (16 + 1 + 20 + 2/10 + 5 + 18)** en une proposition unique cohérente.

---

# PHASE 6 — Concept final : « Lignées »

> **MMO de stratégie diplomatique et économique, asynchrone et persistant, jouable au tour-par-tour sur n'importe quel téléphone (PWA), où des milliers de joueurs incarnent une dynastie au sein d'une même civilisation vivante — maintenue habitée par des factions IA — sur des saisons de plusieurs mois, avec une économie pilotée par les joueurs et une monétisation strictement cosmétique/confort.**

## 6.1 Le pitch en une phrase

*« Et si Travian, EVE Online et Crusader Kings avaient un enfant — né sur mobile, gratuit et honnête, dans une civilisation que vous transmettez à vos héritiers, vivante même quand vous dormez. »*

## 6.2 Boucle de jeu cœur (low-friction, offline-tolérante)

1. **Rituel quotidien (2-5 min, le « hook » type Wordle, concept n°18) :** chaque jour, ton **chef de maison** prend quelques décisions à fort sens — un édit, une offre commerciale, un message diplomatique, l'orientation d'un héritier. Jouable hors-ligne, synchronisé au retour réseau.
2. **Résolution par ticks (concept n°1/7) :** le monde avance par tours lents (ex. 1 tick = 1-6 h). **Aucun état temps réel** → coût serveur quasi nul, équité tous fuseaux.
3. **Méta diplomatique & économique (n°2/8/10) :** alliances, traités, routes commerciales, marché des joueurs. Le **vrai jeu est social** : confiance, trahison, réputation.
4. **Saison (3-6 mois) → reset partiel (modèle Travian) :** une civilisation « s'achève » (un vainqueur collectif, une chronique enregistrée), puis renaît — mais **ta lignée, ta réputation et tes cosmétiques persistent** (n°13/20). C'est le moteur de rétention décennale.

## 6.3 Les 4 piliers de différenciation (et pourquoi ils sont défendables)

| Pilier | Origine | Pourquoi c'est un fossé défensif |
|---|---|---|
| **Asynchrone tour-par-tour** | n°1, n°8 | coût serveur ~0 (prouvé : Lichess 5 M parties/j pour ~100 k$/an) → un solo peut tenir 10 ans **[É]** |
| **Diplomatie + économie joueur comme cœur** (pas le combat) | n°2, n°8, n°10 | la valeur est dans le **graphe social et l'histoire accumulée** — non clonable comme un match-3 ; c'est le fossé d'EVE/Travian **[É]** |
| **Monde maintenu vivant par IA** | n°5 | résout le **cold-start** (le tueur n°1 du multi solo) : le monde n'est jamais vide ; IA **invisible**, jamais vendue comme « contenu IA » (85 % des joueurs hostiles) **[M-É]** |
| **Dynastie + thème culturel régional** | n°16, n°20 | identité + appartenance + différenciation culturelle dans un marché saturé de médiéval-fantasy générique **[M]** |

## 6.4 Architecture serveur low-cost (réaliste pour un solo)

- **Cœur :** simulation **par cron/tick** (batchs horaires), pas de WebSocket autoritatif. État écrit en base **uniquement aux événements** (write-through), cache Redis.
- **Stack candidate :** PWA (HTML/JS léger, offline via service worker) + backend serverless (**Cloudflare Workers/D1/Durable Objects** ou Supabase) + Postgres + Redis. Coût observé : ~quelques centaines de $/mois pour des dizaines de milliers de joueurs actifs async. **[M-É]**
- **IA :** appels LLM **groupés et asynchrones** (factions IA mises à jour par batch, pas en temps réel) → coût maîtrisable et cacheable.
- **Anti-triche :** trivial en tour-par-tour (résolution serveur autoritaire batch).

## 6.5 Monétisation strictement éthique (compatible plafond F2P)

- **Cosmétiques** : blasons, palais, tenues de dynastie, thèmes de carte, sceaux diplomatiques.
- **Confort non-pay-to-win** : slots de file de construction supplémentaires, journaux/historiques étendus, alertes — **rien qui donne un avantage de pouvoir**.
- **Abonnement optionnel** (« Chroniqueur ») : cosmétiques mensuels + QoL + soutien au monde. Modèle RuneScape membership **sans** les loot boxes.
- **Pas de timers payants, pas de gacha, pas de P2W** → **avantage réglementaire** (Inde 2025) et **confiance communautaire** = rétention.
- **Réalisme financier :** ARPU émergents 10-100× inférieur → on vise le **volume** ; ~1 M joueurs à la *Ludo King* = revenu viable pour un solo ; ce n'est **pas** un modèle à milliards (assumé). **[É]**

## 6.6 Rétention & communauté sur 10 ans

- **Liens sociaux** (alliances, dynasties, rivalités) = barrière de sortie n°1. **[É]**
- **Saisons + chroniques persistantes** : chaque saison entre dans l'**Histoire du monde** (n°13) → légende, prestige, raison de revenir.
- **Habitude quotidienne légère** : ancrage rituel sans grind.
- **Go-to-market émergents :** lancer sur **un thème culturel régional fort** (ex. grandes civilisations africaines précoloniales) où la concurrence est quasi nulle et l'identification maximale ; communauté d'ambassadeurs ; mécaniques **virales par invitation diplomatique** (le jeu *a besoin* d'amis → croissance organique).

## 6.7 Ce qui RÉFUTE ou menace cette recommandation (honnêteté)

| Risque | Gravité | Contre-mesure |
|---|---|---|
| **Distribution PWA fragile** (Meta tue Instant Games 2026 ; pas de hit PWA F2P prouvé à 10 M DAU) | 🔴 **Le risque n°1** | Empaqueter la PWA en **TWA sur Play Store** (découverte store + install minuscule) ; canaux **Telegram mini-app** (sans crypto), agrégateurs (Poki/CrazyGames/itch), **viralité diplomatique** native. **[M]** |
| **Plafond ARPU du F2P éthique** | 🟡 moyen | Modèle dimensionné pour un solo ; viser volume + minorité cosmétique ; pas de promesse de milliards. **[É]** |
| **Cold-start / monde vide** | 🟡 moyen | **Factions IA** + démarrage sur petits « royaumes » densifiés avant ouverture. **[M]** |
| **Hostilité à l'IA** | 🟡 moyen | IA **invisible** (simulation/PNJ), **jamais** marketée ; contenu écrit/validé humain en façade. **[M-É]** |
| **Équilibrage d'économie joueur = difficile** | 🟡 moyen | C'est aussi le **fossé** (savoir-faire rare) ; commencer simple, complexifier par saisons. **[M]** |
| **« Plusieurs millions » incertain** | 🟡 moyen | Précédents : Travian >1 M, Free Fire 110 M, Ludo King 1 Md prouvent que async/éthique/low-end **peut** scaler ; mais rampe pluriannuelle, pas garantie. **[M]** |

## 6.8 Vérification contre les 6 contraintes

| Contrainte | Respect | Justification |
|---|---|---|
| Solo / bootstrap | ✅ | async = peu de tech ; IA assiste contenu & dev |
| F2P éthique | ✅ | cosmétique/confort uniquement |
| Profil game-design | ✅ | densité de design > prouesse technique |
| PWA + low-end | ✅ | texte/2D, offline, tour-par-tour |
| Marchés émergents | ✅ | low-end, mobile money, thème culturel local |
| Rétention >10 ans + millions | ✅ (sous réserve distribution) | modèle Travian/EVE modernisé ; risque = acquisition |

---

## Conclusion stratégique

Le marché va dans deux directions simultanées et **paradoxalement complémentaires** : (1) une masse de **nouveaux joueurs mobiles à faible ARPU** dans les marchés émergents, et (2) une **lassitude croissante** envers le pay-to-win et l'IA-marketing. La fenêtre n'est pas de faire un meilleur *Last War* (red ocean coûteux), mais de **refaire proprement le format le plus durable de l'histoire du jeu en ligne** — la stratégie asynchrone, sociale et persistante — pour **le téléphone bon marché, gratuitement et honnêtement**, en utilisant l'IA comme **outil invisible** pour qu'un solo puisse tenir un monde vivant pendant une décennie.

**Le fossé n'est pas technique : il est social, économique et temporel.** Un concurrent peut copier les règles ; il ne peut pas copier dix ans d'histoire de monde, le graphe d'alliances, ni le savoir-faire d'équilibrage d'une économie vivante. C'est exactement ce qui a permis à Travian (22 ans) et EVE (20 ans) de survivre. **« Lignées » est ce moat, modernisé pour 2035.**

---

## Annexe — Sources principales

**Marché & titres :** [Paradox financials](https://www.paradoxinteractive.com/investors/financial-reports/) · [Naavik — Last War](https://naavik.co/digest/how-last-war-is-winning-the-4x-game/) · [Statista — strategy games](https://www.statista.com/outlook/amo/app/games/strategy-games/worldwide) · [PCGamer — Manor Lords 3M](https://www.pcgamer.com/games/sim/manor-lords-the-best-city-builder-of-2024-hits-3-million-sales/) · [Sensor Tower State of Mobile 2026](https://sensortower.com/blog/state-of-mobile-2026)
**Longévité & coût serveur :** [Travian 20 ans](https://blog.travian.com/2024/09/20-years-travian-legends/) · [Lichess coût](https://lichess.org/faq) · [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) · [CCP/EVE infra](https://massivelyop.com/2018/01/30/ccp-says-it-recently-poured-3m-into-eve-onlines-server-cluster-upgrades/) · [Melvor Idle](https://melvoridle.com/)
**Marchés émergents :** [Mordor — Africa gaming](https://www.mordorintelligence.com/industry-reports/africa-gaming-market) · [GSMA Mobile Economy Africa](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/) · [KPMG Africa Games 2025](https://assets.kpmg.com/content/dam/kpmg/ng/pdf/2025/02/2025%20Africa%20Games%20Industry%20Report.pdf) · [Naavik — Ludo King](https://naavik.co/digest/ludo-king-takes-over-the-indian-mobile-games-market/)
**Signaux faibles :** [Quantic Foundry — sentiment IA](https://quanticfoundry.com/2025/12/18/gen-ai/) · [GameDeveloper — devs & IA (GDC)](https://www.gamedeveloper.com/business/developers-still-aren-t-warming-up-to-generative-ai) · [CoinDesk — effondrement Web3](https://www.coindesk.com/) · [Naavik — État de l'UGC 2026](https://naavik.co/deep-dives/the-state-of-ugc-games-2026/) · [Roblox IR](https://ir.roblox.com/) · [Meta — fin des Web/Instant Games 2026](https://developers.facebook.com/blog/post/2025/07/31/web-and-instant-games-changes/)
**F2P éthique à l'échelle :** [Deconstructor of Fun — Brawl Stars](https://www.deconstructoroffun.com/blog/2024/2/11/brawl-stars-to-the-moon/) · [BusinessofApps — Free Fire](https://www.businessofapps.com/data/free-fire-statistics/) · [BusinessofApps — Among Us](https://www.businessofapps.com/data/among-us-statistics/)

*Niveaux de confiance rappelés dans le texte : **[É]** élevé · **[M]** moyen · **[F]** faible. Les chiffres de marché évoluent vite — revérifier avant toute décision d'investissement majeure.*
