import { expect, test } from "@playwright/test";
import { gotoGalleryExample } from "../gallery";

test.describe("Prompt gallery examples", () => {
  test("renders the default prompt in a portal", async ({ page }) => {
    await gotoGalleryExample(page, "UiControls/Prompt/BareBonesPrompt");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainClass("vuuPrompt");
  });

  test("supports a confirm-only prompt with a custom label", async ({ page }) => {
    await gotoGalleryExample(page, "UiControls/Prompt/ConfirmOnly");

    await expect(page.getByRole("dialog")).toBeVisible();

    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(1);

    const okButton = page.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeFocused();
  });

  test("focuses the confirm button when configured", async ({ page }) => {
    await gotoGalleryExample(page, "UiControls/Prompt/FocusOnConfirm");

    await expect(page.getByRole("dialog")).toBeVisible();

    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(3);

    const confirmButton = page.getByRole("button", { name: "Confirm" });
    await expect(confirmButton).toBeFocused();
  });
});
