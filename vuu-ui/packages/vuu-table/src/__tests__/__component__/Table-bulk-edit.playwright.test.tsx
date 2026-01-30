import { test } from "@playwright/experimental-ct-react";
import { BulkEditPanelFixture } from "../../../../../showcase/src/examples/Table/BulkEdit.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";

const IS_EDITABLE = true;
const NOT_EDITING = false;

test.describe("Table Bulk Edit Panel", () => {
  test("smoke test", async ({ mount, page }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );

    const table = new TableOM(page.getByRole("table"));
    await table.assertRenderedRows({ from: 0, to: 9 }, 0, 9, 2);
    await table.assertCellIsEditable(3, 1, IS_EDITABLE, "AAOO L");
    await table.assertCellIsEditable(3, 2, IS_EDITABLE); // currency value changes between runs
    await table.assertCellIsEditable(11, 1, IS_EDITABLE, "AAOY L");
  });

  test("clicking a cell applies focus to input (textbox), but does not engage edit mode", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));

    // get the first data cell
    let cell = table.locateCell(3, 1);
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");

    cell = table.locateCell(3, 2);
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");

    cell = table.locateCell(5, 7);
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
  });

  test("clicking a cell, then using arrow keys applies cell navigation ", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));

    // get the first data cell
    let cell1 = table.locateCell(3, 1);
    let cell2 = table.locateCell(4, 1);
    let cell3 = table.locateCell(4, 2);

    await cell1.click();
    await table.assertCellIsFocused(cell1, "textbox");

    await cell1.press("ArrowDown");
    await table.assertCellIsFocused(cell2);

    await cell2.press("ArrowRight");
    await table.assertCellIsFocused(cell3);
  });

  test("clicking a cell applies focus, then using Enter key engages edit mode", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));

    // get the currency  cell
    let cell = table.locateCell(3, 2);

    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
  });

  test("clicking Escape in a cell in edit mode, before actual editing, exits edit mode, tetxbox retains focus", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));

    // get the currency  cell
    let cell = table.locateCell(3, 2);

    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await cell.press("Escape");
    await table.assertCellIsEditing(cell, NOT_EDITING);
    await table.assertCellIsFocused(cell, "textbox");
  });

  test("clicking Arrow keys in a cell in edit mode, moves cursor within textbox", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <BulkEditPanelFixture />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));

    // get the currency  cell
    let cell = table.locateCell(3, 2);

    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await cell.press("ArrowDown");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    const textbox = cell.getByRole("textbox");
    await expect(textbox).toHaveSelection(3, 3);

    await cell.press("ArrowUp");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await expect(textbox).toHaveSelection(0, 0);

    await cell.press("ArrowRight");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await expect(textbox).toHaveSelection(1, 1);

    await cell.press("ArrowLeft");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await expect(textbox).toHaveSelection(0, 0);
  });
});
