/* AwemA — backend leaderboard API (v1).
   Zero runtime dependencies (node:http only) — meme ethos leger que les jeux.
   Mappe la couture Cloud.* du front :
     Cloud.submit(payload) -> POST /api/score
     Cloud.global()        -> GET  /api/leaderboard
     Cloud.game(key)       -> GET  /api/leaderboard?game=KEY
   Persistance : optionnelle. Regler DATA_FILE sur un chemin de volume Railway
   pour la durabilite ; sinon le classement vit en memoire (remis a zero au redeploiement).
   ANTI-TRICHE (v2) : le serveur RECALCULE l'Indice a partir des scores par jeu
   (l'indice envoye par le client est ignore) et plafonne chaque score a une
   valeur plausible. Limite connue : les scores solo restent declares par le
   client (pas de gameplay serveur-autoritaire hors duels/Lignees). */
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { WebSocketServer } from "ws";
import LE from "./lignees-engine.cjs";   // moteur Lignées partagé (résolution autoritaire)

const PORT = Number(process.env.PORT) || 8090;
const DATA_FILE = process.env.DATA_FILE || "";
const ORIGINS = (process.env.CORS_ORIGINS ||
  "https://codescooper.github.io,http://localhost:8780,http://127.0.0.1:8780")
  .split(",").map(s => s.trim()).filter(Boolean);

// Anti-triche du classement : barèmes identiques au front (engine/classements.html → GAMES.target,
// maitrise = clamp(score/target,0,1)) + plafonds de score plausibles par jeu. Le serveur RECALCULE
// l'Indice à partir des scores (jamais l'indice client) → score absurde ou indice gonflé sans effet.
const GAME_TARGETS = { harmattan: 180, tamtam: 30000, awale: 12, banco: 21, echecs: 8, voraces: 400, sables: 2500, lignees: 200, atelier: 310, oware: 8 };
const GAME_MAX = {};
for (const k in GAME_TARGETS) GAME_MAX[k] = Math.max(GAME_TARGETS[k] * 20, 1000);
GAME_MAX.banco = 21;   // borné par construction (7 chantiers × 3 étoiles)
const computeIndice = games => { let t = 0; for (const k in GAME_TARGETS) { const s = (games && games[k]) || 0; t += Math.round(Math.min(1, s / GAME_TARGETS[k]) * 1000); } return t; };

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
// modération : masque une liste de base d'insultes (FR/EN), normalisées sans accent ni ponctuation
const BADWORDS = new Set(["con","cons","conne","connard","connards","connasse","pute","putes","putain","putains","merde","merdes","salope","salopes","salaud","salauds","encule","encules","enculer","enfoire","enfoires","batard","batards","nique","niquer","niquetamere","ntm","fdp","filsdepute","pd","pede","pedes","tafiole","bouffon","negre","bamboula","fuck","fucking","fucker","shit","bitch","bitches","asshole","dick","cunt","nigger","nigga","faggot","retard"]);
function maskProfanity(s){ return String(s).split(" ").map(tok=>{ let norm=""; for(const ch of tok.toLowerCase().normalize("NFD")){ const c=ch.charCodeAt(0); if(c>=97&&c<=122) norm+=ch; } return (norm.length>=2 && BADWORDS.has(norm)) ? "•".repeat(Math.max(3,tok.length)) : tok; }).join(" "); }

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
  const g = (p && p.games) || {};
  for (const k of Object.keys(g)) {
    if (!(k in GAME_TARGETS)) continue;                          // clé de jeu inconnue → ignorée
    const v = num(g[k], 0, GAME_MAX[k]);                          // plafond plausible par jeu
    if (v > (cur.games[k] || 0)) cur.games[k] = v;               // on ne conserve que le meilleur
  }
  cur.indice = computeIndice(cur.games);                          // Indice RECALCULÉ serveur (p.indice ignoré)
  cur.t = Date.now();
  players[uid] = cur; saveSoon();
  return { ok: true, uid, indice: cur.indice };
}
function board(game, limit) {
  limit = num(limit, 1, 200);
  const arr = Object.values(players);
  let ranked;
  if (game) ranked = arr.filter(p => p.games && p.games[game] > 0).map(p => ({ uid: p.uid, name: p.name, score: p.games[game] })).sort((a, b) => b.score - a.score);
  else ranked = arr.filter(p => (p.indice || 0) > 0).map(p => ({ uid: p.uid, name: p.name, indice: p.indice })).sort((a, b) => b.indice - a.indice);
  return { ok: true, game: game || null, count: arr.length, board: ranked.slice(0, limit).map((r, i) => ({ rank: i + 1, uid: r.uid, name: r.name, indice: r.indice, score: r.score })) };
}

