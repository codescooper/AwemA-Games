# « Lignées » — Maquette jouable de la boucle quotidienne

**But :** rendre l'Étape 1 (prototype papier) directement testable. Ce document décrit le jeu assez précisément pour qu'on puisse le jouer **sur papier, à 5-10 personnes, sans une ligne de code**, et vérifier que la boucle est fun et fidélisante.

**Thème (arbitré) :** monde fictif inspiré des **empires marchands précoloniaux d'Afrique** (Sahel/Trans-Saharien + côte swahilie). Décor de **cités-États, caravanes, or & sel, alliances** — au service du cœur *diplomatie + économie*.

---

## 1. Ce qu'incarne le joueur

Tu diriges une **Maison** (lignée) dans une région contestée, **Le Carrefour des Sables** — un réseau de cités, d'oasis et de ports reliés par des routes caravanières. Tu n'es pas un général : tu es un **chef de dynastie** qui prospère par le commerce, les alliances et la ruse, pas par les réflexes.

## 2. Modèle d'état d'une Maison (volontairement minimal)

| Élément | Rôle |
|---|---|
| **Or** | monnaie : développer, lever des troupes, commercer |
| **Grain** | nourrit la population → plafonne ton armée (l'économie limite la guerre) |
| **Guerriers** | force militaire (lever coûte grain + or) |
| **Possessions** | 1 à N cités/oasis/ports sur la carte partagée (territoire) |
| **Prestige** | **le score** (condition de victoire de saison) |
| **Réputation** | confiance diplomatique **publique** : honorer ses traités la monte, trahir la baisse |
| **Traités** | liens binaires avec d'autres Maisons (voir §4) |

> 3 ressources, 2 jauges de standing. C'est tout. La profondeur vient des **interactions entre joueurs**, pas du nombre de variables.

## 3. Les ordres quotidiens (3 créneaux d'action / jour)

Chaque jour tu disposes de **3 créneaux** (tes officiers). Tu choisis 3 actions parmi :

1. **Développer** une possession — Or → +revenu (or ou grain) ou +niveau.
2. **Lever** — Grain + Or → +Guerriers (plafonné par ton grain).
3. **Caravane (commerce)** — envoie de l'Or sur une route → profit si la route est **sûre/alliée**, risque d'interception si elle traverse un territoire **hostile**. *Le commerce dépend de la diplomatie et du contrôle de la carte.*
4. **Marcher / Razzier** — envoie des Guerriers sur une possession voisine → conteste le territoire (résolu la nuit).
5. **Fortifier** — Or → +défense d'une possession.
6. **Émissaire** — diplomatie : proposer/rompre un traité, demander de l'aide, menacer.

> 3 créneaux pour 6 options = **tension de choix** chaque jour, sans micro-gestion.

## 4. La diplomatie (la glu sociale)

- **Alliance** : groupe nommé, chat dédié, **un objectif commun** (tenir une cité-clé du Carrefour).
- **Traités** (états simples) : **non-agression** · **défense mutuelle** (tes alliés peuvent renforcer ta défense la nuit) · **pacte commercial** (routes sûres entre vous).
- **Trahison** : rompre un traité est permis — mais **affiché publiquement** et **baisse ta Réputation**. La trahison a un coût social et alimente le drame.

## 5. L'événement du jour (le moment partageable, type Wordle)

Chaque jour, **un événement frappe tout le Carrefour**, et chaque Maison choisit sa réponse. **L'agrégat des choix de tous** infléchit le monde du lendemain → un sujet de discussion quotidien (« t'as fait quoi pour la sécheresse ? »).

**Exemple A — L'Harmattan (sécheresse) :**
- *Thésauriser le grain* → sûr, mais **−Réputation** si beaucoup affament.
- *Partager avec les voisins* → **+Réputation, −Grain**.
- *Spéculer (monter les prix)* → **+Or, −Réputation**, risque d'émeute.
→ Si la majorité thésaurise : la famine s'aggrave, troubles partout. Si la majorité partage : stabilité, mais les généreux sont plus pauvres et vulnérables.

**Exemple B — La Grande Foire de Tombouctou :**
- *Investir dans le commerce* (+Or à terme), *Parader* (+Prestige, −Or), ou *Recruter des mercenaires* (+Guerriers, −Or).

> C'est un **léger dilemme social** (dilemme du prisonnier déguisé) qui génère de la politique émergente — pas une simple loterie.

## 6. La résolution nocturne (« le tick » — 1×/jour, heure fixe)

