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

  const reportData = JSON.parse(
    await fs.readFile(
      path.resolve(coverageOptions.outputDir, "coverage-report.json"),
      "utf8",
    ),
  );
  const packages = new Map();
  for (const file of reportData.files) {
    const match = file.sourcePath.match(/(?:^|\/)packages\/([^/]+)\//);
    if (!match) continue;
    const packageName = match[1];
    const packageSummary = packages.get(packageName) ?? {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 },
    };
    for (const metric of ["statements", "branches", "functions", "lines"]) {
      packageSummary[metric].covered += file.summary[metric].covered;
      packageSummary[metric].total += file.summary[metric].total;
    }
    packages.set(packageName, packageSummary);
  }

  const formatMetric = ({ covered, total }) =>
    `${total ? ((covered / total) * 100).toFixed(1) : "100.0"}% (${covered}/${total})`;
  console.log("\n### Coverage by package\n");
  console.log(
    "| Package | Statements | Branches | Functions | Lines |\n| --- | ---: | ---: | ---: | ---: |",
  );
  for (const [packageName, summary] of [...packages].sort()) {
    console.log(
      `| ${packageName} | ${formatMetric(summary.statements)} | ${formatMetric(summary.branches)} | ${formatMetric(summary.functions)} | ${formatMetric(summary.lines)} |`,
    );
  }
}

module.exports = { test, expect, generateCoverage };
