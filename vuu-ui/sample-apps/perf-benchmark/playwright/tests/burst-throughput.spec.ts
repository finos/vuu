import { expect, test } from "@playwright/test";
import { gotoGrid, type GridUnderTest } from "./utils/benchmarkPage";
import { recordResult } from "./utils/report";

// Mirrors ag-grid's own published "stress test": fire a burst of updates
// (as messages of 100 each) back to back and measure wall-clock time.
//
// Against VUU's real server this comfortably completes 100,000 updates even
// at 100,000 rows (see streaming-throughput.spec.ts comments for the earlier
// mock-datasource numbers, which did not); the smaller total at the 100k
// tier is kept mainly so both grids run the same fixed set of tiers without
// the suite taking longer than it needs to.
const UPDATES_PER_MESSAGE = 100;
const TOTAL_UPDATES_BY_ROW_COUNT: Record<number, number> = {
  10_000: 100_000,
  100_000: 5_000,
};
const GRIDS: GridUnderTest[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

test.describe("burst update throughput", () => {
  for (const grid of GRIDS) {
    for (const [rowCountStr, totalUpdates] of Object.entries(
      TOTAL_UPDATES_BY_ROW_COUNT,
    )) {
      const rowCount = Number(rowCountStr);

      test(`[${grid}] applies ${totalUpdates} updates as fast as possible at ${rowCount} rows`, async ({
        page,
      }) => {
        test.setTimeout(120_000);
        await gotoGrid(page, grid, rowCount);

        const result = await page.evaluate(
          ([total, upm]) => window.__benchmark!.fireBurst(total, upm),
          [totalUpdates, UPDATES_PER_MESSAGE],
        );

        recordResult("burst-throughput", grid, rowCount, result);

        expect(result.totalUpdates).toBe(totalUpdates);
        expect(result.updatesPerSecond).toBeGreaterThan(0);
      });
    }
  }
});
