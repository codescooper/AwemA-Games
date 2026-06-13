# STATUS — AWEMA Light Games Prototype
> Dernière MAJ : 2026-06-13

## 🎯 Objectif de la phase actuelle
Explorer et prototyper des mini-jeux 100 % locaux (HTML/Canvas, JS vanilla, zéro dépendance) en repoussant le graphisme et le réalisme au maximum des performances du navigateur. Horizon : installation en PWA, puis multijoueur.

## ✅ Fait (cette semaine)
- **Multijoueur — couche ③ : « Le Village » (monde ouvert, prototype simulé).** Place 2D où l'avatar se déplace (clavier/clic, caméra suiveuse), bots qui errent + palabrent (bulles), 9 cases de jeu + le Grand Conseil en bâtiments où l'on entre (→ Jouer). **La vision ①②③ est entièrement prototypée en local.** Vérifié (déplacement, errance, entrée, chat, rendu). Commit `40042a2`.
- **Multijoueur — couche ② : « La Place » (hub social, prototype simulé).** Présence vivante (bots qui arrivent/partent/entrent dans les salles), **chat** « arbre à palabres » (les présents répondent), **9 salles de jeu** (compteur live + bouton Jouer). Réutilise identité/Indice ; couture `Lobby.*` prête pour PartyKit/Cloudflare. Vérifié (chat, 30 ticks, salles). Commit `e70f900`.
- **Le Grand Conseil — prototype réseau (cloud simulé, async).** Identité persistante + `Cloud.submit()/global()/game()` asynchrones (latence simulée) sur un faux serveur local (`awema_cloud_v1`) avec bots qui progressent → board « vivant », bouton Synchroniser, badge « en ligne (simulé) ». Couture isolée : passer au vrai mondial = remplacer le corps de `Cloud.*` par des `fetch()`. Vérifié (board 8 joueurs, scores poussés, bots +3016/6 synchros). Commit `49a1134`.
- **Indice AwemA — couche ① complète : les 9 jeux contribuent.** Échecs (victoires), Sables (score), Lignées (prestige) enregistrent un meilleur score ; Voraces & Atelier en avaient déjà un. Registre étendu + paliers de rang recalibrés (Indice max ~9000). Vérifié (mat→`echecs_best`, `sables_best`, `lignees_best`, Indice 9 jeux). Commit `6bd5bbd`.
- **Multijoueur — couche ① : « Le Grand Conseil »** (classements). Page `classements.html` qui lit les scores des jeux (localStorage) et calcule l'**Indice AwemA** (Σ maîtrise normalisée 0–1000/jeu) → rang (Voyageur→Légende), classement général + par jeu, pseudo, rivaux d'exemple. 100 % local (back-end « décidé plus tard »), couture `Boards` prête pour Cloudflare/Supabase. Commit `4d44d92`.
- **Publication en ligne** 🌍 : dépôt public **AwemA-Games** créé + poussé, **GitHub Pages activé** → **https://codescooper.github.io/AwemA-Games/** (redirection racine vers `engine/`). Manifest + SW + icône SVG servis avec le bon type MIME (vérifié en ligne) → la **PWA est réellement installable**. Commit `306fca7`.
- **PWA installable** : `manifest.webmanifest` + service worker (`sw.js`, cache `awema-v1` *cache-first* hors-ligne de tout l'app-shell) + icône SVG maskable, branchés sur le menu (bouton « Installer », enregistrement défensif hors `file://`). Vérifié sur localhost (manifest, SW scope `/`, 14 entrées cachées, ressource servable hors-ligne, 0 erreur). Commit `195e0fa`.
- **Nouveau jeu D — « Tam-Tam »** : combat rythmique (3 danses 92→132 BPM, jugements ±75/160 ms, combos ×4, transe). Synchro audio par construction (une seule horloge WebAudio pour sons + esprits), percussions 100 % procédurales. Vérifié E2E (victoire/défaite, jugements exacts, 0 erreur). **File A-B-C-D terminée.** Commit `ac1b6f4`.
- **Nouveau jeu C — « Awalé Royal »** : roguelike de combos façon Balatro (48 graines en 4 familles Or/Sel/Cola/Mil, 9 combos culturels, 10 gri-gris, proverbes, 12 enchères, 5 malus de chef). Équilibrage validé par simulation (IA gloutonne : 2 victoires / 8, morts enchères 9–12). Commit `5340583`.
- **Nouveau jeu B — « Banco — Démolition »** : puzzle à **vraie physique** (Verlet + contraintes, casse à l'impact, soudage des pièces, poutres colorées par la contrainte, poussière, son procédural). 7 chantiers, étoiles, sauvegarde. Vérifié (stabilité au repos 0 casse, victoire/défaite E2E, 1,8 ms/frame). Commit `949cf1b`.
- **Robustesse plateforme** : auto‑guérison de la taille du canvas sur tous les jeux canvas (panneau replié → `innerWidth=2`), bandeau d'erreur visible, boucle insensible aux exceptions (Harmattan). Commits `0388793`, `8563f91`, `baa8ab5`.
- **Nouveau jeu A — « Harmattan »** : bullet‑heaven / survie en horde (armes automatiques, montée de niveau + builds, 4 armes, boss, glow/particules/screen‑shake). Vérifié (équilibrage OK : niv 15 / 4 armes / survie >2 min en simulation), ajouté au menu + README. Commit `ba21b6a`.
- **L'Âge des Sables** (RTS) enrichi : son procédural, commerce de caravanes, victoire par Merveille + écran de score, brouillard de guerre + éclaireurs, arbre d'améliorations + passe d'équilibrage, navigation A\* + formation anti-empilement, démolition / portails.
- **Rendu pixel art animé** : basse résolution + nearest-neighbor, contours noirs, réglable (touches `[ ]` / `P`), défaut « max netteté » adapté au DPR.
- **Nouveau jeu — Échecs à l'Ivoirienne** : pièces inspirées de la culture ivoirienne, moteur complet **validé par perft** (20/400/8902/197281), IA minimax α-β.
- **Nouveau — L'Atelier** : tutoriel interactif (bac à sable de code en direct, mentor IA, XP/badges) pour apprendre à coder en créant les jeux.
- **Menu** (`engine/index.html`) et **README** à jour : 5 entrées (Atelier, Lignées, Sables, Échecs, Voraces).

## 🚧 En cours
- [ ] **Multijoueur — vision entièrement PROTOTYPÉE en local** : ① classements/Indice ✅ (9 jeux) · ② hub présence+chat+salles ✅ · ③ monde ouvert (Le Village) ✅. Reste **le passage en ligne** : remplacer les coutures simulées (`Cloud.*`, bots de `salon.html`/`monde.html`) par un vrai client temps réel. **Décision d'infra requise.**

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
**Brancher le vrai réseau** : choisir l'infra (**Cloudflare recommandé** — Pages+Workers+D1+Durable Objects/PartyKit — vs Supabase), puis (a) classement mondial réel (remplacer le corps de `Cloud.*` par `fetch()`), (b) présence/chat temps réel dans Le Village, (c) **anti-triche minimal** sur les scores. Commencer petit : juste le **classement en ligne** d'abord.
→ *Justif : la vision est validée en prototype (zéro coût) ; c'est le seul pas qui la rend réellement multijoueur, et il était jusqu'ici différé faute de décision d'infra. À cadrer avec l'utilisateur (compte, coût, modération chat, RGPD).*

## 🧱 Décisions verrouillées
- **100 % local / offline-first** : chaque jeu = 1 fichier HTML autonome, JS vanilla, **zéro dépendance runtime**, lançable au double-clic.
- **Ambition graphique** : explorer et **pousser le graphisme et le réalisme au maximum des performances du navigateur** (Canvas/WebGL, pixel art, effets, animation) — sans rompre l'offline ni la légèreté.
- **Solo / bootstrap** (<50 k€), **F2P éthique** (pas de pay-to-win, pas de loot boxes).
- Cible : **PWA + smartphones modestes + marchés émergents**.
- Moteur de *Lignées* **pur & déterministe** (`engine/prototype.ts`), destiné à migrer côté serveur sans réécriture (ADR-1).
- Cap produit long terme : **« Lignées »** (stratégie asynchrone persistante) ; les autres jeux élargissent la plateforme et le savoir-faire.

## ⚠️ Dettes / risques connus
- **Duplication du moteur** `resolveTick` entre les fichiers *Lignées* (`conseil.html` / `prototype.*`) — à extraire dans un `engine.js` partagé au passage à un vrai build.
- **Pas encore de build ni de PWA** : on en est au « double-clic » (aucun manifest / service worker).
- **Tension perf vs légèreté** : pousser le réalisme graphique au max sans casser l'offline ni alourdir (rester en Canvas/WebGL natif, sans moteur lourd).
- **Multijoueur = rupture d'architecture** (serveur, réseau, état partagé) ; le temps réel « tue le budget serveur » d'un solo (cf. `docs/`) → privilégier l'**asynchrone**.
- ~~Push GitHub en attente~~ → **fait** : publié sur https://codescooper.github.io/AwemA-Games/ (Pages sert depuis `main`/racine ; le menu vit sous `/engine/`).
- **Distribution PWA pure fragile** (fermeture des Meta Instant Games en 2026, cf. étude de marché).
