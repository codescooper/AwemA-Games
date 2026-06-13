# STATUS — AWEMA Light Games Prototype
> Dernière MAJ : 2026-06-13

## 🎯 Objectif de la phase actuelle
Explorer et prototyper des mini-jeux 100 % locaux (HTML/Canvas, JS vanilla, zéro dépendance) en repoussant le graphisme et le réalisme au maximum des performances du navigateur. Horizon : installation en PWA, puis multijoueur.

## ✅ Fait (cette semaine)
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
- [ ] Rien de non committé — repo propre, **publié et installable** (9 jeux + atelier + PWA en ligne). Cap restant : **multijoueur (asynchrone)**.

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
**Démarrer le multijoueur asynchrone** (le cap) : choisir l'approche (échange d'état sans serveur — lien/fichier/QR — vs backend léger), puis une **première tranche verticale sur un seul jeu** (probablement *Lignées*, dont le moteur `prototype.ts` est déjà pur & déterministe → migration serveur sans réécriture, ADR-1).
→ *Justif : seul cap restant ; commencer par un prototype étroit (1 jeu, 2 joueurs en tour-par-tour async) évite la rupture d'archi décrite dans les risques ; **décision d'approche à valider avec l'utilisateur** avant de coder.*

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
