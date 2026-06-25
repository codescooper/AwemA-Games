import { defineConfig, devices } from "@playwright/test";

/* AwemA — smoke navigateur réel (headless). Boote le cabinet + chaque jeu via
   tools/serve.mjs et vérifie qu'aucune exception JS ne survient. C'est ce qui
   solde la dette « vérifié serveur mais jamais booté en navigateur ». */
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:8780", trace: "on-first-retry" },
  webServer: {
    command: "node tools/serve.mjs 8780",
    url: "http://127.0.0.1:8780/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
