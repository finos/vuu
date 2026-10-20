/**
 * Prints the key metrics of one results directory as markdown, used for the
 * GitHub Actions job summary.
 *
 *   tsx benchmarks/scripts/report.ts benchmarks/results/current >> "$GITHUB_STEP_SUMMARY"
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { round } from "../harness/stats";
import type { ScenarioResult } from "../harness/types";
import { KEY_METRICS } from "../runner/scenarios";

const [resultsDir] = process.argv.slice(2);
if (!resultsDir) {
  console.error("usage: report.ts <results dir>");
  process.exit(1);
}

const results: ScenarioResult[] = [];
for (const file of (await readdir(resultsDir)).sort()) {
  if (file.endsWith(".json")) {
    results.push(JSON.parse(await readFile(join(resultsDir, file), "utf8")));
  }
}
if (results.length === 0) {
  console.log(`No benchmark results found in \`${resultsDir}\`.`);
  process.exit(0);
}

const { env } = results[0];
const iterations = results[0].runs.filter((r) => r.pass === "timing").length;

console.log("## Vuu Table benchmarks\n");
console.log(
  `\`${env.gitSha.slice(0, 10)}\`, ${env.browser} ${env.browserVersion}, ` +
    `CPU throttle ${env.cpuThrottle}x, ${env.hardwareConcurrency} cores, ` +
    `medians of ${iterations} iteration(s). Lower is better.\n`,
);
if (env.buildMode !== "production") {
  console.log("> **Development build, timings are not representative.**\n");
}
console.log("| Scenario | Metric | Value |\n| --- | --- | --- |");
for (const { scenario, summary } of results) {
  for (const metric of KEY_METRICS[scenario.run.kind]) {
    const value = summary[metric];
    if (value !== undefined) {
      console.log(`| ${scenario.id} | ${metric} | ${round(value)} |`);
    }
  }
}
