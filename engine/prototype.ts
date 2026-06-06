/**
 * Lignées — Moteur de jeu (prototype 100 % LOCAL).
 *
 * ADR-1 : ce module est PUR et DÉTERMINISTE (aucun Math.random, aucune I/O, aucun
 * réseau). Le MÊME code tournera plus tard dans une fonction serveur, sans réécriture.
 * Pour le prototype, il tourne entièrement dans le navigateur / en local.
 *
 * Fichier unique volontairement (zéro souci de config de modules pour démarrer).
 * À terme, le découper en config.ts / types.ts / resolveTick.ts / scenario.ts (cf. spec §0).
 *
 * Lancer :  npm install  &&  npm run play     (Node ≥ 18 pour structuredClone)
 */

// ============================================================================
// ===== CONFIG (source unique des constantes de balance — cf. spec §2) =======
// ============================================================================
const CONFIG = {
  START: { gold: 100, grain: 100, soldiers: 50 },
  INCOME: {
    city: { gold: 20, grain: 0 },
    oasis: { gold: 0, grain: 20 },
    port: { gold: 15, grain: 10 },
  },
  DEV_COST: 40,
  DEV_INCOME_BONUS: 5,
  LEVEE_COST_PER_SOLDIER: { grain: 1, gold: 1 },
  CARAVANE_PROFIT_RATE: 0.5,
  FORTIFIE_COST: 40,
  FORTIFY_DEF_MULT: 0.25,
  COMBAT: { winnerLossRate: 0.3, loserLossRate: 0.8 },
  MUTUAL_DEFENSE_REINFORCE_RATE: 0.25,
  TREATY_BREAK_REP_PENALTY: 10,
  PRESTIGE: { perHoldingPerTick: 2, tradeProfitDivisor: 20, defenseWon: 8, capture: 12, repHigh: 2, repLow: 2 },
  REP: { start: 50, min: 0, max: 100 },
} as const;

// ============================================================================
// ===== TYPES ================================================================
// ============================================================================
type HoldingType = "city" | "oasis" | "port";
type OrderType = "DEV" | "LEVEE" | "CARAVANE" | "MARCHE" | "FORTIFIE" | "EMISSAIRE";
type TreatyType = "non_aggression" | "mutual_defense" | "trade_pact";

interface Holding { id: string; name: string; type: HoldingType; ownerHouseId: string | null; fortification: number; soldiers: number; incomeBonus: number; }
interface House { id: string; name: string; isAI: boolean; gold: number; grain: number; prestige: number; reputation: number; capitalHoldingId: string; alive: boolean; }
interface Treaty { a: string; b: string; type: TreatyType; status: "proposed" | "active" | "broken"; proposedBy: string; }
interface Order { houseId: string; slot: number; type: OrderType; params: any; status?: "pending" | "resolved" | "invalid"; }
interface WorldState { tick: number; holdings: Record<string, Holding>; houses: Record<string, House>; edges: Array<[string, string]>; treaties: Treaty[]; }
interface TickInput { orders: Order[]; eventId: string; eventChoices: Record<string, string>; }
interface LogEntry { tick: number; text: string; houseId?: string; public: boolean; }
interface TickResult { state: WorldState; log: LogEntry[]; }
interface Acc { tradeProfit: Record<string, number>; defensesWon: Record<string, number>; captures: Record<string, number>; }

// ============================================================================
// ===== HELPERS (purs) =======================================================
// ============================================================================
const clampRep = (h: House) => { h.reputation = Math.max(CONFIG.REP.min, Math.min(CONFIG.REP.max, h.reputation)); };

function neighbors(state: WorldState, id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of state.edges) { if (a === id) out.push(b); else if (b === id) out.push(a); }
  return out.sort();
}

function shortestPath(state: WorldState, from: string, to: string): string[] | null {
  if (from === to) return [from];
  const q: string[] = [from]; const prev: Record<string, string | null> = { [from]: null };
  while (q.length) {
    const cur = q.shift()!;
    for (const n of neighbors(state, cur)) {
      if (!(n in prev)) { prev[n] = cur; if (n === to) { const path = [n]; let p = cur; while (p != null) { path.unshift(p); p = prev[p]!; } return path; } q.push(n); }
    }
  }
  return null;
}

const hasActiveTreaty = (s: WorldState, a: string, b: string) =>
  s.treaties.some(t => t.status === "active" && ((t.a === a && t.b === b) || (t.a === b && t.b === a)));
