# CLAUDE.md — AWEMA Light Games Prototype

## Suivi d'avancement
- Début de session : lire STATUS.md avant toute action. Source de vérité du
  projet, pas l'historique de conversation.
- Fin de tâche significative : mettre STATUS.md à jour (déplacer le fait,
  réécrire la prochaine action unique). Jamais plus d'une prochaine action.
- Ne pas re-débattre la section "Décisions verrouillées" sans demande explicite.
- État d'avancement → commande /awema-dev-status.

## Atelier (tutoriel `engine/atelier.html`)
- Le tutoriel est **bi-piste** : `🧑‍💻 Coding` (écrire le code) et `🪄 Vibecoding`
  (diriger + vérifier une IA). Chaque leçon a deux sous-objets `coding` et `vibecoding`.
- **Règle de croissance : tout nouveau jeu = +1 étude de cas bi-piste** dans `atelier.html`
  (module `jeux`) via le gabarit en tête du `<script>` + entrée dans `ATELIER_CASES`.
  Côté Vibecoding, le piège enseigné doit être un **vrai piège IA documenté** du jeu (issu de la revue de code / cartographie, jamais inventé).
- `starter`/`solution` limités aux **primitives du bac à sable** (print/clear/rand/loop/onKey/
  onClick/ctx/W/H ; pas de DOM/import/fetch/rAF). Ne jamais mettre dans un `starter` un
  commentaire/texte contenant le motif cherché par le `check` (regex sur `api.src`).
- Toute modif d'`atelier.html` ⇒ **bumper le cache** `engine/sw.js` (`awema-vXX → vXX+1`).
- Guide complet : `docs/atelier-tutoriel.md`.
