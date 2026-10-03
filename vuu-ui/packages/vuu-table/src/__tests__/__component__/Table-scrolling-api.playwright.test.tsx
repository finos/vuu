import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

// Chromium at a device scale factor of 2 (e.g. a Retina display) and Firefox
// virtualise this table, WebKit does not.
test.use({
  launchOptions: async ({ browserName }, use) =>
    use(
      browserName === "chromium"
        ? { args: ["--force-device-scale-factor=2"] }
        : {},
    ),
});

const HEADER_COUNT = 1;
const ROW_COUNT = 1_000_000;

/**
 * Returns the aria-rowindex of each row whose top edge lies within the
 * table body (i.e below the header), in ascending order. Browsers round very
 * large scroll positions, so allow a row to be hidden by a pixel or two.
 */
const getVisibleRowIndices = (page: Page) =>
  page.evaluate(() => {
    const container = document.querySelector(
      ".vuuTable-contentContainer",
    ) as HTMLElement;
    const header = container.querySelector(".vuuTableHeader") as HTMLElement;
    const { top, height } = container.getBoundingClientRect();
    const bodyTop = top + header.offsetHeight;
    return Array.from(container.querySelectorAll(".vuuTableRow"))
      .filter((row) => {
        const rowTop = Math.round(row.getBoundingClientRect().top);
        return rowTop >= bodyTop - 2 && rowTop < top + height;
      })
      .map((row) => Number(row.getAttribute("aria-rowindex")))
      .sort((a, b) => a - b);
  });

const scrollToIndex = async (page: Page, rowIndex: number) => {
  await page.getByRole("textbox").fill(`${rowIndex}`);
  await page.getByRole("button", { name: "Scroll To Row at Index" }).click();
};

const toAriaRowIndex = (rowIndex: number) => rowIndex + HEADER_COUNT + 1;

test.describe("Table scrolling API, scrollToIndex", () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount("Table/BigData/TableScrollingAPI");
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });

  test.describe("WHEN row is outside viewport", () => {
    test("THEN row is scrolled to top of viewport", async ({ page }) => {
      for (const rowIndex of [500_000, 123_456, 10_000, 750_001]) {
        await scrollToIndex(page, rowIndex);
        await expect
          .poll(async () => (await getVisibleRowIndices(page))[0])
          .toBe(toAriaRowIndex(rowIndex));
      }
    });
  });

  test.describe("WHEN row is within last page", () => {
    test("THEN table is scrolled to end and row is visible", async ({
      page,
    }) => {
      await scrollToIndex(page, ROW_COUNT - 3);
      await expect
        .poll(async () => (await getVisibleRowIndices(page)).at(-1))
        .toBe(toAriaRowIndex(ROW_COUNT - 1));
      const rows = await getVisibleRowIndices(page);
      expect(rows).toContain(toAriaRowIndex(ROW_COUNT - 3));
    });
  });

  test.describe("WHEN scrolled to end, then to first row", () => {
    test("THEN table is scrolled to top", async ({ page }) => {
      await scrollToIndex(page, ROW_COUNT - 1);
      await expect
        .poll(async () => (await getVisibleRowIndices(page)).at(-1))
        .toBe(toAriaRowIndex(ROW_COUNT - 1));
      await scrollToIndex(page, 0);
      await expect
        .poll(async () => (await getVisibleRowIndices(page))[0])
        .toBe(toAriaRowIndex(0));
    });
  });

  test.describe("WHEN row is already within viewport", () => {
    test("THEN table does not scroll", async ({ page }) => {
      const rowsBefore = await getVisibleRowIndices(page);
      await scrollToIndex(page, 10);
      await page.waitForTimeout(100);
      expect(await getVisibleRowIndices(page)).toEqual(rowsBefore);
    });
  });
});
