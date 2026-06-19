/* AwemA — Lignées : MOTEUR PUR & DÉTERMINISTE (partagé navigateur + serveur Node).
   Aucune dépendance, aucune I/O, aucun accès DOM : resolveTick(state, tickInput)
   renvoie un nouvel état (structuredClone). Même code côté client (conseil.html)
   et côté serveur Railway (résolution autoritaire du multijoueur asynchrone).
   ADR-1 : déterministe à partir de l'état (clé `seed`) -> rejouable et vérifiable. */
const CONFIG = { START:{gold:100,grain:100,soldiers:50}, INCOME:{city:{gold:20,grain:0},oasis:{gold:0,grain:20},port:{gold:15,grain:10}}, DEV_COST:40, DEV_INCOME_BONUS:5, CARAVANE_PROFIT_RATE:0.5, FORTIFIE_COST:40, FORTIFY_DEF_MULT:0.4, COMBAT:{winnerLossRate:0.6,loserLossRate:0.85}, MUTUAL_DEFENSE_REINFORCE_RATE:0.3, UPKEEP_RATE:0.34, TERRAIN_DEF:{city:1.6,port:1.2,oasis:0.95}, TREATY_BREAK_REP_PENALTY:10, PRESTIGE:{perHoldingPerTick:2,tradeProfitDivisor:12,defenseWon:10,capture:8,repHigh:4,repLow:2,treatyPerTick:1}, REP:{start:50,min:0,max:100}, SEASON_LENGTH:24 };
const clampRep = h => { h.reputation = Math.max(CONFIG.REP.min, Math.min(CONFIG.REP.max, h.reputation)); };
function neighbors(s, id){ const o=[]; for(const [a,b] of s.edges){ if(a===id)o.push(b); else if(b===id)o.push(a);} return o.sort(); }
function shortestPath(s, from, to){ if(from===to)return[from]; const q=[from],prev={[from]:null}; while(q.length){const c=q.shift(); for(const n of neighbors(s,c)){ if(!(n in prev)){prev[n]=c; if(n===to){const p=[n];let x=c;while(x!=null){p.unshift(x);x=prev[x];}return p;} q.push(n);}}} return null; }
const hasActiveTreaty=(s,a,b)=>s.treaties.some(t=>t.status==="active"&&((t.a===a&&t.b===b)||(t.a===b&&t.b===a)));
const isMutualDefense=(s,a,b)=>s.treaties.some(t=>t.status==="active"&&t.type==="mutual_defense"&&((t.a===a&&t.b===b)||(t.a===b&&t.b===a)));
const holdingsOf=(s,id)=>Object.values(s.holdings).filter(h=>h.ownerHouseId===id).sort((x,y)=>x.id<y.id?-1:1);
const totalSoldiers=(s,id)=>holdingsOf(s,id).reduce((n,h)=>n+h.soldiers,0);
function removeSoldiers(s,id,n){ const hs=holdingsOf(s,id).sort((a,b)=>b.soldiers-a.soldiers); let left=n; for(const h of hs){ const t=Math.min(h.soldiers,left); h.soldiers-=t; left-=t; if(left<=0)break; } }
const EVENTS={
  harmattan:{name:"L'Harmattan (sécheresse)",apply:(h,c,s)=>{if(c==="partager"){h.reputation+=10;h.grain-=30;}else if(c==="speculer"){h.gold+=40;h.reputation-=15;}clampRep(h);},aggregate:(s,ch,log)=>{const v=Object.values(ch),hoard=v.filter(c=>c==="thesauriser").length;if(hoard*2>v.length){for(const h of Object.values(s.houses))h.grain-=10;log.push({tick:s.tick,text:"La majorité a thésaurisé : la famine s'aggrave (−10 grain pour tous).",public:true});}}},
  foire:{name:"Grande Foire de Tombouctou",apply:(h,c,s)=>{if(c==="investir")h.gold+=50;else if(c==="parader"){h.gold-=40;h.prestige+=15;}else if(c==="mercenaires"){h.gold-=60;s.holdings[h.capitalHoldingId].soldiers+=20;}}},
  pelerins:{name:"La caravane de pèlerins",apply:(h,c,s)=>{if(c==="escorter")h.reputation+=10;else if(c==="taxer"){h.gold+=30;h.reputation-=5;}clampRep(h);}},
  crue:{name:"La crue du fleuve",apply:(h,c,s)=>{if(c==="semer"){h.gold-=20;h.grain+=30;}else if(c==="prier")h.reputation+=5;clampRep(h);}},
  griot:{name:"Le griot chante ta lignée",apply:(h,c,s)=>{if(c==="honorer"){h.gold-=15;h.prestige+=12;}else if(c==="modeste")h.reputation+=3;clampRep(h);}},
  pillards:{name:"Des pillards rôdent",apply:(h,c,s)=>{if(c==="tribut")h.gold-=30;else if(c==="garde"){h.gold-=10;s.holdings[h.capitalHoldingId].soldiers+=10;}clampRep(h);}}
};
const EVENT_ORDER=["harmattan","foire","pelerins","crue","griot","pillards"];
function eventIdFor(s){ const sd=s.seed||0; const hh=((sd^(s.tick*2654435761))>>>0); return EVENT_ORDER[hh%EVENT_ORDER.length]; }
/* ARC DE SAISON (3 actes) + AMBITIONS (voies de victoire) */
const ACTS=[{from:16,name:"Le Sacre",mult:1.5,ic:"👑"},{from:8,name:"Les Tensions",mult:1,ic:"⚔️"},{from:0,name:"L'Essor",mult:1,ic:"🌱"}];
function actOf(tick){ for(const a of ACTS)if(tick>=a.from)return a; return ACTS[ACTS.length-1]; }
const AMBITIONS={
  commerce:{name:"Empire marchand",desc:"finir avec ≥ 350 or",check:(s,h)=>h.gold>=350,bonus:50},
  conquete:{name:"Soif de conquête",desc:"tenir ≥ 5 lieux",check:(s,h)=>holdingsOf(s,h.id).length>=5,bonus:50},
  diplomatie:{name:"Tisseur d'alliances",desc:"≥ 3 traités actifs",check:(s,h)=>s.treaties.filter(t=>t.status==="active"&&(t.a===h.id||t.b===h.id)).length>=3,bonus:50},
  bastion:{name:"Cœur imprenable",desc:"≥ 4 fortifications cumulées",check:(s,h)=>holdingsOf(s,h.id).reduce((n,x)=>n+x.fortification,0)>=4,bonus:50},
  renommee:{name:"Gloire éternelle",desc:"réputation ≥ 75",check:(s,h)=>h.reputation>=75,bonus:50}
};
function isOrderValid(s,o){ const h=s.houses[o.houseId]; if(!h||!h.alive)return false; const p=o.params||{}; switch(o.type){
  case"DEV":return !!s.holdings[p.holding]&&s.holdings[p.holding].ownerHouseId===h.id&&h.gold>=CONFIG.DEV_COST;
  case"FORTIFIE":return !!s.holdings[p.holding]&&s.holdings[p.holding].ownerHouseId===h.id&&h.gold>=CONFIG.FORTIFIE_COST;
  case"LEVEE":return p.count>0&&h.grain>=p.count&&h.gold>=p.count;
  case"CARAVANE":return p.gold>0&&h.gold>=p.gold&&!!s.holdings[p.from]&&s.holdings[p.from].ownerHouseId===h.id&&!!s.holdings[p.to];
  case"MARCHE":{const f=s.holdings[p.from];return !!f&&f.ownerHouseId===h.id&&p.soldiers>0&&f.soldiers>=p.soldiers&&neighbors(s,p.from).includes(p.to);}
  case"EMISSAIRE":return !!s.houses[p.target]&&p.target!==h.id; default:return false; } }