// Assainit les données déjà stockées (héritage v1 sans validation) : clamp des scores + recalcul de l'Indice.
function sanitizeAll() {
  for (const uid in players) {
    const pl = players[uid];
    if (!pl || typeof pl !== "object") { delete players[uid]; continue; }
    const games = Object.create(null);
    for (const k in GAME_TARGETS) { const v = num((pl.games || {})[k], 0, GAME_MAX[k]); if (v > 0) games[k] = v; }
    pl.games = games; pl.indice = computeIndice(games);
  }
  saveSoon();
}
sanitizeAll();

/* ---------- LIGNÉES — multijoueur asynchrone (parties privées par code) ----------
   Serveur autoritaire : chaque humain soumet ses ordres ; le tour se résout via le
   moteur partagé (lignees-engine.cjs) dès que tous les humains ont validé. Les
   Maisons libres sont jouées par l'IA. État partagé persistant (volume /data). */
const LG_FILE = DATA_FILE ? (dirname(DATA_FILE) + "/lignees.json") : "";
const LG_HOUSES = ["aissata", "tinduk", "zalimba", "djenne", "tombouctou", "gao"];
let games = Object.create(null);
function lgLoad(){ if(!LG_FILE) return; try{ const o=JSON.parse(readFileSync(LG_FILE,"utf8")); if(o&&o.games) games=o.games; console.log("loaded "+Object.keys(games).length+" parties Lignees"); }catch(e){} }
let lgTimer=null;
function lgSave(){ if(!LG_FILE) return; clearTimeout(lgTimer); lgTimer=setTimeout(()=>{ try{ const cut=Date.now()-7*864e5; for(const id in games) if((games[id].updatedAt||0)<cut) delete games[id]; mkdirSync(dirname(LG_FILE),{recursive:true}); writeFileSync(LG_FILE, JSON.stringify({games}), "utf8"); }catch(e){ console.error("lignees save:", e.message); } }, 800); }
lgLoad();
function lgCode(){ const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c; do{ c=""; for(let i=0;i<5;i++)c+=A[Math.floor(Math.random()*A.length)]; }while(games[c]); return c; }
const lgHouseOfUid=(g,uid)=>{ for(const h in g.seats) if(g.seats[h]&&g.seats[h].uid===uid) return h; return null; };
const lgHumans=g=>Object.keys(g.seats).filter(h=>g.seats[h]);
function lgView(g,uid){ return { id:g.id, state:g.state, seats:Object.fromEntries(Object.entries(g.seats).map(([h,s])=>[h,s?s.name:null])), you:lgHouseOfUid(g,uid), submitted:Object.keys(g.pending), waitingFor:lgHumans(g).filter(h=>!g.pending[h]), eventId:LE.eventIdFor(g.state), log:(g.log||[]).slice(-30), status:g.status }; }
function lgResolve(g){ const orders=[], eventChoices={};
  for(const h of lgHumans(g)){ const p=g.pending[h]; if(p){ (p.orders||[]).forEach((o,i)=>orders.push({houseId:h,slot:i,type:o.type,params:o.params})); if(p.eventChoice)eventChoices[h]=p.eventChoice; } }
  const r=LE.resolveTick(g.state,{ eventId:LE.eventIdFor(g.state), eventChoices, orders });
  g.state=r.state; g.log=(g.log||[]).concat(r.log.filter(e=>e.public)).slice(-200); g.pending={};
  if(g.state.tick>=LE.CONFIG.SEASON_LENGTH) g.status="ended"; g.updatedAt=Date.now(); }

