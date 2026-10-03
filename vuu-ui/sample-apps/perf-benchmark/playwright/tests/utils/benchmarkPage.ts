import type { Page } from "@playwright/test";

// ag-grid-client: ag-grid's normal client-side row model (holds the full
// dataset in the browser, sorts/filters/updates it itself).
// ag-grid-server: ag-grid's Enterprise Server-Side Row Model (SSRM), backed
// by this project's own Node feed-server - the browser holds only loaded
// row blocks, sort/filter/paging happen server-side.
// ag-grid-vuu: ag-grid's Enterprise Viewport Row Model, backed by VUU's
// *real* server (the same one the "vuu" variant uses) - the closest
// apples-to-apples comparison, since backend and wire protocol are
// identical to VUU's own and only the rendering grid library differs.
export type GridUnderTest = "vuu" | "ag-grid-client" | "ag-grid-server" | "ag-grid-vuu";

const TEST_IDS: Record<GridUnderTest, string> = {
  vuu: "vuu-benchmark-grid",
  "ag-grid-client": "ag-grid-benchmark-grid",
  "ag-grid-server": "ag-grid-benchmark-grid",
  "ag-grid-vuu": "ag-grid-benchmark-grid",
};

export const gridTestId = (grid: GridUnderTest) => TEST_IDS[grid];

const FEED_SERVER_HTTP_URL = "http://localhost:4000";

export async function gotoGrid(
  page: Page,
  grid: GridUnderTest,
  rowCount: number,
) {
  // Reset the shared server-side dataset + tick PRNG back to a pristine,
  // freshly-seeded state before this test's page even connects. Without
  // this, every variant after the first to touch a given table/feed in the
  // whole suite run inherits whatever an earlier test already ticked it to -
  // silently breaking the "same data, same random sequence" premise the
  // comparison depends on (see README's "Shared harness / determinism").
  //
  // For the feed-server-backed variants this has to happen over plain HTTP,
  // *before* page.goto: ag-grid-client is pushed its full dataset the
  // instant it connects, and ag-grid-server's SSRM starts firing getRows as
  // soon as it mounts, so a reset issued from the page itself (after
  // connecting) could race either of those.
  if (grid === "ag-grid-client" || grid === "ag-grid-server") {
    const res = await fetch(`${FEED_SERVER_HTTP_URL}/reset?rows=${rowCount}`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`feed-server reset failed: ${res.status} ${await res.text()}`);
    }
  }

  await page.goto(`/?grid=${grid}&rows=${rowCount}`);
  await page.waitForFunction(() => Boolean(window.__benchmark));
  // window.__benchmark becomes available as soon as the DataSource/WebSocket
  // is constructed, which can be before the grid has actually finished
  // subscribing/loading its first rows (VUU-backed variants: viewport not
  // yet assigned server-side; feed-server-backed: initial data not yet
  // received) - wait for an actual rendered data row so RPC/message calls
  // that need a live subscription (fireBurst etc.) don't race it.
  //
  // All variants expose a proper ARIA grid: row 0 (index 0) is the header
  // row (role="row" containing role="columnheader" cells), row 1 is the
  // first data row - so this check doesn't need to know any variant's
  // internal DOM/class structure.
  await page
    .getByTestId(gridTestId(grid))
    .getByRole("row")
    .nth(1)
    .waitFor({ state: "visible" });

  // VUU-backed variants: only safe to call resetDataset's RPC once a viewport
  // actually exists server-side (which a rendered data row guarantees, but
  // window.__benchmark's mere existence above doesn't - see the comment on
  // that wait). The reset then arrives as an ordinary batch of pushed row
  // updates, replacing whatever the just-rendered row(s) momentarily showed.
  // For ag-grid-client/ag-grid-server this is a no-op (already reset over
  // HTTP before this page navigated, so there's nothing stale to replace).
  await page.evaluate(() => window.__benchmark!.resetDataset());
}
