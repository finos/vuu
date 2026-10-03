import { expect, test } from "@playwright/test";
import { gotoGrid, type GridUnderTest } from "./utils/benchmarkPage";
import { recordResult } from "./utils/report";

// Mirrors ag-grid's own published "load test": 10 messages/sec of 100 row
// updates each = 1000 sustained updates/sec, while checking the grid keeps up.
const UPDATES_PER_SECOND = 1000;
const UPDATES_PER_MESSAGE = 100;
const STREAM_DURATION_MS = 5000;
const ROW_COUNTS = [10_000, 100_000];
const GRIDS: GridUnderTest[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

test.describe("sustained streaming update throughput", () => {
  for (const grid of GRIDS) {
    for (const rowCount of ROW_COUNTS) {
      test(`[${grid}] grid keeps up with ${UPDATES_PER_SECOND} updates/sec at ${rowCount} rows`, async ({
        page,
      }) => {
        await gotoGrid(page, grid, rowCount);

        await page.evaluate(() => window.__benchmark!.resetFrameMetrics());
        await page.evaluate(
          ([ups, upm]) => window.__benchmark!.startTicking(ups, upm),
          [UPDATES_PER_SECOND, UPDATES_PER_MESSAGE],
        );

        await page.waitForTimeout(STREAM_DURATION_MS);

        const [tickStats, frameMetrics] = await page.evaluate(async () => {
          window.__benchmark!.stopTicking();
          const tickStats = await window.__benchmark!.getTickStats();
          const frameMetrics = window.__benchmark!.getFrameMetrics();
          return [tickStats, frameMetrics] as const;
        });

        const expectedMessages = STREAM_DURATION_MS / (UPDATES_PER_MESSAGE / UPDATES_PER_SECOND * 1000);

        recordResult("streaming-throughput", grid, rowCount, {
          updatesPerSecondTarget: UPDATES_PER_SECOND,
          ...tickStats,
          avgDriftMs: tickStats.messagesSent
            ? tickStats.totalDriftMs / tickStats.messagesSent
            : 0,
          ...frameMetrics,
        });

        // Sanity: the tick engine actually ran at roughly the scheduled rate.
        // A wide tolerance here - this is a functional check, not the metric itself.
        expect(tickStats.messagesSent).toBeGreaterThan(expectedMessages * 0.5);
        expect(tickStats.rowsUpdated).toBeGreaterThan(0);
      });
    }
  }
});
