/* AwemA — Proof-of-Work anti-bot (Hashcash, Adam Back 1997). Auto-hébergé, sans SaaS, sans tiers.
   Asymétrie : PRODUIRE la preuve coûte du CPU (client, ~2^D hash), VÉRIFIER = 1 hash (serveur).
   STATELESS : le challenge est signé (HMAC) → pas besoin de le stocker pour le vérifier.
   GATED / NO-OP : inactif tant que POW_SECRET est absent → on merge sans risque et on l'allume
   en prod via la seule variable d'env. Voir docs/antibot-pow.md. */
import { createHmac, createHash, randomBytes } from "node:crypto";

const SECRET = process.env.POW_SECRET || "";
const ENABLED = !!SECRET && process.env.POW_ENABLED !== "0";          // actif dès que le secret est posé
const BITS = Math.max(8, Math.min(26, Number(process.env.POW_BITS) || 18));   // difficulté (bits de zéro)
const TTL_MS = 5 * 60 * 1000;                                          // validité d'un challenge

export const powEnabled = () => ENABLED;
export const powBits = () => BITS;

const sign = payload => createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);

export function issueChallenge() {
  if (!ENABLED) return { enabled: false };
  const salt = randomBytes(16).toString("hex");
  const exp = Date.now() + TTL_MS;
  const payload = salt + ":" + exp + ":" + BITS;
  return { enabled: true, challenge: payload + ":" + sign(payload), difficulty: BITS, ttlMs: TTL_MS };
}

// anti-rejeu : un salt n'est consommé qu'une fois (MONO-INSTANCE ; multi-instance → store partagé type Redis SETNX).
const used = new Map();   // salt -> exp(ms)
function gcUsed() { const now = Date.now(); for (const [s, e] of used) if (e < now) used.delete(s); }

const CLZ4 = [4, 3, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];        // bits de zéro en tête d'un quartet hex
function leadingZeroBits(hex) { let b = 0; for (let i = 0; i < hex.length; i++) { const v = parseInt(hex[i], 16); b += CLZ4[v]; if (v !== 0) break; } return b; }

export function verifyPoW(pow) {
  if (!ENABLED) return { ok: true, skipped: true };                  // NO-OP (dev / pas encore activé)
  if (!pow || typeof pow !== "object") return { ok: false, error: "preuve requise" };
  const challenge = String(pow.c || ""), nonce = String(pow.n);
  const p = challenge.split(":");
  if (p.length !== 4) return { ok: false, error: "challenge malforme" };
  const [salt, expS, diffS, sig] = p;
  if (sign(salt + ":" + expS + ":" + diffS) !== sig) return { ok: false, error: "challenge forge" };       // (a) signature
  if (!(Number(expS) > Date.now())) return { ok: false, error: "challenge expire" };                        // (b) TTL
  if (!(Number(diffS) >= BITS)) return { ok: false, error: "difficulte insuffisante" };                     // (c) anti-downgrade
  const h = createHash("sha256").update(challenge + ":" + nonce).digest("hex");
  if (leadingZeroBits(h) < Number(diffS)) return { ok: false, error: "preuve invalide" };                   // (d) la preuve
  if (used.has(salt)) return { ok: false, error: "preuve rejouee" };                                         // (e) anti-rejeu
  used.set(salt, Number(expS)); if (used.size > 5000) gcUsed();
  return { ok: true };
}

// limite de débit de l'émission de challenges par IP (mono-instance).
const issueLog = new Map();   // ip -> [timestamps]
export function allowIssue(ip) {
  const now = Date.now(); ip = ip || "?";
  const arr = (issueLog.get(ip) || []).filter(t => now - t < 10000);
  if (arr.length >= 30) { issueLog.set(ip, arr); return false; }      // max 30 challenges / 10 s / IP
  arr.push(now); issueLog.set(ip, arr);
  if (issueLog.size > 5000) for (const [k, v] of issueLog) if (!v.some(t => now - t < 10000)) issueLog.delete(k);
  return true;
}
