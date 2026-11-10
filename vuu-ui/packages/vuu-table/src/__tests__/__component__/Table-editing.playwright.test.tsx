import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";

const IS_EDITABLE = true;
const NOT_EDITABLE = false;
const NOT_EDITING = false;

test.describe("useEditableTable session readiness", () => {
  test("becomes ready when the session datasource subscribes", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/UseEditableTableSessionReadiness");

    const readiness = page.locator("output");
    await page.getByRole("button", { name: "Start edit session" }).click();

    await expect(readiness).toHaveAttribute("data-session", "true");
    await expect(readiness).toHaveAttribute("data-ready", "false");
    await page.getByRole("button", { name: "Release subscription" }).click();
    await expect(readiness).toHaveAttribute("data-ready", "true");
  });

  test("recognizes a session datasource that is already subscribed", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/UseEditableTableSessionReadiness", {
      delaySubscription: false,
    });

    const readiness = page.locator("output");
    await page.getByRole("button", { name: "Start edit session" }).click();

    await expect(readiness).toHaveAttribute("data-session", "true");
    await expect(readiness).toHaveAttribute("data-ready", "true");
  });

  test("exits edit mode and restores the source table when the session datasource unsubscribes after edits", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/UseEditableTableSessionReadiness", {
      delaySubscription: false,
    });

    const readiness = page.locator("output");
    await expect(readiness).toHaveAttribute("data-mode", "view");
    await page.getByRole("button", { name: "Start edit session" }).click();
    await expect(readiness).toHaveAttribute("data-mode", "edit");
    await expect(readiness).toHaveAttribute("data-session", "true");
    await expect(readiness).toHaveAttribute("data-ready", "true");
    await expect(readiness).toHaveAttribute("data-dirty", "false");

    const lotSizeInput = page.getByRole("textbox", { name: "lotSize" }).first();
    await expect(lotSizeInput).toBeVisible();
    const originalLotSize = await lotSizeInput.inputValue();

    await lotSizeInput.dblclick();
    await lotSizeInput.fill("999");
    await lotSizeInput.press("Enter");
    await expect(readiness).toHaveAttribute("data-dirty", "true");

    await page.getByRole("button", { name: "Disconnect session" }).click();

    await expect(readiness).toHaveAttribute("data-mode", "view");
    await expect(readiness).toHaveAttribute("data-session", "false");
    await expect(readiness).toHaveAttribute("data-ready", "false");
    await expect(readiness).toHaveAttribute("data-dirty", "false");
    await expect(readiness).toHaveAttribute("data-dirty-at-cancel", "false");
    await expect(page.getByRole("textbox", { name: "lotSize" })).toHaveCount(0);
    await expect(
      page.locator('[role="row"][aria-rowindex="2"] [data-field="lotSize"]'),
    ).toHaveText(originalLotSize);
  });
});

test.describe("useEditableTable with a divergent edit table", () => {
  test("applies the datasource's session config and reports divergence", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/UseEditableTableWithEditColumns");

    const output = page.locator("output");
    await page.getByRole("button", { name: "Start edit session" }).click();

    await expect(output).toHaveAttribute("data-session", "true");
    await expect(output).toHaveAttribute("data-edit-schema", "id,quantity");
    await expect(output).toHaveAttribute("data-diverge", "true");
  });
});

