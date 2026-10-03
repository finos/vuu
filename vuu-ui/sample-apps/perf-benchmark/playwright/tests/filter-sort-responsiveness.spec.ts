import { expect, test } from "@playwright/test";
import { gotoGrid, type GridUnderTest } from "./utils/benchmarkPage";
import { recordResult } from "./utils/report";
import { getCell } from "./utils/gridCell";

// Sort/filter issued while a live price stream is running - the realistic
// case for a trading blotter, and the harder case for a grid to stay
// responsive in.
const UPDATES_PER_SECOND = 1000;
const UPDATES_PER_MESSAGE = 100;
const ROW_COUNTS = [10_000, 100_000];
const GRIDS: GridUnderTest[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

// Deliberately tight and starting at 1ms: applySort/applyFilter dispatch a
// request and return before the change is actually visible for three of the
// four variants (vuu, ag-grid-vuu, and - via SSRM's async getRows -
// ag-grid-server), so sortMs/filterMs are measured as "time until the poll
// condition below is true", not "time until the dispatch call resolves".
// Playwright's default expect.poll cadence (100ms, then backing off further)
// would quantize away most of the very numbers this scenario exists to
// measure - some of these round trips genuinely complete in single-digit ms.
const TIGHT_POLL_INTERVALS_MS = [1, 2, 5, 10, 20, 50];
const POLL_TIMEOUT_MS = 10_000;

test.describe("sort/filter responsiveness while streaming", () => {
  for (const grid of GRIDS) {
    for (const rowCount of ROW_COUNTS) {
      test(`[${grid}] sort and filter while streaming at ${rowCount} rows`, async ({
        page,
      }) => {
        await gotoGrid(page, grid, rowCount);

        await page.evaluate(
          ([ups, upm]) => window.__benchmark!.startTicking(ups, upm),
          [UPDATES_PER_SECOND, UPDATES_PER_MESSAGE],
        );
        await page.waitForTimeout(300);

        await page.evaluate(() => window.__benchmark!.resetFrameMetrics());

        // sortMs/filterMs are measured from dispatch until the change is
        // actually visible, not until applySort/applyFilter resolves: for
        // vuu, ag-grid-vuu, and ag-grid-server (SSRM), that call just enqueues
        // a request and returns immediately - the real sort/filter+re-render
        // happens later, asynchronously, over the network. Only ag-grid-client
        // does the work synchronously inside the call itself. Timing just the
        // dispatch call would compare "time to enqueue a request" against
        // "time to actually do the work" - not a fair comparison of anything.
        // Folding the correctness poll into the timed window (instead of
        // treating it as an untimed sanity check afterward) makes all four
        // variants measure the same real-world thing: how long until a user
        // actually sees the new order/filter.
        const sortStart = Date.now();
        await page.evaluate(() => window.__benchmark!.applySort("bid", "desc"));
        // both visible cells parse as numbers *and* are correctly ordered -
        // fails fast on a real regression instead of masking one, and never
        // spuriously fails on a slow-but-still-in-progress sort.
        await expect
          .poll(
            async () => {
              const [firstText, secondText] = await Promise.all([
                getCell(page, grid, 0, "bid").textContent(),
                getCell(page, grid, 1, "bid").textContent(),
              ]);
              const firstBid = parseFloat(firstText ?? "");
              const secondBid = parseFloat(secondText ?? "");
              return Number.isFinite(firstBid) && Number.isFinite(secondBid) && firstBid >= secondBid;
            },
            { intervals: TIGHT_POLL_INTERVALS_MS, timeout: POLL_TIMEOUT_MS },
          )
          .toBe(true);
        const sortMs = Date.now() - sortStart;

        const filterStart = Date.now();
        await page.evaluate(() => window.__benchmark!.applyFilter("exchange", "eq", "NASDAQ"));
        await expect
          .poll(
            async () => (await getCell(page, grid, 0, "exchange").textContent()) === "NASDAQ",
            { intervals: TIGHT_POLL_INTERVALS_MS, timeout: POLL_TIMEOUT_MS },
          )
          .toBe(true);
        const filterMs = Date.now() - filterStart;

        const frameMetrics = await page.evaluate(() =>
          window.__benchmark!.getFrameMetrics(),
        );

        await page.evaluate(async () => {
          window.__benchmark!.stopTicking();
          await window.__benchmark!.clearFilter();
        });

        recordResult("filter-sort-responsiveness", grid, rowCount, {
          sortMs,
          filterMs,
          ...frameMetrics,
        });
      });
    }
  }
});
