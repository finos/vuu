import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GridUnderTest } from "./benchmarkPage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "../../results");

/**
 * Appends a scenario's measurement for one grid into results/<scenario>.json,
 * keyed by grid name and row count, so once the ag-grid adapter lands
 * (step 4) the two sets of numbers sit side by side for comparison.
 */
export function recordResult(
  scenario: string,
  grid: GridUnderTest,
  rowCount: number,
  data: object,
) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${scenario}.json`);
  const existing: Record<string, unknown> = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf-8"))
    : {};
  const key = `${grid}-${rowCount}rows`;
  existing[key] = { grid, rowCount, ...data, capturedAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[${scenario}] ${key}:`, data);
}