const isMutualDefense = (s: WorldState, a: string, b: string) =>
  s.treaties.some(t => t.status === "active" && t.type === "mutual_defense" && ((t.a === a && t.b === b) || (t.a === b && t.b === a)));

const holdingsOf = (s: WorldState, houseId: string) => Object.values(s.holdings).filter(h => h.ownerHouseId === houseId).sort((x, y) => x.id < y.id ? -1 : 1);
const totalSoldiers = (s: WorldState, houseId: string) => holdingsOf(s, houseId).reduce((n, h) => n + h.soldiers, 0);

// ============================================================================
// ===== ÉVÉNEMENTS DU JOUR ====================================================
// ============================================================================
const EVENTS: Record<string, { name: string; apply: (h: House, choice: string) => void; aggregate?: (s: WorldState, choices: Record<string, string>, log: LogEntry[]) => void; }> = {
  harmattan: {
    name: "L'Harmattan (sécheresse)",
    apply: (h, c) => {
      if (c === "partager") { h.reputation += 10; h.grain -= 30; }
      else if (c === "speculer") { h.gold += 40; h.reputation -= 15; }
      // "thesauriser" : rien d'individuel ; l'effet vient de l'agrégat
      clampRep(h);
    },
    aggregate: (s, choices, log) => {
      const vals = Object.values(choices);
      const hoarders = vals.filter(c => c === "thesauriser").length;
      if (hoarders * 2 > vals.length) {
        for (const h of Object.values(s.houses)) h.grain -= 10;
        log.push({ tick: s.tick, text: "La majorité a thésaurisé : la famine s'aggrave (−10 grain pour tous).", public: true });
      }
    },
  },
  foire: {
    name: "Grande Foire de Tombouctou",
    apply: (h, c) => {
      if (c === "investir") h.gold += 50;          // simplifié (TUNABLE)
      else if (c === "parader") { h.gold -= 40; h.prestige += 15; }
      else if (c === "mercenaires") h.gold -= 60;  // +20 soldats appliqués via capitale ci-dessous
    },
  },
};

// ============================================================================
// ===== VALIDATION DES ORDRES (cf. spec §4) ==================================
// ============================================================================
function isOrderValid(s: WorldState, o: Order): boolean {
  const h = s.houses[o.houseId]; if (!h || !h.alive) return false;
  const p = o.params || {};
  switch (o.type) {
    case "DEV": return !!s.holdings[p.holding] && s.holdings[p.holding].ownerHouseId === h.id && h.gold >= CONFIG.DEV_COST;
    case "FORTIFIE": return !!s.holdings[p.holding] && s.holdings[p.holding].ownerHouseId === h.id && h.gold >= CONFIG.FORTIFIE_COST;
    case "LEVEE": return p.count > 0 && h.grain >= p.count && h.gold >= p.count;
    case "CARAVANE": return p.gold > 0 && h.gold >= p.gold && !!s.holdings[p.from] && s.holdings[p.from].ownerHouseId === h.id && !!s.holdings[p.to];
    case "MARCHE": {
      const from = s.holdings[p.from];
      return !!from && from.ownerHouseId === h.id && p.soldiers > 0 && from.soldiers >= p.soldiers && neighbors(s, p.from).includes(p.to);
    }
    case "EMISSAIRE": return !!s.houses[p.target] && p.target !== h.id;
    default: return false;
  }
}