test.describe("Inline add row", () => {
  test("renders insert-editable cells and blanks update-only columns", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstrumentsWithInlineAddRow");
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
    await mount("Table/Editing/EditableInstrumentsWithInlineAddRow");
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
    await mount("Table/Editing/EditableInstrumentsWithInlineAddRow");
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
    await mount("Table/Editing/EditableInstrumentsWithInlineAddRow");
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
    await mount("Table/Editing/TestTableEmpty");
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
    const insertedId = page
      .getByRole("textbox", { name: "id", exact: true })
      .nth(1);
    await expect(insertedId).toBeVisible();
    await expect(insertedId).toHaveValue("TEST-006");
  });

  test("inserts two consecutive rows in the same edit session", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
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

    const addRow = async (
      values: readonly [string, string, string, string, string],
    ) => {
      const editors = [id, description, quantity, price, externalId];
      for (const [index, editor] of editors.entries()) {
        await editor.fill(values[index]);
        await editor.press("Enter");
      }
    };

    await addRow(["TEST-006", "Foxtrot", "72", "607.5", "1006"]);
    await expect(id).toBeFocused();
    await expect(id).toHaveValue("");

    await addRow(["TEST-007", "Golf", "84", "708.5", "1006"]);

    await expect(id).toBeFocused();
    await expect(id).toHaveValue("");
    await expect(description).toHaveValue("");
    await expect(quantity).toHaveValue("");
    await expect(price).toHaveValue("");
    await expect(externalId).toHaveValue("");
    const firstInsertedId = page
      .getByRole("textbox", { name: "id", exact: true })
      .nth(1);
    const secondInsertedId = page
      .getByRole("textbox", { name: "id", exact: true })
      .nth(2);
    await expect(firstInsertedId).toBeVisible();
    await expect(firstInsertedId).toHaveValue("TEST-006");
    await expect(secondInsertedId).toBeVisible();
    await expect(secondInsertedId).toHaveValue("TEST-007");
  });

  test("marks only omitted cells as invalid when the final cell is committed", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
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
    await mount("Table/Editing/TestTableEmpty");
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
    const insertedId = page
      .getByRole("textbox", { name: "id", exact: true })
      .nth(1);
    await expect(insertedId).toBeVisible();
    await expect(insertedId).toHaveValue("TEST-006");
  });

  test("moves to the next invalid cell when repairing incomplete rows", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
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
    await mount("Table/Editing/TestTableFIveRows");
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

  test("rejects alphabetic input in an inline numeric cell", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
    await page.getByRole("radio", { name: "Edit" }).click();

    const quantity = page
      .locator(".vuuInlineAddRow")
      .getByRole("textbox", { name: "quantity" });
    await quantity.pressSequentially("invalid");
    await quantity.press("Enter");

    await expect(quantity.locator("..")).toContainClass(
      "vuuTableInputCell-error",
    );
  });

  test("does not commit an inline row when an optional column has an invalid value", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty", {
      optionalColumns: ["quantity"],
    });
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
    await quantity.fill("invalid");
    await quantity.press("Enter");
    await expect(quantity.locator("..")).toContainClass(
      "vuuTableInputCell-error",
    );

    await price.fill("607.5");
    await price.press("Enter");
    await externalId.fill("1006");
    await externalId.press("Enter");

    // Row should not be committed because optional quantity has an invalid value
    await expect(page.locator(".vuuTableRow-inserted")).toHaveCount(0);
    await expect(id).toHaveValue("TEST-006");
    await expect(quantity).toBeFocused();

    // Clearing the optional quantity clears the error and commits the row
    await quantity.fill("");
    await quantity.press("Enter");

    await expect(page.locator(".vuuTableRow-inserted")).toHaveCount(1);
    await expect(id).toHaveValue("");
  });

  test("updates and deletes existing rows", async ({ mount, page }) => {
    await mount("Table/Editing/TestTableFIveRows");
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

const getInlineAddRowEditors = (page: Page) => {
  const inlineAddRow = page.locator(".vuuInlineAddRow");
  return {
    id: inlineAddRow.getByRole("textbox", { name: "id", exact: true }),
    description: inlineAddRow.getByRole("textbox", { name: "description" }),
    quantity: inlineAddRow.getByRole("textbox", { name: "quantity" }),
    price: inlineAddRow.getByRole("textbox", { name: "price" }),
    externalId: inlineAddRow.getByRole("textbox", { name: "externalId" }),
  };
};

const getInsertedRows = (page: Page) => page.locator(".vuuTableRow-inserted");

/**
 * The inline add row moves focus in a requestAnimationFrame after a commit.
 * Wait for that to happen so the next action is not raced by a focus change.
 */
const waitForFocusToSettle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

const commitValue = async (editor: Locator, value: string) => {
  await editor.fill(value);
  await editor.press("Enter");
  await waitForFocusToSettle(editor.page());
};

const expectError = (editor: Locator) =>
  expect(editor.locator("..")).toContainClass("vuuTableInputCell-error");

const expectNoError = (editor: Locator) =>
  expect(editor.locator("..")).not.toContainClass("vuuTableInputCell-error");

const expectErrorMessage = async (
  page: Page,
  editor: Locator,
  message: string,
) => {
  await editor.locator("..").locator(".vuuTableInputCell-icon").hover();
  await expect(page.getByRole("tooltip")).toContainText(message);
};

test.describe("Inline add row with optional columns", () => {
  test.describe("optional columns before the final column", () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount("Table/Editing/TestTableEmptyOptionalColumns");
      await page.getByRole("radio", { name: "Edit" }).click();
    });

    test("inserts a row when the optional columns are left blank", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "id", exact: true }),
      ).toHaveValue("TEST-006");
      await expect(
        insertedRows.getByRole("textbox", { name: "description" }),
      ).toHaveValue("");
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("");
      await expect(
        insertedRows.getByRole("textbox", { name: "price" }),
      ).toHaveValue("607.5");

      await expect(id).toHaveValue("");
      await expect(description).toHaveValue("");
      await expect(quantity).toHaveValue("");
      await expect(id).toBeFocused();
    });

    test("includes values entered in the optional columns", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "description" }),
      ).toHaveValue("Foxtrot");
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("72");
    });

    test("does not mark blank optional columns as invalid when a required column is missing", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(id).toHaveAttribute("aria-invalid", "true");
      await expect(description).not.toHaveAttribute("aria-invalid", "true");
      await expect(quantity).not.toHaveAttribute("aria-invalid", "true");
      await expect(id).toBeFocused();
    });

    test("inserts a row after an invalid optional value is cleared one character at a time", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await quantity.pressSequentially("abc");
      await quantity.press("Enter");
      await waitForFocusToSettle(page);
      await expect(quantity.locator("..")).toContainClass(
        "vuuTableInputCell-error",
      );

      await quantity.press("Backspace");
      await quantity.press("Backspace");
      await quantity.press("Backspace");
      await expect(quantity).toHaveValue("");
      await quantity.press("Enter");
      await expect(quantity.locator("..")).not.toContainClass(
        "vuuTableInputCell-error",
      );

      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("");
    });

    test("does not insert a row while an optional column holds an invalid value", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await quantity.pressSequentially("abc");
      await quantity.press("Enter");
      await waitForFocusToSettle(page);
      await expect(quantity.locator("..")).toContainClass(
        "vuuTableInputCell-error",
      );

      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(id).toHaveValue("TEST-006");
    });

    test("Escape on an invalid optional value clears the error so the row can be inserted", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await quantity.pressSequentially("abc");
      await quantity.press("Enter");
      await waitForFocusToSettle(page);
      await expectError(quantity);

      await quantity.press("Escape");
      await expect(quantity).toHaveValue("");
      await expectNoError(quantity);

      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(1);
    });

    test("correcting an invalid optional value inserts the corrected value", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await quantity.pressSequentially("abc");
      await quantity.press("Enter");
      await waitForFocusToSettle(page);
      await expectError(quantity);

      await commitValue(quantity, "72");
      await expectNoError(quantity);
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("72");
    });
  });

  test.describe("optional final column", () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount("Table/Editing/TestTableEmptyOptionalFinalColumn");
      await page.getByRole("radio", { name: "Edit" }).click();
    });

    test("inserts a row when the optional final column is left blank", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "externalId" }),
      ).toHaveValue("");
      await expect(externalId).toHaveValue("");
    });

    test("does not insert a row while the optional final column holds an invalid value", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await externalId.pressSequentially("abc");
      await externalId.press("Enter");
      await waitForFocusToSettle(page);
      await expectError(externalId);

      await commitValue(id, "TEST-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(externalId).toBeFocused();

      await commitValue(externalId, "");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "externalId" }),
      ).toHaveValue("");
    });
  });
});

