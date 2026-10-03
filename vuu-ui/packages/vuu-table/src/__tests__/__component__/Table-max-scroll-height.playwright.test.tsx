import { expect, test } from "../../../../../playwright/fixtures";
import { TableOM } from "@vuu-ui/vuu-playwright-helpers";

const ONE_MILLION = 1_000_000;

// aria-rowindex is 1-based and header occupies first row
const LAST_ROW_ARIA_INDEX = ONE_MILLION + 1;

const pressEndAndAssertLastRowRendered = async (
  mount: (story: string) => Promise<unknown>,
  page: import("@playwright/test").Page,
) => {
  await mount("Table/BigData/SimpleTableMillionRows");
  const table = new TableOM(page.getByRole("table"));

  const cell = table.locateCell(2, 1);
  await cell.click();
  await expect(cell).toBeFocused();
  await cell.press("End");

  await expect(table.locateCell(LAST_ROW_ARIA_INDEX, 1)).toBeVisible();
};

test.describe("Table with more rows than browser can scroll through natively", () => {
  test.describe("WHEN End key pressed", () => {
    test("THEN last row is rendered and visible", async ({ mount, page }) => {
      await pressEndAndAssertLastRowRendered(mount, page);
    });
  });
});
