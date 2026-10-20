import { defineConfig } from "@playwright/test";

/**
 * Vuu Table benchmarks. Chromium only, the runner relies on the Chrome
 * DevTools Protocol. See benchmarks/README.md for the environment variables.
 */
const env = process.env;
const gpuOff = env.BENCH_GPU === "off";

export default defineConfig({
  testDir: "./runner",
  testMatch: "*.bench.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!env.CI,
  timeout: 60 * 60_000,
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    // the full Chromium build with new headless mode, which renders like
    // headed Chrome (the default headless shell does not)
    channel: env.BENCH_CHANNEL ?? "chromium",
    headless: env.BENCH_HEADED !== "1",
    launchOptions: {
      args: [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        ...(gpuOff ? ["--disable-gpu"] : []),
      ],
    },
  },
});
