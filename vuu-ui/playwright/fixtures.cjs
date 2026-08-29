const fs = require("node:fs/promises");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");

const coverageDirectory = path.resolve("playwright/coverage-data");

const test = base.extend({
  mount: async ({ page }, use) => {
    await page.goto("/");
    await use(async (story, props = {}) => {
      await page.evaluate(
        ({ story: storyId, props: storyProps }) =>
          window.mount({ story: storyId, props: storyProps }),
        { story, props },
      );
      return page.locator("#root > *").first();
    });
    await page.evaluate(() => window.unmount()).catch(() => {});
  },
  coverage: [
    async ({ context, browserName }, use, testInfo) => {
      const enabled =
        process.env.PLAYWRIGHT_COVERAGE === "1" && browserName === "chromium";

      await use(undefined);

      if (!enabled) {
        return;
      }

      const coverage = {};
      for (const page of context.pages()) {
        try {
          const pageCoverage = await page.evaluate(
            () => globalThis.__coverage__ ?? {},
          );
          for (const [file, fileCoverage] of Object.entries(pageCoverage)) {
            coverage[file] = coverage[file]
              ? mergeFileCoverage(coverage[file], fileCoverage)
              : fileCoverage;
          }
        } catch {
          // A page can be closed by a failed test before coverage is collected.
        }
      }

      await fs.mkdir(coverageDirectory, { recursive: true });
      const fileName = `${testInfo.testId}-${testInfo.retry}-${testInfo.workerIndex}.json`;
      await fs.writeFile(
        path.join(coverageDirectory, fileName),
        JSON.stringify(coverage),
      );
    },
    { auto: true },
  ],
});

function mergeFileCoverage(left, right) {
  const merged = { ...left };
  for (const metric of ["s", "f", "b"]) {
    merged[metric] = { ...left[metric] };
    for (const [key, value] of Object.entries(right[metric] ?? {})) {
      merged[metric][key] = (merged[metric][key] ?? 0) + value;
    }
  }
  return merged;
}

module.exports = { test, expect };
