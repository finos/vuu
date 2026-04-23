import { test, expect } from "@playwright/experimental-ct-react";
import { DefaultModalProvider } from "../../../../../showcase/src/examples/UiControls/ModalProvider.examples";

test.describe("ModalProvider", () => {
  test.describe("WHEN modal dialog is triggered", () => {
    test("THEN modal dialog is displayed and dismissed with Escape, host is no re rendered", async ({
      mount,
      page,
    }) => {
      await mount(<DefaultModalProvider />);
      await page.getByTestId("dialog-trigger").click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();

      const button = page.getByRole("button");
      await expect(button).toHaveText("rendered 1 times");
    });
  });

  test.describe("WHEN modal prompt is triggered", () => {
    test("THEN modal prompt is displayed and dismissed with Escape, host is no re rendered", async ({
      mount,
      page,
    }) => {
      await mount(<DefaultModalProvider />);
      await page.getByTestId("prompt-trigger").click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainClass("vuuPrompt");
      page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();

      const button = page.getByRole("button");
      await expect(button).toHaveText("rendered 1 times");
    });
  });
});
