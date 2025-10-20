import { test, expect } from "@playwright/experimental-ct-react";
import {
  BareBonesPrompt,
  ConfirmOnly,
  FocusOnConfirm,
} from "../../../../../../showcase/src/examples/UiControls/Prompt.examples";

test.describe("WHEN rendered with open true", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    await mount(<BareBonesPrompt />);

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
    await mount(<ConfirmOnly />);

    await expect(page.getByRole("dialog")).toBeVisible();

    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(1);

    const okButton = page.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeFocused();
  });
});

test.describe("WHEN configured to focus on confirm", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    await mount(<FocusOnConfirm />);

    await expect(page.getByRole("dialog")).toBeVisible();

    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(3);

    const confirmButton = page.getByRole("button", { name: "Confirm" });
    await expect(confirmButton).toBeFocused();
  });
});
