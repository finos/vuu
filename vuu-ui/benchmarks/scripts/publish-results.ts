/**
 * Adds a benchmark run to the history kept on the gh-pages branch.
 *
 *   tsx benchmarks/scripts/publish-results.ts <results dir> <gh-pages checkout>
 *
 * Writes a compact summary of the run to benchmarks/data/runs/, appends it
 * to benchmarks/data/index.json and refreshes the trends page. Raw runs and
 * traces are not published, they are kept as workflow artifacts.
 */
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ScenarioResult } from "../harness/types";
import { KEY_METRICS } from "../runner/scenarios";

const [resultsDir, pagesRoot] = process.argv.slice(2);
if (!resultsDir || !pagesRoot) {
  console.error("usage: publish-results.ts <results dir> <gh-pages checkout>");
  process.exit(1);
}

interface HistoryIndex {
  schemaVersion: 1;
  runs: Array<{ file: string; date: string; gitSha: string }>;
}

const benchRoot = join(pagesRoot, "benchmarks");
const dataDir = join(benchRoot, "data");
const runsDir = join(dataDir, "runs");
const indexPath = join(dataDir, "index.json");

const results: ScenarioResult[] = [];
for (const file of await readdir(resultsDir)) {
  if (file.endsWith(".json")) {
    results.push(JSON.parse(await readFile(join(resultsDir, file), "utf8")));
  }
}
if (results.length === 0) {
  console.error(`no results found in ${resultsDir}`);
  process.exit(1);
}

const { env } = results[0];
const date = new Date().toISOString();
const record = {
  schemaVersion: 1,
  date,
  env,
  scenarios: Object.fromEntries(
    results.map(({ scenario, summary }) => [
      scenario.id,
      {
        kind: scenario.run.kind,
        description: scenario.description,
        keyMetrics: KEY_METRICS[scenario.run.kind],
        summary,
      },
    ]),
  ),
};

const file = `${date.slice(0, 19).replace(/:/g, "")}-${env.gitSha.slice(0, 7)}.json`;
await mkdir(runsDir, { recursive: true });
await writeFile(join(runsDir, file), JSON.stringify(record));

const index: HistoryIndex = await readFile(indexPath, "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => ({ schemaVersion: 1, runs: [] }));
index.runs = index.runs.filter((run) => run.file !== `runs/${file}`);
index.runs.push({ file: `runs/${file}`, date, gitSha: env.gitSha });
await writeFile(indexPath, JSON.stringify(index, null, 2));

const here = dirname(fileURLToPath(import.meta.url));
await copyFile(join(here, "../site/index.html"), join(benchRoot, "index.html"));

console.log(`published ${file}, ${index.runs.length} runs in history`);
