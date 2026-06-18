/* AwemA — backend leaderboard API (v1).
   Zero runtime dependencies (node:http only) — meme ethos leger que les jeux.
   Mappe la couture Cloud.* du front :
     Cloud.submit(payload) -> POST /api/score
     Cloud.global()        -> GET  /api/leaderboard
     Cloud.game(key)       -> GET  /api/leaderboard?game=KEY
   Persistance : optionnelle. Regler DATA_FILE sur un chemin de volume Railway
   pour la durabilite ; sinon le classement vit en memoire (remis a zero au redeploiement).
   NOTE : v1 fait confiance aux scores envoyes par le client (prototype). La
   validation cote serveur / anti-triche viendra ensuite (recalcul de l'Indice,
   limitation par uid, sessions signees). */
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT) || 8090;
const DATA_FILE = process.env.DATA_FILE || "";
const ORIGINS = (process.env.CORS_ORIGINS ||
  "https://codescooper.github.io,http://localhost:8780,http://127.0.0.1:8780")
  .split(",").map(s => s.trim()).filter(Boolean);

/** players[uid] = { uid, name, indice, games: {key:score}, t } */
let players = Object.create(null);

/* ---------- persistance optionnelle (anti-rafale) ---------- */
function load() {
  if (!DATA_FILE) return;
  try {
    const o = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    if (o && o.players && typeof o.players === "object") players = o.players;
    console.log("loaded " + Object.keys(players).length + " players from " + DATA_FILE);
  } catch (e) { /* premier boot — fichier absent */ }
}
let saveTimer = null;
function saveSoon() {
  if (!DATA_FILE) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { mkdirSync(dirname(DATA_FILE), { recursive: true }); writeFileSync(DATA_FILE, JSON.stringify({ players }), "utf8"); }
    catch (e) { console.error("save failed:", e.message); }
  }, 800);
}
load();

/* ---------- helpers ---------- */
const num = (v, lo, hi) => { v = Number(v); if (!Number.isFinite(v)) return lo; return Math.max(lo, Math.min(hi, v)); };
// garde les caracteres imprimables (code >= 32), retire < et > ; pas de regex a antislash
const clean = s => Array.from(String(s == null ? "" : s))
  .filter(ch => ch.charCodeAt(0) >= 32 && ch !== "<" && ch !== ">")
  .join("").trim().slice(0, 24);
// chat : on garde les imprimables, on retire les caractères de contrôle, cap 140 (rendu canvas, pas de HTML)
const cleanChat = s => Array.from(String(s == null ? "" : s)).filter(ch => ch.charCodeAt(0) >= 32).join("").trim().slice(0, 140);

