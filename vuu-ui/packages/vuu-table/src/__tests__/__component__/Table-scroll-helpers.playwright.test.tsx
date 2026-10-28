import type { Page } from "@playwright/test";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

// 1000 rows of 20px, viewport shows 30 rows (600px)
const TEST_TABLE = "Table/Misc/TestTable";
const ROW_COUNT = 1000;
const BUFFER_SIZE = 5;
const VIEWPORT_HEIGHT = 600;

// 200 columns of 150px, viewport shows 6 columns (900px)
const TWO_HUNDRED_COLUMNS = "Table/TEST/TwoHundredColumns";

const mountTable = async (
  mount: (story: string) => Promise<unknown>,
  page: Page,
  story: string,
) => {
  await mount(story);
  const table = new PwTable(page);
  await expect(table.locateCell(2, 1)).toBeVisible();
  return table;
};

test.describe("PwTable scroll helpers", () => {
  test.describe("vertical scrolling", () => {
    test("scrollDown by pixels scrolls by that distance", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await table.scrollDown(200);
      expect(await table.scrollPosition()).toEqual({
        scrollLeft: 0,
        scrollTop: 200,
      });
      await table.assertRenderedRows(
        { from: 10, to: 40 },
        BUFFER_SIZE,
        ROW_COUNT,
      );
    });

    test("scrollUp by pixels scrolls back by that distance", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await table.scrollDown(300);
      await table.scrollUp(100);
      expect((await table.scrollPosition()).scrollTop).toBe(200);
      await table.assertRenderedRows(
        { from: 10, to: 40 },
        BUFFER_SIZE,
        ROW_COUNT,
      );
    });

    test("scrollUp beyond the top stops at the top", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await table.scrollDown(100);
      await table.scrollUp(500);
      expect((await table.scrollPosition()).scrollTop).toBe(0);
      await table.assertRenderedRows(
        { from: 0, to: 30 },
        BUFFER_SIZE,
        ROW_COUNT,
      );
    });

    test("scrollDown and scrollUp by 'page' scroll by the viewport height", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await table.scrollDown("page");
      expect((await table.scrollPosition()).scrollTop).toBe(VIEWPORT_HEIGHT);
      await table.assertRenderedRows(
        { from: 30, to: 60 },
        BUFFER_SIZE,
        ROW_COUNT,
      );

      await table.scrollDown("page");
      await table.assertRenderedRows(
        { from: 60, to: 90 },
        BUFFER_SIZE,
        ROW_COUNT,
      );

      await table.scrollUp("page");
      expect((await table.scrollPosition()).scrollTop).toBe(VIEWPORT_HEIGHT);
      await table.assertRenderedRows(
        { from: 30, to: 60 },
        BUFFER_SIZE,
        ROW_COUNT,
      );
    });

    test("scrollDown('end') shows the last row, scrollUp('start') the first", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await table.scrollDown("end");
      await expect(table.row(ROW_COUNT + 1)).toBeInViewport();
      await expect(table.row(2)).not.toBeAttached();

      await table.scrollUp("start");
      expect((await table.scrollPosition()).scrollTop).toBe(0);
      await table.assertRenderedRows(
        { from: 0, to: 30 },
        BUFFER_SIZE,
        ROW_COUNT,
      );
    });

    test("scrollDown('end') reaches the last row of a million rows", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(
        mount,
        page,
        "Table/BigData/SimpleTableMillionRows",
      );
      await table.scrollDown("end");
      await expect(table.locateCell(1_000_001, 1)).toBeVisible();
    });

    test("a negative distance is rejected", async ({ mount, page }) => {
      const table = await mountTable(mount, page, TEST_TABLE);
      await expect(table.scrollDown(-100)).rejects.toThrow(
        /must not be negative/,
      );
    });
  });

  test.describe("horizontal scrolling", () => {
    test("scrollRight by pixels scrolls by that distance", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TWO_HUNDRED_COLUMNS);
      await table.scrollRight(900);
      expect(await table.scrollPosition()).toEqual({
        scrollLeft: 900,
        scrollTop: 0,
      });
      await table.assertRenderedColumns({
        rendered: { from: 6, to: 14 },
        visible: { from: 7, to: 12 },
      });
    });

    test("scrollLeft by pixels scrolls back by that distance", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TWO_HUNDRED_COLUMNS);
      await table.scrollRight(1800);
      await table.scrollLeft(900);
      expect((await table.scrollPosition()).scrollLeft).toBe(900);
      await table.assertRenderedColumns({
        rendered: { from: 6, to: 14 },
        visible: { from: 7, to: 12 },
      });
    });

    test("scrollRight('end') shows the last column, scrollLeft('start') the first", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page, TWO_HUNDRED_COLUMNS);
      await table.scrollRight("end");
      await expect(table.locateCell(2, 200)).toBeInViewport();
      await expect(table.locateCell(2, 1)).not.toBeAttached();

      await table.scrollLeft("start");
      expect((await table.scrollPosition()).scrollLeft).toBe(0);
      await table.assertRenderedColumns({
        rendered: { from: 1, to: 8 },
        visible: { from: 1, to: 6 },
      });
    });
  });
});
