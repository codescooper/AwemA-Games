# « Lignées » — Scope du MVP (« la graine »)

**But de ce document :** définir le périmètre exact, jouable, d'une première version réalisable par un solo (profil game-design) assisté par IA, pour un coût serveur ≈ 0. Ce n'est **pas** le MMO complet — c'est la graine qui doit prouver une seule chose avant qu'on investisse plus.

---

## 1. L'hypothèse unique à valider

> **« Des inconnus reviennent chaque jour pendant des semaines, et nouent des alliances entre eux, dans un monde de stratégie asynchrone — sans pay-to-win, sans temps réel, sur un téléphone bas de gamme. »**

Si c'est vrai → on empile l'économie, la persistance multi-saison, les dynasties, la monétisation cosmétique. Si c'est faux → on corrige la boucle **avant** d'ajoute la moindre feature. Tout le reste est secondaire.

---

## 2. Périmètre — la discipline anti-échec

| ✅ DANS la graine | ❌ HORS de la graine (plus tard) |
|---|---|
| Boucle quotidienne (2-5 min) | Économie de joueurs complexe / marché |
| Alliances + diplomatie minimale | Monétisation (cosmétiques, abo) |
| Factions IA dès le jour 1 (anti-monde-vide) | Persistance multi-saison / héritage de dynastie |
| 1 saison finie (4-8 semaines) + classement | Multi-mondes simultanés |
| Résolution **planifiée** (équitable tous fuseaux) | Temps réel, WebSockets, anti-triche complexe |
| PWA installable, ultra-légère, offline-tolérante | App native / stores (vient après via TWA) |

> **Règle d'or :** toute idée qui n'aide pas à tester l'hypothèse §1 est reportée. C'est ce qui tue ou sauve un projet solo.

---

## 3. La boucle quotidienne (le « hook »)

Rythme : **une résolution planifiée par jour** (ex. chaque nuit à heure fixe du monde). Tu n'as **pas** besoin d'être en ligne au bon moment — être endormi ne te fait jamais perdre. *C'est un choix de design délibéré et un anti-pattern frontal au mobile 4X prédateur.*

**Une journée type du joueur (2-5 min) :**

