import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { TableOM } from "@vuu-ui/vuu-playwright-helpers";

// The table is only virtualised when its content height exceeds the browser's
// maximum scroll height. Firefox's limit is low enough, as is Chromium's at a
// device scale factor of 2 (e.g. a Retina display).
test.use({
  launchOptions: async ({ browserName }, use) =>
    use(
      browserName === "chromium"
        ? { args: ["--force-device-scale-factor=2"] }
        : {},
    ),
});

/**
 * Returns the aria-rowindex of each row whose top edge lies within the
 * content container, in ascending order.
 */
const getVisibleRowIndices = (page: Page) =>
  page.evaluate(() => {
    const container = document.querySelector(
      ".vuuTable-contentContainer",
    ) as HTMLElement;
    const { top, height } = container.getBoundingClientRect();
    return Array.from(container.querySelectorAll(".vuuTableRow"))
      .filter((row) => {
        const rowTop = row.getBoundingClientRect().top - top;
        return rowTop >= 0 && rowTop < height;
      })
      .map((row) => Number(row.getAttribute("aria-rowindex")))
      .sort((a, b) => a - b);
  });

const getFocusedRowIndex = (page: Page) =>
  page.evaluate(() =>
    Number(
      document.activeElement
        ?.closest(".vuuTableRow")
        ?.getAttribute("aria-rowindex"),
    ),
  );

const isContiguous = (rows: number[]) =>
  rows.every((row, i) => i === 0 || row === rows[i - 1] + 1);

/**
 * Page and wait until the viewport is filled with a contiguous block of rows
 * that ends where the previous page began (pages may overlap by the one
 * partially visible row).
 */
const pageUp = async (page: Page, previousRows: number[]) => {
  await page.keyboard.press("PageUp");
  await expect
    .poll(async () => {
      const rows = await getVisibleRowIndices(page);
      return (
        rows.length === previousRows.length &&
        isContiguous(rows) &&
        rows[0] < previousRows[0] &&
        (rows.at(-1) as number) <= previousRows[0] + 1
      );
    })
    .toBe(true);
  const rows = await getVisibleRowIndices(page);
  await expect
    .poll(async () => rows.includes(await getFocusedRowIndex(page)))
    .toBe(true);
  return rows;
};

const mountAndPressEnd = async (
  mount: (story: string) => Promise<unknown>,
  page: Page,
) => {
  await mount("Table/BigData/SimpleTableMillionRows");
  const table = new TableOM(page.getByRole("table"));
  const cell = table.locateCell(2, 1);
  await cell.click();
  await expect(cell).toBeFocused();
  await page.keyboard.press("End");
  await expect(table.locateCell(1_000_001, 1)).toBeFocused();
  const rowsAtEnd = await getVisibleRowIndices(page);
  expect(rowsAtEnd.at(-1)).toBe(1_000_001);
  return rowsAtEnd;
};

test.describe("Virtualised Table, keyboard paging", () => {
  test.skip(
    ({ browserName }) => browserName === "webkit",
    "WebKit's maximum scroll height is too large for this table to be virtualised",
  );

  test.describe("WHEN End then PageUp pressed twice", () => {
    test("THEN viewport is filled with preceding rows each time and focused cell is visible", async ({
      mount,
      page,
    }) => {
      const rowsAtEnd = await mountAndPressEnd(mount, page);
      const rowsAfterPageUp = await pageUp(page, rowsAtEnd);
      await pageUp(page, rowsAfterPageUp);
    });
  });

  test.describe("WHEN End, PageUp then PageDown pressed", () => {
    test("THEN viewport shows the last rows again", async ({ mount, page }) => {
      const rowsAtEnd = await mountAndPressEnd(mount, page);
      const rowsAfterPageUp = await pageUp(page, rowsAtEnd);
      await page.keyboard.press("PageDown");
      await expect.poll(() => getVisibleRowIndices(page)).toEqual(rowsAtEnd);
      const table = new TableOM(page.getByRole("table"));
      await expect(table.locateCell(1_000_001, 1)).toBeFocused();
    });
  });
});
