/**
 * Compares two result directories written by the benchmark runner, usually
 * a base (main) and a candidate (PR) run, and prints a markdown table.
 *
 *   npm run bench:compare -- benchmarks/results/base benchmarks/results/pr
 *
 * A metric is reported as a change only when the medians differ by more
 * than the threshold AND a Mann-Whitney U test over the timing iterations
 * gives p < 0.05. Informational only, nothing is gated on this yet.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { mannWhitneyU, median, round } from "../harness/stats";
import type { ScenarioResult } from "../harness/types";
import { KEY_METRICS } from "../runner/scenarios";
import { flattenRun } from "../runner/summary";

const THRESHOLD_PCT = Number(process.env.BENCH_THRESHOLD_PCT ?? 5);
const P_VALUE = 0.05;

const [baseDir, candidateDir] = process.argv.slice(2);
if (!baseDir || !candidateDir) {
  console.error("usage: compare.ts <base results dir> <candidate results dir>");
  process.exit(1);
}

const load = async (dir: string) => {
  const results = new Map<string, ScenarioResult>();
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".json")) continue;
    const result = JSON.parse(
      await readFile(join(dir, file), "utf8"),
    ) as ScenarioResult;
    results.set(result.scenario.id, result);
  }
  return results;
};

const timingValues = (result: ScenarioResult, metric: string) =>
  result.runs
    .filter((r) => r.pass === "timing")
    .map((r) => flattenRun(r)[metric])
    .filter((v): v is number => typeof v === "number");

const base = await load(baseDir);
const candidate = await load(candidateDir);

const rows: string[] = [];
let regressions = 0;
let improvements = 0;

for (const [id, baseResult] of base) {
  const candidateResult = candidate.get(id);
  if (!candidateResult) continue;
  for (const metric of KEY_METRICS[baseResult.scenario.run.kind]) {
    const a = timingValues(baseResult, metric);
    const b = timingValues(candidateResult, metric);
    if (a.length === 0 || b.length === 0) continue;
    const ma = median(a);
    const mb = median(b);
    const deltaPct = ma === 0 ? (mb === 0 ? 0 : 100) : ((mb - ma) / ma) * 100;
    const p = mannWhitneyU(a, b);
    let verdict = "";
    if (Math.abs(deltaPct) > THRESHOLD_PCT && p < P_VALUE) {
      // lower is better for every key metric
      verdict = deltaPct > 0 ? "slower" : "faster";
      if (deltaPct > 0) regressions++;
      else improvements++;
    }
    rows.push(
      `| ${id} | ${metric} | ${round(ma)} | ${round(mb)} | ${deltaPct > 0 ? "+" : ""}${round(deltaPct, 1)}% | ${round(p, 3)} | ${verdict} |`,
    );
  }
}

const envOf = (results: Map<string, ScenarioResult>) =>
  results.values().next().value?.env;
const baseEnv = envOf(base);
const candidateEnv = envOf(candidate);

console.log("## Vuu Table benchmark comparison\n");
console.log(
  `Base \`${baseEnv?.gitSha.slice(0, 10)}\` vs candidate \`${candidateEnv?.gitSha.slice(0, 10)}\`, ` +
    `${candidateEnv?.browserVersion}, CPU throttle ${candidateEnv?.cpuThrottle}x. ` +
    `Changes need > ${THRESHOLD_PCT}% and p < ${P_VALUE}.\n`,
);
console.log(
  `**${regressions} slower, ${improvements} faster** across ${rows.length} metrics.\n`,
);
console.log(
  "| Scenario | Metric | Base | Candidate | Change | p | Verdict |\n| --- | --- | --- | --- | --- | --- | --- |",
);
console.log(rows.join("\n"));