test.describe("Edit validation", () => {
  test.describe("client-side rules", () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount("Table/Editing/TestTableFiveRowsClientValidation");
      await page.getByRole("radio", { name: "Edit" }).click();
    });

    test("rejects a commit that breaks a commit-phase rule on an existing row", async ({
      page,
    }) => {
      const description = page
        .getByRole("textbox", { name: "description" })
        .nth(1);
      await expect(description).toHaveValue("Alpha");
      await description.dblclick();
      await description.pressSequentially("Much too long a description");
      await expect(description.locator("..")).not.toContainClass(
        "vuuTableInputCell-error",
      );
      await description.press("Enter");

      await expect(description.locator("..")).toContainClass(
        "vuuTableInputCell-error",
      );
      await expect(description).toHaveAttribute("aria-invalid", "true");
      await expectErrorMessage(
        page,
        description,
        "description must be at most 12 characters",
      );
      await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    });

    test("flags a change-phase rule as soon as the value breaks it", async ({
      page,
    }) => {
      const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
      await expect(quantity).toHaveValue("12");
      await quantity.dblclick();
      await quantity.pressSequentially("1x");

      await expect(quantity.locator("..")).toContainClass(
        "vuuTableInputCell-error",
      );
      await expectErrorMessage(
        page,
        quantity,
        "quantity must contain digits only",
      );

      await quantity.press("Backspace");
      await expect(quantity).toHaveValue("1");
      await expect(quantity.locator("..")).not.toContainClass(
        "vuuTableInputCell-error",
      );
    });

    test("does not add a row while a client rule fails, adds it once corrected", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "test-006");
      await expect(id.locator("..")).toContainClass("vuuTableInputCell-error");

      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(id).toBeFocused();

      await commitValue(id, "TEST-006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "id", exact: true }),
      ).toHaveValue("TEST-006");
    });

    test("correcting a rule failure on an existing row clears the error and enables Submit", async ({
      page,
    }) => {
      const submitButton = page.getByRole("button", { name: "Submit" });
      const description = page
        .getByRole("textbox", { name: "description" })
        .nth(1);
      await description.dblclick();
      await description.pressSequentially("Much too long a description");
      await description.press("Enter");
      await expectError(description);
      await expect(submitButton).toBeDisabled();

      await description.press("ControlOrMeta+a");
      await description.pressSequentially("Short");
      await description.press("Enter");

      await expectNoError(description);
      await expect(description).toHaveValue("Short");
      await expect(submitButton).toBeEnabled();
    });

    test("Escape after a rule failure on an existing row restores the original value", async ({
      page,
    }) => {
      const description = page
        .getByRole("textbox", { name: "description" })
        .nth(1);
      await description.dblclick();
      await description.pressSequentially("Much too long a description");
      await description.press("Enter");
      await expectError(description);

      await description.press("Escape");

      await expect(description).toHaveValue("Alpha");
      await expectNoError(description);
      await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    });

    test("does not apply rules to an optional column left blank when adding a row", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "description" }),
      ).toHaveValue("");
    });

    test("does not add a row while an optional column breaks a rule", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await commitValue(description, "Much too long a description");
      await expectError(description);
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(description).toBeFocused();

      await commitValue(description, "Foxtrot");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "description" }),
      ).toHaveValue("Foxtrot");
    });

    test("flags a change-phase rule in the add row and does not add the row", async ({
      page,
    }) => {
      const { id, quantity, price, externalId } = getInlineAddRowEditors(page);

      await commitValue(id, "TEST-006");
      await quantity.pressSequentially("7x");
      await expectError(quantity);
      await quantity.press("Enter");
      await waitForFocusToSettle(page);
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(quantity).toBeFocused();
    });
  });

  test.describe("server-side rules", () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount("Table/Editing/TestTableFiveRowsServerValidation");
      await page.getByRole("radio", { name: "Edit" }).click();
    });

    test("rejects an edit the server refuses on an existing row", async ({
      page,
    }) => {
      const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
      await expect(quantity).toHaveValue("12");
      await quantity.dblclick();
      await quantity.pressSequentially("5000");
      await quantity.press("Enter");

      await expect(quantity.locator("..")).toContainClass(
        "vuuTableInputCell-error",
      );
      await expect(quantity).toHaveAttribute("aria-invalid", "true");
      await expectErrorMessage(
        page,
        quantity,
        "quantity must be between 1 and 1000",
      );
      await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    });

    test("accepts an edit the server allows on an existing row", async ({
      page,
    }) => {
      const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
      await quantity.dblclick();
      await quantity.pressSequentially("500");
      await quantity.press("Enter");

      await expect(quantity.locator("..")).not.toContainClass(
        "vuuTableInputCell-error",
      );
      await expect(quantity).toHaveValue("500");
      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
    });

    test("does not add a row the server rejects", async ({ page }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "VAL-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "5000");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      await expect(getInsertedRows(page)).toHaveCount(0);
      await expect(externalId).toHaveAttribute("aria-invalid", "true");
      await expectErrorMessage(
        page,
        externalId,
        "quantity must be between 1 and 1000",
      );
      await expect(id).toHaveValue("VAL-006");
      await expect(quantity).toHaveValue("5000");
    });

    test("adds a row the server accepts", async ({ page }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "VAL-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "72");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("72");
    });

    test("correcting a server-rejected edit clears the error and enables Submit", async ({
      page,
    }) => {
      const submitButton = page.getByRole("button", { name: "Submit" });
      const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
      await quantity.dblclick();
      await quantity.pressSequentially("5000");
      await quantity.press("Enter");
      await expectError(quantity);
      await expect(submitButton).toBeDisabled();

      await quantity.press("ControlOrMeta+a");
      await quantity.pressSequentially("500");
      await quantity.press("Enter");

      await expectNoError(quantity);
      await expect(quantity).toHaveValue("500");
      await expect(submitButton).toBeEnabled();
    });

    test("Escape after a server rejection restores the original value", async ({
      page,
    }) => {
      const quantity = page.getByRole("textbox", { name: "quantity" }).nth(1);
      await quantity.dblclick();
      await quantity.pressSequentially("5000");
      await quantity.press("Enter");
      await expectError(quantity);

      await quantity.press("Escape");

      await expect(quantity).toHaveValue("12");
      await expectNoError(quantity);
      await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    });

    test("applies each server rule independently", async ({ page }) => {
      const price = page.getByRole("textbox", { name: "price" }).nth(1);
      await price.dblclick();
      await price.press("ControlOrMeta+a");
      await price.pressSequentially("0");
      await price.press("Enter");

      await expectError(price);
      await expectErrorMessage(page, price, "price must be greater than zero");
    });

    test("adds the row once a server-rejected value is corrected", async ({
      page,
    }) => {
      const { id, description, quantity, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "VAL-006");
      await commitValue(description, "Foxtrot");
      await commitValue(quantity, "5000");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");
      await expect(getInsertedRows(page)).toHaveCount(0);

      await commitValue(quantity, "72");
      // The rejection is reported on the final column, which stays invalid
      // until it is committed again: Enter to edit, Enter to commit.
      await externalId.focus();
      await externalId.press("Enter");
      await externalId.press("Enter");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("72");
    });

    test("does not apply server rules to an optional column left blank", async ({
      page,
    }) => {
      const { id, description, price, externalId } =
        getInlineAddRowEditors(page);

      await commitValue(id, "VAL-006");
      await commitValue(description, "Foxtrot");
      await commitValue(price, "607.5");
      await commitValue(externalId, "1006");

      const insertedRows = getInsertedRows(page);
      await expect(insertedRows).toHaveCount(1);
      await expect(
        insertedRows.getByRole("textbox", { name: "quantity" }),
      ).toHaveValue("");
    });
  });
});