// ============================================================================
// ===== LE MOTEUR : resolveTick (déterministe, idempotent) ===================
// ============================================================================
function resolveTick(input0: WorldState, tickInput: TickInput): TickResult {
  const state: WorldState = structuredClone(input0); // ne mute jamais l'entrée
  const log: LogEntry[] = [];
  const acc: Acc = { tradeProfit: {}, defensesWon: {}, captures: {} };

  // copies de travail (on ne mute pas l'input)
  const orders: Order[] = [...tickInput.orders];
  const choices: Record<string, string> = { ...tickInput.eventChoices };

  // 0. Factions IA : génèrent leurs ordres et choix manquants
  generateAIOrders(state, orders, choices);

  // validation (les invalides sont ignorés)
  const valid = orders.filter(o => { const ok = isOrderValid(state, o); o.status = ok ? "pending" : "invalid"; return ok; });

  // 1. Revenus
  for (const hd of Object.values(state.holdings)) {
    if (!hd.ownerHouseId) continue; const owner = state.houses[hd.ownerHouseId]; if (!owner) continue;
    const inc = CONFIG.INCOME[hd.type];
    owner.gold += inc.gold + (hd.type !== "oasis" ? hd.incomeBonus : 0);
    owner.grain += inc.grain + (hd.type === "oasis" ? hd.incomeBonus : 0);
  }

  // 2. Événement du jour
  const ev = EVENTS[tickInput.eventId];
  if (ev) {
    for (const h of Object.values(state.houses)) { const c = choices[h.id]; if (c) ev.apply(h, c); }
    // cas spécial Foire/mercenaires : +20 soldats à la capitale
    if (tickInput.eventId === "foire") for (const h of Object.values(state.houses)) if (choices[h.id] === "mercenaires") state.holdings[h.capitalHoldingId].soldiers += 20;
    ev.aggregate?.(state, choices, log);
  }

  // 3. Caravanes (déterministe : pas de hasard ; interception = garnison hostile sur la route)
  for (const o of valid.filter(o => o.type === "CARAVANE")) {
    const h = state.houses[o.houseId]; const path = shortestPath(state, o.params.from, o.params.to);
    if (h.gold < o.params.gold) { o.status = "invalid"; continue; }
    h.gold -= o.params.gold; // cargaison en transit
    let interceptor: string | null = null;
    if (path) for (const hid of path.slice(1)) { const hd = state.holdings[hid]; if (hd.ownerHouseId && hd.ownerHouseId !== h.id && !hasActiveTreaty(state, h.id, hd.ownerHouseId) && hd.soldiers > 0) { interceptor = hd.ownerHouseId; break; } }
    if (interceptor) {
      state.houses[interceptor].gold += o.params.gold;
      log.push({ tick: state.tick, text: `Caravane de ${h.name} interceptée par ${state.houses[interceptor].name} (−${o.params.gold} or).`, houseId: h.id, public: false });
    } else {
      const profit = Math.floor(o.params.gold * CONFIG.CARAVANE_PROFIT_RATE);
      h.gold += o.params.gold + profit; acc.tradeProfit[h.id] = (acc.tradeProfit[h.id] || 0) + profit;
      log.push({ tick: state.tick, text: `Caravane de ${h.name} arrivée (+${profit} or de profit).`, houseId: h.id, public: false });
    }
  }

  // 4. Combats (MARCHE) — regroupés par lieu cible
  const marches = valid.filter(o => o.type === "MARCHE");
  // retirer d'abord les soldats des lieux sources (en transit)
  for (const o of marches) { const from = state.holdings[o.params.from]; const n = Math.min(o.params.soldiers, from.soldiers); o.params.soldiers = n; from.soldiers -= n; }
  const byTarget: Record<string, Order[]> = {};
  for (const o of marches) (byTarget[o.params.to] ||= []).push(o);

  for (const target of Object.keys(byTarget).sort()) {
    const hd = state.holdings[target]; const attackers = byTarget[target];
    const attackTotal = attackers.reduce((n, o) => n + o.params.soldiers, 0);
    const defenderId = hd.ownerHouseId;
    // renforts (défense mutuelle) : alliés du défenseur possédant un lieu adjacent à la cible
    const reinforcements: Array<{ hid: string; amount: number }> = [];
    if (defenderId) for (const allyHolding of Object.values(state.holdings)) {
      if (allyHolding.ownerHouseId && allyHolding.ownerHouseId !== defenderId && isMutualDefense(state, defenderId, allyHolding.ownerHouseId) && neighbors(state, target).includes(allyHolding.id)) {
        const amt = Math.floor(allyHolding.soldiers * CONFIG.MUTUAL_DEFENSE_REINFORCE_RATE); if (amt > 0) reinforcements.push({ hid: allyHolding.id, amount: amt });
      }
    }
    const reinforceTotal = reinforcements.reduce((n, r) => n + r.amount, 0);
    const defensePower = Math.floor(hd.soldiers * (1 + CONFIG.FORTIFY_DEF_MULT * hd.fortification)) + reinforceTotal;

    if (attackTotal > defensePower) {
      // attaquants gagnent
      const defLoss = Math.floor(hd.soldiers * CONFIG.COMBAT.loserLossRate); hd.soldiers -= defLoss;
      for (const r of reinforcements) state.holdings[r.hid].soldiers -= Math.floor(r.amount * CONFIG.COMBAT.loserLossRate);
      // survivants attaquants rentrent ; le plus gros peut capturer si garnison = 0
      const biggest = [...attackers].sort((a, b) => b.params.soldiers - a.params.soldiers || (a.houseId < b.houseId ? -1 : 1))[0];
      for (const o of attackers) {
        const surv = o.params.soldiers - Math.floor(o.params.soldiers * CONFIG.COMBAT.winnerLossRate);
        if (hd.soldiers === 0 && o === biggest) { hd.ownerHouseId = o.houseId; hd.fortification = 0; hd.soldiers = surv; acc.captures[o.houseId] = (acc.captures[o.houseId] || 0) + 1; log.push({ tick: state.tick, text: `${state.houses[o.houseId].name} a capturé ${hd.name} !`, public: true }); }
        else state.holdings[o.params.from].soldiers += surv; // rentrent à la source
      }
      if (defenderId) log.push({ tick: state.tick, text: `${hd.name} (${state.houses[defenderId].name}) razzié : −${defLoss} guerriers.`, houseId: defenderId, public: false });
    } else {
      // défense tient
      for (const o of attackers) { const surv = o.params.soldiers - Math.floor(o.params.soldiers * CONFIG.COMBAT.loserLossRate); state.holdings[o.params.from].soldiers += surv; }
      const defLoss = Math.floor(hd.soldiers * CONFIG.COMBAT.winnerLossRate); hd.soldiers -= defLoss;
      for (const r of reinforcements) state.holdings[r.hid].soldiers -= Math.floor(r.amount * CONFIG.COMBAT.winnerLossRate);
      if (defenderId) { acc.defensesWon[defenderId] = (acc.defensesWon[defenderId] || 0) + 1; log.push({ tick: state.tick, text: `${hd.name} (${state.houses[defenderId].name}) a repoussé l'assaut.`, houseId: defenderId, public: true }); }
    }
  }

  // 5. Économie : DEV / LEVEE / FORTIFIE
  for (const o of valid.filter(o => ["DEV", "LEVEE", "FORTIFIE"].includes(o.type))) {
    const h = state.houses[o.houseId]; const p = o.params;
    if (o.type === "DEV" && h.gold >= CONFIG.DEV_COST) { h.gold -= CONFIG.DEV_COST; state.holdings[p.holding].incomeBonus += CONFIG.DEV_INCOME_BONUS; }
    else if (o.type === "FORTIFIE" && h.gold >= CONFIG.FORTIFIE_COST) { h.gold -= CONFIG.FORTIFIE_COST; state.holdings[p.holding].fortification += 1; }
    else if (o.type === "LEVEE" && h.grain >= p.count && h.gold >= p.count) { h.grain -= p.count; h.gold -= p.count; state.holdings[h.capitalHoldingId].soldiers += p.count; }
  }

  // 6. Traités (EMISSAIRE : propose / accept / break)
  for (const o of valid.filter(o => o.type === "EMISSAIRE")) {
    const h = state.houses[o.houseId]; const p = o.params;
    if (p.action === "propose") { if (!state.treaties.some(t => t.status !== "broken" && t.type === p.treaty && ((t.a === h.id && t.b === p.target) || (t.a === p.target && t.b === h.id)))) state.treaties.push({ a: h.id, b: p.target, type: p.treaty, status: "proposed", proposedBy: h.id }); }
    else if (p.action === "accept") { const t = state.treaties.find(t => t.status === "proposed" && ((t.a === p.target && t.b === h.id) || (t.a === h.id && t.b === p.target))); if (t) { t.status = "active"; log.push({ tick: state.tick, text: `Traité ${t.type} actif entre ${state.houses[t.a].name} et ${state.houses[t.b].name}.`, public: true }); } }
    else if (p.action === "break") { const t = state.treaties.find(t => t.status === "active" && ((t.a === h.id && t.b === p.target) || (t.a === p.target && t.b === h.id))); if (t) { t.status = "broken"; h.reputation -= CONFIG.TREATY_BREAK_REP_PENALTY; clampRep(h); log.push({ tick: state.tick, text: `${h.name} a ROMPU son traité avec ${state.houses[p.target].name} ! (−${CONFIG.TREATY_BREAK_REP_PENALTY} réputation)`, public: true }); } }
  }

  // 7. Prestige + réputation (accumulation)
  for (const h of Object.values(state.houses)) {
    const nbHoldings = holdingsOf(state, h.id).length; h.alive = nbHoldings > 0;
    let d = nbHoldings * CONFIG.PRESTIGE.perHoldingPerTick
      + Math.floor((acc.tradeProfit[h.id] || 0) / CONFIG.PRESTIGE.tradeProfitDivisor)
      + (acc.defensesWon[h.id] || 0) * CONFIG.PRESTIGE.defenseWon
      + (acc.captures[h.id] || 0) * CONFIG.PRESTIGE.capture;
    if (h.reputation >= 70) d += CONFIG.PRESTIGE.repHigh; else if (h.reputation <= 30) d -= CONFIG.PRESTIGE.repLow;
    h.prestige += d;
  }

  state.tick += 1;
  return { state, log };
}

