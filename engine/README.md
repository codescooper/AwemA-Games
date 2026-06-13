# Moteur « Lignées » — prototype local

Le **cœur du jeu**, 100 % local et déterministe (ADR-1). Aucune dépendance réseau, aucun serveur, aucune base. Le *même* code migrera plus tard côté serveur sans réécriture.

## Lancer — ZÉRO installation (recommandé maintenant)

Double-clic sur le fichier (ou glisse-le dans un onglet du navigateur — marche aussi sur téléphone). Tout tourne en local, hors-ligne :

- **`engine/index.html` → LE MENU.** Choisis ton jeu. **Point d'entrée recommandé.** Servi en http(s)/localhost, le menu devient une **PWA installable** (bouton « ⬇️ Installer l'app ») qui met toute la plateforme **en cache hors-ligne** (`manifest.webmanifest` + `sw.js` + `icon.svg`). En double-clic `file://`, les jeux marchent quand même (autonomes), mais sans installation ni service worker (limitation navigateur).
- **`engine/atelier.html` → APPRENDRE (L'Atelier).** Tutoriel interactif et ludique : apprends à programmer pas à pas (variables, conditions, boucles, fonctions, canvas, boucle de jeu, interactions) et découvre comment chaque jeu de la plateforme est conçu — guidé par **Awa**, le mentor IA, avec un **bac à sable de code en direct**, des défis validés automatiquement, de l'XP et des badges (progression sauvegardée en local). Enseigne aussi la **méthode pour créer avec l'IA** (bien demander, lire, vérifier, corriger).
- **`engine/conseil.html` → JOUER (Lignées).** L'interface « Le Conseil » : tu donnes tes ordres, tu résous la nuit, la partie est sauvegardée en local (localStorage).
- **`engine/voraces.html` → JOUER (Voraces).** Jeu d'arcade temps réel : une créature façon serpent gobe des fruits pour évoluer, dévore les plus petits, noue des alliances, fuit les géants (plus gros = plus lent). Adversaires IA ; multijoueur prévu plus tard.
- **`engine/sables.html` → JOUER (L'Âge des Sables).** RTS temps réel façon Age of Empires, dans l'univers du Sahel médiéval : récolte (caravaniers auto-employés), construction, **Âges Ghana→Mali→Songhaï**, combat lancier/archer/cavalier (système de contres), tours de défense. IA adverse ; multijoueur prévu plus tard.
- **`engine/echecs.html` → JOUER (Échecs à l'Ivoirienne).** Le jeu d'échecs complet (roque, prise en passant, promotion, échec et mat, pat) avec des pièces inspirées de la culture ivoirienne : **Nanan** (roi), **Reine Pokou** (dame), **Tata** (tour), **Komian** (fou), **Dozo** (cavalier), **Planteur** (pion). IA hors-ligne (3 niveaux) ou à 2 joueurs. Moteur validé par perft.
- **`engine/harmattan.html` → JOUER (Harmattan).** Bullet-heaven / survie en horde façon *Vampire Survivors* : tu te déplaces, tes talismans frappent seuls ; survis aux vagues d'esprits, ramasse les graines d'âme (XP) et choisis tes pouvoirs à chaque niveau (souffle, talismans, cercle sacré, tam-tam). Rendu « crépuscule » (glow additif, particules, screen-shake). Tactile + clavier.
- **`engine/banco.html` → JOUER (Banco — Démolition).** Puzzle de démolition à **vraie physique** (intégration de Verlet + contraintes) : glisse depuis la fronde, tire des pierres, les poutres **rougissent sous la contrainte**, cassent et la structure s'effondre d'elle-même. 7 chantiers (mur, tour, maison, grenier sur pilotis, arche, forteresse…), pierres limitées, étoiles, progression sauvegardée. Tactile + clavier.
- **`engine/monde.html` → LE VILLAGE (monde ouvert).** Couche ③ du **multijoueur** (prototype simulé) : une place 2D où ton **avatar se déplace** (ZQSD/flèches/clic), croise les autres (bots qui errent et palabrent en bulles), et **entre dans les cases de jeu** (bâtiments) pour lancer une partie ; le Grand Conseil est un bâtiment du village. Réutilise identité + Indice. Couture `update/bots` à remplacer par un client temps réel (PartyKit/Cloudflare).
- **`engine/salon.html` → LA PLACE (salon social).** Couche ② du **multijoueur** (prototype simulé) : sous l'arbre à palabres, présence vivante (qui est là), **chat** (les autres répondent), et **salles de jeu** (une par jeu) où l'on entre pour lancer une partie. Réutilise l'identité + l'Indice du Grand Conseil ; « autres joueurs » = bots qui vont et viennent. 100 % local — la couture (`Lobby.*`) est prête pour de vraies présences/chat (PartyKit / Cloudflare) sans toucher l'écran.
- **`engine/classements.html` → LE GRAND CONSEIL (classements).** Première couche du **multijoueur** : lit les meilleurs scores de chaque jeu (localStorage, même origine) et calcule l'**Indice AwemA** (synthèse normalisée de la maîtrise sur tous les jeux) → un **rang** (Voyageur → Légende des griots), un **classement général** et un **par jeu**. 100 % local pour l'instant ; le classement mondial en ligne viendra avec le back-end. Pseudo modifiable, rivaux d'exemple.
- **`engine/tamtam.html` → JOUER (Tam-Tam).** Combat rythmique : des esprits masqués approchent du djembé **en rythme** (gauche = Q/←/tap gauche, droite = D/→/tap droit) ; frappe au moment exact (Parfait/Bien/Raté), enchaîne les combos (×4 max) jusqu'à la transe. 3 danses (92→112→132 BPM), 5 cœurs, musique **100 % WebAudio procédurale** — la même horloge pilote sons et esprits (synchro par construction).
- **`engine/awale-royal.html` → JOUER (Awalé Royal).** Roguelike de combos façon *Balatro* : les **48 graines** de l'awalé (4 familles : Or, Sel, Cola, Mil) forment un jeu de cartes. Score = (base du combo + somme des graines) × multiplicateur ; 4 villages × 3 enchères, **gri-gris** passifs et **proverbes** (améliorations permanentes) au marché de nuit, **Chefs de village** à malus. Souris/tactile + clavier (1-8, Entrée, D).
- **`engine/prototype.html` → VÉRIFIER.** Joue 1 tick de démo de Lignées et affiche les 7 contrôles (doit montrer ✅ 7/7).

## Lancer — option B : avec Node (pour le futur vrai build)

Prérequis : **Node ≥ 18**. Même logique, version typée (`prototype.ts`).

```bash
npm install      # installe tsx + typescript (outils de dev uniquement)
npm run play     # exécute engine/prototype.ts
```

## Ce que tu dois voir

Le script :
1. affiche l'**état initial** (le monde « Le Carrefour des Sables » : 8 lieux, 6 Maisons) ;
2. joue **un tick** avec les ordres de l'exemple « Jour 12 » du kit de test papier ;
3. affiche l'**état après la nuit** + la **chronique** ;
4. lance une série de **contrôles** — le code doit reproduire **exactement** tes calculs à la main :

```
✅ Tindûk garnison 40 → 8 (−80%)
✅ Aoudaghost 70 −60 +42 survivants = 52
✅ Aïssata or = 85
✅ Aïssata grain = 100
✅ Aïssata prestige = 5
✅ TOUS LES CONTRÔLES PASSENT (7/7)
```

Si tous les contrôles passent, **ton moteur est juste** : c'est l'étape 4 du spec (le cœur du risque technique) validée.

## Pour jouer avec

- Change les **ordres** ou l'**événement** dans `main()` (en bas de `prototype.ts`) et relance `npm run play`.
- Ajuste la **balance** dans l'objet `CONFIG` (en haut) : tout y est centralisé.
- Modifie le **monde** dans `buildScenario()`.

## Les fichiers

- **`index.html`** — le **menu** : choisit entre les jeux. Point d'entrée. Porte la couche **PWA** (lien manifest, métas, bouton d'installation, enregistrement défensif du service worker).
- **`manifest.webmanifest` · `sw.js` · `icon.svg`** — la **PWA** : manifeste d'app (nom, couleurs, icône), service worker (cache `awema-v1`, stratégie *cache-first* + rafraîchissement réseau, repli menu hors-ligne), et icône **SVG** maskable (zéro binaire). Pour invalider le cache lors d'une mise à jour : incrémenter `CACHE` dans `sw.js`.
- **`atelier.html`** — *L'Atelier*, tutoriel interactif pour **apprendre à coder en créant les jeux**, guidé par un mentor IA (bac à sable de code en direct, défis auto-validés, XP/badges, méthode « créer avec l'IA »). Autonome et hors-ligne ; tout le contenu est dans le tableau `COURSE` en haut du script.
- **`conseil.html`** — *Lignées*, l'**interface jouable** (UI + moteur), zéro install. À ouvrir pour *jouer*.
- **`voraces.html`** — *Voraces — Le Vivier*, jeu d'arcade temps réel (créatures, fruits, IA, alliances), autonome et hors-ligne. Toute la balance est dans l'objet `CFG` en haut du script.
- **`sables.html`** — *L'Âge des Sables*, RTS temps réel façon Age of Empires (récolte, Âges Ghana→Mali→Songhaï, combat avec contres, tours, IA), autonome et hors-ligne. Toute la balance est dans l'objet `CFG` en haut du script.
- **`echecs.html`** — *Échecs à l'Ivoirienne*, jeu d'échecs complet avec pièces inspirées de la culture ivoirienne (Nanan, Reine Pokou, Tata, Komian, Dozo, Planteur) + IA (minimax α-β) hors-ligne. Moteur validé par perft (20/400/8902/197281). Autonome et hors-ligne.
- **`harmattan.html`** — *Harmattan*, bullet-heaven / survie en horde (armes automatiques, montée de niveau + builds, vagues d'esprits, boss, particules/glow/screen-shake). Autonome et hors-ligne ; toute la balance est en haut du script (objets `WEAPONS` / `upgradePool` / `spawnEnemy`).
- **`banco.html`** — *Banco — Démolition*, puzzle physique (Verlet + contraintes : casse sur l'étirement brut à l'impact, soudage des pièces, contrainte colorée, poussière, son procédural). Autonome et hors-ligne ; physique dans `stepPhysics()`, niveaux dans le tableau `LEVELS`.
- **`monde.html`** — *Le Village*, monde ouvert social (multijoueur couche ③, prototype simulé) : avatar déplaçable (caméra qui suit), bots qui errent/palabrent (bulles), bâtiments = cases de jeu + le Grand Conseil. Canvas top-down ; à remplacer par un vrai temps réel pour les positions/présence. Autonome, hors-ligne.
- **`salon.html`** — *La Place*, hub social (multijoueur couche ②, prototype simulé) : présence + chat + salles de jeu. Bots qui arrivent/partent/palabrent ; couture `Lobby.*` à remplacer par un client temps réel (PartyKit/Cloudflare). Autonome, hors-ligne.
- **`classements.html`** — *Le Grand Conseil*, hall des classements (multijoueur couche ①). Lit les clés `*_best`/`banco_save` des jeux, calcule l'**Indice AwemA** (Σ maîtrise 0–1000 par jeu), rangs par paliers, classement général + par jeu. Registre des jeux + barème en haut du script ; **couture back-end** marquée (objet `Boards`) pour brancher Cloudflare/Supabase plus tard. Autonome, hors-ligne.
- **`tamtam.html`** — *Tam-Tam*, combat rythmique (3 danses, motifs par densité, fenêtres ±75/160 ms, percussions WebAudio programmées avec 150 ms d'avance sur l'horloge audio ; jugement sur les notes, sprites = simple projection ; testable hors audio via `timeSkew`). Autonome et hors-ligne ; balance dans `DANSES`/`PATTERNS`.
- **`awale-royal.html`** — *Awalé Royal*, roguelike de combos façon Balatro (48 cartes, 9 combos, 10 gri-gris, proverbes, 5 malus de chef, 12 enchères). Autonome et hors-ligne ; toute la balance est en haut du script (`COMBOS` / `GRIGRIS` / `BOSSES` / `TARGETS` — courbe validée par simulation : 2 victoires / 8 parties d'une IA gloutonne).
- **`prototype.html`** — le **harnais de test** de Lignées (moteur + 7 contrôles), zéro install. À ouvrir pour *vérifier*.
- **`prototype.ts`** — **même moteur** que Lignées, version typée, pour le futur vrai build (via Node, option B).

> Les deux jeux sont indépendants. *Lignées* est tour-par-tour & déterministe ; *Voraces* est temps réel (canvas). Le menu (`index.html`) relie les deux ; chaque jeu a un lien « ← Menu ».

> Le moteur (`resolveTick`) est **identique** dans les trois (pur & déterministe). Duplication temporaire assumée pour le confort « double-clic » ; quand tu passeras à un vrai build (Vite / serveur local), extrais un seul `engine.js` partagé et fais-le importer par les trois.

## Étape suivante (toujours 100 % local)

Brancher une UI PWA ultra-légère (cf. budgets de frugalité, spec §0.5) sur ce moteur :
l'écran **« Le Conseil »** qui lit l'état et envoie 3 ordres. Le moteur ne change pas.
