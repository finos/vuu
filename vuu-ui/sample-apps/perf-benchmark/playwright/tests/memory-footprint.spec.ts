import { expect, test } from "@playwright/test";
import { gotoGrid, type GridUnderTest } from "./utils/benchmarkPage";
import { recordResult } from "./utils/report";
import { sampleHeapUsedBytes } from "./utils/cdp";

const UPDATES_PER_SECOND = 1000;
const UPDATES_PER_MESSAGE = 100;
const CHURN_DURATION_MS = 5000;
const ROW_COUNTS = [10_000, 100_000];
const GRIDS: GridUnderTest[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

test.describe("memory footprint", () => {
  for (const grid of GRIDS) {
    for (const rowCount of ROW_COUNTS) {
      test(`[${grid}] heap usage at rest and after update churn at ${rowCount} rows`, async ({
        page,
      }) => {
        await gotoGrid(page, grid, rowCount);
        // let initial mount settle before the baseline sample
        await page.waitForTimeout(500);
        const heapAtRestBytes = await sampleHeapUsedBytes(page);

        await page.evaluate(
          ([ups, upm]) => window.__benchmark!.startTicking(ups, upm),
          [UPDATES_PER_SECOND, UPDATES_PER_MESSAGE],
        );
        await page.waitForTimeout(CHURN_DURATION_MS);
        await page.evaluate(() => window.__benchmark!.stopTicking());
        // let any pending render/GC work settle before sampling
        await page.waitForTimeout(500);

        const heapAfterChurnBytes = await sampleHeapUsedBytes(page);

        recordResult("memory-footprint", grid, rowCount, {
          heapAtRestBytes,
          heapAfterChurnBytes,
          heapGrowthBytes: heapAfterChurnBytes - heapAtRestBytes,
        });

        expect(Number.isFinite(heapAtRestBytes)).toBe(true);
      });
    }
  }
});