function originAllowed(o) {
  if (!o) return false;
  if (ORIGINS.includes("*") || ORIGINS.includes(o)) return true;
  // toute origine localhost / 127.0.0.1 (machine de dev), quel que soit le port
  return o === "http://localhost" || o.startsWith("http://localhost:")
      || o === "http://127.0.0.1" || o.startsWith("http://127.0.0.1:");
}
function setCors(req, res) {
  const o = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", originAllowed(o) ? o : (ORIGINS[0] || "*"));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}
const sendJson = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > 64 * 1024) { reject(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/* ---------- operations classement ---------- */
function submit(p) {
  let uid = clean(p && p.uid);
  if (!uid) uid = "anon-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const cur = players[uid] || { uid, name: "Anonyme", indice: 0, games: Object.create(null), t: 0 };
  cur.name = clean(p && p.name) || cur.name || "Anonyme";
  cur.indice = Math.max(cur.indice || 0, num(p && p.indice, 0, 1e7));
  const g = (p && p.games) || {};
  for (const k of Object.keys(g)) { const key = clean(k); if (key) cur.games[key] = Math.max(cur.games[key] || 0, num(g[k], 0, 1e12)); }
  cur.t = Date.now();
  players[uid] = cur; saveSoon();
  return { ok: true, uid };
}
function board(game, limit) {
  limit = num(limit, 1, 200);
  const arr = Object.values(players);
  let ranked;
  if (game) ranked = arr.filter(p => p.games && p.games[game] > 0).map(p => ({ uid: p.uid, name: p.name, score: p.games[game] })).sort((a, b) => b.score - a.score);
  else ranked = arr.filter(p => (p.indice || 0) > 0).map(p => ({ uid: p.uid, name: p.name, indice: p.indice })).sort((a, b) => b.indice - a.indice);
  return { ok: true, game: game || null, count: arr.length, board: ranked.slice(0, limit).map((r, i) => ({ rank: i + 1, uid: r.uid, name: r.name, indice: r.indice, score: r.score })) };
}

/* ---------- http ---------- */
const server = http.createServer(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, "http://x");
    let path = url.pathname;
    while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    if (req.method === "GET" && (path === "/" || path === "/api/health"))
      return sendJson(res, 200, { ok: true, service: "awema-leaderboard", players: Object.keys(players).length, persist: !!DATA_FILE });

    if (req.method === "GET" && path === "/api/leaderboard")
      return sendJson(res, 200, board(clean(url.searchParams.get("game")), url.searchParams.get("limit") || 50));

    if (req.method === "POST" && path === "/api/score") {
      let data; try { data = JSON.parse((await readBody(req)) || "{}"); } catch (e) { return sendJson(res, 400, { ok: false, error: "bad json" }); }
      return sendJson(res, 200, submit(data));
    }
    return sendJson(res, 404, { ok: false, error: "not found" });
  } catch (e) {
    try { sendJson(res, 500, { ok: false, error: "server error" }); } catch (_) { }
    console.error("handler error:", e && e.message);
  }
});
/* ---------- WebSocket : présence + chat temps réel du Village ----------
   Protocole compact (clés courtes -> egress minimal) :
     client -> serveur : {t:"hi",n} hello · {t:"m",x,y,d} move · {t:"c",m} chat
     serveur -> client : {t:"w",you,peers} welcome+roster · {t:"j",id,n,x,y,d} join
                        · {t:"m",id,x,y,d} · {t:"c",id,n,m} · {t:"l",id} leave
   État volatile (aucune persistance) ; un humain dans le village = une connexion. */
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });          // Village (/ws)
const wssChess = new WebSocketServer({ noServer: true, maxPayload: 4096 });     // Échecs en duel (/ws/chess)
server.on("upgrade", (req, socket, head) => {
  let pathname = "/"; try { pathname = new URL(req.url, "http://x").pathname; } catch (e) { }
  if (pathname === "/ws") wss.handleUpgrade(req, socket, head, w => wss.emit("connection", w, req));
  else if (pathname === "/ws/chess") wssChess.handleUpgrade(req, socket, head, w => wssChess.emit("connection", w, req));
  else socket.destroy();
});
let seq = 0;
const peers = new Map(); // cid -> { ws, name, x, y, d, lastChat, alive }