test.describe("Added row deletion reconciles edit counters", () => {
  const addRowInline = async (
    page: import("@playwright/test").Page,
    values: readonly [string, string, string, string, string],
  ) => {
    const inlineAddRow = page.locator(".vuuInlineAddRow");
    const editors = [
      inlineAddRow.getByRole("textbox", { name: "id", exact: true }),
      inlineAddRow.getByRole("textbox", { name: "description" }),
      inlineAddRow.getByRole("textbox", { name: "quantity" }),
      inlineAddRow.getByRole("textbox", { name: "price" }),
      inlineAddRow.getByRole("textbox", { name: "externalId" }),
    ];
    for (const [index, editor] of editors.entries()) {
      await editor.fill(values[index]);
      await editor.press("Enter");
    }
  };

  test("deleting a newly added row removes it outright and disables Submit", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    const deleteButton = page.getByRole("button", {
      exact: true,
      name: "Delete",
    });
    const insertedRow = page.locator(".vuuTableRow-inserted");

    await addRowInline(page, ["TEST-006", "Foxtrot", "72", "607.5", "1006"]);
    await expect(insertedRow).toHaveCount(1);
    await expect(submitButton).toBeEnabled();

    await insertedRow
      .getByRole("checkbox", { name: "Press space to select row" })
      .click();
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // The added row had no prior state: it is removed outright, not left
    // behind as a soft-deleted ghost row with an Undo button.
    await expect(insertedRow).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);

    // The addition and the deletion cancel out - session is clean again.
    await expect(submitButton).toBeDisabled();
    await expect(deleteButton).toBeDisabled();
  });

  test("undoing an inserted row via its Undo button removes it and disables Submit", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmpty");
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    const insertedRow = page.locator(".vuuTableRow-inserted");

    await addRowInline(page, ["TEST-006", "Foxtrot", "72", "607.5", "1006"]);
    await expect(insertedRow).toHaveCount(1);
    await expect(submitButton).toBeEnabled();

    await insertedRow.getByRole("button", { name: "Undo insert row" }).click();

    await expect(insertedRow).toHaveCount(0);
    await expect(submitButton).toBeDisabled();
  });

  test("mixed deletes: added row cancels out, source row soft-delete persists until undone", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableFIveRows");
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    const deleteButton = page.getByRole("button", {
      exact: true,
      name: "Delete",
    });
    const insertedRow = page.locator(".vuuTableRow-inserted");
    const deletedRow = page.locator(".vuuTableRow-deleted");

    await addRowInline(page, ["TEST-006", "Foxtrot", "72", "607.5", "1006"]);
    await expect(insertedRow).toHaveCount(1);
    await expect(submitButton).toBeEnabled();

    // Soft-delete a pre-existing source row - it stays, marked for deletion
    await page
      .getByRole("checkbox", { name: "Press space to select row" })
      .first()
      .click();
    await deleteButton.click();
    await expect(deletedRow).toHaveCount(1);
    await expect(submitButton).toBeEnabled();

    // Delete the added row - it is removed outright
    await insertedRow
      .getByRole("checkbox", { name: "Press space to select row" })
      .click();
    await deleteButton.click();
    await expect(insertedRow).toHaveCount(0);

    // deleteCount for the source row still pending - Submit stays enabled
    await expect(submitButton).toBeEnabled();

    // Undo the source-row delete - all changes reconciled, session clean
    await deletedRow.getByRole("button", { name: "Undo delete row" }).click();
    await expect(deletedRow).toHaveCount(0);
    await expect(submitButton).toBeDisabled();
  });
});

