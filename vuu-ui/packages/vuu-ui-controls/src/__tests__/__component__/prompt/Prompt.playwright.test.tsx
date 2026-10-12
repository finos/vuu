import { expect, test } from "../../../../../../playwright/fixtures";

test.describe("WHEN rendered with open true", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    await mount("UiControls/Prompt/BareBonesPrompt");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainClass("vuuPrompt");
  });
});

test.describe("WHEN configured to show confirm button only, with custom label", () => {
  test("THEN neither the close button nor cancel button will be rendered", async ({
    mount,
    page,
  }) => {
    await mount("UiControls/Prompt/ConfirmOnly");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Floating UI focus guards have role="button" in Safari/WebKit.
    const buttons = dialog.getByRole("button");
    await expect(buttons).toHaveCount(1);

    const okButton = page.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeFocused();
  });
});

test.describe("WHEN configured to focus on confirm", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    await mount("UiControls/Prompt/FocusOnConfirm");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Floating UI focus guards have role="button" in Safari/WebKit.
    const buttons = dialog.getByRole("button");
    await expect(buttons).toHaveCount(3);

    const confirmButton = page.getByRole("button", { name: "Confirm" });
    await expect(confirmButton).toBeFocused();
  });
});
