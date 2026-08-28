import { defineConfig, devices } from "@playwright/test";

const useProductionGallery =
  process.env.CI || process.env.PLAYWRIGHT_GALLERY === "production";
const galleryBaseURL = "http://localhost:3100/index.html";

export default defineConfig({
  testDir: "./playwright/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run one worker per CI shard to avoid shared gallery contention. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? "blob"
    : [["html", { outputFolder: "./playwright/reports" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "http://localhost:4173",
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
      testMatch: "**/__component__/prompt/Prompt.playwright.test.tsx",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: galleryBaseURL,
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
    {
      name: "components-firefox",
      testDir: "./packages",
      testMatch: "**/__component__/prompt/Prompt.playwright.test.tsx",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: galleryBaseURL,
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
    {
      name: "components-webkit",
      testDir: "./packages",
      testMatch: "**/__component__/prompt/Prompt.playwright.test.tsx",
      use: {
        ...devices["Desktop Safari"],
        baseURL: galleryBaseURL,
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
  ],
  snapshotPathTemplate: "./playwright/snapshots/{testFilePath}/{arg}{ext}",
  outputDir: "./playwright/test-results",
  webServer: [
    {
      command: useProductionGallery
        ? "npm run playwright:gallery:serve"
        : "npm run playwright:gallery",
      url: galleryBaseURL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
