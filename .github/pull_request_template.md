<!-- Merci pour ta contribution à AwemA 🪘 -->

## Ce que fait cette PR


## Checklist
- [ ] `npm run check` est **vert** (cohérence catalogue / SW / classements / atelier / parité / liens / stubs).
- [ ] Testé **dans un vrai navigateur** : en `file://` (double-clic) **ET** servi en http (`npm run serve`).
- [ ] Rechargé **hors-ligne** (DevTools → Offline) : la borne / le jeu répond.
- [ ] Si multijoueur : **duel testé à 2 onglets** (appariement, fluidité, issue cohérente, repli solo).
- [ ] Si j'ai touché un fichier du *shell* (cabinet, catalogue, shared, ou un jeu listé) : **`AWEMA.CACHE` bumpé** dans `engine/catalog.js`.
- [ ] **Nouveau jeu** ? → entrée dans `catalog.js` + (si pertinent) cas Atelier + parité `score.target` = backend `GAME_TARGETS`.
- [ ] Respect des **règles verrouillées** : 1 fichier autonome, `<script>` classiques (pas d'ES module), zéro dépendance runtime, appels `AWEMA.*` avec repli gracieux.
- [ ] 0 erreur dans la console.
