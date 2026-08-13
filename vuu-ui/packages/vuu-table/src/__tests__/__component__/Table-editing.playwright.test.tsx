import { test } from "@playwright/experimental-ct-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  CreateSessionTableInstruments,
  EditableInstruments,
  EditableInstrumentsInlineEdit,
  EditableInstrumentsWithInlineAddRow,
  TestTableEmpty,
  TestTableFIveRows,
  TwoEditableInstruments,
} from "../../../../../showcase/src/examples/Table/Editing.examples";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";

const IS_EDITABLE = true;
const NOT_EDITABLE = false;
const NOT_EDITING = false;

test.describe("Inline add row", () => {
  test("renders insert-editable cells and blanks update-only columns", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstrumentsWithInlineAddRow />
      </LocalDataSourceProvider>,
    );
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    await expect(
      inlineAddRow.getByRole("textbox", { name: "bbg" }),
    ).toBeVisible();
    await expect(
      inlineAddRow.getByRole("textbox", { name: "isin" }),
    ).toBeVisible();
    await expect(
      inlineAddRow.getByRole("textbox", { name: "vuuMsg" }),
    ).toHaveCount(0);
  });

  test("marks omitted cells as invalid when the final cell is committed", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstrumentsWithInlineAddRow />
      </LocalDataSourceProvider>,
    );
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const finalCell = inlineAddRow.getByRole("textbox", { name: "ric" });
    await finalCell.fill("new instrument");
    await finalCell.press("Enter");

    await expect(
      inlineAddRow.getByRole("textbox", { name: "bbg" }),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(finalCell).toHaveValue("new instrument");
  });

  test("moves to the next cell after a non-final commit", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstrumentsWithInlineAddRow />
      </LocalDataSourceProvider>,
    );
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const bbg = inlineAddRow.getByRole("textbox", { name: "bbg" });
    const currency = inlineAddRow.getByRole("combobox").first();
    await bbg.fill("new-bbg");
    await bbg.press("Enter");

    await expect(currency).toBeFocused();
  });

  test("returns focus to the first editable cell after the final successful commit", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstrumentsWithInlineAddRow />
      </LocalDataSourceProvider>,
    );
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const bbg = inlineAddRow.getByRole("textbox", { name: "bbg" });
    const ric = inlineAddRow.getByRole("textbox", { name: "ric" });
    await ric.dispatchEvent("vuu-commit");

    await expect(bbg).toBeFocused();
  });
});

