import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? "blob"
    : [["html", { outputFolder: "./playwright/reports" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "components-chromium",
      testDir: "./packages",
      testMatch: "**/*.playwright.test.tsx",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3100/playwright/gallery/index.html",
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
    {
      name: "components-firefox",
      testDir: "./packages",
      testMatch: "**/*.playwright.test.tsx",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "http://localhost:3100/playwright/gallery/index.html",
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
    {
      name: "components-webkit",
      testDir: "./packages",
      testMatch: "**/*.playwright.test.tsx",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "http://localhost:3100/playwright/gallery/index.html",
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
  ],
  snapshotPathTemplate: "./playwright/snapshots/{testFilePath}/{arg}{ext}",
  outputDir: "./playwright/test-results",
  webServer: [
    {
      command: "npm run playwright:gallery",
      url: "http://localhost:3100/playwright/gallery/index.html",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
