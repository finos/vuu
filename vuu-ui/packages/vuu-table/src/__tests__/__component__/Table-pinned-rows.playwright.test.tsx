import type { Locator, Page } from "@playwright/test";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

const PINNED_ROWS = "Table/PinnedRows/PinnedRows";
const SCROLLING_PINNED_ROWS = "Table/PinnedRows/ScrollingPinnedRows";
const STRICT_MODE_REMOTE_SUBSCRIBE =
  "Table/PinnedRows/PinnedRowsStrictModeRemoteSubscribe";

// One column header row, so pinned rows begin at aria-rowindex 2
const FIRST_PINNED_ROW = 2;

const pinnedArea = (page: Page) => page.locator(".vuuTable-pinnedRows");
const pinnedRows = (page: Page) =>
  page.locator(".vuuTable-pinnedRows .vuuTableRow");
const bodyRow = (page: Page, ariaRowIndex: number) =>
  page.locator(`.vuuTable-body [aria-rowindex="${ariaRowIndex}"]`);
const pinnedRow = (page: Page, ariaRowIndex: number) =>
  page.locator(`.vuuTable-pinnedRows [aria-rowindex="${ariaRowIndex}"]`);
const cellIn = (row: Locator, ariaColIndex: number) =>
  row.locator(`> [aria-colindex="${ariaColIndex}"]`);

const pinnedRics = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        ".vuuTable-pinnedRows .vuuTableRow",
      ),
    )
      .sort(
        (r1, r2) =>
          Number(r1.getAttribute("aria-rowindex")) -
          Number(r2.getAttribute("aria-rowindex")),
      )
      .map((row) => row.querySelector(".vuuTableCell")?.textContent ?? ""),
  );

const horizontalPosition = async (cell: Locator) => {
  const box = await cell.boundingBox();
  if (box === null) {
    throw Error("cell has no bounding box");
  }
  return { x: Math.round(box.x), width: Math.round(box.width) };
};

/**
 * Columns 1 (ric, pinned left), 2, 5 and the last (phase, pinned right)
 */
const expectColumnsAligned = async (page: Page, pinned: Locator) => {
  const body = bodyRow(page, 4);
  const lastColIndex = await page
    .locator(".vuuTableColHeaderRow .vuuTableHeaderCell")
    .count();
  for (const colIndex of [1, 2, 5, lastColIndex]) {
    const header = page.locator(
      `.vuuTableColHeaderRow > [aria-colindex="${colIndex}"]`,
    );
    const headerPos = await horizontalPosition(header);
    expect(await horizontalPosition(cellIn(pinned, colIndex))).toEqual(
      headerPos,
    );
    expect(await horizontalPosition(cellIn(body, colIndex))).toEqual(headerPos);
  }
};

