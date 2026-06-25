/* ============================================================================
   AwemA — couche partagée (shared/awema.js)  ·  AGPL-3.0
   Script CLASSIQUE (PAS d'ES module) : marche en double-clic file:// ET en
   http(s), hors-ligne. Tout est DÉFENSIF et GRACIEUX — un jeu reste jouable
   même si ce fichier ne charge pas (chaque appelant garde un repli inline).
   Expose window.AWEMA. Lit le catalogue (window.AWEMA.GAMES) de façon paresseuse.
   ========================================================================== */
(function (root) {
  var A = root.AWEMA = root.AWEMA || {};

  /* ---------- config / version ---------- */
  A.VERSION = "0.1.0";                 // = package.json "version" = suffixe cache SW (asserté par tools/check.mjs)
  A.BACKEND_URL = "https://awema-games-production.up.railway.app";

  /* ---------- utilitaires ---------- */
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  A.lsGet = lsGet; A.lsSet = lsSet;
  A.clamp = function (v, a, b){ return v < a ? a : v > b ? b : v; };
  A.esc = function (s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

  /* ---- analytics (wrapper fail-safe au-dessus de window.track de analytics.js) ----
     Funnel produit : cabinet_open → game_open → game_finished. Rétention via $pageview (autocapture). */
  A.track = function (name, props){ try { if (typeof window !== "undefined" && window.track) window.track(name, props || {}); } catch (e) {} };
  // À appeler par un jeu à la fin d'une partie : AWEMA.finish("voraces", score) → event game_finished comparable entre jeux.
  A.finish = function (gameId, score){ A.track("game_finished", { game: gameId, score: (+score || 0) }); };

  /* ---------- identité (CANONIQUE — remplace ~8 réimplémentations) ----------
     uid() lit d'abord la clé existante → AUCUN reset des joueurs actuels ;
     seul le générateur des NOUVEAUX uid est unifié ici. */
  var P_KEY = "awema_player", U_KEY = "awema_uid";
  A.uid = function (){ try { var u = localStorage.getItem(U_KEY);
    if (!u){ u = "u" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(U_KEY, u); }
    return u; } catch (e){ return "u0"; } };
  A.name = function (){ try { return localStorage.getItem(P_KEY) || "Toi"; } catch (e){ return "Toi"; } };
  A.setName = function (n){ try { if (n && String(n).trim()){ localStorage.setItem(P_KEY, String(n).trim().slice(0, 18)); return true; } } catch (e){} return false; };
  A.hasName = function (){ return !!lsGet(P_KEY); };
  A.promptName = function (cb){ try { var cur = A.name() === "Toi" ? "" : A.name();
    var n = prompt("Ton nom de joueur (visible dans les classements) :", cur);
    if (n && n.trim()){ A.setName(n); if (cb) cb(A.name()); return true; } } catch (e){} return false; };
  A.ensureName = function (){ if (!A.hasName()) A.promptName(); return A.name(); };

  /* ---------- catalogue (lu paresseusement au moment de l'appel) ---------- */
  function games(){ return (root.AWEMA && root.AWEMA.GAMES) || []; }
  function scored(){ return games().filter(function (g){ return g.score; }); }
  A.games = games;
  A.gameById = function (id){ var L = games(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };

  /* ---------- lecture / format des scores (jetons déclaratifs du catalogue) ---------- */
  function bancoStars(raw){ try { var s = JSON.parse(raw); return (s && s.stars || []).reduce(function (a, b){ return a + (+b || 0); }, 0); } catch (e){ return 0; } }
  A.readScore = function (g){ if (!g || !g.score) return 0; var sc = g.score;
    if (sc.read === "banco") return bancoStars(lsGet("banco_save"));
    if (sc.read === "atelier"){ try { return (JSON.parse(lsGet("awema_atelier_v1")) || {}).xp || 0; } catch (e){ return 0; } }
    return +lsGet(sc.key) || 0; };
  A.fmtScore = function (g, v){ if (!g || !g.score) return String(v);
    switch (g.score.fmt){
      case "fr": return (+v).toLocaleString("fr");
      case "sec": return v + " s";
      case "slash12": return v + "/12";
      case "stars": return v + " ★";
      case "trophy": return v + " 🏆";
      case "crown": return v + " 👑";
      case "xp": return v + " XP";
      default: return String(v);
    } };
  A.localScores = function (){ var o = {}, L = scored(); for (var i = 0; i < L.length; i++) o[L[i].id] = A.readScore(L[i]); return o; };

  /* ---------- Indice AwemA + paliers ---------- */
  A.maitrise = function (g, score){ return A.clamp(score / (g.score.target || 1), 0, 1); };
  A.gamePoints = function (g, score){ return Math.round(A.maitrise(g, score) * 1000); };
  A.indiceOf = function (scores){ var s = 0, L = scored(); for (var i = 0; i < L.length; i++){ var g = L[i]; s += A.gamePoints(g, (scores && scores[g.id]) || 0); } return s; };
  A.TIERS = [
    { min: 0,    name: "Voyageur",          ic: "🥾" },
    { min: 900,  name: "Marchand",          ic: "🐪" },
    { min: 2200, name: "Notable",           ic: "🎽" },
    { min: 4000, name: "Chef de village",   ic: "🪘" },
    { min: 6000, name: "Roi des routes",    ic: "👑" },
    { min: 8000, name: "Légende des griots", ic: "🌟" }
  ];
  A.tierOf = function (idx){ var t = A.TIERS[0]; for (var i = 0; i < A.TIERS.length; i++) if (idx >= A.TIERS[i].min) t = A.TIERS[i]; return t; };

  /* ---------- client classement : Sim (local) → Net (Railway) → Cloud (dispatcher) ----------
     Promu depuis classements.html. Signatures identiques : l'UI ne sait pas qui répond. */
  var CLOUD_KEY = "awema_cloud_v1";
  var SEED = [
    { name: "Awa la griotte", s: { harmattan:172, tamtam:41000, awale:12, banco:21, echecs:7, voraces:520, sables:3200, lignees:240, atelier:310 } },
    { name: "Kouamé",    s: { harmattan:120, tamtam:22000, awale:9,  banco:15, echecs:4, voraces:300, sables:1800, lignees:150, atelier:120 } },
    { name: "Aïssata",   s: { harmattan:95,  tamtam:28000, awale:11, banco:12, echecs:5, voraces:380, sables:2200, lignees:190, atelier:240 } },
    { name: "N'Dri",          s: { harmattan:64,  tamtam:9000,  awale:6,  banco:9,  echecs:2, voraces:160, sables:900,  lignees:80,  atelier:60  } },
    { name: "Fatou",          s: { harmattan:140, tamtam:15000, awale:8,  banco:18, echecs:6, voraces:440, sables:2600, lignees:210, atelier:175 } },
    { name: "Kossi",          s: { harmattan:38,  tamtam:5000,  awale:4,  banco:6,  echecs:1, voraces:90,  sables:500,  lignees:40,  atelier:30  } },
    { name: "Mariam",         s: { harmattan:155, tamtam:33000, awale:10, banco:19, echecs:6, voraces:470, sables:2900, lignees:225, atelier:290 } }
  ];
  function dbGet(){ try { return JSON.parse(lsGet(CLOUD_KEY)); } catch (e){ return null; } }
  function dbSet(d){ lsSet(CLOUD_KEY, JSON.stringify(d)); }
  function seed(){ var d = { players: {} }; SEED.forEach(function (r, i){ var start = {}, ceil = {};
    for (var k in r.s){ ceil[k] = r.s[k]; start[k] = Math.round(r.s[k] * (0.45 + Math.random() * 0.35)); }
    d.players["bot" + i] = { name: r.name, scores: start, bot: true, ceil: ceil }; }); dbSet(d); return d; }
  function evolve(d){ var L = scored(); if (!L.length) return; for (var id in d.players){ var p = d.players[id]; if (!p.bot) continue;
    if (Math.random() < 0.6){ var g = L[Math.floor(Math.random() * L.length)], cur = p.scores[g.id] || 0, ceil = (p.ceil && p.ceil[g.id]) || g.score.target;
      if (cur < ceil) p.scores[g.id] = Math.min(ceil, Math.round(cur + (ceil - cur) * (0.05 + Math.random() * 0.2) + 1)); } } }
  var delay = function (ms){ return new Promise(function (r){ setTimeout(r, ms); }); };

  var Sim = {
    submit: function (scores){ var self = this; return delay(120 + Math.random() * 160).then(function (){ var d = dbGet() || seed(), u = A.uid();
      var me = d.players[u] || { scores: {} }; me.name = A.name(); me.self = true; me.bot = false;
      for (var k in scores) me.scores[k] = Math.max(me.scores[k] || 0, scores[k] || 0);
      d.players[u] = me; evolve(d); dbSet(d); }); },
    _all: function (){ return delay(140 + Math.random() * 180).then(function (){ var d = dbGet() || seed(), u = A.uid();
      return Object.keys(d.players).map(function (id){ var p = d.players[id], idx = A.indiceOf(p.scores || {}); return { name: p.name || "?", self: id === u, scores: p.scores || {}, idx: idx, tier: A.tierOf(idx) }; }); }); },
    global: function (){ return this._all().then(function (a){ return a.sort(function (x, y){ return y.idx - x.idx; }); }); },
    game: function (id){ return this._all().then(function (a){ return a.map(function (p){ return { name: p.name, self: p.self, score: p.scores[id] || 0 }; }).sort(function (x, y){ return y.score - x.score; }); }); }
  };

  var ONLINE = null;   // null = inconnu · true = en ligne · false = repli local
  function jfetch(url, opts){ var c = new AbortController(), t = setTimeout(function (){ c.abort(); }, 5000);
    return Promise.resolve().then(function (){ return fetch(url, Object.assign({}, opts || {}, { signal: c.signal })); }).then(function (r){ clearTimeout(t); return r; }, function (e){ clearTimeout(t); throw e; }); }
  var Net = {
    submit: function (scores){ return jfetch(A.BACKEND_URL + "/api/score", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: A.uid(), name: A.name(), indice: A.indiceOf(scores), games: scores }) }).then(function (r){ if (!r.ok) throw new Error("submit " + r.status); return r.json(); }); },
    global: function (){ return jfetch(A.BACKEND_URL + "/api/leaderboard").then(function (r){ if (!r.ok) throw new Error("global " + r.status); return r.json(); }).then(function (d){ var u = A.uid(); return (d.board || []).map(function (e){ return { name: e.name, self: e.uid === u, idx: e.indice || 0, tier: A.tierOf(e.indice || 0) }; }); }); },
    game: function (id){ return jfetch(A.BACKEND_URL + "/api/leaderboard?game=" + encodeURIComponent(id)).then(function (r){ if (!r.ok) throw new Error("game " + r.status); return r.json(); }).then(function (d){ var u = A.uid(); return (d.board || []).map(function (e){ return { name: e.name, self: e.uid === u, score: e.score || 0 }; }); }); }
  };
  var Cloud = {
    submit: function (s){ if (A.BACKEND_URL && ONLINE !== false){ return Net.submit(s).then(function (r){ ONLINE = true; return r; }, function (){ ONLINE = false; return Sim.submit(s); }); } return Sim.submit(s); },
    global: function (){ if (A.BACKEND_URL && ONLINE !== false){ return Net.global().then(function (r){ ONLINE = true; return r; }, function (){ ONLINE = false; return Sim.global(); }); } return Sim.global(); },
    game: function (id){ if (A.BACKEND_URL && ONLINE !== false){ return Net.game(id).then(function (r){ ONLINE = true; return r; }, function (){ ONLINE = false; return Sim.game(id); }); } return Sim.game(id); }
  };
  A.board = Cloud; A.Sim = Sim; A.Net = Net;
  A.resetOnline = function (){ ONLINE = null; };
  A.isOnline = function (){ return ONLINE; };

  /* ---------- duel : helper TRANSPORT (PAS le protocole de chaque jeu) ----------
     A.duel(channel, { open(api), msg(obj, api), close(), fail(err) }) → { send(obj), close() }.
     Ouvre wss://BACKEND/ws/<channel>. Chaque jeu garde sa propre machine d'états dans msg(). */
  A.duel = function (channel, h){ h = h || {};
    var url = A.BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://") + "/ws/" + channel;
    var ws; try { ws = new WebSocket(url); } catch (e){ if (h.fail) h.fail(e); return null; }
    var api = {
      send: function (o){ try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e){} },
      close: function (){ try { ws.onclose = null; ws.close(); } catch (e){} },
      socket: function (){ return ws; }
    };
    ws.onopen = function (){ if (h.open) h.open(api); };
    ws.onmessage = function (ev){ var m; try { m = JSON.parse(ev.data); } catch (e){ return; } if (h.msg) h.msg(m, api); };
    ws.onclose = function (){ if (h.close) h.close(); };
    ws.onerror = function (){ try { ws.close(); } catch (e){} };
    return api; };

  /* ---------- barre de navigation injectée (opt-in) ----------
     A.nav({ back:"../index.html" }) ajoute en haut à droite un retour Cabinet + un
     chip profil (pseudo · Indice). No-op si le DOM n'est pas prêt. Léger, sans dépendance. */
  A.nav = function (opts){ opts = opts || {}; try {
    if (!document || !document.body) return;
    if (document.getElementById("awema-nav")) return;
    var back = opts.back || "../index.html";
    var bar = document.createElement("div");
    bar.id = "awema-nav";
    bar.style.cssText = "position:fixed;top:8px;right:8px;z-index:9999;display:flex;gap:.4rem;align-items:center;font:600 13px/1 system-ui,sans-serif";
    var idx = 0; try { idx = A.indiceOf(A.localScores()); } catch (e){}
    var chip = document.createElement("span");
    chip.style.cssText = "background:#0c0e16cc;color:#ffd76a;border:1px solid #ffffff2e;border-radius:1rem;padding:.3rem .6rem;backdrop-filter:blur(4px)";
    chip.textContent = "👤 " + A.name() + (idx ? " · " + idx : "");
    var link = document.createElement("a");
    link.href = back; link.textContent = "≡ Cabinet";
    link.style.cssText = "background:#e8702a;color:#2a1404;border-radius:.5rem;padding:.35rem .7rem;text-decoration:none";
    if (opts.profile !== false) bar.appendChild(chip);
    bar.appendChild(link);
    document.body.appendChild(bar);
  } catch (e){} };

})(typeof window !== "undefined" ? window : this);
