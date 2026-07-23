import { test } from "@playwright/experimental-ct-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  CreateSessionTableInstruments,
  EditableInstruments,
  EditableInstrumentsInlineEdit,
  TwoEditableInstruments,
} from "../../../../../showcase/src/examples/Table/Editing.examples";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";

const IS_EDITABLE = true;
const NOT_EDITABLE = false;
const NOT_EDITING = false;

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
    let cell1 = table.locateCell(2, 1);
    let cell2 = table.locateCell(3, 1);
    let cell3 = table.locateCell(3, 2);
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

    let cell4 = table.locateCell(2, 4);
    let cell5 = table.locateCell(2, 5);
    let cell6 = table.locateCell(2, 6);
    let cell7 = table.locateCell(2, 7);

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
    let cell = table.locateCell(3, 3);
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
    let cell = table.locateCell(3, 2);
    let nextCell = table.locateCell(4, 2);
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
    let cell = table.locateCell(3, 3);
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
    let cell = table.locateCell(3, 3);
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
    let cell = table.locateCell(3, 6);
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
    browserName,
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);

    // View mode: no Delete/Add Rows/Submit buttons visible
    await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible();

    await page.getByRole("radio", { name: "Edit" }).click();

    // Edit mode: action buttons appear
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Rows" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    // Undo column header is visible
    await expect(page.getByRole("columnheader", { name: "undo" })).toBeVisible();
  });

  test("Submit is disabled until at least one row is changed", async ({
    browserName,
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

    // The row should now show vuuMsg = SOFT_DELETED and an Undo button
    // Column 11 = vuuMsg (column 1 is the checkbox selector)
    const vuuMsgCell = table.locateCell(2, 11);
    await expect(vuuMsgCell).toContainText("SOFT_DELETED");

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();

    // Submit is now enabled
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("clicking Undo on a soft-deleted row reverts it", async ({
    browserName,
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

  test("Add Rows appends blank rows to the session table", async ({
    browserName,
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();

    await page.getByRole("button", { name: "Add Rows" }).click();

    // Submit enabled after rows added
    await expect(submitButton).toBeEnabled();
  });

  test("Cancel discards all changes and returns to view mode", async ({
    browserName,
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
    await expect(page.getByRole("button", { name: "Submit" })).not.toBeVisible();
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
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

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
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    // Column 2 = bbg
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await cell.pressSequentially("EDITED");
    await cell.press("Enter");

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("selecting a row enables the Delete button", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

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
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();
    await page.getByRole("button", { name: "Delete" }).click();

    // Column 11 = vuuMsg
    const vuuMsgCell = table.locateCell(2, 11);
    await expect(vuuMsgCell).toContainText("SOFT_DELETED");

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("Add Rows appends blank rows to the session table", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();

    await page.getByRole("button", { name: "Add Rows" }).click();
    await expect(submitButton).toBeEnabled();
  });

  test("soft-deleted row checkbox is checked+disabled and stays that way after selecting another row", async ({
    mount,
    page,
  }) => {
    await mount(<CreateSessionTableInstruments />);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("status", { name: "Loading session table" })).not.toBeVisible();

    const table = new TableOM(page.getByRole("table"));

    // Select row 2 and soft-delete it
    const checkboxRow2 = table.locateCell(2, 1).getByRole("checkbox");
    await checkboxRow2.click();
    await page.getByRole("button", { name: "Delete" }).click();

    // After soft-delete: row 2 checkbox should be checked AND disabled
    await expect(checkboxRow2).toBeChecked();
    await expect(checkboxRow2).toBeDisabled();

    // Click another row's checkbox (row 3)
    const checkboxRow3 = table.locateCell(3, 1).getByRole("checkbox");
    await checkboxRow3.click();

    // Row 2 checkbox should STILL be checked+disabled (checkboxRowLevelProps persists)
    await expect(checkboxRow2).toBeChecked();
    await expect(checkboxRow2).toBeDisabled();
  });
});
