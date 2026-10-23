import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";

const EXAMPLE =
  "Filters/TableWithFilterPanel/InstrumentsExtendedWithFilterPanel";

/** The text of every rendered cell in a Table column */
const columnValues = async (page: Page, columnName: string) => {
  const table = new PwTable(page);
  const colIndex = await table.locator
    .locator(`[data-column-name="${columnName}"]`)
    .first()
    .getAttribute("aria-colindex");
  return table.locator
    .locator(
      `[aria-rowindex]:not([aria-rowindex="1"]) > [aria-colindex="${colIndex}"]`,
    )
    .allTextContents();
};

const distinctValues = async (page: Page, columnName: string) => [
  ...new Set(await columnValues(page, columnName)),
];

const rowCount = async (page: Page) => {
  const stats = page.locator(".vuuDatasourceStats-rowStats");
  await expect(stats).toContainText("of");
  const text = (await stats.textContent()) ?? "";
  return parseInt(text.split("of")[1].replace(/[^\d]/g, ""), 10);
};

const cellText = async (
  page: Page,
  columnName: string,
  ariaRowIndex: number,
) => {
  const cell = await new PwTable(page).cell(columnName, ariaRowIndex);
  await expect(cell).not.toBeEmpty();
  return (await cell.textContent()) as string;
};

const rightClickCell = async (
  page: Page,
  columnName: string,
  ariaRowIndex: number,
) => {
  const cell = await new PwTable(page).cell(columnName, ariaRowIndex);
  await cell.click({ button: "right" });
};

const withoutGrouping = (value: string) => value.replace(/,/g, "");

test.describe("Table with FilterPanel and filter context menu", () => {
  test.describe("WHEN a filter is set from a scaled decimal cell", () => {
    test("THEN every row displaying the cell value is matched", async ({
      mount,
      page,
    }) => {
      await mount(EXAMPLE);
      const fxRate = await cellText(page, "fxRate", 10);

      await rightClickCell(page, "fxRate", 10);
      await page
        .getByRole("menuitem", { name: `Set filter FX rate '${fxRate}'` })
        .click();

      await expect(page.getByTestId("vuu-filter-query")).toContainText(
        "fxRate >= ",
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
      // the displayed value is shared by many underlying values
      expect(await rowCount(page)).toBeGreaterThan(1);
      await expect.poll(() => distinctValues(page, "fxRate")).toEqual([fxRate]);

      // the FilterPanel shows the filter value
      await expect(page.getByRole("textbox", { name: "FX rate" })).toHaveValue(
        withoutGrouping(fxRate),
      );
    });

    test("THEN a negative value with digit grouping is matched", async ({
      mount,
      page,
    }) => {
      await mount(EXAMPLE);
      // the second row holds edge case values, fxRate -1234.5
      const fxRate = await cellText(page, "fxRate", 3);
      expect(fxRate).toBe("-1,234.50");

      await rightClickCell(page, "fxRate", 3);
      await page
        .getByRole("menuitem", { name: "Set filter FX rate '-1,234.50'" })
        .click();

      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= -1234.504999 and fxRate <= -1234.495000",
      );
      await expect
        .poll(() => distinctValues(page, "fxRate"))
        .toEqual(["-1,234.50"]);
    });

    test("THEN a second cell value can be added to the filter", async ({
      mount,
      page,
    }) => {
      await mount(EXAMPLE);
      const fxRate = await cellText(page, "fxRate", 10);
      await rightClickCell(page, "fxRate", 10);
      await page
        .getByRole("menuitem", { name: `Set filter FX rate '${fxRate}'` })
        .click();
      await expect.poll(() => distinctValues(page, "fxRate")).toEqual([fxRate]);
      const fxRateCount = await rowCount(page);

      const weight = await cellText(page, "weight", 2);
      await rightClickCell(page, "weight", 2);
      await page
        .getByRole("menuitem", {
          name: `Add Weight '${weight}' to existing filter`,
        })
        .click();

      await expect(page.getByTestId("vuu-filter-query")).toContainText(
        "weight >= ",
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(fxRateCount);
      expect(await distinctValues(page, "fxRate")).toEqual([fxRate]);
      expect(await distinctValues(page, "weight")).toEqual([weight]);
      await expect(page.getByRole("textbox", { name: "Weight" })).toHaveValue(
        weight,
      );
    });
  });

  test.describe("WHEN a value, as displayed, is entered in the FilterPanel", () => {
    test("THEN every row displaying that value is matched", async ({
      mount,
      page,
    }) => {
      await mount(EXAMPLE);
      // closePrice is a scaleddecimal4, displayed with 2 decimals
      const closePrice = await cellText(page, "closePrice", 12);

      const input = page.getByRole("textbox", { name: "Close price" });
      await input.fill(withoutGrouping(closePrice));
      await input.press("Enter");

      await expect(page.getByTestId("vuu-filter-query")).toContainText(
        "closePrice >= ",
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
      expect(await distinctValues(page, "closePrice")).toEqual([closePrice]);
    });
  });

  test.describe("WHEN scaled decimal values are truncated for display", () => {
    test("THEN a filter set from a cell matches every row displaying the value", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/TableWithFilterPanel/InstrumentsExtendedWithFilterPanelTruncated",
      );
      const fxRate = await cellText(page, "fxRate", 10);

      await rightClickCell(page, "fxRate", 10);
      await page
        .getByRole("menuitem", { name: `Set filter FX rate '${fxRate}'` })
        .click();

      // truncation: [value, value + 0.01)
      await expect(page.getByTestId("vuu-filter-query")).toContainText(
        `fxRate >= ${fxRate}0000 and fxRate <= `,
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
      await expect.poll(() => distinctValues(page, "fxRate")).toEqual([fxRate]);
    });
  });
});
