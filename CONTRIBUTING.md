# Contribuer à AwemA 🤝

Bienvenue — et **akwaba** aux AfroCodeurs ! AwemA est une borne d'arcade web, solo/bootstrap,
**F2P éthique**. On code en **JavaScript vanilla**, sans build, sans framework : c'est volontaire
(frugalité, marchés émergents, téléphones modestes, hors-ligne d'abord).

## Mise en route
```bash
git clone https://github.com/codescooper/AwemA-Games.git
cd AwemA-Games
npm install          # uniquement des outils de dev (tsx) — AUCUNE dépendance runtime
npm run serve        # → http://127.0.0.1:8780/  (le cabinet)
npm run check        # garde-fou de cohérence — DOIT être vert avant toute PR
```
Pas de Node ? Double-clique simplement `engine/games/<jeu>.html` : chaque jeu est autonome.

## Les règles verrouillées (non négociables)
1. **1 jeu = 1 fichier HTML autonome**, lançable au **double-clic `file://`** et **hors-ligne**.
2. Le code partagé est inclus en **`<script src>` classique** — **jamais d'`import`/ES module** (ça casse `file://`)
   — et appelé de façon **gracieuse** : `var n = (window.AWEMA && AWEMA.name) ? AWEMA.name() : (localStorage.getItem("awema_player")||"Toi");`
   Un jeu doit rester jouable même si `shared/awema.js` ne se charge pas.
3. **Zéro dépendance runtime** côté jeu (pas de CDN, pas de npm). `tools/` peut être ESM/Node.
4. Tout changement d'un fichier du *shell* (cabinet, catalogue, shared, jeu listé) ⇒ **bumper `AWEMA.CACHE`** dans `engine/catalog.js`.

## Ajouter un jeu (la « règle de croissance »)
Un nouveau jeu n'est **terminé** que quand **tout** ceci est fait (sinon `npm run check` échoue) :
1. **Le jeu** : `engine/games/<id>.html`, autonome, qui sauve son meilleur score en `localStorage`
   (clé `<id>_best`, écrite en `Math.max(...) + try/catch`).
2. **Le catalogue** : une entrée dans `engine/catalog.js` (`AWEMA.GAMES`) — `id, name, emoji, file,
   category, tagline, multiplayer, ws, score:{key,target,unit,fmt}, atelier, theme, status`.
   ⚠️ `score.target` **doit** être identique à `GAME_TARGETS[id]` du backend (parité de l'Indice).
3. **L'Atelier** (si le jeu enseigne une méthode) : un bloc `atelier:{ keyMethod, lessons }` dans l'entrée
   catalogue **et** la/les leçon(s) correspondantes dans `engine/games/atelier.html` (voir
   [`docs/atelier-tutoriel.md`](docs/atelier-tutoriel.md) — côté Vibecoding, le piège enseigné doit être un **vrai** piège IA du jeu).
4. **Le cache** : bumper `AWEMA.CACHE` dans `catalog.js`.
5. `npm run check` **vert**, et vérifié **à la main dans un vrai navigateur** (double-clic `file://` + servi en http).

Le SHELL du service worker, le menu (cabinet) et les classements se mettent à jour **automatiquement**
depuis le catalogue : tu n'as **qu'une** liste à toucher.

## La couche partagée `shared/awema.js` (`window.AWEMA`)
À utiliser dans les jeux (toujours via le repli gracieux) :
- **Identité** : `AWEMA.name()`, `AWEMA.setName(n)`, `AWEMA.uid()`, `AWEMA.promptName(cb)`.
- **Classement / Indice** : `AWEMA.board.submit/global/game`, `AWEMA.indiceOf`, `AWEMA.tierOf`, `AWEMA.localScores`.
- **Duel temps réel** (transport) : `AWEMA.duel(canal, { open, msg, close, fail })` → `{ send, close }`.
  Ouvre `wss://…/ws/<canal>` ; **garde ta propre machine d'états** dans `msg(obj)`.
- **Navigation** : `AWEMA.nav({ back:"../index.html" })` injecte une barre retour + profil.

## ✨ Bonnes premières contributions (good first issues)
La couche partagée existe ; les jeux peuvent l'**adopter progressivement** — parfait pour débuter :
- **Brancher un jeu sur l'identité partagée** : remplacer le `myName()/myUid()` local par `AWEMA.name()/uid()`
  (repli inline conservé). Jeux concernés : `voraces, tamtam, awale, echecs, monde, conseil, idees`.
- **Brancher un duel sur `AWEMA.duel`** : remplacer le `new WebSocket(...)` copié-collé par `AWEMA.duel(canal, …)`
  en réutilisant le `onDuelMsg` existant. Jeux : `voraces (canal "voraces"), tamtam ("tamtam"), awale/echecs ("chess")`.
  **Vérifier le duel à 2 onglets** après coup.
- **Injecter `AWEMA.nav`** là où la barre « ≡ Menu » est codée à la main.
Ces tâches sont **sûres** (repli gracieux), bien cadrées, et n'altèrent pas le gameplay.

## Workflow de PR
1. Branche depuis `main` : `git checkout -b feat/mon-jeu`.
2. `npm run check` **vert** + test navigateur (file:// **et** http) + (si multijoueur) **duel à 2 onglets**.
3. Bump du cache SW si tu as touché un fichier du shell.
4. Ouvre la PR et coche la checklist du template.
Style : imite le code autour (commentaires en français, pas de dépendance, défensif). Sois bienveillant en revue.

## Signaler un bug / proposer un jeu
- 🐛 Bug ou retour de test → **Issues** (gabarits *bug* / *playtest*).
- 💡 Idée de jeu → la page **Doléances** in-app (vote communautaire) ou une issue.

Merci de faire grandir la borne 🪘
