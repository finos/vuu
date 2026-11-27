import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../../playwright/fixtures";

const EXAMPLE = "DataEditing/EditableTable/SessionBlueprint";

const columnHeaders = (page: Page) =>
  page.getByRole("columnheader").filter({ hasText: /\w/ });

const firstRow = (page: Page) =>
  page.getByRole("row").filter({ hasText: "TEST-001" });

const selectionCheckbox = (page: Page) =>
  firstRow(page).getByLabel("Press space to select row");

test.describe("EditableTableContainer with a session table blueprint", () => {
  test("Edit shows the blueprint's columns, View shows them all", async ({
    mount,
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mount(EXAMPLE);

    await expect(columnHeaders(page)).toHaveText([
      "id",
      "description",
      "quantity",
      "price",
      "enabled",
    ]);

    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("textbox", { name: "price" }).first(),
    ).toBeVisible();
    await expect(columnHeaders(page)).toHaveText(["id", "quantity", "price"]);

    const price = page.getByRole("textbox", { name: "price" }).first();
    await price.fill("111.5");
    await price.press("Enter");
    await page.getByRole("button", { exact: true, name: "Save" }).click();

    await expect(page.getByRole("radio", { name: "View" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(columnHeaders(page)).toHaveCount(5);
    await expect(firstRow(page)).toContainText("Alpha");
    await expect(firstRow(page)).toContainText("111.5");
    expect(errors).toEqual([]);
  });

  test("rows can be checked in View, not in Edit", async ({ mount, page }) => {
    await mount(EXAMPLE);

    const checkbox = selectionCheckbox(page);
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(firstRow(page)).toHaveAttribute("aria-selected", "true");

    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(
      page.getByRole("textbox", { name: "price" }).first(),
    ).toBeVisible();
    await expect(selectionCheckbox(page)).toHaveCount(0);
  });
});
