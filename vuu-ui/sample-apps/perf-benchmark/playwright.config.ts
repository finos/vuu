import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  // Perf measurements (FPS, scheduling drift, long tasks) are only
  // meaningful without other test workers competing for the CPU.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  // Chromium only: the longtask PerformanceObserver API and the CDP
  // Performance domain (used for heap-size sampling) are both Chromium-specific.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // All three backing servers are started automatically: the app itself,
  // ag-grid's Node feed-server, and the real VUU server (JVM). A clean
  // checkout needs nothing manual beyond `npx playwright test` - see
  // scripts/start-vuu-server.ps1 for what that entails (builds the Scala
  // modules and downloads Maven on first run if needed).
  webServer: [
    {
      // Build + serve the production bundle - the dev server runs React in
      // development mode (extra checks, unminified), which would skew every
      // metric this suite measures.
      command: "npm run build && npm run preview",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // port (not url): this is a WebSocket-only server, a plain HTTP GET
      // to it won't get a normal HTTP response, so Playwright's readiness
      // check needs to be "is the TCP port open" rather than "does a GET succeed".
      command: "npm run feed-server",
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Generous timeout: on a genuinely fresh checkout (empty ~/.m2 cache),
      // this downloads Maven itself plus every Scala/Kotlin dependency the
      // server modules need, then compiles them - which can take several
      // minutes. Once ~/.m2 is warm, subsequent runs finish in well under a
      // minute.
      command: "npm run vuu-server",
      port: 8090,
      reuseExistingServer: !process.env.CI,
      timeout: 600_000,
    },
  ],
});
