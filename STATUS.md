# STATUS — AWEMA Light Games Prototype
> Dernière MAJ : 2026-06-12

## 🎯 Objectif de la phase actuelle
Explorer et prototyper des mini-jeux 100 % locaux (HTML/Canvas, JS vanilla, zéro dépendance) en repoussant le graphisme et le réalisme au maximum des performances du navigateur. Horizon : installation en PWA, puis multijoueur.

## ✅ Fait (cette semaine)
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
- [ ] File des 4 jeux (veille tendances 2025‑2026), livrés un par un : **A — Harmattan ✅** · **B — Banco ✅** · **C — Awalé Royal ✅**. Reste : **D — Tam‑Tam** (combat rythmique).

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
Construire et committer **le jeu D — « Tam‑Tam »** (combat rythmique : frapper le djembé en tempo, le monde pulse à la musique, audio 100 % WebAudio procédural).
→ *Justif : dernier jeu de la file validée ; gardé pour la fin car le plus risqué (synchronisation audio/timing) — les 3 autres sont livrés et sûrs.*

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
- **Push GitHub** (dépôt public « AwemA-Games ») en attente d'un `gh auth login` ; rien n'est encore poussé.
- **Distribution PWA pure fragile** (fermeture des Meta Instant Games en 2026, cf. étude de marché).
