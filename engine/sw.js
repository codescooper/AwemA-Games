/* AwemA — service worker : cache hors-ligne de toute la plateforme.
   Stratégie cache-first (tout est statique et autonome) avec mise à jour réseau
   en arrière-plan. Bump CACHE pour invalider lors d'une nouvelle version. */
const CACHE = "awema-v4";
const SHELL = [
  ".", "index.html", "manifest.webmanifest", "icon.svg",
  "monde.html", "classements.html", "salon.html",
  "atelier.html", "harmattan.html", "banco.html", "awale-royal.html", "tamtam.html",
  "conseil.html", "sables.html", "echecs.html", "voraces.html", "prototype.html",
];

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
      // hors-ligne et non caché : pour une navigation, renvoyer le menu
      if (req.mode === "navigate") { const fallback = await caches.match("index.html"); if (fallback) return fallback; }
      return Response.error();
    }
  })());
});
