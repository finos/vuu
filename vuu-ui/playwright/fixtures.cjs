const fs = require("node:fs/promises");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");
const MCR = require("monocart-coverage-reports");
const coverageOptions = require("./coverage.config.cjs");

const test = base.extend({
  coverage: [
    async ({ context, browserName }, use, testInfo) => {
      const enabled =
        process.env.PLAYWRIGHT_COVERAGE === "1" && browserName === "chromium";

      if (!enabled) {
        await use(undefined);
        return;
      }

      const handlePage = async (page) => {
        await Promise.all([
          page.coverage.startJSCoverage({ resetOnNavigation: false }),
          page.coverage.startCSSCoverage({ resetOnNavigation: false }),
        ]);
      };

      for (const page of context.pages()) {
        await handlePage(page);
      }
      context.on("page", handlePage);

      await use(undefined);

      context.off("page", handlePage);
      const coverage = (
        await Promise.all(
          context.pages().map(async (page) => {
            const [jsCoverage, cssCoverage] = await Promise.all([
              page.coverage.stopJSCoverage(),
              page.coverage.stopCSSCoverage(),
            ]);
            return [...jsCoverage, ...cssCoverage];
          }),
        )
      ).flat();

      const coverageDirectory = path.resolve("playwright/coverage-data");
      await fs.mkdir(coverageDirectory, { recursive: true });
      await fs.writeFile(
        path.join(
          coverageDirectory,
          `${testInfo.testId}-${testInfo.retry}-${testInfo.workerIndex}.json`,
        ),
        JSON.stringify(coverage),
      );
    },
    { auto: true },
  ],
});

async function generateCoverage() {
  const coverageDirectory = path.resolve("playwright/coverage-data");
  const files = (await fs.readdir(coverageDirectory)).filter((file) =>
    file.endsWith(".json"),
  );
  const report = MCR(coverageOptions);

  for (const file of files) {
    const coverage = JSON.parse(
      await fs.readFile(path.join(coverageDirectory, file), "utf8"),
    );
    await report.add(coverage);
  }

  await report.generate();
}

module.exports = { test, expect, generateCoverage };
