import type { Page } from "@playwright/test";
import {
  type PwColumnPicker,
  PwTable,
  PwTableFooter,
} from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../../playwright/fixtures.cjs";

const STORY = "TableExtras/ColumnPicker/TableWithColumnPicker";

const INITIAL_COLUMNS = ["bbg", "currency", "description", "exchange"];

/**
 * Mounts the story, waits for data, then opens the ColumnPicker from the
 * table footer.
 */
const openColumnPicker = async (
  mount: (story: string) => Promise<unknown>,
  page: Page,
): Promise<{ picker: PwColumnPicker; table: PwTable }> => {
  await mount(STORY);
  const table = new PwTable(page);
  await table.dataLoaded;
  await table.assertColumns(INITIAL_COLUMNS);
  const picker = await new PwTableFooter(page).showColumnPicker();
  return { picker, table };
};

test.describe("Table with ColumnPicker", () => {
  test("the footer action opens the ColumnPicker, showing the columns in view", async ({
    mount,
    page,
  }) => {
    const { picker } = await openColumnPicker(mount, page);
    await picker.assertSelectedColumns(INITIAL_COLUMNS);
    await picker.assertAvailableColumns(["isin", "lotSize", "ric"]);
  });

  test("columns added in the ColumnPicker are added to the Table", async ({
    mount,
    page,
  }) => {
    const { picker, table } = await openColumnPicker(mount, page);

    await picker.addColumn("lotSize");
    await table.assertColumns([...INITIAL_COLUMNS, "lotSize"]);

    await picker.addColumn("ric");
    await picker.addColumn("isin");

    const expectedColumns = [...INITIAL_COLUMNS, "lotSize", "ric", "isin"];
    await table.assertColumns(expectedColumns);
    await picker.assertSelectedColumns(expectedColumns);
    expect(await picker.availableColumns()).not.toContain("lotSize");

    // new columns are populated
    await expect
      .poll(async () => (await table.columnValues("lotSize")).some(Boolean))
      .toBe(true);
  });

  test("columns removed in the ColumnPicker are removed from the Table", async ({
    mount,
    page,
  }) => {
    const { picker, table } = await openColumnPicker(mount, page);

    await picker.removeColumn("currency");
    await table.assertColumns(["bbg", "description", "exchange"]);

    await picker.removeColumn("description");
    await table.assertColumns(["bbg", "exchange"]);
    await picker.assertSelectedColumns(["bbg", "exchange"]);
    await picker.assertAvailableColumns(["currency", "description"]);
  });

  test("columns removed with the column menu are removed from the Table and the ColumnPicker", async ({
    mount,
    page,
  }) => {
    const { picker, table } = await openColumnPicker(mount, page);

    let menu = await table.headerCell("exchange").showColumnMenu();
    await menu.menuItem("Remove exchange column").click();
    await table.assertColumns(["bbg", "currency", "description"]);
    await picker.assertSelectedColumns(["bbg", "currency", "description"]);

    menu = await table.headerCell("bbg").showColumnMenu();
    await menu.menuItem("Remove bbg column").click();
    await table.assertColumns(["currency", "description"]);
    await picker.assertSelectedColumns(["currency", "description"]);
    await picker.assertAvailableColumns(["bbg", "exchange"]);
  });

  test("columns can be added in the ColumnPicker and removed with both the ColumnPicker and the column menu", async ({
    mount,
    page,
  }) => {
    const { picker, table } = await openColumnPicker(mount, page);

    await picker.addColumn("lotSize");
    await picker.addColumn("ric");
    await table.assertColumns([...INITIAL_COLUMNS, "lotSize", "ric"]);

    await picker.removeColumn("description");
    await table.assertColumns([
      "bbg",
      "currency",
      "exchange",
      "lotSize",
      "ric",
    ]);

    const menu = await table.headerCell("lotSize").showColumnMenu();
    await menu.menuItem("Remove lotSize column").click();

    const expectedColumns = ["bbg", "currency", "exchange", "ric"];
    await table.assertColumns(expectedColumns);
    await picker.assertSelectedColumns(expectedColumns);
    await picker.assertAvailableColumns(["description", "lotSize"]);
  });
});
