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
server.listen(PORT, () => console.log("AwemA leaderboard API on :" + PORT + " (persist=" + (DATA_FILE || "memory") + ")"));
