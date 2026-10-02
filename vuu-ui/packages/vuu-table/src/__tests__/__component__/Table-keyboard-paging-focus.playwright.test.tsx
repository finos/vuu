import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { TableOM } from "@vuu-ui/vuu-playwright-helpers";

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

const FIRST_ROW = 2;
const LAST_ROW = 1_000_001;

const mountTable = async (
  mount: (story: string) => Promise<unknown>,
  page: Page,
) => {
  await mount("Table/BigData/SimpleTableMillionRows");
  return new TableOM(page.getByRole("table"));
};

/**
 * Number of rows paged by PageUp/PageDown, i.e. the number of rows
 * (including any partially visible row) that fit in the table body.
 */
const getPageSize = (page: Page) =>
  page.evaluate(() => {
    const container = document.querySelector(
      ".vuuTable-contentContainer",
    ) as HTMLElement;
    const header = container.querySelector(".vuuTableHeader") as HTMLElement;
    const row = container.querySelector(".vuuTableRow") as HTMLElement;
    return Math.ceil(
      (container.clientHeight - header.offsetHeight) / row.offsetHeight,
    );
  });

test.describe("Table keyboard paging, focus", () => {
  test.describe("WHEN PageDown pressed on a row less than a page from the end", () => {
    test("THEN last row is focused", async ({ mount, page }) => {
      const table = await mountTable(mount, page);
      await table.locateCell(FIRST_ROW, 1).click();
      await page.keyboard.press("End");
      await expect(table.locateCell(LAST_ROW, 1)).toBeFocused();
      const cell = table.locateCell(LAST_ROW - 3, 1);
      await cell.click();
      await expect(cell).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect(table.locateCell(LAST_ROW, 1)).toBeFocused();
    });
  });

  test.describe("WHEN PageUp pressed on a row less than a page from the start", () => {
    test("THEN first row is focused", async ({ mount, page }) => {
      const table = await mountTable(mount, page);
      const cell = table.locateCell(FIRST_ROW + 3, 1);
      await cell.click();
      await expect(cell).toBeFocused();
      await page.keyboard.press("PageUp");
      await expect(table.locateCell(FIRST_ROW, 1)).toBeFocused();
    });
  });

  test.describe("WHEN rendering is slow", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "CPU throttling requires Chrome DevTools Protocol",
    );

    test("THEN End, PageUp and PageDown focus the correct cell", async ({
      mount,
      page,
    }) => {
      const table = await mountTable(mount, page);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 20 });

      await table.locateCell(FIRST_ROW, 1).click();
      await page.keyboard.press("End");
      await expect(table.locateCell(LAST_ROW, 1)).toBeFocused();

      const pageSize = await getPageSize(page);
      await page.keyboard.press("PageUp");
      await expect(table.locateCell(LAST_ROW - pageSize, 1)).toBeFocused();
      await page.keyboard.press("PageUp");
      await expect(table.locateCell(LAST_ROW - 2 * pageSize, 1)).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect(table.locateCell(LAST_ROW - pageSize, 1)).toBeFocused();

      await page.keyboard.press("Home");
      await expect(table.locateCell(FIRST_ROW, 1)).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect(table.locateCell(FIRST_ROW + pageSize, 1)).toBeFocused();
    });
  });
});
