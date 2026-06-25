/* AwemA — vérification de cohérence de la borne (node tools/check.mjs).
   Garde-fou : catalogue ↔ fichiers ↔ SW ↔ classements ↔ atelier ↔ parité backend
   ↔ liens relatifs ↔ stubs. Modelé sur backend/engine-parity.mjs. Sortie GO/NO-GO. */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const ENGINE = join(ROOT, "engine");
const problems = [], warns = [];
const fail = m => problems.push(m), warn = m => warns.push(m);

/* ---- charger le catalogue (catalog.js est un script classique à `self`) ---- */
let AWEMA;
try {
  const ctx = {};
  new Function("self", readFileSync(join(ENGINE, "catalog.js"), "utf8"))(ctx);
  AWEMA = ctx.AWEMA;
  if (!AWEMA || !Array.isArray(AWEMA.GAMES)) throw new Error("AWEMA.GAMES absent");
} catch (e) { console.error("FATAL: impossible de charger engine/catalog.js —", e.message); process.exit(1); }
const GAMES = AWEMA.GAMES;

/* ---- 1. catalogue ↔ fichiers ---- */
for (const g of GAMES) {
  if (!g.id || !g.file || !g.name) { fail(`catalogue: entrée incomplète ${JSON.stringify(g.id)}`); continue; }
  if (!existsSync(join(ENGINE, g.file))) fail(`catalogue: fichier manquant pour ${g.id} → engine/${g.file}`);
}
/* jeux orphelins dans games/ non catalogués (hors _archive) */
const catFiles = new Set(GAMES.map(g => g.file.split("/").pop()));
for (const f of readdirSync(join(ENGINE, "games"))) {
  if (f.endsWith(".html") && !catFiles.has(f)) warn(`games/${f} présent mais absent du catalogue`);
}

/* ---- 2. SW : SHELL dérivé + fichiers CORE présents ---- */
const sw = readFileSync(join(ENGINE, "sw.js"), "utf8");
if (!/importScripts\(\s*["']\.\/catalog\.js["']\s*\)/.test(sw)) fail("sw.js: importScripts('./catalog.js') manquant");
if (!/live\.map\(\s*g\s*=>\s*g\.file\s*\)/.test(sw)) fail("sw.js: le SHELL ne dérive pas du catalogue (live.map(g=>g.file))");
for (const c of ["index.html", "manifest.webmanifest", "icon.svg", "catalog.js", "shared/awema.js", "shared/analytics.js", "shared/pow.js", "shared/lignees-engine.js"])
  if (!existsSync(join(ENGINE, c))) fail(`sw.js CORE: fichier manquant engine/${c}`);

/* ---- 3. classements dérive du catalogue (pas de liste en dur) ---- */
const cls = readFileSync(join(ENGINE, "games", "classements.html"), "utf8");
if (!/AWEMA\.GAMES\.filter\(\s*g\s*=>\s*g\.score\s*\)/.test(cls)) fail("classements.html: GAMES non dérivé de AWEMA.GAMES");
if (/key:\s*"\w+_best"/.test(cls)) fail("classements.html: une liste GAMES codée en dur subsiste (key:\"..._best\")");

/* ---- 4. atelier dérive + leçons existantes ---- */
const at = readFileSync(join(ENGINE, "games", "atelier.html"), "utf8");
if (!/AWEMA\.GAMES\.filter\(/.test(at)) fail("atelier.html: ATELIER_CASES non dérivé de AWEMA.GAMES");
for (const g of GAMES) if (g.atelier) for (const L of (g.atelier.lessons || []))
  if (!new RegExp('id:\\s*"' + L + '"').test(at)) fail(`atelier.html: leçon ${L} (cas ${g.id}) introuvable dans COURSE`);

/* ---- 5. parité Indice : catalog.target === backend GAME_TARGETS ---- */
try {
  const idx = readFileSync(join(ROOT, "backend", "index.js"), "utf8");
  const m = idx.match(/GAME_TARGETS\s*=\s*\{([\s\S]*?)\}/);
  if (!m) warn("backend/index.js: GAME_TARGETS introuvable (parité non vérifiée)");
  else {
    const map = {}; let mm; const re = /(\w+)\s*:\s*(\d+)/g;
    while ((mm = re.exec(m[1]))) map[mm[1]] = +mm[2];
    for (const g of GAMES) if (g.score) {
      if (!(g.id in map)) fail(`parité: ${g.id} absent de backend GAME_TARGETS`);
      else if (map[g.id] !== g.score.target) fail(`parité: cible ${g.id} catalogue=${g.score.target} ≠ backend=${map[g.id]}`);
    }
  }
} catch (e) { warn("parité backend non vérifiée: " + e.message); }

/* ---- 6. liens relatifs résolus (tous les .html sous engine, hors _archive) ---- */
function htmlFiles(dir) { let out = []; for (const e of readdirSync(dir)) { const p = join(dir, e);
  if (statSync(p).isDirectory()) { if (e === "_archive" || e === "node_modules" || e === ".git") continue; out = out.concat(htmlFiles(p)); }
  else if (e.endsWith(".html")) out.push(p); } return out; }
const SKIP = /^(https?:|\/\/|data:|blob:|mailto:|tel:|javascript:|#)/;
for (const file of htmlFiles(ENGINE)) {
  const txt = readFileSync(file, "utf8");
  const re = /(?:src|href)\s*=\s*"([^"]*)"/g; let m2;
  while ((m2 = re.exec(txt))) {
    let ref = m2[1].trim();
    if (!ref || SKIP.test(ref) || ref.includes("$") || ref.includes("{") || ref.includes(" ")) continue;
    ref = ref.split("#")[0].split("?")[0]; if (!ref) continue;
    if (!/\.(html|js|css|webmanifest|svg|png|jpg|jpeg|gif|ico|json)$/i.test(ref)) continue;
    if (!existsSync(resolve(dirname(file), ref))) fail(`lien cassé dans ${file.replace(ROOT, ".")} → ${ref}`);
  }
}

/* ---- 7. stubs de redirection (engine/*.html racine) ---- */
for (const f of readdirSync(ENGINE)) {
  if (!f.endsWith(".html") || f === "index.html") continue;
  const txt = readFileSync(join(ENGINE, f), "utf8");
  const t = txt.match(/url=games\/([\w.-]+)/) || txt.match(/location\.replace\("games\/([\w.-]+)"/);
  if (!t) fail(`stub engine/${f}: pas de redirection vers games/…`);
  else if (!existsSync(join(ENGINE, "games", t[1]))) fail(`stub engine/${f}: cible games/${t[1]} inexistante`);
}

/* ---- 8. parité moteur Lignées (octet + run) ---- */
try { execSync("node backend/engine-parity.mjs", { cwd: ROOT, stdio: "pipe" }); }
catch (e) { fail("engine-parity.mjs a échoué: " + (e.stdout ? e.stdout.toString() : e.message)); }

/* ---- verdict ---- */
console.log(`Catalogue : ${GAMES.length} jeux (${GAMES.filter(g => g.score).length} notés, ${GAMES.filter(g => g.status === "live").length} live).`);
if (warns.length) console.log("⚠️  " + warns.length + " avertissement(s):\n - " + warns.join("\n - "));
if (problems.length) { console.error("\n❌ NO-GO — " + problems.length + " problème(s):\n - " + problems.join("\n - ")); process.exit(1); }
console.log("✅ GO — borne cohérente (catalogue ↔ fichiers ↔ SW ↔ classements ↔ atelier ↔ parité ↔ liens ↔ stubs).");
