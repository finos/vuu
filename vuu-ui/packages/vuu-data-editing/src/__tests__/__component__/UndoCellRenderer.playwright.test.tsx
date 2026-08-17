import { expect, test } from "@playwright/experimental-ct-react";
import { EditableInstrumentsInlineEdit } from "../../../../../showcase/src/examples/Table/Editing.examples";

test.describe("Undo cell renderer", () => {
  test("renders an undo delete action and reverts the deleted row", async ({
    mount,
    page,
  }) => {
    await mount(<EditableInstrumentsInlineEdit />);
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
});
