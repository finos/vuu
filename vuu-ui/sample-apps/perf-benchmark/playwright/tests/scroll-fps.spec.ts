import { expect, test } from "@playwright/test";
import { gotoGrid, gridTestId, type GridUnderTest } from "./utils/benchmarkPage";
import { recordResult } from "./utils/report";

// Deliberately combines scrolling with live streaming updates - a static
// scroll benchmark doesn't reflect a trading blotter, where the two always
// happen concurrently.
const UPDATES_PER_SECOND = 1000;
const UPDATES_PER_MESSAGE = 100;
const SCROLL_DURATION_MS = 2000;
const ROW_COUNTS = [10_000, 100_000];
const GRIDS: GridUnderTest[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

test.describe("scroll FPS while streaming", () => {
  for (const grid of GRIDS) {
    for (const rowCount of ROW_COUNTS) {
      test(`[${grid}] scroll frame rate with live updates at ${rowCount} rows`, async ({
        page,
      }) => {
        await gotoGrid(page, grid, rowCount);

        await page.evaluate(
          ([ups, upm]) => window.__benchmark!.startTicking(ups, upm),
          [UPDATES_PER_SECOND, UPDATES_PER_MESSAGE],
        );
        // let the stream settle into steady state before measuring
        await page.waitForTimeout(300);

        await page.getByTestId(gridTestId(grid)).hover();

        await page.evaluate(() => {
          window.__benchmark!.resetFrameMetrics();
          window.__benchmark!.startFpsCounter();
        });

        const scrollStart = Date.now();
        while (Date.now() - scrollStart < SCROLL_DURATION_MS) {
          await page.mouse.wheel(0, 120);
          await page.waitForTimeout(16);
        }

        const [fpsResult, frameMetrics] = await page.evaluate(() => {
          const fps = window.__benchmark!.stopFpsCounter();
          const frames = window.__benchmark!.getFrameMetrics();
          window.__benchmark!.stopTicking();
          return [fps, frames] as const;
        });

        recordResult("scroll-fps", grid, rowCount, { ...fpsResult, ...frameMetrics });

        expect(fpsResult.frames).toBeGreaterThan(0);
      });
    }
  }
});
