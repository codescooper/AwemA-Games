# STATUS — AWEMA Light Games Prototype
> Dernière MAJ : 2026-06-10

## 🎯 Objectif de la phase actuelle
Explorer et prototyper des mini-jeux 100 % locaux (HTML/Canvas, JS vanilla, zéro dépendance) en repoussant le graphisme et le réalisme au maximum des performances du navigateur. Horizon : installation en PWA, puis multijoueur.

## ✅ Fait (cette semaine)
- **L'Âge des Sables** (RTS) enrichi : son procédural, commerce de caravanes, victoire par Merveille + écran de score, brouillard de guerre + éclaireurs, arbre d'améliorations + passe d'équilibrage, navigation A\* + formation anti-empilement, démolition / portails.
- **Rendu pixel art animé** : basse résolution + nearest-neighbor, contours noirs, réglable (touches `[ ]` / `P`), défaut « max netteté » adapté au DPR.
- **Nouveau jeu — Échecs à l'Ivoirienne** : pièces inspirées de la culture ivoirienne, moteur complet **validé par perft** (20/400/8902/197281), IA minimax α-β.
- **Nouveau — L'Atelier** : tutoriel interactif (bac à sable de code en direct, mentor IA, XP/badges) pour apprendre à coder en créant les jeux.
- **Menu** (`engine/index.html`) et **README** à jour : 5 entrées (Atelier, Lignées, Sables, Échecs, Voraces).

## 🚧 En cours
- [ ] Rien de non committé — repo propre, branche `main`. Le prochain jeu n'a pas encore démarré.

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
Ajouter **un nouveau jeu** qui présente une **mécanique ou une expérience de jeu inédite** dans le navigateur, en poussant le rendu (graphisme + réalisme) au maximum.
→ *Justif : on est en phase d'exploration/prototypage ; un jeu de plus éprouve la plateforme et l'ambition graphique. PWA puis multijoueur restent le cap, abordés ensuite.*

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
