# L'Atelier — tutoriel bi-piste (Coding / Vibecoding) & règle de croissance

`engine/atelier.html` est le tutoriel interactif d'AwemA : il apprend à **créer les jeux
de la plateforme**, en **deux pistes au choix** (basculables par onglet, à chaque étape) :

- **🧑‍💻 Coding** — pour qui veut **apprendre à coder** : on écrit le vrai JavaScript dans
  le bac à sable, on comprend le code et **les méthodes réelles** des jeux d'AwemA.
- **🪄 Vibecoding** — pour qui veut **avancer en dirigeant une IA de code** : on apprend à
  **bien gérer une IA** (spécifier, vérifier, corriger) et **les concepts EN FAISANT**.

Mono‑fichier, 100 % local/hors‑ligne, mentor « Awa », XP/badges, progression `localStorage`
(`awema_atelier_v1`, qui retient aussi la piste choisie). Aucune dépendance.

## Comment c'est construit
- `COURSE` = modules → leçons. **Chaque leçon** porte un `concept` commun + deux sous‑objets
  **parallèles** : `coding` et `vibecoding`. Champs communs : `mode` (`code|canvas|anim`, purement descriptif ; une leçon de simple lecture = sans `check`, le bouton « ✓ Compris » apparaît alors),
  `intro` (phrase d'Awa), `teach` (HTML), `starter`, `task`, `hint`, `solution`, `check(api)`.
  La piste `vibecoding` ajoute `missionType`, `examplePrompt`, `whatToVerify` (le « prompt »
  affiché devient une *mission de pilotage IA* + une check‑list « À vérifier »).
- `renderLesson()` lit `viewOf(l)` = la piste courante (`prog.track`, défaut `code`). **Migration
  douce** : si une leçon n'a pas de `vibecoding`, l'onglet retombe sur `coding` — rien ne casse.
- La **progression est unifiée par `lessonId`** : valider dans n'importe quelle piste marque ✅ et
  crédite l'XP **une seule fois** ; un liseré invite à essayer l'autre piste.
- `ATELIER_CASES` (en tête du `<script>`) = **registre déclaratif** des jeux déjà couverts
  (`{ gameId, keyMethod, lessons }`) → dette visible d'un coup d'œil.

## Le contrat du bac à sable (à respecter dans tout `starter`/`solution`)
Le code n'a accès **qu'à** : `print(...)`, `clear()`, `rand(a,b)`, `loop(fn(dt))`,
`onKey(fn(key))`, `onClick(fn(x,y))`, et les variables `ctx` (2D), `W=320`, `H=200`.
**Interdit** : DOM (`document`, `addEventListener`), `import`, `fetch`,
`requestAnimationFrame` brut (utiliser `loop`). `Math`/`JSON` sont disponibles.
`check(api)` reçoit `api = { logs:[], calls:Set, error, src, W, H, ctx, pix(x,y) }`.

> ⚠️ **Piège des `check` par regex sur `api.src`** : `api.src` = **tout** le contenu de
> l'éditeur, **commentaires et `print` inclus**. Ne mets jamais dans un `starter` un commentaire
> ou un texte qui contient le motif recherché par le `check` (ex. `state = "gather"`, `>>3`,
> `&7`, `break`, `document.`) : la regex matcherait la prose et fausserait la validation.
> Décris la consigne **sans** le token littéral.

## Règle de croissance — « nouveau jeu = nouvelle étude de cas »
Un nouveau jeu **n'est pas terminé** tant que son étude de cas bi‑piste n'est pas ajoutée à
l'Atelier (module `jeux`). Pour chaque nouveau jeu :

1. **Repérer LA méthode authentique enseignable** (`keyMethod`) dans le *vrai* code : boucle à
   `dt` borné, fonction pure, machine à états, structure de données, formule de stat bornée,
   autorité serveur… (jamais une version inventée).
2. **Réduire** en une démo n'utilisant **que** les primitives du bac à sable.
3. **Piste Coding** : `teach` (le « pourquoi » + la méthode) + `task` + un `check` **objectif**
   (sur `logs`/`calls`/`src`/`pix`), avec un `starter` à compléter (un TODO) et une `solution`.
4. **Piste Vibecoding** : la boucle **Spécifier → Prédire → Coller & Lancer → Vérifier → Itérer**,
   avec **1 à 3 PIÈGES IA RÉELS** du jeu (issus de la revue de code / cartographie, jamais
   inventés). Le `starter` = le code « écrit par l'IA » **volontairement bugué** ; le `check`
   valide la correction. Renseigne `missionType`, `examplePrompt`, `whatToVerify`.
5. **Inscrire** le jeu dans `ATELIER_CASES`.
6. **Bumper le cache** du service worker (`engine/sw.js` : `awema-vXX → vXX+1`) — sinon les
   visiteurs gardent l'ancienne version.

Un **gabarit copier‑coller** complet vit en commentaire en tête du `<script>` de
`engine/atelier.html` (là où on édite).

## Vérifier avant de livrer (sans navigateur)
La preview locale (`server.ps1`) se **fige sur les grosses pages** → on vérifie en **Node** :
1. **Syntaxe** : compiler le `<script>` inline (`new vm.Script(code)`).
2. **Structure** : extraire `COURSE`, vérifier que chaque leçon a `coding` + `vibecoding`
   (champs requis) et que chaque `check` rend un booléen sans jeter.
3. **Runtime** : reproduire le bac à sable (`new Function(...)` + un `ctx` mock) et, pour chaque
   leçon, exécuter la **solution** (→ `check` doit être **vrai**) et le **starter bugué**
   (→ `check` doit être **faux**). C'est ce qui prouve que chaque exercice est réel et que le
   `check` correspond bien à sa solution.

*(Les scripts de vérif sont jetables : on les recrée au besoin, on ne les commite pas.)*