function resolveTick(input0, tickInput){ const state=structuredClone(input0); const log=[]; const events=[]; const econ={}; const ec=id=>econ[id]||(econ[id]={incomeGold:0,incomeGrain:0,upkeep:0,desertions:0}); const acc={tradeProfit:{},defensesWon:{},captures:{}};
  const orders=[...tickInput.orders]; const choices={...tickInput.eventChoices}; generateAIOrders(state,orders,choices,tickInput.eventId);
  const valid=orders.filter(o=>{const ok=isOrderValid(state,o);o.status=ok?"pending":"invalid";return ok;});
  for(const hd of Object.values(state.holdings)){ if(!hd.ownerHouseId)continue; const o=state.houses[hd.ownerHouseId]; if(!o)continue; const inc=CONFIG.INCOME[hd.type]; const ig=inc.gold+(hd.type!=="oasis"?hd.incomeBonus:0), igr=inc.grain+(hd.type==="oasis"?hd.incomeBonus:0); o.gold+=ig; o.grain+=igr; const e=ec(o.id); e.incomeGold+=ig; e.incomeGrain+=igr; }
  const ev=EVENTS[tickInput.eventId];
  if(ev){ for(const h of Object.values(state.houses)){const c=choices[h.id];if(c)ev.apply(h,c,state);} if(ev.aggregate)ev.aggregate(state,choices,log); }
  for(const o of valid.filter(o=>o.type==="CARAVANE")){ const h=state.houses[o.houseId]; const path=shortestPath(state,o.params.from,o.params.to); if(h.gold<o.params.gold){o.status="invalid";continue;} h.gold-=o.params.gold; let interceptor=null;
    if(path)for(const hid of path.slice(1)){const hd=state.holdings[hid];if(hd.ownerHouseId&&hd.ownerHouseId!==h.id&&!hasActiveTreaty(state,h.id,hd.ownerHouseId)&&hd.soldiers>0){interceptor=hd.ownerHouseId;break;}}
    events.push({type:"caravan",from:o.params.from,to:o.params.to,house:h.id,intercepted:!!interceptor});
    if(interceptor){state.houses[interceptor].gold+=o.params.gold;log.push({tick:state.tick,text:`Caravane de ${h.name} interceptée par ${state.houses[interceptor].name} (−${o.params.gold} or).`,houseId:h.id,public:false});}
    else{const profit=Math.floor(o.params.gold*CONFIG.CARAVANE_PROFIT_RATE);h.gold+=o.params.gold+profit;acc.tradeProfit[h.id]=(acc.tradeProfit[h.id]||0)+profit;log.push({tick:state.tick,text:`Caravane de ${h.name} arrivée (+${profit} or de profit).`,houseId:h.id,public:false});} }
  const marches=valid.filter(o=>o.type==="MARCHE");
  for(const o of marches){const f=state.holdings[o.params.from];const n=Math.min(o.params.soldiers,f.soldiers);o.params.soldiers=n;f.soldiers-=n;}
  const byTarget={}; for(const o of marches)(byTarget[o.params.to]||(byTarget[o.params.to]=[])).push(o);
  for(const target of Object.keys(byTarget).sort()){ const hd=state.holdings[target]; const attackers=byTarget[target]; const attackTotal=attackers.reduce((n,o)=>n+o.params.soldiers,0); const defenderId=hd.ownerHouseId; let captured=false, capturedBy=null;
    const reinforcements=[]; if(defenderId)for(const ah of Object.values(state.holdings)){if(ah.ownerHouseId&&ah.ownerHouseId!==defenderId&&isMutualDefense(state,defenderId,ah.ownerHouseId)&&neighbors(state,target).includes(ah.id)){const amt=Math.floor(ah.soldiers*CONFIG.MUTUAL_DEFENSE_REINFORCE_RATE);if(amt>0)reinforcements.push({hid:ah.id,amount:amt});}}
    const reinforceTotal=reinforcements.reduce((n,r)=>n+r.amount,0); const terr=CONFIG.TERRAIN_DEF[hd.type]||1; const defensePower=Math.floor(hd.soldiers*terr*(1+CONFIG.FORTIFY_DEF_MULT*hd.fortification))+reinforceTotal;
    if(attackTotal>defensePower){ hd.soldiers=0; for(const r of reinforcements)state.holdings[r.hid].soldiers-=Math.floor(r.amount*CONFIG.COMBAT.loserLossRate);
      const biggest=[...attackers].sort((a,b)=>b.params.soldiers-a.params.soldiers||(a.houseId<b.houseId?-1:1))[0];
      for(const o of attackers){const surv=o.params.soldiers-Math.floor(o.params.soldiers*CONFIG.COMBAT.winnerLossRate); if(o===biggest){hd.ownerHouseId=o.houseId;hd.fortification=0;hd.soldiers=surv;acc.captures[o.houseId]=(acc.captures[o.houseId]||0)+1;captured=true;capturedBy=o.houseId;log.push({tick:state.tick,text:`${state.houses[o.houseId].name} a capturé ${hd.name} !`,public:true});}else state.holdings[o.params.from].soldiers+=surv;}
      if(defenderId)log.push({tick:state.tick,text:`${hd.name} (${state.houses[defenderId].name}) est TOMBÉ — garnison dispersée.`,houseId:defenderId,public:false});
    } else { for(const o of attackers){const surv=o.params.soldiers-Math.floor(o.params.soldiers*CONFIG.COMBAT.loserLossRate);state.holdings[o.params.from].soldiers+=surv;} const defLoss=Math.floor(hd.soldiers*CONFIG.COMBAT.winnerLossRate); hd.soldiers-=defLoss; for(const r of reinforcements)state.holdings[r.hid].soldiers-=Math.floor(r.amount*CONFIG.COMBAT.winnerLossRate); if(defenderId){acc.defensesWon[defenderId]=(acc.defensesWon[defenderId]||0)+1;log.push({tick:state.tick,text:`${hd.name} (${state.houses[defenderId].name}) a repoussé l'assaut.`,houseId:defenderId,public:true});} }
    events.push({type:"attack",to:target,sources:attackers.map(o=>o.params.from),win:attackTotal>defensePower,captured,by:capturedBy}); }
  for(const o of valid.filter(o=>["DEV","LEVEE","FORTIFIE"].includes(o.type))){ const h=state.houses[o.houseId]; const p=o.params;
    if(o.type==="DEV"&&h.gold>=CONFIG.DEV_COST){h.gold-=CONFIG.DEV_COST;state.holdings[p.holding].incomeBonus+=CONFIG.DEV_INCOME_BONUS;}
    else if(o.type==="FORTIFIE"&&h.gold>=CONFIG.FORTIFIE_COST){h.gold-=CONFIG.FORTIFIE_COST;state.holdings[p.holding].fortification+=1;}
    else if(o.type==="LEVEE"&&h.grain>=p.count&&h.gold>=p.count){h.grain-=p.count;h.gold-=p.count;state.holdings[h.capitalHoldingId].soldiers+=p.count;} }
  for(const o of valid.filter(o=>o.type==="EMISSAIRE")){ const h=state.houses[o.houseId]; const p=o.params;
    if(p.action==="propose"){if(!state.treaties.some(t=>t.status!=="broken"&&t.type===p.treaty&&((t.a===h.id&&t.b===p.target)||(t.a===p.target&&t.b===h.id))))state.treaties.push({a:h.id,b:p.target,type:p.treaty,status:"proposed",proposedBy:h.id});}
    else if(p.action==="accept"){const t=state.treaties.find(t=>t.status==="proposed"&&((t.a===p.target&&t.b===h.id)||(t.a===h.id&&t.b===p.target)));if(t){t.status="active";log.push({tick:state.tick,text:`Traité ${t.type} actif entre ${state.houses[t.a].name} et ${state.houses[t.b].name}.`,public:true});}}
    else if(p.action==="break"){const t=state.treaties.find(t=>t.status==="active"&&((t.a===h.id&&t.b===p.target)||(t.a===p.target&&t.b===h.id)));if(t){t.status="broken";h.reputation-=CONFIG.TREATY_BREAK_REP_PENALTY;clampRep(h);log.push({tick:state.tick,text:`${h.name} a ROMPU son traité avec ${state.houses[p.target].name} !`,public:true});}} }
  /* intendance : les guerriers consomment du grain ; famine -> désertion */
  for(const h of Object.values(state.houses)){ const sol=totalSoldiers(state,h.id); if(sol<=0)continue; const need=Math.ceil(sol*CONFIG.UPKEEP_RATE); const e=ec(h.id);
    if(h.grain>=need){ h.grain-=need; e.upkeep=need; }
    else { e.upkeep=h.grain; const unfed=need-h.grain; h.grain=0; const desert=Math.min(sol,Math.ceil(unfed/CONFIG.UPKEEP_RATE)); removeSoldiers(state,h.id,desert); e.desertions=desert; log.push({tick:state.tick,text:`Famine chez ${h.name} : ${desert} guerriers désertent (grain épuisé).`,houseId:h.id,public:false}); } }
  for(const h of Object.values(state.houses)){ const nb=holdingsOf(state,h.id).length; h.alive=nb>0; let d=nb*CONFIG.PRESTIGE.perHoldingPerTick+Math.floor((acc.tradeProfit[h.id]||0)/CONFIG.PRESTIGE.tradeProfitDivisor)+(acc.defensesWon[h.id]||0)*CONFIG.PRESTIGE.defenseWon+(acc.captures[h.id]||0)*CONFIG.PRESTIGE.capture+state.treaties.filter(t=>t.status==="active"&&(t.a===h.id||t.b===h.id)).length*(CONFIG.PRESTIGE.treatyPerTick||0); if(h.reputation>=70)d+=CONFIG.PRESTIGE.repHigh;else if(h.reputation<=30)d-=CONFIG.PRESTIGE.repLow; h.prestige+=Math.round(d*actOf(state.tick).mult); }
  state.tick+=1;
  if(state.tick>=CONFIG.SEASON_LENGTH){ for(const h of Object.values(state.houses)){ const amb=AMBITIONS[h.ambition]; if(amb&&!h.ambitionDone&&amb.check(state,h)){ h.prestige+=amb.bonus; h.ambitionDone=true; log.push({tick:state.tick,text:`${h.name} accomplit son ambition — « ${amb.name} » (+${amb.bonus} 👑) !`,public:true}); } } }
  return {state,log,events,econ}; }
