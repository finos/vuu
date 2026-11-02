import type { Page } from "@playwright/test";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

/**
 * tradeId is a long column, its values are larger than the int range. A long
 * filter value is held as a string, the local data holds numbers.
 */

const commitValue = async (page: Page, label: string, value: string) => {
  const input = page.getByRole("textbox", { name: label });
  await input.fill(value);
  await input.press("Enter");
};

const selectOperator = async (page: Page, label: string, op: string) => {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: op, exact: true }).click();
};

/** The number of rows in the DataSource, from DataSourceStats */
const rowCount = async (page: Page) => {
  const stats = page.locator(".vuuDatasourceStats-rowStats");
  const text = (await stats.textContent()) ?? "";
  return text.includes("of")
    ? parseInt(text.split("of")[1].replace(/[^\d]/g, ""), 10)
    : 0;
};

const tradeIdCell = (page: Page, ariaRowIndex: number) =>
  new PwTable(page).cell("tradeId", ariaRowIndex);

test.describe("FilterContainer, a filter on a long column", () => {
  test("'=' matches the row with that value", async ({ mount, page }) => {
    await mount("Filters/FilterContainer/AllColumnTypes");
    const tradeId = (await (await tradeIdCell(page, 5)).textContent()) ?? "";
    expect(tradeId).toMatch(/^4\d{12}$/);

    await commitValue(page, "Trade id", tradeId);
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      `tradeId = ${tradeId}`,
    );
    await expect.poll(() => rowCount(page)).toBe(1);
    await expect(await tradeIdCell(page, 2)).toHaveText(tradeId);
  });

  test("operators partition the rows", async ({ mount, page }) => {
    await mount("Filters/FilterContainer/AllColumnTypesWithOperators");
    await expect.poll(() => rowCount(page)).toBe(10_000);
    // tradeIds ascend, so the value in row n has n - 1 smaller values
    const tradeId = (await (await tradeIdCell(page, 11)).textContent()) ?? "";

    const expectedCounts: Record<string, number> = {
      "!=": 9_999,
      ">": 9_990,
      ">=": 9_991,
      "<": 9,
      "<=": 10,
    };
    for (const [op, count] of Object.entries(expectedCounts)) {
      await selectOperator(page, "Trade id", op);
      await commitValue(page, "Trade id", tradeId);
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        `tradeId ${op} ${tradeId}`,
      );
      await expect.poll(() => rowCount(page)).toBe(count);
    }
  });

  test("a filter set from the context menu matches the cell row", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/AllColumnTypes");
    const cell = await tradeIdCell(page, 5);
    const tradeId = (await cell.textContent()) ?? "";

    await cell.click({ button: "right" });
    await page
      .getByRole("menuitem", { name: `Set filter Trade id '${tradeId}'` })
      .click();
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      `tradeId = ${tradeId}`,
    );
    await expect(page.getByRole("textbox", { name: "Trade id" })).toHaveValue(
      tradeId,
    );
    await expect.poll(() => rowCount(page)).toBe(1);

    await (await tradeIdCell(page, 2)).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Clear filter" }).click();
    await expect(page.getByTestId("vuu-filter-query")).toHaveText("");
    await expect.poll(() => rowCount(page)).toBe(10_000);
  });
});
