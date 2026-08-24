import { expect, test } from "../../../../../playwright/fixtures";

test.describe("Undo cell renderer", () => {
  test("renders an undo delete action and reverts the deleted row", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/EditableInstrumentsInlineEdit");
    await page.getByRole("radio", { name: "Edit" }).click();

    const row = page.getByRole("row").nth(2);
    await row.getByRole("checkbox").first().click();
    await page.getByRole("button", { name: "Delete" }).click();

    const undoButton = row.getByRole("button", {
      name: "Undo delete row",
    });
    await expect(undoButton).toBeVisible();
    await undoButton.click();

    await expect(undoButton).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("renders an undo cell after a row is imported", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmptyWithUpload");
    await page.getByRole("button", { name: "Upload (preview)" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "id,description,quantity,price,enabled,externalId\nCSV-001,Imported row,10,12.5,true,1001\n",
      ),
    });
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(
      page
        .locator('input[value="CSV-001"]')
        .locator('xpath=ancestor::*[@role="row"]')
        .getByRole("cell")
        .last(),
    ).toBeVisible();
  });
});