test.describe("Table pinned rows", () => {
  test.describe("WHEN StrictMode re-runs effects while the pinned data source is still subscribing", () => {
    test("THEN the Table does not throw and pinned rows render once subscribed", async ({
      mount,
      page,
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await mount(STRICT_MODE_REMOTE_SUBSCRIBE);
      await new PwTable(page).dataLoaded;

      await expect(pinnedRows(page)).toHaveCount(2);
      expect(await pinnedRics(page)).toEqual(["AAOO.L", "AAOQ.OQ"]);
      expect(pageErrors).toEqual([]);
    });
  });

  test.describe("WHEN rows are pinned by key", () => {
    test("THEN pinned rows render above the body and are excluded from it", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;

      await expect(pinnedRows(page)).toHaveCount(2);
      expect(await pinnedRics(page)).toEqual(["AAOP.N", "AAOT.PA"]);
      await expect(page.getByTestId("pinned-count")).toHaveText("2 pinned");

      // body rows follow pinned rows in aria-rowindex order
      await expect(cellIn(bodyRow(page, 4), 1)).toHaveText("AAOO.L");
      await expect(cellIn(bodyRow(page, 5), 1)).toHaveText("AAOQ.OQ");
      await expect(
        page
          .locator(".vuuTable-body")
          .getByRole("cell", { exact: true, name: "AAOP.N" }),
      ).toHaveCount(0);

      // header, pinned and body rows
      await expect(page.getByRole("table")).toHaveAttribute(
        "aria-rowcount",
        "10001",
      );
    });

    test("THEN pinned area is positioned directly below the column headers", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      await new PwTable(page).dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      const header = await page.locator(".vuuTableHeader").boundingBox();
      const pinned = await pinnedArea(page).boundingBox();
      expect(Math.round(pinned?.y ?? 0)).toEqual(
        Math.round((header?.y ?? 0) + (header?.height ?? 0)),
      );
      await expect(page.locator(".vuuTable-pinnedDivider")).toBeVisible();
    });

    test("THEN pinned rows stay in place when the body scrolls", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);

      const before = await pinnedArea(page).boundingBox();
      await table.scrollDown(2000);
      await expect(bodyRow(page, 3)).not.toBeAttached();
      const after = await pinnedArea(page).boundingBox();
      expect(after?.y).toEqual(before?.y);
      await expect(pinnedRow(page, FIRST_PINNED_ROW)).toBeInViewport();
    });
  });

  test.describe("layout", () => {
    test("pinned cells align with headers and body, including pinned columns", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N"] });
      await new PwTable(page).dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);

      await expectColumnsAligned(page, pinnedRow(page, FIRST_PINNED_ROW));
    });

    test("pinned cells stay aligned when the table is scrolled horizontally", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);

      const pinned = pinnedRow(page, FIRST_PINNED_ROW);
      const ricBefore = await horizontalPosition(cellIn(pinned, 1));
      const descriptionBefore = await horizontalPosition(cellIn(pinned, 2));

      await table.scrollRight(200);

      // ric is pinned left, it does not move
      expect(await horizontalPosition(cellIn(pinned, 1))).toEqual(ricBefore);
      expect((await horizontalPosition(cellIn(pinned, 2))).x).toBeLessThan(
        descriptionBefore.x,
      );
      await expectColumnsAligned(page, pinned);
    });

    test("resizing a column resizes pinned cells", async ({
      browserName,
      mount,
      page,
    }) => {
      test.skip(browserName === "webkit");
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N"] });
      await new PwTable(page).dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);

      const header = page.getByRole("columnheader", {
        name: "description column header",
      });
      const resizer = header.getByRole("separator");
      const box = await resizer.boundingBox();
      if (box === null) {
        throw Error("no resizer");
      }
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 50, y, { steps: 10 });
      await page.mouse.up();

      const pinnedCell = cellIn(pinnedRow(page, FIRST_PINNED_ROW), 2);
      await expect
        .poll(async () => (await horizontalPosition(pinnedCell)).width)
        .toEqual(250);
      await expectColumnsAligned(page, pinnedRow(page, FIRST_PINNED_ROW));
    });
  });

  test.describe("keyboard navigation", () => {
    test("ArrowUp and ArrowDown cross between body and pinned rows, keeping the column", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      const firstBodyCell = cellIn(bodyRow(page, 4), 3);
      await firstBodyCell.click();
      await expect(firstBodyCell).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(cellIn(pinnedRow(page, 3), 3)).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(cellIn(pinnedRow(page, 2), 3)).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(table.locateColumnHeader(3)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(firstBodyCell).toBeFocused();
    });

    test("Home moves to the first pinned row", async ({ mount, page }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      const cell = cellIn(bodyRow(page, 6), 2);
      await cell.click();
      await page.keyboard.press("Home");
      await expect(cellIn(pinnedRow(page, 2), 2)).toBeFocused();
    });

    test("PageDown from a pinned row moves into the body", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      await cellIn(pinnedRow(page, 2), 2).click();
      await page.keyboard.press("PageDown");
      const focusedRow = await page.evaluate(() =>
        document.activeElement?.closest(".vuuTable-body [role='row']")
          ? Number(
              document.activeElement
                ?.closest("[role='row']")
                ?.getAttribute("aria-rowindex"),
            )
          : -1,
      );
      expect(focusedRow).toBeGreaterThan(3);
    });
  });

  test.describe("selection", () => {
    test("a single selection spans pinned and body rows", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      await cellIn(bodyRow(page, 5), 2).click();
      await expect(bodyRow(page, 5)).toHaveAttribute("aria-selected", "true");

      await cellIn(pinnedRow(page, 3), 2).click();
      await expect(pinnedRow(page, 3)).toHaveAttribute("aria-selected", "true");
      await expect(bodyRow(page, 5)).not.toHaveAttribute("aria-selected");
      await expect(page.getByTestId("unpin-row")).toBeEnabled();

      await cellIn(bodyRow(page, 4), 2).click();
      await expect(bodyRow(page, 4)).toHaveAttribute("aria-selected", "true");
      await expect(pinnedRow(page, 3)).not.toHaveAttribute("aria-selected");
      await expect(page.getByTestId("pin-row")).toBeEnabled();
    });

    test("Space selects a pinned row without scrolling the body", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOP.N", "AAOT.PA"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      await cellIn(bodyRow(page, 4), 2).click();
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Space");
      await expect(pinnedRow(page, 3)).toHaveAttribute("aria-selected", "true");
      expect((await table.scrollPosition()).scrollTop).toEqual(0);
    });
  });

  test.describe("sort and grouping", () => {
    test("pinned rows follow the sort of the main data source", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, {
        pinnedKeys: ["AAOP.N", "AAOT.PA", "AAOQ.OQ"],
        sort: { sortDefs: [{ column: "ric", sortType: "D" }] },
      });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect
        .poll(() => pinnedRics(page))
        .toEqual(["AAOT.PA", "AAOQ.OQ", "AAOP.N"]);

      // toggle the sort from the column header
      await table.headerCell("ric").locator.click();
      await expect
        .poll(() => pinnedRics(page))
        .toEqual(["AAOP.N", "AAOQ.OQ", "AAOT.PA"]);
    });

    test("pinned rows are not grouped when the body is grouped", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, {
        groupBy: ["currency"],
        pinnedKeys: ["AAOP.N", "AAOT.PA"],
      });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(2);

      for (const ariaRowIndex of [2, 3]) {
        const row = pinnedRow(page, ariaRowIndex);
        await expect(row).not.toHaveAttribute("aria-expanded");
        await expect(row).not.toHaveAttribute("aria-level");
      }
      await expect(bodyRow(page, 4)).toHaveAttribute("aria-expanded", "false");
    });
  });

  test.describe("empty pinned area", () => {
    test("WHEN no keys THEN there is no pinned area", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS);
      const table = new PwTable(page);
      await table.dataLoaded;

      await expect(pinnedArea(page)).toHaveCount(0);
      await expect(page.locator(".vuuTable-pinnedDivider")).toHaveCount(0);
      await expect(cellIn(bodyRow(page, 2), 1)).toHaveText("AAOO.L");
    });

    test("WHEN all rows are unpinned THEN the pinned area is removed and rows return to the body", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOO.L"] });
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);
      await expect(cellIn(bodyRow(page, 3), 1)).toHaveText("AAOP.N");

      await page.getByTestId("unpin-all").click();
      await expect(pinnedArea(page)).toHaveCount(0);
      await expect(page.getByTestId("pinned-count")).toHaveText("0 pinned");
      await expect(cellIn(bodyRow(page, 2), 1)).toHaveText("AAOO.L");

      const header = await page.locator(".vuuTableHeader").boundingBox();
      const firstRow = await bodyRow(page, 2).boundingBox();
      expect(Math.round(firstRow?.y ?? 0)).toEqual(
        Math.round((header?.y ?? 0) + (header?.height ?? 0)),
      );
    });

    test("WHEN pinned rows are hidden THEN pinned area is removed", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, { pinnedKeys: ["AAOO.L"] });
      await new PwTable(page).dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(1);

      await page.getByRole("switch", { name: "Show pinned rows" }).click();
      await expect(pinnedArea(page)).toHaveCount(0);
      await expect(cellIn(bodyRow(page, 2), 1)).toHaveText("AAOO.L");
    });
  });

  test.describe("limits", () => {
    test("WHEN there are more keys than maxPinnedRows THEN extra rows stay in the body", async ({
      mount,
      page,
    }) => {
      await mount(PINNED_ROWS, {
        maxPinnedRows: 2,
        pinnedKeys: ["AAOP.N", "AAOT.PA", "AAOQ.OQ"],
      });
      const table = new PwTable(page);
      await table.dataLoaded;

      await expect(pinnedRows(page)).toHaveCount(2);
      await expect(page.getByTestId("pinned-count")).toHaveText("2 pinned");
      await expect(
        page
          .locator(".vuuTable-body")
          .getByRole("cell", { exact: true, name: "AAOQ.OQ" }),
      ).toHaveCount(1);
    });

    test("WHEN there are more rows than maxVisibleRows THEN pinned area scrolls on its own", async ({
      mount,
      page,
    }) => {
      await mount(SCROLLING_PINNED_ROWS);
      const table = new PwTable(page);
      await table.dataLoaded;
      await expect(pinnedRows(page)).toHaveCount(4);

      const rowHeight = (await bodyRow(page, 6).boundingBox())?.height ?? 0;
      const viewport = await page
        .locator(".vuuTable-pinnedRowsViewport")
        .boundingBox();
      expect(Math.round(viewport?.height ?? 0)).toEqual(
        Math.round(2 * rowHeight),
      );
      await expect(page.locator(".vuuTable-pinnedRowsScrollbar")).toBeVisible();

      await expect(pinnedRow(page, 5)).not.toBeInViewport();
      await pinnedRow(page, 2).hover();
      await page.mouse.wheel(0, 200);
      await expect(pinnedRow(page, 5)).toBeInViewport();
      expect((await table.scrollPosition()).scrollTop).toEqual(0);

      // keyboard focus scrolls the pinned area
      await cellIn(bodyRow(page, 6), 2).click();
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await expect(cellIn(pinnedRow(page, 2), 2)).toBeFocused();
      await expect(pinnedRow(page, 2)).toBeInViewport();
    });
  });
});