/* IA VIVANTE : chaque Maison a une DOCTRINE et réagit au monde */
const DOCTRINE={ tinduk:"conquerant", zalimba:"marchand", djenne:"diplomate", tombouctou:"batisseur", gao:"opportuniste" };
const DOCTRINE_NAME={ conquerant:"⚔️ Conquérant", marchand:"🐫 Marchand", diplomate:"🕊️ Diplomate", batisseur:"🏗️ Bâtisseur", opportuniste:"🎭 Opportuniste" };
const aiDoctrine=id=>DOCTRINE[id]||"batisseur";
const AI_EVENT_CHOICE={ harmattan:{conquerant:"speculer",marchand:"speculer",diplomate:"partager",batisseur:"thesauriser",opportuniste:"speculer"}, foire:{conquerant:"mercenaires",marchand:"investir",diplomate:"parader",batisseur:"investir",opportuniste:"investir"}, pelerins:{conquerant:"taxer",marchand:"taxer",diplomate:"escorter",batisseur:"escorter",opportuniste:"taxer"}, crue:{conquerant:"rien",marchand:"semer",diplomate:"prier",batisseur:"semer",opportuniste:"semer"}, griot:{conquerant:"honorer",marchand:"modeste",diplomate:"modeste",batisseur:"honorer",opportuniste:"honorer"}, pillards:{conquerant:"garde",marchand:"tribut",diplomate:"tribut",batisseur:"garde",opportuniste:"garde"} };
const defEst=(s,id)=>{ const hd=s.holdings[id]; return Math.floor(hd.soldiers*(CONFIG.TERRAIN_DEF[hd.type]||1)*(1+CONFIG.FORTIFY_DEF_MULT*hd.fortification)); };
function neighborHouses(s,id){ const set=new Set(); for(const hd of holdingsOf(s,id))for(const n of neighbors(s,hd.id)){ const o=s.holdings[n].ownerHouseId; if(o&&o!==id)set.add(o); } return [...set].sort(); }
function leaderId(s){ const arr=Object.values(s.houses).filter(h=>h.alive).sort((a,b)=>b.prestige-a.prestige||(a.id<b.id?-1:1)); return arr.length?arr[0].id:null; }
function enemyBorders(s,id){ const out=[]; for(const hd of holdingsOf(s,id))for(const n of neighbors(s,hd.id)){ const t=s.holdings[n]; if(t.ownerHouseId&&t.ownerHouseId!==id&&!hasActiveTreaty(s,id,t.ownerHouseId)) out.push({from:hd.id,to:n,owner:t.ownerHouseId,def:defEst(s,n)}); } return out; }
function generateAIOrders(state,orders,choices,eventId){
  const hasOrders=id=>orders.some(o=>o.houseId===id); const leader=leaderId(state);
  for(const h of Object.values(state.houses).sort((a,b)=>a.id<b.id?-1:1)){
    if(!h.isAI||!h.alive)continue; const doc=aiDoctrine(h.id);
    if(choices[h.id]===undefined){ const m=AI_EVENT_CHOICE[eventId]; if(m&&m[doc])choices[h.id]=m[doc]; }
    if(hasOrders(h.id))continue;
    const mine=holdingsOf(state,h.id); if(!mine.length)continue;
    const strong=[...mine].sort((a,b)=>b.soldiers-a.soldiers); const richHold=strong[0];
    const borders=enemyBorders(state,h.id);
    const winnable=borders.filter(b=>state.holdings[b.from].soldiers>b.def).sort((a,b)=>a.def-b.def);
    const threatened=mine.filter(hd=>neighbors(state,hd.id).some(n=>{const t=state.holdings[n];return t.ownerHouseId&&t.ownerHouseId!==h.id&&!hasActiveTreaty(state,h.id,t.ownerHouseId)&&t.soldiers>defEst(state,hd.id)*1.05;}));
    const lowGrain=h.grain<25; const canLevee=()=>h.grain>=15&&h.gold>=15&&!lowGrain; const slots=[];
    const propose=tr=>{ const t=neighborHouses(state,h.id).find(o=>!hasActiveTreaty(state,h.id,o)&&!state.treaties.some(x=>x.status==="proposed"&&((x.a===h.id&&x.b===o)||(x.a===o&&x.b===h.id)))); if(t)slots.push({type:"EMISSAIRE",params:{action:"propose",target:t,treaty:tr}}); };
    const accept=()=>{ const t=state.treaties.find(x=>x.status==="proposed"&&(x.b===h.id||x.a===h.id)&&x.proposedBy!==h.id); if(t)slots.push({type:"EMISSAIRE",params:{action:"accept",target:t.proposedBy}}); };
    if(doc!=="conquerant")accept();
    if(doc==="conquerant"){
      const tgt=winnable.find(b=>state.holdings[b.from].soldiers>b.def*1.25);
      if(tgt)slots.push({type:"MARCHE",params:{from:tgt.from,to:tgt.to,soldiers:Math.floor(state.holdings[tgt.from].soldiers*0.9)}});
      if(canLevee())slots.push({type:"LEVEE",params:{count:Math.min(25,h.grain,h.gold)}});
      if(!tgt&&h.gold>=CONFIG.FORTIFIE_COST)slots.push({type:"FORTIFIE",params:{holding:(threatened[0]||strong[0]).id}});
    } else if(doc==="marchand"){
      const dest=mine.find(x=>x.id!==richHold.id)||richHold; if(h.gold>40)slots.push({type:"CARAVANE",params:{from:richHold.id,to:dest.id,gold:Math.min(60,Math.floor(h.gold*0.6))}});
      if(h.gold>CONFIG.DEV_COST)slots.push({type:"DEV",params:{holding:mine[0].id}}); propose("trade_pact");
    } else if(doc==="diplomate"){
      propose(leader&&leader!==h.id?"mutual_defense":"non_aggression"); if(h.gold>CONFIG.DEV_COST)slots.push({type:"DEV",params:{holding:mine[0].id}});
      if(threatened.length&&h.gold>=CONFIG.FORTIFIE_COST)slots.push({type:"FORTIFIE",params:{holding:threatened[0].id}});
    } else if(doc==="batisseur"){
      if(h.gold>CONFIG.DEV_COST)slots.push({type:"DEV",params:{holding:mine[0].id}});
      if(h.gold>=CONFIG.FORTIFIE_COST)slots.push({type:"FORTIFIE",params:{holding:(threatened[0]||richHold).id}});
      if(canLevee())slots.push({type:"LEVEE",params:{count:Math.min(15,h.grain,h.gold)}});
    } else {
      const juicy=winnable.filter(b=>b.owner===leader);
      if(juicy.length)slots.push({type:"MARCHE",params:{from:juicy[0].from,to:juicy[0].to,soldiers:Math.floor(state.holdings[juicy[0].from].soldiers*0.85)}});
      else if(winnable.length&&state.holdings[winnable[0].from].soldiers>winnable[0].def*1.4)slots.push({type:"MARCHE",params:{from:winnable[0].from,to:winnable[0].to,soldiers:Math.floor(state.holdings[winnable[0].from].soldiers*0.85)}});
      else propose("non_aggression");
      if(leader&&leader!==h.id&&hasActiveTreaty(state,h.id,leader)&&state.houses[leader].prestige>h.prestige+25)slots.push({type:"EMISSAIRE",params:{action:"break",target:leader}});
    }
    const dom=Object.values(state.houses).filter(x=>x.alive&&x.id!==h.id).map(x=>({id:x.id,n:holdingsOf(state,x.id).length,p:x.prestige})).sort((a,b)=>b.n-a.n||b.p-a.p)[0];
    const bully=(dom&&(dom.n>=3||dom.p>h.prestige+20))?dom.id:null;
    if(bully&&!slots.some(s=>s.type==="MARCHE")){ const t=winnable.filter(b=>b.owner===bully).sort((a,b)=>a.def-b.def)[0]; if(t)slots.push({type:"MARCHE",params:{from:t.from,to:t.to,soldiers:Math.floor(state.holdings[t.from].soldiers*0.9)}}); }
    if(!slots.length){ if(h.gold>CONFIG.DEV_COST)slots.push({type:"DEV",params:{holding:mine[0].id}}); else if(canLevee())slots.push({type:"LEVEE",params:{count:Math.min(15,h.grain,h.gold)}}); }
    slots.slice(0,3).forEach((s,i)=>orders.push({houseId:h.id,slot:i,type:s.type,params:s.params}));
  }
}
function buildScenario(){ const H=(id,name,type,owner,soldiers)=>[id,{id,name,type,ownerHouseId:owner,fortification:0,soldiers,incomeBonus:0}];
  const holdings=Object.fromEntries([H("aoudaghost","Aoudaghost","oasis","aissata",70),H("goundam","Goundam","oasis","aissata",10),H("tinduk","Tindûk","oasis","tinduk",40),H("koumbi","Koumbi","city","tinduk",50),H("zalimba","Zalimba","port","zalimba",50),H("djenne","Djenné","city","djenne",50),H("tombouctou","Tombouctou","city","tombouctou",50),H("gao","Gao","city","gao",50)]);
  const mk=(id,name,isAI,capital)=>[id,{id,name,isAI,gold:CONFIG.START.gold,grain:CONFIG.START.grain,prestige:0,reputation:CONFIG.REP.start,capitalHoldingId:capital,alive:true}];
  const houses=Object.fromEntries([mk("aissata","Maison d'Aïssata",false,"aoudaghost"),mk("tinduk","Maison Tindûk",true,"tinduk"),mk("zalimba","Maison Zalimba",true,"zalimba"),mk("djenne","Maison Djenné",true,"djenne"),mk("tombouctou","Maison Tombouctou",true,"tombouctou"),mk("gao","Maison Gao",true,"gao")]);
  const edges=[["tombouctou","gao"],["gao","koumbi"],["tombouctou","djenne"],["gao","aoudaghost"],["koumbi","tinduk"],["djenne","aoudaghost"],["aoudaghost","tinduk"],["aoudaghost","zalimba"],["djenne","goundam"]];
  const treaties=[{a:"aissata",b:"djenne",type:"trade_pact",status:"active",proposedBy:"djenne"}];
  for(const _h of Object.values(houses)){ const cap=holdings[_h.capitalHoldingId]; if(cap)cap.fortification=2; }
  const AMB={aissata:"commerce",tinduk:"conquete",zalimba:"renommee",djenne:"diplomatie",tombouctou:"bastion",gao:"conquete"}; for(const id in houses)houses[id].ambition=AMB[id];
  return {tick:0,seed:Math.floor(Math.random()*1e9),holdings,houses,edges,treaties}; }

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, clampRep, neighbors, shortestPath, hasActiveTreaty, isMutualDefense, holdingsOf, totalSoldiers, removeSoldiers, EVENTS, EVENT_ORDER, eventIdFor, ACTS, actOf, AMBITIONS, isOrderValid, resolveTick, DOCTRINE, DOCTRINE_NAME, aiDoctrine, defEst, neighborHouses, leaderId, enemyBorders, generateAIOrders, buildScenario };
}