test.describe("Test table editing", () => {
  test("inserts a row with an unchecked boolean without validation warnings", async ({
    mount,
    page,
  }) => {
    await mount(<TestTableEmpty />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const id = inlineAddRow.getByRole("textbox", { name: "id", exact: true });
    const description = inlineAddRow.getByRole("textbox", {
      name: "description",
    });
    const quantity = inlineAddRow.getByRole("textbox", { name: "quantity" });
    const price = inlineAddRow.getByRole("textbox", { name: "price" });
    const externalId = inlineAddRow.getByRole("textbox", {
      name: "externalId",
    });

    await id.fill("TEST-006");
    await id.press("Enter");
    await description.fill("Foxtrot");
    await description.press("Enter");
    await quantity.fill("72");
    await quantity.press("Enter");
    await price.fill("607.5");
    await price.press("Enter");
    await externalId.fill("1006");
    await externalId.press("Enter");

    await expect(id).toBeFocused();
    await expect(id).toHaveValue("");
    await expect(inlineAddRow.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(inlineAddRow.getByRole("checkbox")).not.toBeChecked();
    await expect(
      page.getByRole("textbox", { name: "id", exact: true }).nth(1),
    ).toHaveValue("TEST-006");
  });

  test("marks only omitted cells as invalid when the final cell is committed", async ({
    mount,
    page,
  }) => {
    await mount(<TestTableEmpty />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const id = inlineAddRow.getByRole("textbox", { name: "id", exact: true });
    const description = inlineAddRow.getByRole("textbox", {
      name: "description",
    });
    const quantity = inlineAddRow.getByRole("textbox", { name: "quantity" });
    const price = inlineAddRow.getByRole("textbox", { name: "price" });
    const externalId = inlineAddRow.getByRole("textbox", {
      name: "externalId",
    });

    await description.fill("Foxtrot");
    await description.press("Enter");
    await quantity.fill("72");
    await quantity.press("Enter");
    await price.fill("607.5");
    await price.press("Enter");
    await externalId.fill("1006");
    await externalId.press("Enter");

    await expect(id).toHaveAttribute("aria-invalid", "true");
    await expect(externalId).not.toHaveAttribute("aria-invalid", "true");
    await expect(externalId.locator("..")).not.toContainClass(
      "vuuTableInputCell-error",
    );
    await expect(id).toBeFocused();
  });

  test("inserts after a previously omitted value is committed", async ({
    mount,
    page,
  }) => {
    await mount(<TestTableEmpty />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const id = inlineAddRow.getByRole("textbox", { name: "id", exact: true });
    const description = inlineAddRow.getByRole("textbox", {
      name: "description",
    });
    const quantity = inlineAddRow.getByRole("textbox", { name: "quantity" });
    const price = inlineAddRow.getByRole("textbox", { name: "price" });
    const externalId = inlineAddRow.getByRole("textbox", {
      name: "externalId",
    });

    await description.fill("Foxtrot");
    await description.press("Enter");
    await quantity.fill("72");
    await quantity.press("Enter");
    await price.fill("607.5");
    await price.press("Enter");
    await externalId.fill("1006");
    await externalId.press("Enter");
    await expect(id).toBeFocused();

    await id.fill("TEST-006");
    await id.press("Enter");

    await expect(id).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "id", exact: true }).nth(1),
    ).toHaveValue("TEST-006");
  });

  test("moves to the next invalid cell when repairing incomplete rows", async ({
    mount,
    page,
  }) => {
    await mount(<TestTableEmpty />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const id = inlineAddRow.getByRole("textbox", { name: "id", exact: true });
    const description = inlineAddRow.getByRole("textbox", {
      name: "description",
    });
    const quantity = inlineAddRow.getByRole("textbox", { name: "quantity" });
    const price = inlineAddRow.getByRole("textbox", { name: "price" });
    const externalId = inlineAddRow.getByRole("textbox", {
      name: "externalId",
    });

    await description.fill("Foxtrot");
    await description.press("Enter");
    await price.fill("607.5");
    await price.press("Enter");
    await externalId.fill("1006");
    await externalId.press("Enter");
    await expect(id).toBeFocused();
    await expect(quantity).toHaveAttribute("aria-invalid", "true");

    await id.fill("TEST-006");
    await id.press("Enter");

    await expect(quantity).toBeFocused();
  });

  test("rejects alphabetic input in an existing numeric cell", async ({
    mount,
    page,
  }) => {
    await mount(<TestTableFIveRows />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
    await expect(quantity).toHaveValue("12");
    await quantity.dblclick();
    await quantity.pressSequentially("invalid");
    await quantity.press("Enter");

    await expect(quantity.locator("..")).toContainClass(
      "vuuTableInputCell-error",
    );
  });

  test("updates and deletes existing rows", async ({ mount, page }) => {
    await mount(<TestTableFIveRows />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const descriptionCell = page
      .getByRole("textbox", { name: "description" })
      .nth(1);
    await expect(descriptionCell).toHaveValue("Alpha");
    await descriptionCell.dblclick();
    await descriptionCell.pressSequentially("Updated");
    await descriptionCell.press("Enter");
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();

    await page
      .getByRole("checkbox", { name: "Press space to select row" })
      .first()
      .click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  });
});

test.describe("Editable table navigation", () => {
  test("smoke test", async ({ mount, page }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table1 = new TableOM(page.getByTestId("table-1"));
    const editButton = page.getByRole("radio", { name: "Edit" });

    await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
    await table1.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");

    await editButton.click();
    await table1.assertCellIsEditable(2, 1, IS_EDITABLE, "AAOO L");
  });

  test("clicking a cell, then using arrow keys applies cell navigation ", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the first data cell
    const cell1 = table.locateCell(2, 1);
    const cell2 = table.locateCell(3, 1);
    const cell3 = table.locateCell(3, 2);
    await cell1.click();
    await table.assertCellIsFocused(cell1, "textbox");
    await cell1.press("ArrowDown");
    await table.assertCellIsFocused(cell2);
    await cell2.press("ArrowRight");
    await table.assertCellIsFocused(cell3, "combobox");
  });

  test("In edit mode, with cell navigation disabled, arrow key navigation traverses editable cells only", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    const cell4 = table.locateCell(2, 4);
    const cell5 = table.locateCell(2, 5);
    const cell6 = table.locateCell(2, 6);
    const cell7 = table.locateCell(2, 7);

    // focus is in not editable, followed by 2 editable cells
    await cell5.click();
    await table.assertCellIsFocused(cell5);
    await cell5.press("ArrowRight");

    await table.assertCellIsFocused(cell6);
    await cell6.press("ArrowRight");

    await table.assertCellIsFocused(cell7);
    // attempts to navigate further right do nothing
    await cell7.press("ArrowRight");
    await table.assertCellIsFocused(cell7);

    await cell7.press("ArrowLeft");
    await table.assertCellIsFocused(cell6);

    // slip the non editable cell, isin
    await cell6.press("ArrowLeft");
    await table.assertCellIsFocused(cell4);
  });

  test("clicking a cell applies focus, then using Enter key engages edit mode", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the description  cell
    const cell = table.locateCell(3, 3);
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
  });

  test("clicking a dropdown cell applies focus and shows dropdown, current value is focused, Enter again closes", async ({
    browserName,
    mount,
    page,
  }) => {
    // The very last assetion doesn't work in Safari - the transfer of focus on 'vuu-commit'
    test.skip(browserName === "webkit");

    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the currency cell
    const cell = table.locateCell(3, 2);
    const nextCell = table.locateCell(4, 2);
    const originalValue =
      (await cell.getByRole("combobox").textContent()) ?? "";
    await cell.click();

    await table.assertCellIsFocused(cell, "combobox");
    await expect(page.getByRole("listbox")).toBeVisible();
    await cell.press("Enter");
    await expect(page.getByRole("listbox")).not.toBeVisible();
    await table.assertCellContent(cell, originalValue, "combobox");

    await table.assertCellIsFocused(nextCell, "combobox");
  });

  test("clicking Escape in a cell in edit mode, before actual editing, exits edit mode, textbox retains focus", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the description  cell
    const cell = table.locateCell(3, 3);
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
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the description  cell
    const cell = table.locateCell(3, 3);
    await cell.click();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    await cell.press("ArrowDown");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);
    const textbox = cell.getByRole("textbox");
    await expect(textbox).toHaveSelection(18, 18);
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

test.describe("Cell editing", () => {
  test("double clicking a cell applies focus and selection, edit to overwrite, Escape reverts", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the lotsize  cell
    const cell = table.locateCell(3, 6);
    const originalValue = await cell.getByRole("textbox").inputValue();
    await cell.dblclick();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.pressSequentially("123");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);

    await table.assertCellValue(cell, "123", "textbox");

    await cell.press("Escape");
    await table.assertCellIsEditing(cell, NOT_EDITING);

    await table.assertCellValue(cell, originalValue, "textbox");
  });

  test("double clicking a cell applies focus and selection, edit to overwrite, Enter commits", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the lotsize  cell
    const cell = table.locateCell(3, 6);
    const nextCell = table.locateCell(4, 6);
    await cell.dblclick();
    await table.assertCellIsFocused(cell, "textbox");
    await cell.pressSequentially("123");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);

    await table.assertCellValue(cell, "123", "textbox");

    await cell.press("Enter");
    await table.assertCellIsEditing(cell, NOT_EDITING);
    await table.assertCellValue(cell, "123", "textbox");
    await table.assertCellIsFocused(nextCell);
  });

  test("navigate to a cell, Enter to enter edit mode, Enter again without editing exits", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the first  cell
    const preceedingCell = table.locateCell(2, 1);
    const cell = table.locateCell(3, 1);
    const nextCell = table.locateCell(4, 1);
    await preceedingCell.click();
    await table.assertCellIsFocused(preceedingCell, "textbox");

    await preceedingCell.press("ArrowDown");
    await table.assertCellIsFocused(cell);

    await cell.press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);

    await cell.getByRole("textbox").press("Enter");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell, NOT_EDITING);

    await cell.press("ArrowDown");
    await table.assertCellIsFocused(nextCell);
    await table.assertCellIsEditing(nextCell, NOT_EDITING);
  });

  test("navigate to a cell, type text to enter edit mode and apply edits, Escape exits, reverting edits", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <EditableInstruments />
      </LocalDataSourceProvider>,
    );
    const table = new TableOM(page.getByRole("table"));
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // get the first  cell
    const preceedingCell = table.locateCell(2, 1);
    const cell = table.locateCell(3, 1);
    const nextCell = table.locateCell(4, 1);
    await preceedingCell.click();
    await table.assertCellIsFocused(preceedingCell, "textbox");

    await preceedingCell.press("ArrowDown");
    await table.assertCellIsFocused(cell);

    const originalValue = await cell.getByRole("textbox").inputValue();
    await cell.pressSequentially("123");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell);

    await cell.getByRole("textbox").press("Escape");
    await table.assertCellIsFocused(cell, "textbox");
    await table.assertCellIsEditing(cell, NOT_EDITING);
    await table.assertCellValue(cell, originalValue, "textbox");

    await cell.press("ArrowDown");
    await table.assertCellIsFocused(nextCell);
    await table.assertCellIsEditing(nextCell, NOT_EDITING);
  });
});

