# 🧪 Tester AwemA

Merci de tester la borne ! Pas besoin d'être technique — ton **ressenti** est ce qui compte le plus.

## Accès
- **En ligne :** https://codescooper.github.io/AwemA-Games/ (sur ordi ou téléphone).
- Sur téléphone, tu peux **« Ajouter à l'écran d'accueil »** (PWA) : ça s'installe comme une appli et marche **hors-ligne**.
- Pseudo : au premier classement, choisis un nom (modifiable en cliquant dessus dans la barre du haut).

## Ce qu'on veut savoir (pour chaque jeu essayé)
Pas de bonne réponse — sois honnête :
1. **Compréhension** : as-tu compris le but **sans explication** ? Qu'est-ce qui t'a perdu ?
2. **Plaisir** : c'était amusant / ennuyeux / frustrant ? À quel moment précis ?
3. **Difficulté** : trop facile / juste / trop dur ? Où as-tu décroché ?
4. **Bugs** : quelque chose s'est mal affiché, bloqué, ou figé ? (note le téléphone/navigateur)
5. **Rétention** : aurais-tu envie d'y **revenir demain** ? Pourquoi (pas) ?

👉 Joue **5–10 min par jeu**, sur **ton vrai téléphone** si possible (c'est la cible).

## Tester un duel en ligne (Voraces, Tam-Tam, Échecs, Awalé)
Il faut **deux joueurs** (ou deux onglets / deux téléphones) :
1. Ouvre le jeu **des deux côtés**, clique **« Duel »** sur chacun.
2. Vérifie : l'appariement se fait, la partie démarre des deux côtés, c'est **fluide**, l'**issue est cohérente**
   (le gagnant d'un côté = le perdant de l'autre), et si l'un quitte, l'autre **retombe en solo** proprement.

## Comment remonter un retour
- 🐛 **Bug** → ouvre une *issue* (gabarit **« Bug »**) : dis le jeu, le téléphone/navigateur, et ce qui s'est passé.
- 🗣️ **Ressenti de session** → *issue* (gabarit **« Playtest »**) : réponds aux 5 questions ci-dessus.
- 💡 **Idée / jeu manquant** → la page **Doléances** dans la borne (tu votes, la communauté priorise).

## Pour les devs : vérif rapide avant de livrer
La preview navigateur peut se figer sur les grosses pages → on vérifie en **Node + serveur local** :
```bash
npm run check                 # cohérence catalogue/SW/classements/atelier/parité/liens/stubs → doit dire GO
npm run serve                 # http://127.0.0.1:8780/
# smoke : codes HTTP attendus = 200
for p in "" engine/index.html games/voraces.html voraces.html catalog.js shared/awema.js; do \
  curl -s -o /dev/null -w "%{http_code} /$p\n" "http://127.0.0.1:8780/$p"; done
```
Puis, **dans un vrai navigateur** : ouvrir le cabinet → chaque carte → le jeu charge, « ≡ Menu » revient,
0 erreur console ; recharger **hors-ligne** (DevTools → Offline) → la borne répond ; tester un **duel à 2 onglets**.
Checklist complète : voir le gabarit de Pull Request.
