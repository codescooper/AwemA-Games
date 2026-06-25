/* Garde-fou anti-divergence du moteur Lignées (à lancer avant de déployer une modif moteur) :
   engine/shared/lignees-engine.js (chargé par le NAVIGATEUR en <script> classique) DOIT rester
   identique à backend/lignees-engine.cjs (résolution serveur autoritaire). On vérifie
   l'OCTET (preuve que la logique est la même des deux côtés) + que le moteur tourne une
   saison complète sans erreur. Usage : `node backend/engine-parity.mjs` → OK ou exit 1.
   NB : on ne `require()` pas le .js (selon le package.json racine, Node peut le voir ESM) —
   l'égalité octet-pour-octet suffit à garantir que le navigateur exécute le même code. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const aBytes = readFileSync(new URL("../engine/shared/lignees-engine.js", import.meta.url));
const bBytes = readFileSync(new URL("./lignees-engine.cjs", import.meta.url));
const identical = Buffer.compare(aBytes, bBytes) === 0;
const B = require("./lignees-engine.cjs");
let s = B.buildScenario(); s.seed = 42424242; let ran = true;
try { for (let t = 0; t < 24; t++) s = B.resolveTick(s, { eventId: B.eventIdFor(s), eventChoices: {}, orders: [] }).state; } catch (e) { ran = false; console.error(e); }
const sane = ran && s.tick === 24;
console.log("octet-identique (engine/.js == backend/.cjs):", identical, "| moteur tourne 24 tours:", sane);
if (!identical || !sane) { console.log("ENGINE PARITY FAIL"); process.exit(1); }
console.log("ENGINE PARITY OK");