1. **Le briefing** *(le drame social, le vrai moteur)* : « Cette nuit, la Maison Okonkwo a rompu son traité avec toi. Ton allié demande ton aide. Une maison neutre propose un pacte commercial. » → l'intérêt vient **des gens**, pas de barres de ressources.
2. **L'événement du jour** *(le moment partageable, type Wordle)* : un événement touche tout le monde (sécheresse, migration, présage). Chaque maison choisit sa réponse ; **l'agrégat des choix** infléchit le monde du lendemain. Ça crée un sujet de conversation quotidien (« t'as fait quoi pour la famine ? ») → virabilité.
3. **Tes ordres** *(2-3 décisions liantes)* : développer · lever des troupes · envoyer un émissaire · fortifier · commercer · trahir. Pas plus. Choix, pas micro-gestion.
4. **La diplomatie** *(optionnel)* : lire/répondre aux messages, proposer/accepter/rompre un traité, voter une guerre d'alliance.

Puis la résolution nocturne applique tout, déterministe et côté serveur. Le joueur revient le lendemain voir les conséquences. **Boucle « je me connecte, je donne mes ordres, je me déconnecte »** (ADN Travian/EVE) compressée en rituel quotidien.

---

## 4. Alliances & diplomatie (la glu sociale — minimale mais réelle)

- **Alliance** : groupe nommé, chat dédié, un **objectif partagé** (tenir une région / un site emblématique).
- **Traités** (états binaires simples) : non-agression · défense mutuelle · pacte commercial.
- **Réputation** : rompre un traité est *possible* mais laisse une trace publique → la trahison a un coût social. **C'est le moteur de drame.**
- **Virabilité native** : le jeu *a besoin* d'alliés → inviter des amis est une mécanique, pas un bouton marketing. C'est ta principale boucle de croissance organique (cf. risque n°1 = distribution).

> On s'arrête là. Pas d'arbre politique, pas de gouvernance complexe. Membres + 3 traités + chat + 1 objectif commun.

---

## 5. Les factions IA (la solution au cold-start)

Le tueur n°1 du multijoueur solo, c'est le **monde vide au lancement**. Réponse : la carte est peuplée dès le départ de **maisons contrôlées par le jeu**, qui se développent, défendent, concluent et rompent des traités, et **répondent à la diplomatie des joueurs**. Pour le joueur, ce sont simplement « les autres maisons du royaume » — **jamais présentées comme de l'IA** (85 % des joueurs y sont hostiles).

**Décision technique cruciale pour la v1 : IA *scriptée* (arbres de comportement / heuristiques), PAS de LLM dans la boucle.**
- Fiable, déterministe, débogable, **coût = 0**, tourne dans le job de résolution.
- Le LLM est tentant mais introduit coût, latence et imprévisibilité — à réserver, *plus tard*, à de la **saveur de texte** (messages diplomatiques générés), en batch et caché. Pas maintenant.
- À mesure que de vrais joueurs arrivent, les factions IA refluent vers les marges → monde crédible dès 20 joueurs, « réel » à 500.

---

## 6. Structure d'une saison

- **Durée :** 4 à 8 semaines (engagement fini = faible burnout, créneau de réacquisition).
- **Fin :** une alliance/maison « remporte » le royaume (territoire/prestige). La saison est **enregistrée dans une chronique** (graine du futur système d'Histoire/légende).
- **Reset :** nouveau royaume, classement remis à zéro. *(La persistance des lignées/cosmétiques entre saisons = feature de l'étape suivante, pas de la graine.)*
- Le « nouveau départ de saison » devient un **rendez-vous viral** récurrent.

---

## 7. Stack technique concrète (pour un non-dev assisté par IA)

**Principe directeur : il n'y a pas de « serveur de jeu » qui tourne en continu. Tout le serveur = un job planifié 1×/jour.** C'est ce qui rend le projet solo-faisable et quasi gratuit.

| Couche | Reco v1 | Pourquoi |
|---|---|---|
| **Frontend** | PWA légère — SvelteKit *ou* vanilla JS + htmx | Petit payload, offline via service worker, installable |
| **Backend / BDD** | **Supabase** (Postgres + Auth + Edge Functions + `pg_cron`) | Modèle mental simple (SQL), auth incluse, free tier généreux, **très bien connu des assistants IA de code** |
| **La résolution (« tick »)** | 1 fonction planifiée (cron, 1×/jour) qui lit tous les ordres, résout le monde, écrit le nouvel état | C'est *tout* le « serveur ». Pas de WebSocket, pas de process continu |
| **Auth** | Email/OTP ou téléphone (pas de carte bancaire) | Friction minimale en marchés émergents |
| **IA factions** | Code TypeScript pur dans le tick | 0 appel externe, 0 coût |

*Alternative quand tu scaleras : migrer le chemin chaud vers **Cloudflare Workers + D1 + Cron Triggers** (encore moins cher). Mais commence avec Supabase — l'objectif est de livrer, pas d'optimiser.*

---

## 8. Coût (la bonne nouvelle)

- **Hébergement :** 0 à 25 $/mois à l'échelle MVP (Supabase free → Pro 25 $ ; Cloudflare = centimes). (confiance élevée — cohérent avec Lichess/agar.io)
- **Domaine :** ~10-15 $/an.
- **Le vrai coût, c'est ton TEMPS, pas l'argent.** Idéal pour du bootstrap.

---

## 9. Plan de construction en tranches (ordre du « vertical slice »)

Construis dans **cet ordre**, et ne passe à l'étape suivante que si la précédente tient :

1. **Prototype papier / Figma de la boucle quotidienne** *(≈1 semaine, 0 code)* — la journée type §3 est-elle intéressante sur le papier ? Teste-la sur 5-10 personnes.
2. **Prototype jouable solo contre factions IA** *(local, pas d'infra)* — la boucle + l'IA donnent-elles l'illusion d'un monde vivant et tendu ?
3. **Comptes + persistance + le tick quotidien** — le monde partagé asynchrone existe (c'est ça, le « multijoueur » ici).
4. **Alliances + diplomatie + chat.**
5. **Test fermé** avec la communauté de l'Étape 0 → **un seul petit monde** (200-500 places).
6. **Itère** sur les métriques §10, puis ouvre d'autres mondes.

**Délais honnêtes (la plus grande incertitude du projet) :**
- **Si tu codes toi-même avec assistance IA :** ~4-7 mois jusqu'à une graine déployée et jouable (courbe d'apprentissage incluse). Variance forte.
- **Si tu t'associes à un dev / un prestataire technique :** ~2-4 mois.
- *Le choix « coder soi-même vs partenaire technique » est la décision qui pèse le plus sur ce délai. À trancher tôt.*

---

## 10. Métriques de succès & critères d'arrêt (pour que ce soit un vrai test)

Définis le verdict **avant** de lancer, sinon tu construiras à l'infini :

| Signal | Cible « ça marche » | Mesure |
|---|---|---|
| **Rétention J7** | > 25 % | reviennent-ils ? |
| **Adhésion à une alliance** | > 60 % des joueurs actifs | la glu sociale prend-elle ? |
| **Acquisition organique** | remplir 1 monde de 200 **sans payer** | le risque n°1 (distribution) est-il surmontable ? |
| **Rétention de saison** | > 30 % finissent la saison | l'engagement tient-il sur la durée ? |

**Si ces seuils échouent → on corrige la BOUCLE (§3), on n'ajoute pas de features.** C'est la règle qui sépare un projet qui aboutit d'un projet qui s'enlise.

---

## 11. Ce qu'on s'interdit explicitement dans la graine

Temps réel · WebSockets · économie de marché · monétisation · gacha/loot boxes/timers payants · app native · multi-mondes · LLM dans la boucle de simulation · tout système « parce que ce serait cool ». **Chaque “non” ici est du temps gagné vers la seule question qui compte (§1).**
