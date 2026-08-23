import { test } from "@playwright/experimental-ct-react";
import { expect } from "../../../../../playwright/customAssertions";
import {
  FilterPillEditableLabel,
  FilterPillNotEditable,
} from "../../../../../showcase/src/examples/Filters/FilterBar/FilterPill.examples";

test.describe("FilterPill", () => {
  test("non-editable pill has no editable label or Rename menu item", async ({
    mount,
    page,
  }) => {
    const component = await mount(<FilterPillNotEditable />);

    await expect(component.locator(".vuuEditableLabel")).toHaveCount(0);
    await component.getByRole("button", { name: "currency" }).click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Rename" })).toHaveCount(0);
  });

  test("editable pill renders an editable label and offers Rename", async ({
    mount,
    page,
  }) => {
    const component = await mount(<FilterPillEditableLabel />);

    await expect(component.locator(".vuuEditableLabel")).toHaveCount(1);
    await component.getByRole("button", { name: "currency" }).click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
  });
});
