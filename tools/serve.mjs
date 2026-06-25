/* AwemA — serveur statique de dev, cross-platform (node tools/serve.mjs [port]).
   Sert engine/ comme racine (comme server.ps1) : / → index.html (le cabinet).
   Aucun cache, MIME minimal. Pour tester la borne sans PowerShell. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";

const ROOT = join(process.cwd(), "engine");
const PORT = +(process.argv[2] || process.env.PORT || 8780);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon", ".wasm": "application/wasm" };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (p === "/" || p.endsWith("/")) p += "index.html";
    const full = normalize(join(ROOT, p));
    if (!full.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }     // anti path-traversal
    const info = await stat(full).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404 — " + p); return; }
    const body = await readFile(full);
    res.writeHead(200, { "content-type": MIME[extname(full).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch (e) { res.writeHead(500).end("500 — " + e.message); }
}).listen(PORT, "0.0.0.0", () => console.log("AwemA arcade → http://127.0.0.1:" + PORT + "/  (et http://<ip-locale>:" + PORT + "/ depuis un téléphone du même réseau)  ·  Ctrl+C pour arrêter"));