test.describe("Edit conflicts", () => {
  test.describe("View mode", () => {
    test("smoke test", async ({ mount, page }) => {
      await mount(
        <LocalDataSourceProvider>
          <TwoEditableInstruments />
        </LocalDataSourceProvider>,
      );
      const table1 = new TableOM(page.getByTestId("table-1"));
      await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table1.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");

      const table2 = new TableOM(page.getByTestId("table-2"));
      await table2.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table2.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");
    });

    test("clicking a cell applies focus to input (textbox), but does not engage edit mode", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <TwoEditableInstruments />
        </LocalDataSourceProvider>,
      );
      const table = new TableOM(page.getByTestId("table-1"));
      // get the first data cell

      let cell = table.locateCell(2, 1);
      await cell.click();
      await table.assertCellIsFocused(cell);
      await cell.click();
      await table.assertCellIsFocused(cell);
      cell = table.locateCell(2, 2);
      await cell.click();
      await table.assertCellIsFocused(cell);
      cell = table.locateCell(4, 7);
      await cell.click();
      await table.assertCellIsFocused(cell);
    });
  });

  test.describe("Edit mode", () => {
    test("smoke test", async ({ mount, page }) => {
      await mount(
        <LocalDataSourceProvider>
          <TwoEditableInstruments />
        </LocalDataSourceProvider>,
      );

      const editButton = page.getByTestId("toggle-edit-1");
      const table1 = new TableOM(page.getByTestId("table-1"));

      await editButton.click();

      await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table1.assertCellIsEditable(2, 1, IS_EDITABLE, "AAOO L");

      const table2 = new TableOM(page.getByTestId("table-2"));
      await table2.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table2.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");
    });

    test("switches source to session and back while ignoring old-source updates", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <TwoEditableInstruments />
        </LocalDataSourceProvider>,
      );

      const first = page.getByTestId("edit-table-1");
      const second = page.getByTestId("edit-table-2");
      const firstTableElement = first.getByTestId("table-1");
      const firstTable = new TableOM(firstTableElement);
      const secondTable = new TableOM(second.getByTestId("table-2"));

      const sourceViewport =
        (await firstTableElement.getAttribute("data-viewport")) ?? "";
      expect(sourceViewport).not.toBe("");
      await first.getByTestId("toggle-edit-1").click();
      await expect(firstTableElement).not.toHaveAttribute(
        "data-viewport",
        sourceViewport,
      );
      await firstTable.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);

      const firstValue = await firstTable
        .locateCell(3, 6)
        .getByRole("textbox")
        .inputValue();

      await second.getByTestId("toggle-edit-2").click();
      const secondCell = secondTable.locateCell(3, 6);
      await secondCell.dblclick();
      await secondCell.pressSequentially("321");
      await secondCell.press("Enter");
      await second.getByRole("button", { name: "Save" }).click();

      await expect(
        firstTable.locateCell(3, 6).getByRole("textbox"),
      ).toHaveValue(firstValue);

      await first.getByRole("button", { name: "Cancel" }).click();
      await expect(firstTableElement).toHaveAttribute(
        "data-viewport",
        sourceViewport,
      );
      await firstTable.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await expect(firstTable.locateCell(3, 6)).toContainText("321");
    });
  });

  test.describe("Save Cancel buttons", () => {
    test("shown in edit mode, Save enabled on commit", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <EditableInstruments />
        </LocalDataSourceProvider>,
      );
      const table = new TableOM(page.getByTestId("table-1"));
      const editButton = page.getByRole("radio", { name: "Edit" });
      await editButton.click();

      const saveButton = page.getByRole("button", { name: "Save" });
      const cancelButton = page.getByRole("button", { name: "Cancel" });

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeDisabled();

      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();

      const cell = table.locateCell(3, 6);
      await cell.dblclick();
      await table.assertCellIsFocused(cell, "textbox");
      await cell.pressSequentially("123");

      await expect(saveButton).toBeDisabled();
      await expect(cancelButton).toBeEnabled();

      await cell.press("Enter");

      await expect(saveButton).toBeEnabled();
      await expect(cancelButton).toBeEnabled();
    });

    test("Save disabled whilst rejected edits", async ({ mount, page }) => {
      await mount(
        <LocalDataSourceProvider>
          <EditableInstruments />
        </LocalDataSourceProvider>,
      );
      const table = new TableOM(page.getByTestId("table-1"));
      const editButton = page.getByRole("radio", { name: "Edit" });
      await editButton.click();

      const saveButton = page.getByRole("button", { name: "Save" });
      const cancelButton = page.getByRole("button", { name: "Cancel" });

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeDisabled();

      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();

      const cell1 = table.locateCell(3, 6);
      await cell1.dblclick();
      await table.assertCellIsFocused(cell1, "textbox");
      await cell1.pressSequentially("123");

      const cell2 = table.locateCell(4, 6);
      await cell2.dblclick();
      await table.assertCellIsFocused(cell2, "textbox");
      await cell2.pressSequentially("abc");
      await cell2.press("Enter");
      await expect(cell2.locator(".saltInput")).toContainClass(
        "vuuTableInputCell-error",
      );
      await expect(saveButton).toBeDisabled();
      await expect(cancelButton).toBeEnabled();

      await cell2.press("Escape");
      await expect(cell2.locator(".saltInput")).not.toContainClass(
        "vuuTableInputCell-error",
      );
      await expect(saveButton).toBeEnabled();
      await expect(cancelButton).toBeEnabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Inline editing (session-based) — EditableInstrumentsInlineEdit
// ---------------------------------------------------------------------------

test.describe("Inline row editing (session)", () => {
  test("entering Edit mode shows the undo column and action buttons", async ({
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);

    // View mode: no Delete/Add Rows/Submit buttons visible
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();

    await page.getByRole("radio", { name: "Edit" }).click();

    // Edit mode: action buttons appear
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    // Undo column header is visible
    await expect(
      page.getByRole("columnheader", { name: "undo" }),
    ).toBeVisible();
  });

  test("Submit is disabled until at least one row is changed", async ({
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();

    const table = new TableOM(page.getByRole("table"));
    // Column 2 = bbg (column 1 is the checkbox selector)
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await cell.pressSequentially("X");
    await cell.press("Enter");

    await expect(submitButton).toBeEnabled();
  });

  test("soft-deleting a selected row marks it and shows the undo button", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");
    await mount(<EditableInstrumentsInlineEdit />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new TableOM(page.getByRole("table"));

    // Select first data row via checkbox
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();

    const deleteButton = page.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // The row should now show an Undo button

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();

    // Submit is now enabled
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("clicking Undo on a soft-deleted row reverts it", async ({
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new TableOM(page.getByRole("table"));
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();
    await page.getByRole("button", { name: "Delete" }).click();

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await undoButton.click();

    // vuuMsg cleared, undo button gone, Submit disabled again
    // Column 11 = vuuMsg (column 1 is the checkbox selector)
    const vuuMsgCell = table.locateCell(2, 11);
    await expect(vuuMsgCell).not.toContainText("SOFT_DELETED");
    await expect(undoButton).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });


  test("Cancel discards all changes and returns to view mode", async ({
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new TableOM(page.getByRole("table"));
    // Column 2 = bbg (column 1 is the checkbox selector)
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await cell.pressSequentially("X");
    await cell.press("Enter");
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();

    // InlineEditTableTemplate has no Cancel button — clicking "View" discards the session
    await page.getByRole("radio", { name: "View" }).click();

    // Returns to view mode — action buttons gone
    await expect(
      page.getByRole("button", { name: "Submit" }),
    ).not.toBeVisible();
    await expect(page.getByRole("radio", { name: "View" })).toBeVisible();
  });
});

test.describe("Session table editing (createSessionTable)", () => {
  test("entering edit mode shows the session table data", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    const table = new TableOM(page.getByRole("table"));

    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    // Column 2 = bbg (column 1 is the checkbox selector)
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await expect(cell.getByRole("textbox")).toBeVisible();
  });

  test("editing a cell marks the row with an Undo button", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    // Column 2 = bbg
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await cell.pressSequentially("EDITED");
    await cell.press("Enter");

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await expect(table.locateCell(2, 2).getByRole("textbox")).toHaveAttribute(
      "readonly",
    );
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("selecting a row enables the Delete button", async ({ mount, page }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    const deleteButton = page.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeDisabled();

    // Column 1 = checkbox selector
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();
    await expect(deleteButton).toBeEnabled();
  });

  test("deleting a selected row marks it SOFT_DELETED with an Undo button", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();
    await page.getByRole("button", { name: "Delete" }).click();

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("soft-deleted row retains vuuTableRow-noSelect class after another row is selected", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));

    // Select row 2 and soft-delete it
    const checkboxRow2 = table.locateCell(2, 1).getByRole("checkbox");
    await checkboxRow2.click();
    await page.getByRole("button", { name: "Delete" }).click();

    // After soft-delete: row 2 is checked and has noSelect class
    await expect(checkboxRow2).toBeChecked();
    await expect(table.row(2)).toHaveClass(/vuuTableRow-noSelect/);

    // Select row 3 — this issues a SELECT_ROW which clears existing server selection
    await table.locateCell(3, 1).getByRole("checkbox").click();

    // Row 2 is no longer server-selected but remains non-selectable (vuuMsg still SOFT_DELETED)
    await expect(table.row(2)).toHaveClass(/vuuTableRow-noSelect/);
    await expect(
      table.row(2).getByRole("button", { name: "Undo" }),
    ).toBeVisible();
  });

  test("clicking a soft-deleted row checkbox does not change row 3's selection state", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    const checkboxRow2 = table.locateCell(2, 1).getByRole("checkbox");
    const checkboxRow3 = table.locateCell(3, 1).getByRole("checkbox");

    // Soft-delete row 2, then select row 3
    await checkboxRow2.click();
    await page.getByRole("button", { name: "Delete" }).click();
    await checkboxRow3.click();
    await expect(checkboxRow3).toBeChecked();

    // Click the soft-deleted row's checkbox (force bypasses pointer-events:none CSS)
    await checkboxRow2.click({ force: true });
    // isRowSelectable blocks the click — row 3 must remain selected, row 2 unaffected
    await expect(checkboxRow3).toBeChecked();
    await expect(table.row(2)).toHaveClass(/vuuTableRow-noSelect/);
  });

  test("delete button is only enabled as long as rows are selected", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    const deleteButton = page.getByRole("button", {
      exact: true,
      name: "Delete",
    });

    await table.locateCell(2, 1).click();
    await deleteButton.click();
    await expect(deleteButton).not.toBeEnabled();
  });


  test("block selection spanning a soft-deleted row selects only the selectable rows", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));

    // Soft-delete row 3
    await table.locateCell(3, 1).click();
    await page.getByRole("button", { name: "Delete" }).click();

    // Click row 2 as the anchor, then shift-click row 5 for block range 2→5
    await table.locateCell(2, 1).click();
    await table.locateCell(5, 1).click({ modifiers: ["Shift"] });

    // Rows 2, 4, 5 must be selected; row 3 was non-selectable and should be skipped
    await expect(table.row(2)).toHaveAttribute("aria-selected", "true");
    await expect(table.row(3)).not.toHaveAttribute("aria-selected", "true");
    await expect(table.row(4)).toHaveAttribute("aria-selected", "true");
    await expect(table.row(5)).toHaveAttribute("aria-selected", "true");
    // Row 3 is still soft-deleted — undo button remains
    await expect(
      table.row(3).getByRole("button", { name: "Undo" }),
    ).toBeVisible();
  });
});
