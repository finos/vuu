import { test, expect } from "../../../../../../playwright/fixtures";

test.describe("VuuInput", () => {
  test.describe("Given a default VuuInput", () => {
    test("Then basic smoke-test passes", async ({ mount }) => {
      const component = await mount("UiControls/VuuInput/DefaultVuuInput");

      const vuuInput = component.getByTestId("vuu-input");
      await expect(vuuInput).toContainClass("vuuInput");
      await expect(vuuInput).toBeVisible();
      await expect(vuuInput.locator("input")).toBeVisible();
    });
  });
});

test.describe("Given a VuuInput box with input validation", () => {
  test.describe("WHEN invalid input is provided", () => {
    test("Then box will turn red and error icon will be displayed", async ({
      mount,
      page,
    }) => {
      const component = await mount(
        "UiControls/VuuInput/VuuInputWithValidation",
      );

      const vuuInput = component.getByTestId("vuu-input");
      const input = vuuInput.locator("input");
      await input.fill("hello");
      await input.press("Enter");

      await expect(vuuInput).toContainClass("vuuInput-error");

      // Check if error icon exists
      const errorIcon = vuuInput.locator(".vuuInput-errorIcon");
      await expect(errorIcon).toBeVisible();
      await errorIcon.hover();
      await expect(page.getByRole("tooltip")).toBeVisible();
    });
  });

  test.describe("WHEN valid input is provided", () => {
    test("Then no error icon will be displayed", async ({ mount }) => {
      const component = await mount(
        "UiControls/VuuInput/VuuInputWithValidation",
      );

      const vuuInput = component.getByTestId("vuu-input");
      const input = vuuInput.locator("input");
      await input.fill("012345");
      await input.press("Enter");

      await expect(vuuInput).not.toContainClass("vuuInput-error");
      await expect(vuuInput.locator(".vuuInput-errorIcon")).not.toBeAttached();
    });
  });

  test.describe("WHEN no input is provided", () => {
    test("Then the box will not change", async ({ mount }) => {
      const component = await mount(
        "UiControls/VuuInput/VuuInputWithValidation",
      );

      const vuuInput = component.getByTestId("vuu-input");
      const input = vuuInput.locator("input");
      await input.press("Enter");

      await expect(vuuInput).toContainClass("saltInput-primary");
    });
  });

  test.describe("WHEN input provided overflows", () => {
    test("Then box will store the complete value", async ({ mount }) => {
      const component = await mount(
        "UiControls/VuuInput/VuuInputWithValidation",
      );

      const longValue =
        "01234567890123456789012345678901234567890123456789012345678901234567890";
      const vuuInput = component.getByTestId("vuu-input");
      const input = vuuInput.locator("input");
      await input.fill(longValue);
      await input.press("Enter");

      await expect(input).toHaveValue(longValue);
    });
  });
});