// ============================================================================
// ===== FACTIONS IA (heuristiques scriptées — 0 LLM, 0 réseau) ===============
// ============================================================================
function generateAIOrders(state: WorldState, orders: Order[], choices: Record<string, string>) {
  const hasOrders = (id: string) => orders.some(o => o.houseId === id);
  for (const h of Object.values(state.houses).sort((a, b) => a.id < b.id ? -1 : 1)) {
    if (!h.isAI || !h.alive) continue;
    if (choices[h.id] === undefined) choices[h.id] = h.reputation < 50 ? "partager" : "thesauriser";
    if (hasOrders(h.id)) continue;
    const mine = holdingsOf(state, h.id); if (mine.length === 0) continue;
    const slots: Array<{ type: OrderType; params: any }> = [];
    // 1) économie
    if (h.gold > 80) slots.push({ type: "DEV", params: { holding: mine[0].id } });
    else slots.push({ type: "LEVEE", params: { count: Math.min(20, h.grain) } });
    // 2) diplomatie : proposer non-agression à un voisin non lié
    const neighborHouses = new Set<string>();
    for (const hd of mine) for (const n of neighbors(state, hd.id)) { const o = state.holdings[n].ownerHouseId; if (o && o !== h.id) neighborHouses.add(o); }
    const target = [...neighborHouses].sort().find(o => !hasActiveTreaty(state, h.id, o));
    if (target) slots.push({ type: "EMISSAIRE", params: { action: "propose", target, treaty: "non_aggression" } });
    // 3) attaque si fort
    if (totalSoldiers(state, h.id) > 70) {
      let best: { from: string; to: string; def: number } | null = null;
      for (const hd of mine) for (const n of neighbors(state, hd.id)) { const t = state.holdings[n]; if (t.ownerHouseId && t.ownerHouseId !== h.id && !hasActiveTreaty(state, h.id, t.ownerHouseId)) { if (!best || t.soldiers < best.def) best = { from: hd.id, to: n, def: t.soldiers }; } }
      if (best) slots.push({ type: "MARCHE", params: { from: best.from, to: best.to, soldiers: Math.floor(state.holdings[best.from].soldiers * 0.8) } });
    }
    slots.slice(0, 3).forEach((s, i) => orders.push({ houseId: h.id, slot: i, type: s.type, params: s.params }));
  }
}

