const fs = require("node:fs/promises");
const path = require("node:path");
const { createCoverageMap } = require("istanbul-lib-coverage");
const { createContext } = require("istanbul-lib-report");
const reports = require("istanbul-reports");

const coverageDataDirectory = path.resolve("playwright/coverage-data");
const coverageOptions = require("./coverage.config.cjs");
const packagesDirectory = path.resolve("packages");

async function readCoverage() {
  const coverageMap = createCoverageMap({});
  let files = [];
  try {
    files = await fs.readdir(coverageDataDirectory);
  } catch (error) {
    if (error.code === "ENOENT") {
      return coverageMap;
    }
    throw error;
  }

  for (const file of files.filter((name) => name.endsWith(".json"))) {
    const data = JSON.parse(
      await fs.readFile(path.join(coverageDataDirectory, file), "utf8"),
    );
    coverageMap.merge(data);
  }
  return coverageMap;
}

function metric({ covered, total }) {
  return `${total ? ((covered / total) * 100).toFixed(1) : "0.0"}% (${covered}/${total})`;
}

function packageSummary(coverageMap, packageName) {
  const summary = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };

  for (const file of coverageMap.files()) {
    const match = file.replaceAll("\\", "/").match(/\/packages\/([^/]+)\//);
    if (match?.[1] !== packageName) continue;
    const fileSummary = coverageMap.fileCoverageFor(file).toSummary().toJSON();
    for (const name of Object.keys(summary)) {
      summary[name].covered += fileSummary[name].covered;
      summary[name].total += fileSummary[name].total;
    }
  }
  return summary;
}

async function packageNames() {
  const entries = await fs.readdir(packagesDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function generateCoverage() {
  const coverageMap = await readCoverage();
  await fs.rm(path.resolve(coverageOptions.outputDir), {
    recursive: true,
    force: true,
  });
  await fs.mkdir(path.resolve(coverageOptions.outputDir), { recursive: true });

  const context = createContext({
    coverageMap,
    dir: path.resolve(coverageOptions.outputDir),
  });
  for (const reportName of coverageOptions.reports) {
    reports.create(reportName).execute(context);
  }

  const summary = coverageMap.getCoverageSummary().toJSON();
  console.log("\n### Playwright component coverage\n");
  console.log(
    `| Metric | Coverage |\n| --- | ---: |\n| Lines | ${metric(summary.lines)} |\n| Functions | ${metric(summary.functions)} |\n| Branches | ${metric(summary.branches)} |\n| Statements | ${metric(summary.statements)} |`,
  );
  console.log("\n### Coverage by package\n");
  console.log(
    "| Package | Lines | Functions | Branches | Statements |\n| --- | ---: | ---: | ---: | ---: |",
  );
  for (const packageName of await packageNames()) {
    const packageCoverage = packageSummary(coverageMap, packageName);
    console.log(
      `| ${packageName} | ${metric(packageCoverage.lines)} | ${metric(packageCoverage.functions)} | ${metric(packageCoverage.branches)} | ${metric(packageCoverage.statements)} |`,
    );
  }
}

generateCoverage().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