test.describe("Editable table navigation", () => {
  test("smoke test", async ({ mount, page }) => {
    await mount("Table/Editing/EditableInstruments");
    const table1 = new PwTable(page, '[data-testid="table-1"]');
    const editButton = page.getByRole("radio", { name: "Edit" });

    await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
    await table1.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");

    await editButton.click();
    await table1.assertCellIsEditable(2, 1, IS_EDITABLE, "AAOO L");
    await expect(table1.locateCell(2, 5).getByRole("textbox")).toHaveCount(0);
  });

  test("clicking a cell, then using arrow keys applies cell navigation ", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await table.assertCellIsFocused(cell3);
  });

  test("arrow keys move between dropdown cells, Enter moves focus into the dropdown and opens it", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    // currency column, rendered with dropdown-cell
    const bbgCell = table.locateCell(2, 1);
    const currencyRow2 = table.locateCell(2, 2);
    const currencyRow3 = table.locateCell(3, 2);
    const currencyRow4 = table.locateCell(4, 2);
    const dropdownRow3 = currencyRow3.getByRole("combobox");
    const listbox = page.getByRole("listbox");

    // Navigation focuses the cell, as it does for input cells
    await bbgCell.click();
    await bbgCell.press("ArrowRight");
    await table.assertCellIsFocused(currencyRow2);

    await currencyRow2.press("ArrowDown");
    await table.assertCellIsFocused(currencyRow3);
    await currencyRow3.press("ArrowDown");
    await table.assertCellIsFocused(currencyRow4);
    await currencyRow4.press("ArrowUp");
    await table.assertCellIsFocused(currencyRow3);
    await expect(listbox).not.toBeVisible();

    // Enter moves focus into the dropdown and opens it
    await currencyRow3.press("Enter");
    await table.assertCellIsFocused(currencyRow3, "combobox");
    await expect(listbox).toBeVisible();

    // While open, arrow keys move between options
    await dropdownRow3.press("ArrowDown");
    await table.assertCellIsFocused(currencyRow3, "combobox");
    await expect(listbox).toBeVisible();

    // Escape closes the dropdown, which keeps focus, as an input cell does
    await dropdownRow3.press("Escape");
    await expect(listbox).not.toBeVisible();
    await table.assertCellIsFocused(currencyRow3, "combobox");

    // The focus outline stays while the pointer is over the dropdown
    await dropdownRow3.hover();
    await expect(dropdownRow3).toHaveCSS("outline-style", "solid");

    // A focused, closed dropdown leaves arrow keys to table navigation
    await dropdownRow3.press("ArrowDown");
    await table.assertCellIsFocused(currencyRow4);
    await expect(listbox).not.toBeVisible();
  });

  test("selecting a dropdown option with the keyboard commits and moves focus to the next row", async ({
    browserName,
    mount,
    page,
  }) => {
    // Safari doesn't transfer focus on 'vuu-commit'
    test.skip(browserName === "webkit");

    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    const bbgCell = table.locateCell(3, 1);
    const currencyCell = table.locateCell(3, 2);
    const nextCell = table.locateCell(4, 2);

    await bbgCell.click();
    await bbgCell.press("ArrowRight");
    await table.assertCellIsFocused(currencyCell);
    await currencyCell.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await currencyCell.getByRole("combobox").press("ArrowDown");
    await currencyCell.getByRole("combobox").press("Enter");

    await expect(page.getByRole("listbox")).not.toBeVisible();
    await table.assertCellIsFocused(nextCell);
  });

  test("typing a character in a dropdown cell opens the dropdown at the first matching option", async ({
    browserName,
    mount,
    page,
  }) => {
    // Safari doesn't transfer focus on 'vuu-commit'
    test.skip(browserName === "webkit");

    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    const bbgCell = table.locateCell(3, 1);
    const currencyCell = table.locateCell(3, 2);
    const dropdown = currencyCell.getByRole("combobox");
    const nextCell = table.locateCell(4, 2);
    const listbox = page.getByRole("listbox");
    const activeOption = listbox.locator(".saltOption-active");

    await bbgCell.click();
    await bbgCell.press("ArrowRight");
    await table.assertCellIsFocused(currencyCell);

    // The character moves focus into the Dropdown, as it does for an input cell
    await currencyCell.press("s");
    await table.assertCellIsFocused(currencyCell, "combobox");
    await expect(listbox).toBeVisible();
    await expect(activeOption).toHaveText("SEK");

    // Typing on a focused, closed Dropdown opens it too
    await dropdown.press("Escape");
    await expect(listbox).not.toBeVisible();
    // Salt joins keys typed within 500ms into one search ("sj")
    await page.waitForTimeout(600);
    await dropdown.press("j");
    await expect(listbox).toBeVisible();
    await expect(activeOption).toHaveText("JPY");

    await dropdown.press("Enter");
    await expect(listbox).not.toBeVisible();
    await table.assertCellContent(currencyCell, "JPY", "combobox");
    await table.assertCellIsFocused(nextCell);
  });

  test("typing a character in a focused dropdown cell, then Enter, commits the matching option", async ({
    browserName,
    mount,
    page,
  }) => {
    // Safari doesn't transfer focus on 'vuu-commit'
    test.skip(browserName === "webkit");

    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
    const editButton = page.getByRole("radio", { name: "Edit" });
    await editButton.click();

    const bbgCell = table.locateCell(3, 1);
    const currencyCell = table.locateCell(3, 2);
    const dropdown = currencyCell.getByRole("combobox");
    const nextCell = table.locateCell(4, 2);
    const listbox = page.getByRole("listbox");

    await bbgCell.click();
    await bbgCell.press("ArrowRight");
    await table.assertCellIsFocused(currencyCell);

    await currencyCell.press("s");
    await expect(listbox.locator(".saltOption-active")).toHaveText("SEK");

    await dropdown.press("Enter");
    await expect(listbox).not.toBeVisible();
    await table.assertCellContent(currencyCell, "SEK", "combobox");
    await table.assertCellIsFocused(nextCell);
  });

  test("In edit mode, with cell navigation disabled, arrow key navigation traverses editable cells only", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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

    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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

    await table.assertCellIsFocused(nextCell);
  });

  test("clicking Escape in a cell in edit mode, before actual editing, exits edit mode, textbox retains focus", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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

test.describe("editable-cell navigation style", () => {
  test("arrow keys move only between editable cells", async ({
    mount,
    page,
  }) => {
    // description and isin are not editable
    await mount("Table/TableEditing/EditableTable");
    const table = new PwTable(page);

    const bbg = await table.locateCell(2, "bbg");
    const currency = await table.locateCell(2, "currency");
    const exchange = await table.locateCell(2, "exchange");
    const lotSize = await table.locateCell(2, "lotSize");
    const lotSizeRow3 = await table.locateCell(3, "lotSize");

    await bbg.click();
    await bbg.press("ArrowRight");
    await table.assertCellIsFocused(currency);
    await currency.press("ArrowRight");
    await table.assertCellIsFocused(exchange);
    await exchange.press("ArrowRight");
    await table.assertCellIsFocused(lotSize);
    await lotSize.press("ArrowDown");
    await table.assertCellIsFocused(lotSizeRow3);
    await lotSizeRow3.press("ArrowUp");
    await table.assertCellIsFocused(lotSize);
    await lotSize.press("ArrowLeft");
    await table.assertCellIsFocused(exchange);
    await exchange.press("ArrowLeft");
    await table.assertCellIsFocused(currency);
  });

  test("a clicked non-editable cell shows focus, arrow keys move to the next editable cell", async ({
    mount,
    page,
  }) => {
    await mount("Table/TableEditing/EditableTable");
    const table = new PwTable(page);

    const description = await table.locateCell(2, "description");
    const exchange = await table.locateCell(2, "exchange");

    await description.click();
    await table.assertCellIsFocused(description);
    await expect(description).toHaveCSS("outline-style", "solid");

    await description.press("ArrowRight");
    await table.assertCellIsFocused(exchange);
  });
});

test.describe("Cell editing", () => {
  test("cancelling an edit restores the original value when locating by column name", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
    const cell = await table.locateCell(2, "lotSize");
    const originalValue = await cell.textContent();
    const editButton = page.getByRole("radio", { name: "Edit" });

    await editButton.click();
    await cell.dblclick();
    const textbox = cell.getByRole("textbox");
    await textbox.fill("9999");
    await expect(textbox).toHaveValue("9999");
    await textbox.press("Escape");

    const revertedValue = await textbox.inputValue();
    expect(revertedValue).toBe(originalValue);
  });

  test("double clicking a cell applies focus and selection, edit to overwrite, Escape reverts", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
    await mount("Table/Editing/EditableInstruments");
    const table = new PwTable(page);
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
      await mount("Table/Editing/TwoEditableInstruments");
      const table1 = new PwTable(page, '[data-testid="table-1"]');
      await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table1.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");

      const table2 = new PwTable(page, '[data-testid="table-2"]');
      await table2.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table2.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");
    });

    test("clicking a cell applies focus to input (textbox), but does not engage edit mode", async ({
      mount,
      page,
    }) => {
      await mount("Table/Editing/TwoEditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
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
      await mount("Table/Editing/TwoEditableInstruments");

      const editButton = page.getByTestId("toggle-edit-1");
      const table1 = new PwTable(page, '[data-testid="table-1"]');

      await editButton.click();

      await table1.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table1.assertCellIsEditable(2, 1, IS_EDITABLE, "AAOO L");

      const table2 = new PwTable(page, '[data-testid="table-2"]');
      await table2.assertRenderedRows({ from: 0, to: 10 }, 10, 10_000, 1);
      await table2.assertCellIsEditable(2, 1, NOT_EDITABLE, "AAOO L");
    });

    test("switches source to session and back while ignoring old-source updates", async ({
      mount,
      page,
    }) => {
      await mount("Table/Editing/TwoEditableInstruments");

      const first = page.getByTestId("edit-table-1");
      const second = page.getByTestId("edit-table-2");
      const firstTableElement = first.getByTestId("table-1");
      const firstTable = new PwTable(
        page,
        '[data-testid="edit-table-1"] [data-testid="table-1"]',
      );
      const secondTable = new PwTable(
        page,
        '[data-testid="edit-table-2"] [data-testid="table-2"]',
      );

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
      await mount("Table/Editing/EditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
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

    test("cancelling an uncommitted edit does not mark the cell as edited", async ({
      mount,
      page,
    }) => {
      await mount("Table/Editing/EditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
      await page.getByRole("radio", { name: "Edit" }).click();

      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      const cell = table.locateCell(3, 6);
      const originalValue = await cell.getByRole("textbox").inputValue();
      await cell.dblclick();
      await table.assertCellIsFocused(cell, "textbox");
      await cell.pressSequentially("123");
      await cell.press("Escape");

      await table.assertCellIsEditing(cell, NOT_EDITING);
      await table.assertCellValue(cell, originalValue, "textbox");
      await expect(cell.locator(".saltInput")).not.toContainClass(
        "vuuTableInputCell-edited",
      );
      await expect(saveButton).toBeDisabled();
    });

    test("cancelling a rejected edit restores a previously committed edit", async ({
      mount,
      page,
    }) => {
      await mount("Table/Editing/EditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
      await page.getByRole("radio", { name: "Edit" }).click();

      const saveButton = page.getByRole("button", { name: "Save" });
      const cell = table.locateCell(3, 6);
      const input = cell.locator(".saltInput");

      await cell.dblclick();
      await cell.pressSequentially("123");
      await cell.press("Enter");
      await expect(input).toContainClass("vuuTableInputCell-edited");
      await expect(saveButton).toBeEnabled();

      await cell.dblclick();
      await cell.pressSequentially("abc");
      await cell.press("Enter");
      await expect(input).toContainClass("vuuTableInputCell-error");
      await expect(saveButton).toBeDisabled();

      await cell.press("Escape");
      await expect(input).not.toContainClass("vuuTableInputCell-error");
      await expect(input).toContainClass("vuuTableInputCell-edited");
      await table.assertCellValue(cell, "123", "textbox");
      await expect(saveButton).toBeEnabled();
    });

    test("Save disabled whilst rejected edits", async ({ mount, page }) => {
      await mount("Table/Editing/EditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
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

    test("deleting a numeric value and pressing Enter shows error, keeps focus in cell, and disables Save", async ({
      mount,
      page,
    }) => {
      await mount("Table/Editing/EditableInstruments");
      const table = new PwTable(page, '[data-testid="table-1"]');
      await page.getByRole("radio", { name: "Edit" }).click();

      const saveButton = page.getByRole("button", { name: "Save" });

      // Commit a valid edit first so Save becomes enabled
      const cell1 = table.locateCell(3, 6);
      await cell1.dblclick();
      await cell1.pressSequentially("123");
      await cell1.press("Enter");
      await expect(saveButton).toBeEnabled();

      // Select numeric value in the next row, delete it, and press Enter
      const cell2 = table.locateCell(4, 6);
      const input = cell2.locator(".saltInput");
      const textbox = cell2.getByRole("textbox");

      await cell2.dblclick();
      await table.assertCellIsFocused(cell2, "textbox");
      await textbox.press("Backspace");
      await textbox.press("Enter");

      await expect(input).toContainClass("vuuTableInputCell-error");
      await expect(input).toContainClass("vuuEditing");
      await expect(textbox).toHaveAttribute("aria-invalid", "true");
      await expect(cell2.locator(".vuuTableInputCell-icon")).toBeVisible();
      await table.assertCellIsFocused(cell2, "textbox");
      await expect(saveButton).toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Inline editing (session-based) — EditableInstrumentsInlineEdit
// ---------------------------------------------------------------------------

test.describe("Inline row editing (session)", () => {
  test("waits for the session subscription before showing edit columns", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstrumentsInlineEdit");

    const table = page.getByRole("table");
    const tableRoot = page.locator("[data-viewport]");
    const sourceViewport = await tableRoot.getAttribute("data-viewport");
    await page.evaluate(() => {
      const table = document.querySelector('[role="table"]');
      const tableRoot = document.querySelector("[data-viewport]");
      if (!table || !tableRoot) {
        throw new Error("table not found");
      }

      table.setAttribute("data-edit-source-violation", "false");
      new MutationObserver(() => {
        if (
          tableRoot.getAttribute("data-viewport") ===
            table.getAttribute("data-source-viewport") &&
          table.querySelector('[data-column-name="undo"]') &&
          table.getAttribute("data-edit-source-violation") !== "true"
        ) {
          table.setAttribute("data-edit-source-violation", "true");
        }
      }).observe(table, { attributes: true, childList: true, subtree: true });
      table.setAttribute(
        "data-source-viewport",
        tableRoot.getAttribute("data-viewport") ?? "",
      );
    });

    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("columnheader", { name: "undo" }),
    ).toBeVisible();

    expect(await tableRoot.getAttribute("data-viewport")).not.toBe(
      sourceViewport,
    );
    await expect(table).toHaveAttribute("data-edit-source-violation", "false");
  });

  test("entering Edit mode shows the undo column and action buttons", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstrumentsInlineEdit");

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
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();

    const table = new PwTable(page);
    const cell = await table.cell("bbg", 2);
    const originalValue = await cell.getByRole("textbox").inputValue();
    await table.editCell("bbg", 2, "X", "cancel");
    await expect(cell.getByRole("textbox")).toHaveValue(originalValue);
    await expect(submitButton).toBeDisabled();

    await table.editCell("bbg", 2, "X");

    await expect(cell.getByRole("textbox")).toHaveValue("X");
    await expect(submitButton).toBeEnabled();
  });

  test("edited markers survive virtualization without leaking to recycled rows", async ({
    mount,
    page,
  }) => {
    test.slow();
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const tableLocator = page.getByRole("table");
    const table = new PwTable(page);
    const editedCell = table.locateCell(2, 2);
    await editedCell.dblclick();
    await editedCell.pressSequentially("X");
    await editedCell.press("Enter");
    await expect(editedCell.locator(".vuuTableInputCell-edited")).toHaveCount(
      1,
    );

    const contentContainer = page.locator(".vuuTable-contentContainer");
    await contentContainer.evaluate((element) => {
      element.scrollTop = 2_000;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(table.row(2)).toHaveCount(0);
    await expect(tableLocator.locator(".vuuTableInputCell-edited")).toHaveCount(
      0,
    );

    await contentContainer.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(table.row(2)).toBeVisible();
    await expect(
      table.locateCell(2, 2).locator(".vuuTableInputCell-edited"),
    ).toHaveCount(1);
  });

  test("soft-deleting a selected row marks it and shows the undo button", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new PwTable(page);

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
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new PwTable(page);
    const checkboxCell = table.locateCell(2, 1);
    await checkboxCell.click();
    await page.getByRole("button", { name: "Delete" }).click();

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await undoButton.click();

    // undo button gone, Submit disabled again
    await expect(undoButton).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("Cancel discards all changes and returns to view mode", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const table = new PwTable(page);
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    const table = new PwTable(page);

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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);
    // Column 2 = bbg
    const cell = table.locateCell(2, 2);
    await cell.dblclick();
    await cell.pressSequentially("EDITED");
    await cell.press("Enter");

    const undoButton = table.row(2).getByRole("button", { name: "Undo" });
    await expect(undoButton).toBeVisible();
    await expect(table.locateCell(2, 2).getByRole("textbox")).toHaveValue(
      "AAOO EDITED",
    );
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("selecting a row enables the Delete button", async ({ mount, page }) => {
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);

    // Select row 2 and soft-delete it
    const checkboxRow2 = table.locateCell(2, 1).getByRole("checkbox");
    await checkboxRow2.click();
    await page.getByRole("button", { name: "Delete" }).click();

    // After soft-delete: row 2 is no longer checked and has noSelect class
    await expect(checkboxRow2).not.toBeChecked();
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);
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
    await mount("Table/Editing/CreateSessionTableInstruments");
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("status", { name: "Loading session table" }),
    ).not.toBeVisible();

    const table = new PwTable(page);

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