Algorithme déterministe (donc équitable, débogable, et c'est *tout* le serveur) :

1. Appliquer l'effet **agrégé de l'événement du jour**.
2. Résoudre les **caravanes** (profits ; interceptions sur routes hostiles).
3. Résoudre les **marches/razzias** — combat simple : `Force_attaque = Guerriers_envoyés` vs `Force_défense = Guerriers_présents × (1 + 0,25 × niveau_fortif) + renforts_alliés`. Le plus fort gagne ; le perdant perd l'essentiel de ses guerriers ; un attaquant vainqueur peut **capturer** la possession si elle est peu défendue. *(Déterministe en v1 — on pourra ajouter une petite variance plus tard.)*
4. Appliquer **développement / levée / fortification**.
5. Mettre à jour les **traités** (nouveaux ; rompus → Réputation modifiée et **annoncée publiquement**).
6. Recalculer **Prestige + Réputation**, mettre à jour le **classement**.
7. Les **factions IA** jouent leur tour avec **les mêmes règles** (heuristiques scriptées — 0 coût, 0 appel externe).
8. Générer le **briefing du matin** de chaque joueur.

## 7. Gagner une saison (4-8 semaines)

**Plus haut Prestige en fin de saison** (ou alliance contrôlant les cités-clés). Le Prestige se gagne par : territoire contrôlé · profit commercial net · **traités honorés** (bonus de Réputation) · défenses victorieuses. → On récompense **le commerce et la diplomatie autant que la conquête**, pas seulement la guerre. Fin de saison → **chronique** enregistrée + reset.

## 8. Les écrans de la PWA (4 onglets, ultra-légers)

1. **Le Conseil** (écran principal) : en haut tes ressources/Prestige/Réputation ; au milieu **le briefing du matin** + le **choix d'événement du jour** ; en bas tes **3 créneaux d'ordres** + bouton **Émissaire**.
2. **La Carte** : liste/grille texte des possessions et de leurs propriétaires (pas de rendu lourd → compatible bas de gamme).
3. **Alliances** : chat d'alliance + liste des traités.
4. **La Chronique** : classement + récit de la saison en cours.

---

## 9. Exemple concret — « Jour 12 dans la vie d'Aïssata »

> **07:12, dans le bus.** Aïssata ouvre « Lignées ». Le **briefing** s'affiche :
> *« Cette nuit, la Maison Tindûk a rompu son pacte de non-agression et razzié ton oasis de Goundam — tu as perdu 40 guerriers. Ton allié, la Maison Zalimba, propose de t'aider à riposter. Et la Foire de Tombouctou ouvre aujourd'hui. »*
>
> **L'événement du jour — la Foire.** Aïssata est à court d'or après la razzia. Elle choisit *Investir dans le commerce* (profit demain plutôt que parade aujourd'hui).
>
> **Ses 3 créneaux :**
> 1. **Émissaire → Zalimba** : « J'accepte. Défense mutuelle, et on frappe Tindûk ensemble demain. »
> 2. **Lever** des guerriers (elle dépense son grain — l'armée d'abord).
> 3. **Caravane** vers Djenné, *via* la route alliée de Zalimba (sûre) → profit garanti.
>
> Elle ferme l'appli. **40 secondes.**
>
> **Le soir**, le tick résout tout. **Le lendemain matin**, nouveau briefing : *« Tindûk, voyant ton alliance avec Zalimba se renforcer, demande la paix. Ta caravane est rentrée : +120 or. Ta Réputation grimpe — deux Maisons neutres veulent désormais t'allier. »*

**Ce qui s'est passé côté design :** une trahison (drame) → une demande d'aide (lien social) → une décision à fort sens en 40 s (rétention) → une conséquence sociale le lendemain (raison de revenir) → de nouveaux alliés (boucle de croissance). **C'est exactement l'hypothèse §1 du MVP en action.**

---

## 10. Pourquoi cette boucle teste la bonne chose

| Élément de design | Hypothèse qu'il teste |
|---|---|
| Briefing centré sur les autres Maisons | *Le drame social fait-il revenir ?* |
| Événement du jour partagé | *Y a-t-il un sujet quotidien / une virabilité ?* |
| 3 créneaux, 6 options | *Le choix est-il assez tendu sans être chronophage ?* |
| Traités + trahison publique | *Les alliances se forment-elles ? (cible >60 %)* |
| Émissaire = inviter/recruter | *Peut-on croître organiquement ? (risque n°1)* |
| Résolution planifiée, déterministe | *Le format async/équitable plaît-il vs le 4X prédateur ?* |

---

## 11. Comment tester ça **cette semaine, sans code**

Sur un tableur ou des fiches papier : 1 « maître du jeu » (toi) joue le tick à la main, 5-8 testeurs jouent une Maison via un simple message quotidien (leurs 3 ordres + choix d'événement). Fais tourner **5-7 jours**. Tu sauras **immédiatement** si les gens attendent le briefing du lendemain avec impatience — ou pas. C'est le test le moins cher et le plus révélateur du projet.