// ============================================================================
// ===== SCÉNARIO DE TEST (calqué sur le kit-test-papier) =====================
// ============================================================================
function buildScenario(): WorldState {
  const H = (id: string, name: string, type: HoldingType, owner: string | null, soldiers: number): [string, Holding] =>
    [id, { id, name, type, ownerHouseId: owner, fortification: 0, soldiers, incomeBonus: 0 }];
  const holdings = Object.fromEntries([
    H("aoudaghost", "Aoudaghost", "oasis", "aissata", 70),
    H("goundam", "Goundam", "oasis", "aissata", 10),
    H("tinduk", "Tindûk", "oasis", "tinduk", 40),
    H("koumbi", "Koumbi", "city", "tinduk", 50),
    H("zalimba", "Zalimba", "port", "zalimba", 50),
    H("djenne", "Djenné", "city", "djenne", 50),
    H("tombouctou", "Tombouctou", "city", "tombouctou", 50),
    H("gao", "Gao", "city", "gao", 50),
  ]);
  const mkHouse = (id: string, name: string, isAI: boolean, capital: string): [string, House] =>
    [id, { id, name, isAI, gold: CONFIG.START.gold, grain: CONFIG.START.grain, prestige: 0, reputation: CONFIG.REP.start, capitalHoldingId: capital, alive: true }];
  const houses = Object.fromEntries([
    mkHouse("aissata", "Maison d'Aïssata", false, "aoudaghost"),
    mkHouse("tinduk", "Maison Tindûk", true, "tinduk"),
    mkHouse("zalimba", "Maison Zalimba", true, "zalimba"),
    mkHouse("djenne", "Maison Djenné", true, "djenne"),
    mkHouse("tombouctou", "Maison Tombouctou", true, "tombouctou"),
    mkHouse("gao", "Maison Gao", true, "gao"),
  ]);
  const edges: Array<[string, string]> = [
    ["tombouctou", "gao"], ["gao", "koumbi"],
    ["tombouctou", "djenne"], ["gao", "aoudaghost"], ["koumbi", "tinduk"],
    ["djenne", "aoudaghost"], ["aoudaghost", "tinduk"],
    ["aoudaghost", "zalimba"], ["djenne", "goundam"],
  ];
  // un pacte commercial préexistant Aïssata <-> Djenné (rend sa route caravane sûre)
  const treaties: Treaty[] = [{ a: "aissata", b: "djenne", type: "trade_pact", status: "active", proposedBy: "djenne" }];
  return { tick: 0, holdings, houses, edges, treaties };
}

