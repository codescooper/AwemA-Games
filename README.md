# 🎮 AwemA — Borne d'arcade

> Une **borne d'arcade web** de mini-jeux, **100 % locale & hors-ligne** (PWA), inspirée des
> empires marchands précoloniaux d'Afrique. Vanilla JS, **zéro dépendance runtime**, chaque jeu
> tient dans **un seul fichier HTML** lançable au double-clic.

**▶ Jouer maintenant : https://codescooper.github.io/AwemA-Games/**
&nbsp;·&nbsp; installable sur téléphone (PWA) &nbsp;·&nbsp; fonctionne sans connexion.

---

## La borne en un coup d'œil

Un **meuble** (le *cabinet* — `engine/index.html`) orchestre des **cartouches** (les jeux, chacun
autonome) et des **services partagés** (identité, classement, multijoueur). **Une seule liste**
— le **catalogue** (`engine/catalog.js`) — alimente le cabinet, le cache hors-ligne, les
classements et l'atelier : ajouter un jeu = ajouter une entrée.

| Catégorie | Jeux |
|-----------|------|
| 🕹️ Arcade & action | Voraces (duel live) · Harmattan |
| 🥁 Rythme | Tam-Tam (duel live) |
| 🧩 Puzzle | Banco — Démolition (physique) |
| 🧠 Stratégie | L'Âge des Sables (RTS) · Lignées (async) |
| ♟️ Plateau & cartes | Échecs à l'Ivoirienne (duel) · Awalé/Oware (duel) · Awalé Royal (roguelike) |
| 🎓 Apprendre | L'Atelier — créer les jeux (pistes 🧑‍💻 Coding / 🪄 Vibecoding) |
| 🌍 Social | Le Village (présence + chat) · Le Grand Conseil (Indice & classement mondial) · Doléances |

L'**Indice AwemA** synthétise ta maîtrise sur tous les jeux en un **rang** (Voyageur → Légende des griots),
avec un **classement mondial** réel (serveur) et un repli local hors-ligne.

## Architecture

```
engine/                front (GitHub Pages sert depuis la racine → /engine/…)
  index.html           LE CABINET (shell, piloté par le catalogue)
  catalog.js           SOURCE DE VÉRITÉ unique (window.AWEMA.GAMES) — classic + importScripts
  sw.js                service worker (cache hors-ligne, SHELL dérivé du catalogue)
  manifest.webmanifest  icon.svg  .nojekyll(racine)
  shared/              services partagés (classic <script>, file://-safe, gracieux)
    awema.js           identité, client classement (Cloud→Net→Sim) + Indice, duel transport, nav
    analytics.js  pow.js  lignees-engine.js
  games/               un fichier HTML autonome par jeu (les "cartouches")
  games/_archive/      prototypes retirés (non servis depuis le cabinet)
  <jeu>.html           stubs de redirection (anciennes URLs → games/<jeu>.html)
backend/               serveur Node (node:http + ws) — classement, présence/chat, duels, anti-triche
                       hébergé sur Railway. CORS par origine. Anti-bot PoW (Hashcash).
tools/                 check.mjs (vérif cohérence), serve.mjs (serveur statique dev)
docs/                  études, spec, atelier-tutoriel, kit de test…
```
Détails serveur : [`backend/README.md`](backend/README.md). Détails Atelier : [`docs/atelier-tutoriel.md`](docs/atelier-tutoriel.md).

## Lancer en local

**Option 1 — zéro install :** double-clic sur `engine/games/<jeu>.html` (chaque jeu est autonome),
ou ouvre `engine/index.html` (le cabinet). *(Le service worker / l'installation PWA exigent http(s) ;
en `file://` les jeux marchent quand même, sans cache hors-ligne.)*

**Option 2 — serveur de dev (recommandé) :**
```bash
npm run serve         # → http://127.0.0.1:8780/  (le cabinet)   [tools/serve.mjs, zéro dépendance]
npm run check         # vérifie la cohérence de la borne (catalogue/SW/classements/atelier/liens)
```
Sous Windows tu peux aussi double-cliquer `jouer.cmd`.

## Règles verrouillées (à respecter pour toute contribution)
1. **1 jeu = 1 fichier HTML autonome**, lançable au **double-clic `file://`**, **hors-ligne**.
2. Le code partagé est inclus en **`<script src>` classique** (jamais d'ES modules — ils cassent `file://`),
   et appelé de façon **gracieuse** (repli inline) : un jeu reste jouable même si `shared/awema.js` ne charge pas.
3. **Zéro dépendance runtime** côté jeu (le dossier `tools/` peut être ESM/Node, pas les jeux).
4. Tout changement du shell ⇒ **bumper `AWEMA.CACHE`** dans `catalog.js` (cache du service worker).

## Contribuer & tester
- 🛠️ **Devs (AfroCodeurs bienvenus !)** → [`CONTRIBUTING.md`](CONTRIBUTING.md) (comment ajouter un jeu, conventions, *good first issues*).
- 🧪 **Testeurs** → [`TESTING.md`](TESTING.md) (que tester, comment remonter un retour).
- 🤝 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Licence
**AGPL-3.0** ([`LICENSE`](LICENSE)) : libre et contributif ; tout fork ou service en ligne dérivé doit
rester open-source. © les contributeurs d'AwemA.