/* ---------- DOLÉANCES — file de demandes de jeu votables, PARTAGÉE (volume /data) ----------
   Liste commune à tous : chaque demande a un proposeur + des votants (1 voix/uid, basculable).
   Modération (masque insultes), persistance debouncée, seed au 1er boot. Pas de "clôture"
   publique (action admin) pour éviter l'abus ; la n°1 est mise en avant côté client. */
const DO_FILE = DATA_FILE ? (dirname(DATA_FILE) + "/doleances.json") : "";
let doleances = Object.create(null), doSeq = 0;
function doLoad(){ if(!DO_FILE) return; try{ const o=JSON.parse(readFileSync(DO_FILE,"utf8")); if(o&&o.doleances){ doleances=o.doleances; doSeq=o.seq||0; } console.log("loaded "+Object.keys(doleances).length+" doleances"); }catch(e){} }
let doTimer=null;
function doSave(){ if(!DO_FILE) return; clearTimeout(doTimer); doTimer=setTimeout(()=>{ try{ mkdirSync(dirname(DO_FILE),{recursive:true}); writeFileSync(DO_FILE, JSON.stringify({doleances,seq:doSeq}), "utf8"); }catch(e){ console.error("doleances save:", e.message); } }, 800); }
const cleanTitle = s => maskProfanity(cleanChat(s)).slice(0, 60);
function doSeedIfEmpty(){
  if(Object.keys(doleances).length) return;
  const seed=[
    { title:"Course de pirogues sur la lagune", by:"Kouamé", dev:"", n:14 },
    { title:"Gestion de plantation de cacao", by:"Aïssata", dev:"", n:23 },
    { title:"Combat de masques (baston en ligne)", by:"N'Dri", dev:"", n:9 },
    { title:"Élevage de pintades (idle)", by:"Fatou", dev:"", n:6 },
    { title:"Awalé traditionnel en duel", by:"Awa la griotte", dev:"AwemA Studio", n:18, status:"dev" },
  ];
  for(const s of seed){ const id="d"+(++doSeq).toString(36); const voters=[]; for(let i=0;i<s.n;i++) voters.push("seed-"+id+"-"+i); doleances[id]={ id, title:s.title, by:s.by, byUid:"seed", dev:s.dev||"", voters, status:s.status||"open", createdAt:Date.now() }; }
  doSave();
}
doLoad(); doSeedIfEmpty();
function doView(uid){
  return { ok:true, list: Object.values(doleances)
    .map(d=>({ id:d.id, title:d.title, by:d.by, dev:d.dev, votes:d.voters.length, voted: uid ? d.voters.indexOf(uid)>=0 : false, status:d.status }))
    .sort((a,b)=> (b.status==="dev")-(a.status==="dev") || b.votes-a.votes) };
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
    if (path.startsWith("/api/lignees/")) {
      const body = (req.method === "POST") ? await readBody(req) : "";
      let d = {}; if (body) { try { d = JSON.parse(body); } catch (e) { return sendJson(res, 400, { ok: false, error: "bad json" }); } }
      const q = url.searchParams;
      const uid = clean(d.uid || q.get("uid")); const gid = clean(d.gid || d.gameId || q.get("gid") || q.get("gameId"));
      if (path === "/api/lignees/create" && req.method === "POST") {
        if (!uid) return sendJson(res, 400, { ok: false, error: "uid requis" });
        const house = LG_HOUSES.includes(d.house) ? d.house : "aissata";
        const state = LE.buildScenario(); for (const h of Object.values(state.houses)) h.isAI = true; state.houses[house].isAI = false;
        const id = lgCode();
        games[id] = { id, state, seats: { [house]: { uid, name: maskProfanity(clean(d.name)) || "Joueur" } }, pending: {}, log: [], status: "playing", createdAt: Date.now(), updatedAt: Date.now() };
        lgSave(); return sendJson(res, 200, { ok: true, ...lgView(games[id], uid) });
      }
      const g = games[gid];
      if (!g) return sendJson(res, 404, { ok: false, error: "partie introuvable" });
      if (path === "/api/lignees/state" && req.method === "GET") return sendJson(res, 200, { ok: true, ...lgView(g, uid) });
      if (path === "/api/lignees/join" && req.method === "POST") {
        if (!uid) return sendJson(res, 400, { ok: false, error: "uid requis" });
        let house = lgHouseOfUid(g, uid);
        if (!house) { house = LG_HOUSES.includes(d.house) ? d.house : null; if (!house || g.seats[house]) return sendJson(res, 400, { ok: false, error: "maison prise ou invalide" }); g.seats[house] = { uid, name: maskProfanity(clean(d.name)) || "Joueur" }; g.state.houses[house].isAI = false; g.updatedAt = Date.now(); lgSave(); }
        return sendJson(res, 200, { ok: true, ...lgView(g, uid) });
      }
      const myHouse = lgHouseOfUid(g, uid);
      if (!myHouse) return sendJson(res, 403, { ok: false, error: "tu n'es pas dans cette partie" });
      if (path === "/api/lignees/orders" && req.method === "POST") {
        if (g.status !== "playing") return sendJson(res, 400, { ok: false, error: "partie terminee" });
        const orders = Array.isArray(d.orders) ? d.orders.slice(0, 3).map(o => ({ type: o.type, params: o.params })) : [];
        g.pending[myHouse] = { orders, eventChoice: clean(d.eventChoice) || null }; g.updatedAt = Date.now();
        let resolved = false; if (lgHumans(g).every(h => g.pending[h])) { lgResolve(g); resolved = true; }
        lgSave(); return sendJson(res, 200, { ok: true, resolved, ...lgView(g, uid) });
      }
      if (path === "/api/lignees/resolve" && req.method === "POST") {
        if (g.status === "playing") { lgResolve(g); lgSave(); }
        return sendJson(res, 200, { ok: true, resolved: true, ...lgView(g, uid) });
      }
      return sendJson(res, 404, { ok: false, error: "route lignees inconnue" });
    }
    if (path.startsWith("/api/doleances")) {
      const body = (req.method === "POST") ? await readBody(req) : "";
      let d = {}; if (body) { try { d = JSON.parse(body); } catch (e) { return sendJson(res, 400, { ok: false, error: "bad json" }); } }
      const uid = clean(d.uid || url.searchParams.get("uid"));
      if (path === "/api/doleances" && req.method === "GET") return sendJson(res, 200, doView(uid));
      if (path === "/api/doleances/add" && req.method === "POST") {
        if (!uid) return sendJson(res, 400, { ok: false, error: "uid requis" });
        const title = cleanTitle(d.title); if (title.length < 3) return sendJson(res, 400, { ok: false, error: "titre trop court" });
        if (Object.keys(doleances).length >= 150) return sendJson(res, 400, { ok: false, error: "trop de demandes — vote plutôt pour une idée existante" });
        if (Object.values(doleances).filter(x => x.byUid === uid).length >= 6) return sendJson(res, 400, { ok: false, error: "tu as déjà proposé beaucoup d'idées" });
        if (Object.values(doleances).some(x => x.title.toLowerCase() === title.toLowerCase())) return sendJson(res, 400, { ok: false, error: "cette idée existe déjà — vote pour elle !" });
        const id = "d" + (++doSeq).toString(36) + Math.random().toString(36).slice(2, 4);
        doleances[id] = { id, title, by: maskProfanity(clean(d.by)) || "Villageois", byUid: uid, dev: clean(d.dev), voters: [uid], status: "open", createdAt: Date.now() };
        doSave(); return sendJson(res, 200, doView(uid));
      }
      if (path === "/api/doleances/vote" && req.method === "POST") {
        if (!uid) return sendJson(res, 400, { ok: false, error: "uid requis" });
        const it = doleances[clean(d.id)]; if (!it) return sendJson(res, 404, { ok: false, error: "demande introuvable" });
        const i = it.voters.indexOf(uid); if (i >= 0) it.voters.splice(i, 1); else it.voters.push(uid);
        doSave(); return sendJson(res, 200, doView(uid));
      }
      return sendJson(res, 404, { ok: false, error: "route doleances inconnue" });
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
const peers = new Map(); // cid -> { ws, name, uid, named, x, y, d, lastChat, missed }

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

function uniqueName(base, exceptCid) {     // pseudo unique parmi les connectés (suffixe -2, -3… au besoin)
  base = base || "Villageois";
  const taken = new Set();
  for (const [id, p] of peers) if (id !== exceptCid && p.named) taken.add(p.name.toLowerCase());
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; i <= 999; i++) { const c = base + "-" + i; if (!taken.has(c.toLowerCase())) return c; }
  return base + "-" + Math.random().toString(36).slice(2, 5);
}

wss.on("connection", (ws, req) => {
  const o = req.headers.origin;
  if (o && !originAllowed(o)) { try { ws.close(1008, "origin"); } catch (e) { } return; }  // navigateur d'origine inconnue
  if (peers.size >= 200) { try { ws.close(1013, "full"); } catch (e) { } return; }          // garde-fou ressources

  const cid = "p" + (++seq).toString(36) + Math.random().toString(36).slice(2, 5);
  const peer = { ws, name: "Villageois", uid: "", named: false, x: 750, y: 500, d: 1, lastChat: 0, missed: 0 };
  peers.set(cid, peer);
  ws.on("pong", () => { peer.missed = 0; });

  ws.on("message", (buf) => {
    let m; try { m = JSON.parse(String(buf)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    if (m.t === "hi") {
      const reqUid = clean(m.uid || "").slice(0, 40);
      if (reqUid) {     // même appareil déjà présent (reconnexion) → évincer l'ancien pair pour éviter un doublon fantôme
        for (const [id, p] of peers) if (id !== cid && p.uid === reqUid) { try { p.ws.terminate(); } catch (e) { } peers.delete(id); wsBroadcast({ t: "l", id }, cid); }
      }
      peer.uid = reqUid;
      peer.name = uniqueName(maskProfanity(clean(m.n)) || "Villageois", cid);
      peer.named = true;
      peer.x = num(m.x, 0, 4000); peer.y = num(m.y, 0, 4000);
      const roster = [];
      for (const [id, p] of peers) if (id !== cid && p.named) roster.push({ id, n: p.name, x: Math.round(p.x), y: Math.round(p.y), d: p.d });
      try { ws.send(JSON.stringify({ t: "w", you: cid, name: peer.name, peers: roster, it: itCid, until: itUntil, cine: cine.queue, startedAt: cine.startedAt, now: Date.now() })); } catch (e) { }
      wsBroadcast({ t: "j", id: cid, n: peer.name, x: Math.round(peer.x), y: Math.round(peer.y), d: peer.d }, cid);
      if (ensureIt()) wsBroadcast(itState(), null);   // 1er arrivé = porteur de la poisse
    } else if (m.t === "m") {
      peer.x = num(m.x, 0, 4000); peer.y = num(m.y, 0, 4000); peer.d = m.d < 0 ? -1 : 1;
      wsBroadcast({ t: "m", id: cid, x: Math.round(peer.x), y: Math.round(peer.y), d: peer.d }, cid);
    } else if (m.t === "c") {
      const now = Date.now();
      if (now - peer.lastChat < 600) return;               // anti-spam : 1 message / 600 ms
      peer.chatTimes = (peer.chatTimes || []).filter(t => now - t < 12000);   // fenêtre anti-flood
      if (peer.chatTimes.length >= 6) { try { ws.send(JSON.stringify({ t: "sys", m: "Tu écris trop vite — patiente un instant." })); } catch (e) { } return; }
      peer.chatTimes.push(now); peer.lastChat = now;
      const text = maskProfanity(cleanChat(m.m));            // modération : masque les insultes
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
let chessSeq = 0;
const duelWaiting = Object.create(null);   // file d'attente par jeu : duelWaiting["chess"|"awale"] = cid en attente
const chessPeers = new Map();   // cid -> { ws, name, alive }
const chessGames = new Map();   // gid -> { w, b }  (cid blanc/Orange, cid noir/Vert)
function chessSend(cid, obj) { const p = chessPeers.get(cid); if (p && p.ws.readyState === 1) { try { p.ws.send(JSON.stringify(obj)); } catch (e) { } } }
function chessGameOf(cid) { for (const [gid, g] of chessGames) if (g.w === cid || g.b === cid) return [gid, g]; return null; }
function chessEnd(cid, reason) { const gx = chessGameOf(cid); if (!gx) return; chessSend(gx[1].w === cid ? gx[1].b : gx[1].w, { t: "end", reason }); chessGames.delete(gx[0]); }
function clearWaiting(cid) { for (const g in duelWaiting) if (duelWaiting[g] === cid) duelWaiting[g] = null; }

wssChess.on("connection", (ws, req) => {
  const o = req.headers.origin;
  if (o && !originAllowed(o)) { try { ws.close(1008, "origin"); } catch (e) { } return; }
  const cid = "c" + (++chessSeq).toString(36) + Math.random().toString(36).slice(2, 5);
  const peer = { ws, name: "Joueur", missed: 0 };
  chessPeers.set(cid, peer);
  ws.on("pong", () => { peer.missed = 0; });
  ws.on("message", (buf) => {
    let m; try { m = JSON.parse(String(buf)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    if (m.t === "join") {
      peer.name = maskProfanity(clean(m.n)) || "Joueur";
      peer.game = (m.game === "awale") ? "awale" : "chess";          // file séparée par jeu : pas de mélange échecs/awalé
      const wcid = duelWaiting[peer.game];
      if (wcid && wcid !== cid && chessPeers.has(wcid)) {
        duelWaiting[peer.game] = null;
        const gid = "g" + (++chessSeq).toString(36);
        const waitWhite = Math.random() < 0.5;                       // côté/couleur tiré au sort
        const white = waitWhite ? wcid : cid, black = waitWhite ? cid : wcid;
        chessGames.set(gid, { w: white, b: black });
        chessSend(white, { t: "start", color: "w", opp: chessPeers.get(black).name });
        chessSend(black, { t: "start", color: "b", opp: chessPeers.get(white).name });
      } else { duelWaiting[peer.game] = cid; chessSend(cid, { t: "waiting" }); }
    } else if (m.t === "move") {
      const gx = chessGameOf(cid); if (!gx) return;
      chessSend(gx[1].w === cid ? gx[1].b : gx[1].w, { t: "move", m: m.m });   // relais brut (client valide)
    } else if (m.t === "resign") { chessEnd(cid, "resign"); }
    else if (m.t === "leave") { clearWaiting(cid); chessEnd(cid, "left"); }
  });
  ws.on("close", () => { chessPeers.delete(cid); clearWaiting(cid); chessEnd(cid, "left"); });
  ws.on("error", () => { try { ws.close(); } catch (e) { } });
});

// heartbeat : éliminer les connexions mortes + garder le canal vivant à travers les proxies
const wsHeartbeat = setInterval(() => {
  for (const [cid, p] of peers) {
    if (p.missed >= 2) { try { p.ws.terminate(); } catch (e) { } peers.delete(cid); wsBroadcast({ t: "l", id: cid }, cid); continue; }   // 2 pings ratés (~50 s) avant éviction → tolère les hoquets réseau/mobile
    p.missed++; try { p.ws.ping(); } catch (e) { }
  }
  for (const [cid, p] of chessPeers) {
    if (p.missed >= 2) { try { p.ws.terminate(); } catch (e) { } chessPeers.delete(cid); clearWaiting(cid); chessEnd(cid, "left"); continue; }
    p.missed++; try { p.ws.ping(); } catch (e) { }
  }
}, 25000);
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