// ============================================================================
// ===== HARNAIS : lance 1 tick et VÉRIFIE les calculs du test papier =========
// ============================================================================
function fmt(s: WorldState): string {
  const houses = Object.values(s.houses).map(h => `  ${h.name.padEnd(22)} or:${String(h.gold).padStart(4)} grain:${String(h.grain).padStart(4)} prestige:${String(h.prestige).padStart(3)} rép:${h.reputation}`).join("\n");
  const holds = Object.values(s.holdings).map(h => `  ${h.name.padEnd(12)} [${h.type}] proprio:${(h.ownerHouseId || "—").padEnd(11)} garnison:${String(h.soldiers).padStart(3)} fort:${h.fortification}`).join("\n");
  return `— MAISONS —\n${houses}\n— LIEUX —\n${holds}`;
}

let pass = 0, fail = 0;
function check(label: string, got: any, want: any) {
  const ok = got === want; ok ? pass++ : fail++;
  console.log(`  ${ok ? "✅" : "❌"} ${label} : ${got}${ok ? "" : `  (attendu ${want})`}`);
}

function main() {
  const s0 = buildScenario();
  console.log("\n=== ÉTAT INITIAL (tick 0) ===\n" + fmt(s0));

  // Ordres du joueur Aïssata (reproduit l'exemple "Jour 12" du kit) :
  const input: TickInput = {
    eventId: "harmattan",
    eventChoices: { aissata: "partager", tinduk: "speculer", zalimba: "thesauriser", djenne: "thesauriser", tombouctou: "thesauriser", gao: "thesauriser" },
    orders: [
      { houseId: "aissata", slot: 0, type: "MARCHE", params: { from: "aoudaghost", to: "tinduk", soldiers: 60 } },
      { houseId: "aissata", slot: 1, type: "CARAVANE", params: { from: "aoudaghost", to: "goundam", gold: 50 } },
      { houseId: "aissata", slot: 2, type: "DEV", params: { holding: "goundam" } },
      // Tindûk fortifie (appliqué APRÈS le combat → ne le protège pas ce tour : leçon de design)
      { houseId: "tinduk", slot: 0, type: "FORTIFIE", params: { holding: "tinduk" } },
      // les 4 autres Maisons : ordres générés par l'IA
    ],
  };

  const { state, log } = resolveTick(s0, input);
  console.log("\n=== APRÈS LA NUIT (tick " + state.tick + ") ===\n" + fmt(state));
  console.log("\n=== CHRONIQUE ===");
  for (const e of log) console.log(`  • ${e.text}`);

  console.log("\n=== CONTRÔLES (le code doit reproduire les calculs papier) ===");
  check("Tindûk garnison 40 → 8 (−80%)", state.holdings.tinduk.soldiers, 8);
  check("Aoudaghost 70 −60 +42 survivants = 52", state.holdings.aoudaghost.soldiers, 52);
  check("Aïssata or = 85 (100 −50 caravane +75 retour −40 DEV)", state.houses.aissata.gold, 85);
  check("Aïssata grain = 100 (100 +40 revenu −30 partage −10 famine)", state.houses.aissata.grain, 100);
  check("Aïssata réputation = 60 (+10 partage)", state.houses.aissata.reputation, 60);
  check("Aïssata prestige = 5 (2 lieux×2 + profit 25÷20)", state.houses.aissata.prestige, 5);
  check("Tindûk garde son lieu (pas capturé : reste 8)", state.holdings.tinduk.ownerHouseId, "tinduk");

  console.log(`\n${fail === 0 ? "✅ TOUS LES CONTRÔLES PASSENT" : "❌ " + fail + " ÉCHEC(S)"} (${pass}/${pass + fail})\n`);
}

main();
