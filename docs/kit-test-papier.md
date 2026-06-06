# « Lignées » — Kit de test papier (Phase 0)

**But :** faire jouer la boucle à **5-8 personnes pendant 5-7 jours, sans une ligne de code**, via un simple groupe WhatsApp/Telegram. Tu joues le **Maître du Jeu (MJ)** : tu résous chaque « nuit » à la main dans un tableur. Coût : 0 €. C'est le test le plus révélateur du projet.

---

## 1. Mise en place (15 min)

- **Crée un groupe** WhatsApp ou Telegram avec tes testeurs (vise **4-6 joueurs humains**).
- **Toi = MJ** : tu envoies les briefings le matin, tu collectes les ordres, tu résous le soir.
- **Cadence :** 1 tour = 1 jour réel (ex. ordres avant 20h, résolution à 20h, briefing le lendemain 8h). *Si tes testeurs sont dispo, tu peux accélérer à 2 tours/jour pour boucler le test en 3 jours.*
- **Durée :** 5 à 7 tours suffisent pour voir si l'envie de revenir est là.

## 2. Le scénario de départ : Le Carrefour des Sables

**8 lieux** reliés par des routes (un lieu n'est attaquable/atteignable que depuis un lieu **adjacent**) :

```
        Tombouctou — Gao — Koumbi
            |         |        |
        Djenné —— Aoudaghost — Tindûk
                      |
                  Zalimba (port)
```

| Lieu | Type | Revenu de base / tour |
|---|---|---|
| Tombouctou, Djenné, Gao, Koumbi | Cité | +20 Or |
| Goundam *(à placer si besoin)*, Tindûk, Aoudaghost | Oasis | +20 Grain |
| Zalimba | Port | +15 Or, +10 Grain |

**6 Maisons** (si 4 testeurs humains, le **MJ joue les 2 autres comme "factions IA"** — c'est le test grandeur nature de l'anti-monde-vide) :

| Maison | Lieu de départ | Or | Grain | Guerriers |
|---|---|---|---|---|
| Maison du joueur ×4-6 | 1 lieu chacune (réparties) | 100 | 100 | 50 |
| Faction IA ×2 (jouées par le MJ) | 1 lieu chacune | 100 | 100 | 50 |

> **Factions IA = règles simples jouées par le MJ :** chaque tour, une faction IA (1) développe si Or > 80, sinon lève des guerriers ; (2) accepte une non-agression si on lui en propose une ; (3) razzie le voisin le plus faible si elle a > 70 guerriers. Note si les joueurs **oublient** que ce sont des PNJ → c'est bon signe.

## 3. Fiche à donner à chaque testeur (copie-colle)

> **Tu diriges une Maison marchande au Carrefour des Sables.** Chaque matin je t'envoie ton **briefing** (ce qui s'est passé la nuit). Tu me réponds avant ce soir avec **(A)** ton choix pour l'événement du jour et **(B)** tes **3 ordres**. La nuit, tout se résout. Le lendemain, tu vois les conséquences.
>
> **Tes ressources :** Or (commerce/armée) · Grain (limite ton armée) · Guerriers (force). **Ton but :** le plus de **Prestige** en fin de partie (territoire + commerce + traités honorés + défenses gagnées). Trahir un traité est permis mais **public** et baisse ta **Réputation**.
>
> **Tes 3 ordres, à choisir dans cette liste (syntaxe simple) :**
> - `DÉV [lieu]` — développer (40 Or → +5 revenu du lieu)
> - `LEVÉE [n]` — lever n guerriers (coût : n×1 Grain + n×1 Or ; max = ton Grain)
> - `CARAVANE [or] vers [lieu]` — commerce (rend +50 % si la route est sûre/alliée ; risque d'interception si elle passe en territoire hostile)
> - `MARCHE [n guerriers] vers [lieu voisin]` — attaque/razzia
> - `FORTIFIE [lieu]` — 40 Or → +1 niveau de défense
> - `ÉMISSAIRE [Maison] : "ton message"` — diplomatie (proposer/rompre non-agression, défense mutuelle, pacte commercial ; demander de l'aide ; menacer)

## 4. Feuille de résolution du MJ (à faire chaque "nuit")

Applique **dans cet ordre** (c'est le futur "tick" du serveur, à la main) :

1. **Revenus :** chaque Maison gagne le revenu de ses lieux (Or/Grain).
2. **Événement du jour :** applique l'effet agrégé (voir §5).
3. **Caravanes :** route sûre (tes lieux/alliés/neutres) → +50 % de l'Or envoyé. Route passant par un lieu **hostile** ou avec une MARCHE ennemie dessus → 50 % de chance d'**interception** (l'Or va à l'intercepteur).
4. **Combats (MARCHE) :** `Attaque = guerriers envoyés`. `Défense = guerriers présents × (1 + 0,25 × niveau_fortif) + renforts d'alliés (défense mutuelle)`. Le plus haut gagne ; le perdant perd 80 % des guerriers engagés, le gagnant 30 %. Si l'attaquant gagne et que le défenseur a **0 guerrier restant** sur le lieu → **capture du lieu**.
5. **Développement / Levée / Fortification :** applique les coûts et effets.
6. **Traités :** enregistre les nouveaux ; un traité **rompu** → annonce publique + **−10 Réputation**.
7. **Prestige :** recalcule = (lieux ×10) + (profit commercial net du tour ÷10) + (traités honorés ×5) + (défenses gagnées ×8) + bonus Réputation (palier).
8. **Briefings :** écris à chacun ce qui le concerne (attaques subies, offres reçues, caravane, classement).

**Mini-exemple de combat :** Aïssata MARCHE 60 guerriers sur Tindûk (oasis IA, 40 guerriers, fortif 0, pas d'allié). Attaque 60 > Défense 40 → Aïssata gagne. Elle perd 18 guerriers (30 %), l'IA perd 32 (80 %) → il reste 8 défenseurs → **pas de capture** (≠0). Le lendemain, briefing IA : *"Aïssata t'a razzié — tu as perdu 32 guerriers."*

## 5. Banque d'événements du jour (pioche-en 1 par tour)

| Événement | Choix A | Choix B | Choix C | Effet agrégé |
|---|---|---|---|---|
| **L'Harmattan (sécheresse)** | Thésauriser (sûr, −5 Rép si beaucoup affament) | Partager (+10 Rép, −30 Grain) | Spéculer (+40 Or, −15 Rép) | Si majorité thésaurise → tous −10 Grain le tour suivant |
| **Grande Foire de Tombouctou** | Investir (+60 Or au prochain tour) | Parader (+15 Prestige, −40 Or) | Mercenaires (+20 Guerriers, −60 Or) | — |
| **Caravane de pèlerins** | Escorter (+10 Rép) | Taxer (+30 Or, −5 Rép) | Ignorer (rien) | Si majorité taxe → routes moins sûres le tour suivant |
| **Rumeur de trahison** | Renforcer alliances (verrouille tes traités 1 tour) | Espionner une Maison (le MJ te révèle ses ordres) | Rien | — |
| **Crue du fleuve** | Investir digues (−30 Or, +10 revenu Grain durable) | Rien (risque −10 Grain) | — | — |

## 6. Tableur de suivi (structure à copier dans Google Sheets)

**Onglet "Maisons" (1 ligne / Maison, mis à jour chaque tour) :**

| Maison | Or | Grain | Guerriers | Lieux (liste) | Fortifs | Prestige | Réputation | Traités actifs |
|---|---|---|---|---|---|---|---|---|

**Onglet "Ordres" (1 ligne / Maison / tour) :**

| Tour | Maison | Choix événement | Ordre 1 | Ordre 2 | Ordre 3 | Reçu à l'heure ? (O/N) |
|---|---|---|---|---|---|---|

**Onglet "Métriques" (le plus important — 1 ligne / tour) :**

| Tour | Joueurs ayant répondu | Délai moyen de réponse | Nb messages diplomatie | Nb alliances actives | Nb trahisons |
|---|---|---|---|---|---|

## 7. Ce que tu observes (les vrais signaux)

| Signal à guetter | Ce qu'il prouve |
|---|---|
| Ils répondent **vite et spontanément** chaque matin | la boucle quotidienne accroche (rétention) |
| Ils **négocient entre eux sans que tu le demandes** | la glu sociale fonctionne ★ le signal le plus important |
| Une **trahison provoque du drame / des réactions** | le moteur émotionnel marche |
| Ils demandent **« il s'est passé quoi cette nuit ?! »** | l'anticipation du briefing = rétention |
| Ils oublient que 2 Maisons sont des PNJ | l'anti-cold-start IA est crédible |
| À l'inverse : réponses molles, pas de diplomatie, lassitude au tour 3 | **la boucle est à revoir AVANT de coder** |

> **Règle :** si le signal social n'apparaît pas, ne code rien. Change la boucle (plus de tension diplomatique ? enjeux plus clairs ?) et refais un test papier. C'est 1 semaine perdue ici contre 6 mois perdus en code.

## 8. Après le test

- **Ça accroche** → tu passes à la Phase 1 (prototype web, toi + IA). Tu as en bonus tes premiers **testeurs-ambassadeurs** et du **contenu** (récits de la partie) pour la communauté Telegram.
- **Ça n'accroche pas** → tu as économisé des mois. Itère la boucle sur papier jusqu'à ce que le signal social apparaisse.