/* ----- état partagé du Village (volatile) : LA POISSE + la file du MIROIR ----- */
let itCid = null, itUntil = 0;                  // qui porte la poisse + fin d'immunité (ms epoch)
const TAG_DIST = 38, IMMUNE_MS = Number(process.env.IMMUNE_MS) || 10000;
let cine = { queue: [], startedAt: 0 };         // file vidéo du Miroir ; startedAt = début du n°1
const validVid = s => { s = String(s || ""); if (s.length !== 11) return null; for (const c of s) { const ok = (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "_" || c === "-"; if (!ok) return null; } return s; };
function itState() { return { t: "it", id: itCid, until: itUntil, now: Date.now() }; }
function cineState() { return { t: "cine", queue: cine.queue, startedAt: cine.startedAt, now: Date.now() }; }
function ensureIt() {           // garantir un porteur tant qu'il y a du monde ; renvoie true si l'état change
  if (itCid && peers.has(itCid)) return false;
  const ids = Array.from(peers.keys());
  if (!ids.length) { const ch = itCid !== null; itCid = null; return ch; }
  itCid = ids[Math.floor(Math.random() * ids.length)]; itUntil = Date.now() + IMMUNE_MS; return true;
}

function wsBroadcast(obj, exceptCid) {
  const msg = JSON.stringify(obj);
  for (const [cid, p] of peers) {
    if (cid === exceptCid || p.ws.readyState !== 1) continue;
    try { p.ws.send(msg); } catch (e) { }
  }
}

wss.on("connection", (ws, req) => {
  const o = req.headers.origin;
  if (o && !originAllowed(o)) { try { ws.close(1008, "origin"); } catch (e) { } return; }  // navigateur d'origine inconnue
  if (peers.size >= 200) { try { ws.close(1013, "full"); } catch (e) { } return; }          // garde-fou ressources

  const cid = "p" + (++seq).toString(36) + Math.random().toString(36).slice(2, 5);
  const peer = { ws, name: "Villageois", x: 750, y: 500, d: 1, lastChat: 0, alive: true };
  peers.set(cid, peer);
  ws.on("pong", () => { peer.alive = true; });

  ws.on("message", (buf) => {
    let m; try { m = JSON.parse(String(buf)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    if (m.t === "hi") {
      peer.name = clean(m.n) || "Villageois";
      peer.x = num(m.x, 0, 4000); peer.y = num(m.y, 0, 4000);
      const roster = [];
      for (const [id, p] of peers) if (id !== cid) roster.push({ id, n: p.name, x: Math.round(p.x), y: Math.round(p.y), d: p.d });
      try { ws.send(JSON.stringify({ t: "w", you: cid, peers: roster, it: itCid, until: itUntil, cine: cine.queue, startedAt: cine.startedAt, now: Date.now() })); } catch (e) { }
      wsBroadcast({ t: "j", id: cid, n: peer.name, x: Math.round(peer.x), y: Math.round(peer.y), d: peer.d }, cid);
      if (ensureIt()) wsBroadcast(itState(), null);   // 1er arrivé = porteur de la poisse
    } else if (m.t === "m") {
      peer.x = num(m.x, 0, 4000); peer.y = num(m.y, 0, 4000); peer.d = m.d < 0 ? -1 : 1;
      wsBroadcast({ t: "m", id: cid, x: Math.round(peer.x), y: Math.round(peer.y), d: peer.d }, cid);
    } else if (m.t === "c") {
      const now = Date.now();
      if (now - peer.lastChat < 600) return;               // anti-spam : 1 message / 600 ms
      peer.lastChat = now;
      const text = cleanChat(m.m);
      if (text) wsBroadcast({ t: "c", id: cid, n: peer.name, m: text }, cid);  // l'émetteur affiche sa bulle localement
    } else if (m.t === "cine_add") {
      const vid = validVid(m.vid); if (!vid || cine.queue.length >= 50) return;
      cine.queue.push({ id: "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: cleanChat(m.title).slice(0, 60) || "Vidéo", vid, by: peer.name });
      if (cine.queue.length === 1) cine.startedAt = Date.now();
      wsBroadcast(cineState(), null);
    } else if (m.t === "cine_next") {
      if (cine.queue.length) { cine.queue.shift(); cine.startedAt = Date.now(); wsBroadcast(cineState(), null); }
    }
  });
  ws.on("close", () => { peers.delete(cid); wsBroadcast({ t: "l", id: cid }, cid); if (cid === itCid) { itCid = null; ensureIt(); wsBroadcast(itState(), null); } });
  ws.on("error", () => { try { ws.close(); } catch (e) { } });
});

/* ---------- ÉCHECS EN DUEL (matchmaking + relais des coups, /ws/chess) ----------
   Le serveur apparie 2 joueurs et relaie leurs coups ; chaque client valide
   localement (les échecs sont déterministes). État volatile. */
let chessWaiting = null, chessSeq = 0;
const chessPeers = new Map();   // cid -> { ws, name, alive }
const chessGames = new Map();   // gid -> { w, b }  (cid blanc/Orange, cid noir/Vert)
function chessSend(cid, obj) { const p = chessPeers.get(cid); if (p && p.ws.readyState === 1) { try { p.ws.send(JSON.stringify(obj)); } catch (e) { } } }
function chessGameOf(cid) { for (const [gid, g] of chessGames) if (g.w === cid || g.b === cid) return [gid, g]; return null; }
function chessEnd(cid, reason) { const gx = chessGameOf(cid); if (!gx) return; chessSend(gx[1].w === cid ? gx[1].b : gx[1].w, { t: "end", reason }); chessGames.delete(gx[0]); }

wssChess.on("connection", (ws, req) => {
  const o = req.headers.origin;
  if (o && !originAllowed(o)) { try { ws.close(1008, "origin"); } catch (e) { } return; }
  const cid = "c" + (++chessSeq).toString(36) + Math.random().toString(36).slice(2, 5);
  const peer = { ws, name: "Joueur", alive: true };
  chessPeers.set(cid, peer);
  ws.on("pong", () => { peer.alive = true; });
  ws.on("message", (buf) => {
    let m; try { m = JSON.parse(String(buf)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    if (m.t === "join") {
      peer.name = clean(m.n) || "Joueur";
      if (chessWaiting && chessWaiting !== cid && chessPeers.has(chessWaiting)) {
        const wcid = chessWaiting; chessWaiting = null;
        const gid = "g" + (++chessSeq).toString(36);
        const waitWhite = Math.random() < 0.5;                       // couleur tirée au sort
        const white = waitWhite ? wcid : cid, black = waitWhite ? cid : wcid;
        chessGames.set(gid, { w: white, b: black });
        chessSend(white, { t: "start", color: "w", opp: chessPeers.get(black).name });
        chessSend(black, { t: "start", color: "b", opp: chessPeers.get(white).name });
      } else { chessWaiting = cid; chessSend(cid, { t: "waiting" }); }
    } else if (m.t === "move") {
      const gx = chessGameOf(cid); if (!gx) return;
      chessSend(gx[1].w === cid ? gx[1].b : gx[1].w, { t: "move", m: m.m });   // relais brut (client valide)
    } else if (m.t === "resign") { chessEnd(cid, "resign"); }
    else if (m.t === "leave") { if (chessWaiting === cid) chessWaiting = null; chessEnd(cid, "left"); }
  });
  ws.on("close", () => { chessPeers.delete(cid); if (chessWaiting === cid) chessWaiting = null; chessEnd(cid, "left"); });
  ws.on("error", () => { try { ws.close(); } catch (e) { } });
});

// heartbeat : éliminer les connexions mortes + garder le canal vivant à travers les proxies
const wsHeartbeat = setInterval(() => {
  for (const [cid, p] of peers) {
    if (!p.alive) { try { p.ws.terminate(); } catch (e) { } peers.delete(cid); wsBroadcast({ t: "l", id: cid }, cid); continue; }
    p.alive = false; try { p.ws.ping(); } catch (e) { }
  }
  for (const [cid, p] of chessPeers) {
    if (!p.alive) { try { p.ws.terminate(); } catch (e) { } chessPeers.delete(cid); if (chessWaiting === cid) chessWaiting = null; chessEnd(cid, "left"); continue; }
    p.alive = false; try { p.ws.ping(); } catch (e) { }
  }
}, 30000);
// boucle de jeu : la poisse passe AU CONTACT (le serveur arbitre) une fois l'immunité écoulée
const wsGameTick = setInterval(() => {
  if (!itCid || !peers.has(itCid)) { if (ensureIt()) wsBroadcast(itState(), null); return; }
  if (Date.now() < itUntil) return;                       // immunité en cours
  const holder = peers.get(itCid);
  let best = null, bestD = TAG_DIST;
  for (const [cid2, p] of peers) {
    if (cid2 === itCid) continue;
    const d = Math.hypot(p.x - holder.x, p.y - holder.y);
    if (d < bestD) { bestD = d; best = cid2; }
  }
  if (best) { itCid = best; itUntil = Date.now() + IMMUNE_MS; wsBroadcast(itState(), null); }
}, 150);
wss.on("close", () => { clearInterval(wsHeartbeat); clearInterval(wsGameTick); });

server.listen(PORT, () => console.log("AwemA backend on :" + PORT + " — API classement + WS /ws (persist=" + (DATA_FILE || "memory") + ")"));
