/* AwemA — service worker : cache hors-ligne de TOUTE la plateforme.
   Le SHELL est DÉRIVÉ du catalogue unique (catalog.js) via importScripts →
   aucune liste à maintenir à la main (fin de la dérive menu/SHELL/classements).
   Stratégie cache-first + rafraîchissement réseau en arrière-plan.
   Pour invalider à une nouvelle version : bumper `AWEMA.CACHE` dans catalog.js. */
importScripts("./catalog.js");

const G = (self.AWEMA && self.AWEMA.GAMES) || [];
const CACHE = (self.AWEMA && self.AWEMA.CACHE) || "awema-v24";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "catalog.js",
  "shared/awema.js", "shared/analytics.js", "shared/pow.js", "shared/lignees-engine.js",
];
const live = G.filter(g => g.status !== "archived");
const SHELL = CORE
  .concat(live.map(g => g.file))                     // jeux : games/<id>.html
  .concat(live.map(g => g.file.split("/").pop()));   // stubs de redirection : <ancien-nom>.html

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll échouerait en bloc si un fichier manque : on met en cache un par un (tolérant)
    await Promise.allSettled(SHELL.map(u => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // on ne touche pas aux requêtes externes
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      // rafraîchit en arrière-plan (stale-while-revalidate)
      fetch(req).then(res => { if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      // hors-ligne et non caché : pour une navigation, renvoyer le cabinet
      if (req.mode === "navigate") { const fallback = await caches.match("index.html"); if (fallback) return fallback; }
      return Response.error();
    }
  })());
});
