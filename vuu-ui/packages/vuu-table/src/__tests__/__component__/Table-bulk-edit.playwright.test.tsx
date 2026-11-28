import { expect, test } from "../../../../../playwright/fixtures";

const EXAMPLE = "Table/Editing/BulkEditTable";

test.describe("Bulk edit panel", () => {
  test("the key column has no input to set every row", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    const row = (n: number) =>
      page.locator(`[role="row"][aria-rowindex="${n + 1}"]`);
    await row(1).click();
    await row(2).click({ modifiers: ["Shift"] });
    await row(2).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Edit rows (local)" }).click();

    const bulkEditRow = page.getByRole("dialog").locator(".vuuBulkEditRow");
    await expect(
      bulkEditRow.locator('[data-field="currency"] input'),
    ).toHaveCount(1);
    await expect(bulkEditRow.locator('[data-field="ric"] input')).toHaveCount(
      0,
    );
  });
});
