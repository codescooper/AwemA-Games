# CLAUDE.md — AWEMA Light Games Prototype

## Suivi d'avancement
- Début de session : lire STATUS.md avant toute action. Source de vérité du
  projet, pas l'historique de conversation.
- Fin de tâche significative : mettre STATUS.md à jour (déplacer le fait,
  réécrire la prochaine action unique). Jamais plus d'une prochaine action.
- Ne pas re-débattre la section "Décisions verrouillées" sans demande explicite.
- État d'avancement → commande /awema-dev-status.

## Architecture (borne d'arcade)
- Front dans `engine/` (GitHub Pages sert depuis la RACINE → URLs publiques `/engine/…`).
  **Catalogue unique = `engine/catalog.js`** (`window.AWEMA.GAMES`) : SOURCE DE VÉRITÉ qui alimente
  le cabinet (`engine/index.html`), le SHELL du service worker (`sw.js` via `importScripts`), les
  classements et l'Atelier. **Un nouveau jeu = +1 entrée dans `catalog.js`** (+ `engine/games/<id>.html`).
- Jeux = `engine/games/*.html`, chacun **autonome** (double-clic `file://`, hors-ligne). Services
  partagés = `engine/shared/` (`awema.js` : identité, classement Cloud/Net/Sim + Indice, duel transport
  `AWEMA.duel`, nav ; + analytics/pow/lignees-engine). **Scripts `<script>` classiques uniquement**
  (jamais d'ES module — casse `file://`), appelés avec repli gracieux.
- Anciennes URLs `engine/<jeu>.html` = **stubs de redirection** vers `games/` (ne PAS supprimer).
  `engine/games/_archive/` = prototypes retirés (salon, cinema, prototype.ts ; non servis).
- `score.target` du catalogue DOIT == `GAME_TARGETS[id]` du backend (parité de l'Indice).
- **Vérif obligatoire avant commit : `node tools/check.mjs` (doit dire GO).** `npm run serve` = serveur dev.
- Onboarding : `README.md`, `CONTRIBUTING.md` (devs/AfroCodeurs), `TESTING.md` (testeurs). Licence **AGPL-3.0**.

## Atelier (tutoriel `engine/games/atelier.html`)
- Le tutoriel est **bi-piste** : `🧑‍💻 Coding` (écrire le code) et `🪄 Vibecoding`
  (diriger + vérifier une IA). Chaque leçon a deux sous-objets `coding` et `vibecoding`.
- **Règle de croissance : tout nouveau jeu = +1 étude de cas bi-piste** dans `atelier.html`
  (module `jeux`) via le gabarit en tête du `<script>` + entrée dans `ATELIER_CASES`.
  Côté Vibecoding, le piège enseigné doit être un **vrai piège IA documenté** du jeu (issu de la revue de code / cartographie, jamais inventé).
- `starter`/`solution` limités aux **primitives du bac à sable** (print/clear/rand/loop/onKey/
  onClick/ctx/W/H ; pas de DOM/import/fetch/rAF). Ne jamais mettre dans un `starter` un
  commentaire/texte contenant le motif cherché par le `check` (regex sur `api.src`).
- Toute modif d'un fichier du *shell* ⇒ **bumper** `AWEMA.CACHE` dans `engine/catalog.js` (`awema-vXX → vXX+1`).
- Guide complet : `docs/atelier-tutoriel.md`.
