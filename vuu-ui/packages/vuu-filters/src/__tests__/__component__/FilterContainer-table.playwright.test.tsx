import type { Page } from "@playwright/test";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

const STORY = "Filters/FilterContainer/FilterContainerWithTable";

const distinct = (values: string[]) => Array.from(new Set(values)).sort();

const filterField = (page: Page, columnName: string) =>
  page.getByTestId(`filter-${columnName}`);

/**
 * Mounts the story and waits for the table to load. Returns the table and
 * its unfiltered row count.
 */
const mountTable = async (
  mount: (story: string) => Promise<unknown>,
  page: Page,
) => {
  await mount(STORY);
  const table = new PwTable(page);
  await table.dataLoaded;
  return { table, totalRowCount: await table.rowCount() };
};

/**
 * Waits until the filter has been applied, i.e. the row count has dropped
 * below the unfiltered count and every rendered value in the column passes
 * the test.
 */
const assertFiltered = async (
  table: PwTable,
  totalRowCount: number,
  columnName: string,
  matches: (value: string) => boolean,
) => {
  await expect.poll(() => table.rowCount()).toBeLessThan(totalRowCount);
  await expect
    .poll(async () => {
      const values = await table.columnValues(columnName);
      return values.length > 0 && values.every(matches);
    })
    .toBe(true);
};

test.describe("FilterContainer applied to a Table", () => {
  test("columnValues returns the formatted values of rendered rows", async ({
    mount,
    page,
  }) => {
    const { table } = await mountTable(mount, page);
    const values = await table.columnValues("currency");
    expect(values.length).toBeGreaterThan(1);
    expect(values[0]).toEqual(
      await (await table.cell("currency", 2)).textContent(),
    );
  });

  for (const columnName of ["currency", "exchange"]) {
    test(`a string filter on ${columnName} shows only matching rows`, async ({
      mount,
      page,
    }) => {
      const { table, totalRowCount } = await mountTable(mount, page);
      expect(
        distinct(await table.columnValues(columnName)).length,
      ).toBeGreaterThan(1);

      const combobox = filterField(page, columnName).getByRole("combobox");
      await combobox.click();
      await page.getByRole("option").first().click();
      const filterValue = await combobox.inputValue();
      expect(filterValue).not.toBe("");

      await assertFiltered(
        table,
        totalRowCount,
        columnName,
        (value) => value === filterValue,
      );
    });
  }

  test("a toggle filter on a char column shows only matching rows", async ({
    mount,
    page,
  }) => {
    const { table, totalRowCount } = await mountTable(mount, page);
    expect(distinct(await table.columnValues("side"))).toEqual(["B", "S"]);

    await filterField(page, "side")
      .getByRole("radio", { name: "S", exact: true })
      .click();

    await assertFiltered(
      table,
      totalRowCount,
      "side",
      (value) => value === "S",
    );
  });

  test("a toggle filter on a boolean column shows only matching rows", async ({
    mount,
    page,
  }) => {
    const { table, totalRowCount } = await mountTable(mount, page);

    // Boolean columns render a checkbox, with no text content
    const ariaColIndex = await table.locator
      .getByRole("columnheader", { name: "supported column header" })
      .getAttribute("aria-colindex");
    const checkboxes = table.locator
      .locator(`[role="row"] > [role="cell"][aria-colindex="${ariaColIndex}"]`)
      .getByRole("checkbox");
    const checkedStates = () =>
      checkboxes.evaluateAll((elements) =>
        elements.map((element) => (element as HTMLInputElement).checked),
      );

    expect(distinct((await checkedStates()).map(String))).toEqual([
      "false",
      "true",
    ]);

    await filterField(page, "supported")
      .getByRole("radio", { name: "true", exact: true })
      .click();

    await expect.poll(() => table.rowCount()).toBeLessThan(totalRowCount);
    await expect
      .poll(async () => {
        const states = await checkedStates();
        return states.length > 0 && states.every(Boolean);
      })
      .toBe(true);
  });

  test("an equals filter on an int column shows only matching rows", async ({
    mount,
    page,
  }) => {
    const { table, totalRowCount } = await mountTable(mount, page);
    const initialValues = await table.columnValues("lotSize");
    expect(distinct(initialValues).length).toBeGreaterThan(1);

    const [filterValue] = initialValues;
    const input = filterField(page, "lotSize").getByRole("textbox");
    await input.fill(filterValue);
    await input.press("Enter");

    await assertFiltered(
      table,
      totalRowCount,
      "lotSize",
      (value) => value === filterValue,
    );
  });

  test("a greater than filter on a double column shows only matching rows", async ({
    mount,
    page,
  }) => {
    const { table, totalRowCount } = await mountTable(mount, page);
    const initialValues = await table.columnValues("price");
    expect(distinct(initialValues).length).toBeGreaterThan(1);

    const input = filterField(page, "price").getByRole("textbox");
    await input.fill("500");
    await input.press("Enter");

    await assertFiltered(
      table,
      totalRowCount,
      "price",
      (value) => Number(value.replace(/,/g, "")) > 500,
    );
  });
});
