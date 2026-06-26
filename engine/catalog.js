/* ============================================================================
   AwemA — CATALOGUE UNIQUE (source de vérité).  ·  AGPL-3.0
   Script CLASSIQUE qui marche dans le navigateur (Window) ET dans le service
   worker (ServiceWorkerGlobalScope) via `self` → importScripts('./catalog.js').
   Une seule liste alimente : le cabinet (index.html), le cache du SW (sw.js),
   les classements (classements.html) et les études de cas de l'Atelier.
   ─ Règle de croissance : un nouveau jeu = +1 entrée ici (+ cas Atelier + bump CACHE). ─
   ── Champs d'une entrée ──
     id, name, emoji, file (relatif à engine/), category, tagline,
     multiplayer: "none"|"duel"|"presence",  ws: "<canal>"|null,
     score: { key, target, unit, fmt, read? } | null   (fmt: fr|sec|slash12|stars|trophy|crown|xp ; read: "banco"|"atelier"|absent=clé)
     atelier: { keyMethod, lessons:[] } | null,  theme, badge?, status: "live"|"hub"|"tool"|"archived"
   ⚠️ score.target DOIT rester égal à backend GAME_TARGETS[id] (parité Indice — asserté par tools/check.mjs).
   ========================================================================== */
(function (g) {
  g.AWEMA = g.AWEMA || {};

  g.AWEMA.CACHE = "awema-v29";   // ← nom du cache SW : bump à CHAQUE changement de shell

  g.AWEMA.CATEGORIES = [
    { id: "arcade",    label: "Arcade & action",  emoji: "🕹️" },
    { id: "rythme",    label: "Rythme",           emoji: "🥁" },
    { id: "puzzle",    label: "Puzzle",           emoji: "🧩" },
    { id: "strategie", label: "Stratégie",        emoji: "🧠" },
    { id: "plateau",   label: "Plateau & cartes", emoji: "♟️" },
    { id: "social",    label: "Social & classement", emoji: "🌍" },
    { id: "apprendre", label: "Apprendre",        emoji: "🎓" },
    { id: "outil",     label: "Outils",           emoji: "🔧" }
  ];

  g.AWEMA.GAMES = [
    /* ---- Arcade & action ---- */
    { id: "voraces", name: "Voraces — Le Vivier", emoji: "🦠", file: "games/voraces.html",
      category: "arcade", theme: "voraces", multiplayer: "duel", ws: "voraces",
      tagline: "Serpent vorace : gobe, grandis… et ralentis. Solo contre l'IA ou duel live 1v1.",
      score: { key: "voraces_best", target: 400, unit: "masse", fmt: "fr" },
      atelier: { keyMethod: "Boucle à dt borné + stat dérivée d'une masse (plancher)", lessons: ["d2", "j2"] },
      status: "live" },
    { id: "harmattan", name: "Harmattan", emoji: "🌪️", file: "games/harmattan.html",
      category: "arcade", theme: "harmattan", multiplayer: "none", ws: null,
      tagline: "Survie en horde : tes talismans frappent seuls. Tiens le plus longtemps possible.",
      score: { key: "harmattan_best", target: 180, unit: "s", fmt: "sec" },
      atelier: null, status: "live" },

    /* ---- Rythme ---- */
    { id: "tamtam", name: "Tam-Tam", emoji: "🥁", file: "games/tamtam.html",
      category: "rythme", theme: "tamtam", multiplayer: "duel", ws: "tamtam",
      tagline: "Combat rythmique au djembé, musique 100 % générée. Solo ou duel sur la même danse.",
      score: { key: "tamtam_best", target: 30000, unit: "pts", fmt: "fr" },
      atelier: null, status: "live" },

    /* ---- Puzzle ---- */
    { id: "banco", name: "Banco — Démolition", emoji: "🧱", file: "games/banco.html",
      category: "puzzle", theme: "banco", multiplayer: "none", ws: null,
      tagline: "Démolition à vraie physique : vise les appuis, fais tout s'effondrer. 7 chantiers.",
      score: { key: "banco_save", target: 21, unit: "★", fmt: "stars", read: "banco" },
      atelier: null, status: "live" },

    /* ---- Stratégie ---- */
    { id: "sables", name: "L'Âge des Sables", emoji: "🏜️", file: "games/sables.html",
      category: "strategie", theme: "sables", multiplayer: "none", ws: null,
      tagline: "RTS façon Age of Empires au Sahel : Ghana → Mali → Songhaï. IA adverse.",
      score: { key: "sables_best", target: 2500, unit: "score", fmt: "fr" },
      atelier: { keyMethod: "Machine à états (u.state + switch)", lessons: ["j3"] },
      status: "live" },
    { id: "lignees", name: "Lignées — Le Conseil", emoji: "👑", file: "games/conseil.html",
      category: "strategie", theme: "lignees", multiplayer: "none", ws: null,
      tagline: "Dynastie marchande au Carrefour des Sables. Async : dormir ne fait jamais perdre.",
      score: { key: "lignees_best", target: 200, unit: "prestige", fmt: "crown" },
      atelier: { keyMethod: "Fonction pure (clone) + hasard déterministe (seed)", lessons: ["j1", "j1b"] },
      status: "live" },

    /* ---- Plateau & cartes ---- */
    { id: "echecs", name: "Échecs à l'Ivoirienne", emoji: "♟️", file: "games/echecs.html",
      category: "plateau", theme: "echecs", multiplayer: "duel", ws: "chess",
      tagline: "Les échecs habillés de culture ivoirienne. IA hors-ligne, à deux, ou duel en ligne.",
      score: { key: "echecs_best", target: 8, unit: "victoires", fmt: "trophy" },
      atelier: { keyMethod: "Plateau plat idx=r*8+f + génération glissante", lessons: ["j4"] },
      status: "live" },
    { id: "oware", name: "Awalé (Oware)", emoji: "🫘", file: "games/awale.html",
      category: "plateau", theme: "oware", multiplayer: "duel", ws: "chess",
      tagline: "Le vrai jeu de semailles africain : affame, capture en chaîne. IA ou duel en ligne.",
      score: { key: "awale_wins", target: 8, unit: "victoires", fmt: "trophy" },
      atelier: null, status: "live" },
    { id: "awale", name: "Awalé Royal", emoji: "🐚", file: "games/awale-royal.html",
      category: "plateau", theme: "awale", multiplayer: "none", ws: null,
      tagline: "Roguelike de combos façon Balatro avec les 48 graines de l'awalé.",
      score: { key: "awale_royal_best", target: 12, unit: "enchère", fmt: "slash12" },
      atelier: null, status: "live" },

    /* ---- Apprendre ---- */
    { id: "atelier", name: "L'Atelier", emoji: "🎓", file: "games/atelier.html",
      category: "apprendre", theme: "atelier", multiplayer: "none", ws: null,
      tagline: "Apprends à créer les jeux — piste 🧑‍💻 Coding ou 🪄 Vibecoding, guidé par Awa.",
      score: { key: "awema_atelier_v1", target: 310, unit: "XP", fmt: "xp", read: "atelier" },
      atelier: null, status: "live" },

    /* ---- Social & classement (hubs) ---- */
    { id: "classements", name: "Le Grand Conseil", emoji: "🏆", file: "games/classements.html",
      category: "social", theme: "classement", multiplayer: "none", ws: null,
      tagline: "Ton Indice AwemA, ton rang (Voyageur → Légende des griots), le classement mondial.",
      score: null, atelier: null, status: "hub" },
    { id: "monde", name: "Le Village", emoji: "🗺️", file: "games/monde.html",
      category: "social", theme: "village", multiplayer: "presence", ws: "",
      tagline: "Le hub social : déplace ton avatar, palabre, et entre dans les jeux. Le cœur de la place.",
      score: null, atelier: null, badge: "NOUVEAU", status: "hub" },
    { id: "idees", name: "Les Doléances", emoji: "💡", file: "games/idees.html",
      category: "social", theme: "place", multiplayer: "none", ws: null,
      tagline: "Propose et vote les prochains jeux : la communauté décide de la suite.",
      score: null, atelier: null, status: "hub" },
    { id: "contribuer", name: "Contribuer", emoji: "🤝", file: "games/contribuer.html",
      category: "social", theme: "place", multiplayer: "none", ws: null,
      tagline: "C'est ta borne aussi : teste, propose un jeu, ou code. Tout est open-source (AGPL).",
      score: null, atelier: null, status: "hub" },

    /* ---- Outils (dev) ---- */
    { id: "prototype", name: "Vérif moteur Lignées", emoji: "🔧", file: "games/prototype.html",
      category: "outil", theme: "classement", multiplayer: "none", ws: null,
      tagline: "Harnais de test du moteur de Lignées (7 contrôles, doit afficher 7/7).",
      score: null, atelier: null, status: "tool" }
  ];

  /* Cas synthétique de l'Atelier non rattaché à un jeu (multijoueur générique). */
  g.AWEMA.ATELIER_EXTRA = [
    { gameId: "multi", keyMethod: "Lobby duelWaiting[jeu] + serveur recalcule l'Indice", lessons: ["j5"] }
  ];
})(typeof self !== "undefined" ? self : this);
