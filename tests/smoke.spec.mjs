import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

/* Charge le catalogue (script classique → on l'évalue avec un faux `self`). */
const ctx = {};
new Function("self", readFileSync(new URL("../engine/catalog.js", import.meta.url), "utf8"))(ctx);
const SHOWN = ctx.AWEMA.GAMES.filter(g => g.status !== "archived");   // cartes rendues par le cabinet

/* Smoke hermétique : on coupe le réseau externe (PostHog, WS Railway) → rapide et
   déterministe. Les jeux doivent rester sains hors-ligne (offline-first). */
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const u = route.request().url();
    if (u.startsWith("http://127.0.0.1") || u.startsWith("http://localhost") || u.startsWith("data:") || u.startsWith("blob:"))
      return route.continue();
    return route.abort();                       // bloque tout l'externe
  });
});

test("le cabinet rend toutes les cartes du catalogue", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/index.html");
  await expect(page.locator("#catalog .card")).toHaveCount(SHOWN.length);
  await expect(page.locator("#profile")).toBeVisible();   // chip profil (avatar + pseudo + Indice) → lien vers le profil
  await expect(page.locator("#daily .daily-in")).toBeVisible();   // défi du jour + série
  expect(errors, "exceptions JS dans le cabinet").toEqual([]);
});

for (const g of SHOWN) {
  test(`${g.id} se charge sans exception JS`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", e => errors.push(`${g.id}: ${e.message}`));
    await page.goto("/" + g.file, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);             // laisse tourner l'init / la 1re frame
    expect(errors).toEqual([]);
  });
}

test("un stub d'ancienne URL redirige vers games/", async ({ page }) => {
  await page.goto("/voraces.html");
  await page.waitForURL("**/games/voraces.html", { timeout: 6000 });
  expect(page.url()).toContain("/games/voraces.html");
});

test("l'Atelier démarre et affiche ses deux pistes", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/games/atelier.html");
  await expect(page.locator("#tab-code")).toBeVisible();
  await expect(page.locator("#tab-vibe")).toBeVisible();
  await expect(page.locator("#toc .lk").first()).toBeVisible();
  expect(errors, "exceptions JS dans l'Atelier").toEqual([]);
});

test("Échecs : bascule Classique/Actuel des pièces + persistance", async ({ page }) => {
  await page.goto("/games/echecs.html");
  await expect(page.locator("#board .pc").first()).toBeVisible();        // pièces présentes (set actuel)
  await page.selectOption("#pieceSet", "classique");
  await expect(page.locator("#board.classic")).toBeVisible();           // classe appliquée
  const t = await page.locator("#board .pc").first().textContent();
  expect(/[♔-♟]/.test(t || "")).toBeTruthy();                 // un symbole d'échec classique est rendu
  await page.reload();
  await expect(page.locator("#board.classic")).toBeVisible();           // choix persisté
});

test("Profil : page rendue (avatar, indice, sélecteurs, badges)", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/games/profil.html");
  await expect(page.locator(".me .ava")).toBeVisible();
  await expect(page.locator("#avEmoji button").first()).toBeVisible();   // sélecteur d'avatar
  await expect(page.locator(".badges .badge").first()).toBeVisible();    // au moins un badge (rang)
  await page.locator("#avEmoji button").nth(2).click();                  // changer d'avatar ne casse rien
  await expect(page.locator(".me .ava")).toBeVisible();
  expect(errors, "exceptions JS dans le profil").toEqual([]);
});

test("Échecs : la partie reprend après rechargement", async ({ page }) => {
  await page.goto("/games/echecs.html");
  await expect(page.locator('#board .sq[data-i="52"] .pc')).toBeVisible();   // pion Orange e2
  await page.click('#board .sq[data-i="52"]');                               // sélection e2
  await page.click('#board .sq[data-i="36"]');                               // → e4
  await expect(page.locator("#board .sq.last")).toHaveCount(2);              // coup surligné
  await page.waitForTimeout(700);                                            // l'IA répond + sauvegarde
  await page.reload();
  await expect(page.locator("#board .sq.last").first()).toBeVisible();       // partie restaurée après reload
});
