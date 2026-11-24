import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../../playwright/fixtures";

const EXAMPLE = "DataEditing/EditableTable/ExternalModeToggle";

const pageToggle = (page: Page) => ({
  edit: page.getByTestId("toggle-edit-page"),
  view: page.getByTestId("toggle-view-page"),
});

const editableTable = (page: Page) => page.getByTestId("edit-table");

/** Edits the description of the first row, committing it with Enter. */
const editFirstDescription = async (page: Page, value: string) => {
  const description = page
    .getByRole("textbox", { name: "description" })
    .first();
  await description.fill(value);
  await description.press("Enter");
};

test.describe("EditModeToggle outside an EditableTableContainer", () => {
  test("enters edit mode and returns to view mode", async ({ mount, page }) => {
    await mount(EXAMPLE);
    const toggle = pageToggle(page);

    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-view/,
    );
    await toggle.edit.click();
    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-edit/,
    );
    await expect(
      page.getByRole("textbox", { name: "description" }).first(),
    ).toBeVisible();

    // nothing has changed, so there is nothing to confirm
    await toggle.view.click();
    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-view/,
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("asks before discarding unsaved changes", async ({ mount, page }) => {
    await mount(EXAMPLE);
    const toggle = pageToggle(page);

    await toggle.edit.click();
    await editFirstDescription(page, "Changed description");
    await expect(
      page.getByRole("button", { exact: true, name: "Save" }),
    ).toBeEnabled();

    await toggle.view.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("You have unsaved changes");

    await dialog.getByRole("button", { name: "Keep editing" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-edit/,
    );
    await expect(toggle.edit).toHaveAttribute("aria-checked", "true");

    await toggle.view.click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Discard" })
      .click();
    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-view/,
    );
    await expect(toggle.view).toHaveAttribute("aria-checked", "true");
  });

  test("follows the table's own Save", async ({ mount, page }) => {
    await mount(EXAMPLE);
    const toggle = pageToggle(page);

    await toggle.edit.click();
    await editFirstDescription(page, "Saved description");
    await page.getByRole("button", { exact: true, name: "Save" }).click();

    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-view/,
    );
    await expect(toggle.view).toHaveAttribute("aria-checked", "true");
  });

  test("with form editing, is disabled until a row is selected", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE, { editStrategy: "form" });
    const toggle = pageToggle(page);

    await expect(toggle.edit).toBeDisabled();
    await page.getByRole("row").nth(1).click();
    await expect(toggle.edit).toBeEnabled();

    await toggle.edit.click();
    await expect(editableTable(page)).toHaveClass(
      /vuuEditableTableContainer-edit/,
    );
  });
});
